/**
 * Texturas desenhadas em <canvas> 2D para os objetos 3D: rótulos das
 * embalagens (com EAN-13 válido), etiquetas de preço da gôndola, letreiro
 * da loja, nota de R$ 100, moeda do troco digital e telas do tablet do caixa.
 */
import { formatBRL, type Product } from '../lib/cart'
import { ean13Modules } from '../lib/ean'
import type { TerminalState } from './cash'

type Ctx = CanvasRenderingContext2D
export const FONT = '-apple-system, "SF Pro Display", Inter, "Segoe UI", system-ui, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace'
const INK = '#0A0A0F'

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, weight = 600, align: CanvasTextAlign = 'left', font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(s, x, y)
}

/** Código de barras EAN-13 real, com dígitos embaixo. */
export function drawBarcode(ctx: Ctx, code: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fff'
  ctx.fillRect(x - 8, y - 8, w + 16, h + 34)
  const modules = ean13Modules(code)
  const m = w / modules.length
  ctx.fillStyle = INK
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] !== '1') continue
    const guard = i < 3 || (i >= 45 && i < 50) || i >= 92
    ctx.fillRect(x + i * m, y, Math.ceil(m), guard ? h + 8 : h)
  }
  text(ctx, code, x + w / 2, y + h + 22, Math.max(10, w / 9), INK, 500, 'center', MONO)
}

export interface LabelStyle {
  bg: string
  band: string
  ink: string
  title: string
  sub: string
}

/** Visual de cada embalagem — cores genéricas, sem marcas reais. */
export const PACKAGING: Record<string, LabelStyle> = {
  leite: { bg: '#FFFFFF', band: '#0A84FF', ink: '#0A3D91', title: 'LEITE', sub: 'Integral · 1L' },
  pao: { bg: '#FFF4DE', band: '#C8782A', ink: '#5A3410', title: 'PÃO DE FORMA', sub: 'Integral · 500g' },
  abacate: { bg: '#F2FFF0', band: '#30A14E', ink: '#1F5E2C', title: 'ABACATE', sub: 'kg · balança' },
  cafe: { bg: '#2B1A12', band: '#D9822B', ink: '#FFE9CF', title: 'CAFÉ', sub: 'Torrado · 500g' },
  sabao: { bg: '#EDEBFF', band: '#5E5CE6', ink: '#2B2A7A', title: 'SABÃO LÍQUIDO', sub: '3 litros' },
}

/** Rótulo frontal: faixa de cor, nome, e o código de barras que o laser lê. */
export function drawLabel(ctx: Ctx, w: number, h: number, product: Product) {
  const s = PACKAGING[product.id]
  ctx.fillStyle = s.bg
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = s.band
  ctx.fillRect(0, h * 0.1, w, h * 0.22)
  text(ctx, s.title, w / 2, h * 0.26, h * 0.1, '#fff', 800, 'center')
  text(ctx, s.sub, w / 2, h * 0.45, h * 0.065, s.ink, 600, 'center')
  const bw = w * 0.62
  drawBarcode(ctx, product.barcode, (w - bw) / 2, h * 0.58, bw, h * 0.2)
}

/** Etiqueta de preço da gôndola (como as de mercado: amarela, preço grande). */
export function drawPriceTag(ctx: Ctx, w: number, h: number, product: Product) {
  ctx.fillStyle = '#FFD60A'
  ctx.fillRect(0, 0, w, h)
  text(ctx, product.name, 14, h * 0.32, h * 0.2, INK, 600)
  text(ctx, formatBRL(product.price), w - 14, h * 0.82, h * 0.42, INK, 800, 'right')
}

/** Letreiro da loja. `glow` acende o ponto verde de check-in. */
export function drawSign(ctx: Ctx, w: number, h: number, glow: boolean) {
  ctx.fillStyle = INK
  rr(ctx, 0, 0, w, h, h * 0.2)
  ctx.fill()
  const g = ctx.createLinearGradient(0, 0, h, h)
  g.addColorStop(0, '#FF9F0A')
  g.addColorStop(1, '#FF375F')
  ctx.fillStyle = g
  rr(ctx, h * 0.18, h * 0.18, h * 0.64, h * 0.64, h * 0.16)
  ctx.fill()
  text(ctx, 'A', h * 0.5, h * 0.66, h * 0.42, '#fff', 800, 'center')
  text(ctx, 'MERCADO AURORA', h * 1.05, h * 0.5, h * 0.25, '#fff', 800)
  text(ctx, 'Unidade Centro · corredor 4', h * 1.05, h * 0.78, h * 0.17, 'rgba(255,255,255,0.6)', 500)
  ctx.fillStyle = glow ? '#30D158' : '#3A3A44'
  ctx.beginPath()
  ctx.arc(w - h * 0.4, h * 0.5, h * 0.12, 0, Math.PI * 2)
  ctx.fill()
  if (glow) text(ctx, 'check-in feito', w - h * 0.22, h * 0.86, h * 0.13, '#30D158', 700, 'right')
}

