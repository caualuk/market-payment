/**
 * Roteiro 3D de "Hero + Como funciona": a jornada de UMA compra no
 * Mercado Aurora, contada pelo scroll.
 *
 *  hero     0.0–0.2  A gôndola com os 5 produtos do design, o celular e a cesta vazia.
 *  checkin  0.2–0.4  O letreiro da loja acende: o app sabe em que loja você está.
 *  scan     0.4–0.6  Cada produto sai da prateleira, passa pelo laser do celular
 *                    e cai na cesta — os dois carrinhos enchem juntos.
 *  pay      0.6–0.8  O celular vem para frente, mostra o total e aprova o Pix.
 *  pass     0.8–1.0  A câmera "caminha" até a saída (a gôndola fica para trás),
 *                    o leitor do balcão lê o QR verde e a cancela abre.
 *
 * Tudo aqui é função pura de `t` (0→1): rolar para cima desfaz a compra na
 * ordem inversa, e nenhum objeto some/reaparece sem motivo narrativo.
 */
import { CATALOG, type Product } from '../lib/cart'
import { clamp, lerp, smoothstep } from '../lib/motion'

export type Vec3 = [number, number, number]

export interface Transform {
  pos: Vec3
  rot: Vec3
}

export type ChapterId = 'hero' | 'checkin' | 'scan' | 'pay' | 'pass'
export type ScreenKind = 'home' | 'checkin' | 'scan' | 'pay' | 'paid' | 'pass' | 'cash'
export type ItemPhase = 'shelf' | 'lift' | 'scan' | 'drop' | 'basket'

export const CHAPTERS: ReadonlyArray<{ id: ChapterId; from: number; to: number }> = [
  { id: 'hero', from: 0, to: 0.2 },
  { id: 'checkin', from: 0.2, to: 0.4 },
  { id: 'scan', from: 0.4, to: 0.6 },
  { id: 'pay', from: 0.6, to: 0.8 },
  { id: 'pass', from: 0.8, to: 1 },
]

/** Os mesmos 5 produtos das telas do FigCraft (total R$ 63,39 com 1 de cada). */
export const STORY_PRODUCTS: readonly Product[] = ['leite', 'pao', 'abacate', 'cafe', 'sabao'].map(
  (id) => CATALOG.find((p) => p.id === id)!,
)

// ---------- layout do "set" (coordenadas locais, celular à direita do texto) ----------
export const SHELF = { x: 0.1, y: 0.55, z: -1.0 }
export const SHELF_SLOTS = [-1.3, -0.65, 0, 0.65, 1.3]
export const BASKET = { x: -0.75, y: -1.85, z: 0.6 }
export const BASKET_SLOTS: ReadonlyArray<[number, number]> = [
  [-0.4, -0.14],
  [0.02, -0.16],
  [0.42, -0.12],
  [-0.2, 0.16],
  [0.24, 0.17],
]
/** Ponto onde o produto é lido pelo laser do celular. */
export const SCAN_POINT: Vec3 = [0.2, -0.15, 1.4]
/** Posição final do balcão de saída (topo do balcão). */
export const EXIT: Vec3 = [0.75, -1.2, 0.1]
/** Distância da "caminhada" da gôndola até a saída. */
export const WALK = 12

const SCAN_PHASES = { lift: 0.35, scan: 0.6 } // fronteiras dentro do segmento de cada item
const IN_BASKET_SCALE = 0.62

// ---------- poses do celular por capítulo ----------
const PHONE: Record<ChapterId, (k: number) => Transform> = {
  hero: (k) => ({ pos: [1.3, -0.45, 1.0], rot: [-0.06, -0.5 + 0.2 * k, 0.06 - 0.04 * k] }),
  checkin: () => ({ pos: [1.3, -0.35, 1.0], rot: [0, -0.3, 0] }),
  scan: () => ({ pos: [1.35, -0.45, 1.1], rot: [-0.05, -0.45, 0] }),
  pay: () => ({ pos: [0.7, -0.15, 1.9], rot: [0, -0.1, 0] }),
  pass: (k) => ({ pos: [-1.1, -0.25, 1.2], rot: [0, 0.55 * smoothstep(k / 0.4), 0] }),
}

export interface ItemState {
  product: Product
  phase: ItemPhase
  /** progresso dentro da fase (0→1) */
  k: number
  pos: Vec3
  rotY: number
  scale: number
}

export interface StoryFrame {
  t: number
  chapter: ChapterId
  /** progresso dentro do capítulo */
  local: number
  phone: Transform
  screen: ScreenKind
  items: ItemState[]
  /** produtos já lidos (entram no carrinho do app) */
  scanned: number
  /** subtotal dos produtos lidos, em centavos */
  subtotal: number
  /** intensidade do laser do scanner (0→1) */
  laser: number
  /** letreiro da loja aceso após o check-in */
  signGlow: number
  /** 0 = no corredor, 1 = no balcão de saída */
  walk: number
  /** feixe do leitor do balcão lendo o QR */
  beam: number
  /** pagamento aprovado no app */
  payApproved: number
  /** saída liberada (tablet verde + cancela aberta) */
  released: number
  shelfX: number
  exit: Vec3
}

export function chapterAt(t: number): { id: ChapterId; index: number; local: number } {
  const x = clamp(t)
  const found = CHAPTERS.findIndex((c) => x < c.to)
  const index = found === -1 ? CHAPTERS.length - 1 : found
  const c = CHAPTERS[index]
  return { id: c.id, index, local: (x - c.from) / (c.to - c.from) }
}

/** Progresso local (0→1) de um capítulo para um `t` global, saturado. */
export function chapterProgress(t: number, id: ChapterId): number {
  const c = CHAPTERS.find((ch) => ch.id === id)!
  return clamp((t - c.from) / (c.to - c.from))
}

const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]

/** Bezier quadrática: trajetória em arco (produto voando). */
export function arc(a: Vec3, b: Vec3, lift: number, k: number): Vec3 {
  const c: Vec3 = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + lift, (a[2] + b[2]) / 2]
  const u = 1 - k
  return [0, 1, 2].map((i) => u * u * a[i] + 2 * u * k * c[i] + k * k * b[i]) as Vec3
}

function lerpTransform(a: Transform, b: Transform, k: number): Transform {
  return { pos: lerp3(a.pos, b.pos, k), rot: lerp3(a.rot, b.rot, k) }
}

/** Pose do celular com transição suave nos primeiros 30% de cada capítulo. */
export function phonePose(t: number): Transform {
  const { id, index, local } = chapterAt(t)
  const here = PHONE[id](local)
  if (index === 0) return here
  const prev = CHAPTERS[index - 1].id
  return lerpTransform(PHONE[prev](1), here, smoothstep(local / 0.3))
}

export function shelfPosition(i: number, walk: number): Vec3 {
  return [SHELF.x + SHELF_SLOTS[i] - walk * WALK, SHELF.y, SHELF.z]
}

export function basketPosition(i: number): Vec3 {
  const [dx, dz] = BASKET_SLOTS[i]
  return [BASKET.x + dx, BASKET.y + 0.08, BASKET.z + dz]
}

/** Estado de um produto durante a leitura (segmento i de 5 dentro do capítulo scan). */
export function itemState(i: number, scanLocal: number, walk: number): ItemState {
  const product = STORY_PRODUCTS[i]
  const n = STORY_PRODUCTS.length
  const u = clamp(scanLocal * n - i)
  const shelf = shelfPosition(i, walk)
  const basket = basketPosition(i)
  const restRot = (i - 2) * 0.28
  const scanRot = 0.95

  if (u <= 0) return { product, phase: 'shelf', k: 0, pos: shelf, rotY: 0, scale: 1 }
  if (u >= 1) return { product, phase: 'basket', k: 1, pos: basket, rotY: restRot, scale: IN_BASKET_SCALE }

  if (u < SCAN_PHASES.lift) {
    const k = u / SCAN_PHASES.lift
    const e = smoothstep(k)
    return { product, phase: 'lift', k, pos: arc(shelf, SCAN_POINT, 0.6, e), rotY: lerp(0, scanRot, e), scale: 1 }
  }
  if (u < SCAN_PHASES.scan) {
    const k = (u - SCAN_PHASES.lift) / (SCAN_PHASES.scan - SCAN_PHASES.lift)
    // leve "passada" do código de barras diante do laser
    const sway = Math.sin(k * Math.PI) * 0.12
    return { product, phase: 'scan', k, pos: [SCAN_POINT[0], SCAN_POINT[1] - sway * 0.3, SCAN_POINT[2]], rotY: scanRot, scale: 1 }
  }
  const k = (u - SCAN_PHASES.scan) / (1 - SCAN_PHASES.scan)
  const e = smoothstep(k)
  return {
    product,
    phase: 'drop',
    k,
    pos: arc(SCAN_POINT, basket, 0.35, e),
    rotY: lerp(scanRot, restRot, e),
    scale: lerp(1, IN_BASKET_SCALE, e),
  }
}

/** O item conta no carrinho do app no meio da leitura (quando o laser "bipa"). */
export function isScanned(state: ItemState): boolean {
  return state.phase === 'drop' || state.phase === 'basket' || (state.phase === 'scan' && state.k >= 0.5)
}

const bell = (x: number, from: number, to: number) => (x <= from || x >= to ? 0 : Math.sin(((x - from) / (to - from)) * Math.PI))

export function storyFrame(rawT: number): StoryFrame {
  const t = clamp(rawT)
  const { id: chapter, local } = chapterAt(t)
  const scanLocal = chapterProgress(t, 'scan')
  const payLocal = chapterProgress(t, 'pay')
  const passLocal = chapterProgress(t, 'pass')

  const walk = smoothstep(passLocal / 0.45)
  const items = STORY_PRODUCTS.map((_, i) => itemState(i, scanLocal, walk))
  const inCart = items.filter(isScanned)
  const laser = Math.max(0, ...items.map((s) => (s.phase === 'scan' ? Math.sin(s.k * Math.PI) : 0)))

  const payApproved = smoothstep((payLocal - 0.45) / 0.15)
  let screen: ScreenKind = 'home'
  if (chapter === 'checkin') screen = 'checkin'
  else if (chapter === 'scan') screen = 'scan'
  else if (chapter === 'pay') screen = payApproved > 0.5 ? 'paid' : 'pay'
  else if (chapter === 'pass') screen = 'pass'

  return {
    t,
    chapter,
    local,
    phone: phonePose(t),
    screen,
    items,
    scanned: inCart.length,
    subtotal: inCart.reduce((s, it) => s + it.product.price, 0),
    laser,
    signGlow: smoothstep(chapterProgress(t, 'checkin') / 0.5),
    walk,
    beam: bell(passLocal, 0.45, 0.75),
    payApproved,
    released: smoothstep((passLocal - 0.62) / 0.2),
    shelfX: SHELF.x - walk * WALK,
    exit: [EXIT[0] + (1 - walk) * WALK, EXIT[1], EXIT[2]],
  }
}

/** Total da compra completa (para as telas de pagamento/passe). */
export const STORY_TOTAL = STORY_PRODUCTS.reduce((s, p) => s + p.price, 0)