/** Nota de R$ 100 estilizada (azul, como a cédula real), sem reproduzir a arte oficial. */
export function drawNote(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#9CC7E8')
  g.addColorStop(1, '#4F8FC0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = h * 0.03
  ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.beginPath()
  ctx.arc(w * 0.72, h * 0.5, h * 0.32, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, '100', w * 0.08, h * 0.42, h * 0.3, '#0B3B66', 800)
  text(ctx, 'CEM REAIS', w * 0.08, h * 0.8, h * 0.12, '#0B3B66', 700)
  text(ctx, 'R$', w * 0.72, h * 0.6, h * 0.28, '#0B3B66', 800, 'center')
}

/** Moeda do troco digital: vai do caixa para a carteira no app. */
export function drawCoin(ctx: Ctx, w: number, amount: number) {
  const g = ctx.createRadialGradient(w * 0.35, w * 0.35, w * 0.05, w / 2, w / 2, w / 2)
  g.addColorStop(0, '#FFE08A')
  g.addColorStop(0.7, '#F2B93B')
  g.addColorStop(1, '#B8860B')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, '+', w / 2, w * 0.36, w * 0.16, '#6B4700', 800, 'center')
  text(ctx, formatBRL(amount), w / 2, w * 0.58, w * 0.15, '#6B4700', 800, 'center')
  text(ctx, 'carteira', w / 2, w * 0.74, w * 0.1, '#6B4700', 600, 'center')
}

export interface TerminalData {
  total: number
  received?: number
  code?: string
  items?: number
  /** linha de contexto acima do valor (padrão: código do pedido) */
  title?: string
}

/** Tela do tablet de validação no balcão (mesma linguagem da tela 07 do design). */
export function drawTerminal(ctx: Ctx, w: number, h: number, state: TerminalState, data: TerminalData) {
  const released = state === 'released'
  ctx.fillStyle = released ? '#E9FBEF' : '#F5F5F7'
  ctx.fillRect(0, 0, w, h)
  text(ctx, 'passa · Caixa Expresso', 28, 44, 22, INK, 700)

  const badge = (label: string, bg: string, fg: string) => {
    ctx.font = `700 18px ${FONT}`
    const bw = ctx.measureText(label).width + 36
    ctx.fillStyle = bg
    rr(ctx, 28, 66, bw, 34, 17)
    ctx.fill()
    text(ctx, label, 46, 89, 18, fg, 700)
  }

  if (state === 'idle' || state === 'reading') {
    badge(state === 'idle' ? 'Pronto para ler' : 'Lendo código…', '#E8E8FF', '#5E5CE6')
    ctx.strokeStyle = state === 'reading' ? '#30D158' : '#5E5CE6'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    const cx = w / 2
    const cy = h * 0.62
    const s = h * 0.25
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath()
      ctx.moveTo(cx + dx * s, cy + dy * s - dy * 30)
      ctx.lineTo(cx + dx * s, cy + dy * s)
      ctx.lineTo(cx + dx * s - dx * 30, cy + dy * s)
      ctx.stroke()
    }
    text(ctx, 'Aponte o QR do cliente', cx, cy + 8, 22, '#6E6E73', 600, 'center')
    return
  }

  if (released) badge('Saída liberada', '#30D158', '#fff')
  else if (state === 'received') badge('Dinheiro recebido', '#FFF4E0', '#B36B00')
  else badge('Aguardando dinheiro', '#FFF4E0', '#B36B00')

  text(ctx, data.title ?? `Pedido · código ${data.code ?? '—'}`, 28, 150, 20, '#6E6E73', 500)
  text(ctx, formatBRL(data.total), 28, 212, 58, INK, 800)
  if (state === 'awaiting') {
    text(ctx, `${data.items ?? 8} itens · receba em dinheiro`, 28, 256, 20, '#6E6E73', 500)
  }
  if ((state === 'received' || released) && data.received) {
    text(ctx, `Recebido ${formatBRL(data.received)}`, 28, 260, 22, INK, 600)
    text(ctx, `Troco ${formatBRL(data.received - data.total)} → carteira`, 28, 296, 22, '#1F8A3D', 700)
  }
  if (released) {
    ctx.fillStyle = '#30D158'
    ctx.beginPath()
    ctx.arc(w - 90, h - 90, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w - 112, h - 90)
    ctx.lineTo(w - 96, h - 72)
    ctx.lineTo(w - 66, h - 108)
    ctx.stroke()
  }
}
