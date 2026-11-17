/**
 * Regras de domínio do carrinho Passa.
 *
 * Todos os valores monetários são inteiros em centavos para evitar erros
 * de ponto flutuante (ex.: 0.1 + 0.2). A formatação para BRL só acontece
 * na borda da UI, via `formatBRL`.
 */

export interface Product {
  id: string
  name: string
  /** Preço unitário em centavos. */
  price: number
  emoji: string
  /** EAN-13 ilustrativo, exibido no scanner da demo. */
  barcode: string
  /** Cor de fundo do thumbnail. */
  tint: string
}

export interface CartLine {
  product: Product
  qty: number
}

export const CATALOG: readonly Product[] = [
  { id: 'leite', name: 'Leite Integral 1L', price: 549, emoji: '🥛', barcode: '7891000100103', tint: '#E5F0FF' },
  { id: 'pao', name: 'Pão de forma integral', price: 990, emoji: '🍞', barcode: '7896002301428', tint: '#FFF1DB' },
  { id: 'abacate', name: 'Abacate', price: 420, emoji: '🥑', barcode: '2000000004204', tint: '#E3F9E9' },
  { id: 'cafe', name: 'Café torrado 500g', price: 1890, emoji: '☕', barcode: '7896005800010', tint: '#F3E8DD' },
  { id: 'sabao', name: 'Sabão líquido 3L', price: 2490, emoji: '🧴', barcode: '7891024134702', tint: '#E8E8FF' },
  { id: 'maca', name: 'Maçã Gala', price: 299, emoji: '🍎', barcode: '2000000002996', tint: '#FFE5E5' },
]

/** Limite de unidades por item, uma proteção simples contra toques acidentais. */
export const MAX_QTY = 99

export function addItem(cart: readonly CartLine[], product: Product): CartLine[] {
  const existing = cart.find((l) => l.product.id === product.id)
  if (!existing) return [...cart, { product, qty: 1 }]
  return cart.map((l) =>
    l.product.id === product.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l,
  )
}

/** Define a quantidade; quantidade <= 0 remove a linha. */
export function setQty(cart: readonly CartLine[], productId: string, qty: number): CartLine[] {
  if (!Number.isFinite(qty)) return [...cart]
  const q = Math.min(MAX_QTY, Math.floor(qty))
  if (q <= 0) return cart.filter((l) => l.product.id !== productId)
  return cart.map((l) => (l.product.id === productId ? { ...l, qty: q } : l))
}

export function cartCount(cart: readonly CartLine[]): number {
  return cart.reduce((n, l) => n + l.qty, 0)
}

export function cartSubtotal(cart: readonly CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.product.price * l.qty, 0)
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 7528 -> "R$ 75,28" (com espaço comum, não NBSP, para facilitar cópia e testes). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ')
}

export interface ChangeResult {
  /** Troco a devolver, em centavos (0 se faltar dinheiro). */
  change: number
  /** Quanto falta, em centavos (0 se o valor cobre o total). */
  missing: number
  enough: boolean
}

export function calcChange(totalCents: number, receivedCents: number): ChangeResult {
  const diff = receivedCents - totalCents
  return diff >= 0
    ? { change: diff, missing: 0, enough: true }
    : { change: 0, missing: -diff, enough: false }
}

/**
 * Sugestões de "valor recebido" para o operador de caixa:
 * o valor exato e as próximas notas redondas acima do total.
 * Ex.: 7528 -> [7528, 8000, 10000]
 */
export function suggestReceived(totalCents: number, max = 3): number[] {
  const out = [totalCents]
  for (const step of [500, 1000, 2000, 5000, 10000]) {
    const v = Math.ceil(totalCents / step) * step
    if (v > totalCents && !out.includes(v)) out.push(v)
    if (out.length >= max) break
  }
  return out.slice(0, max)
}

/**
 * Código numérico de 6 dígitos para pagamento em dinheiro, formatado "482 913".
 * `random` é injetável para testes determinísticos.
 */
export function createPaymentCode(random: () => number = Math.random): string {
  const n = Math.floor(random() * 1_000_000)
  const s = String(Math.min(999_999, Math.max(0, n))).padStart(6, '0')
  return `${s.slice(0, 3)} ${s.slice(3)}`
}

/**
 * Janela de rotação do QR de saída. O QR muda a cada `periodMs` (30 s),
 * então um print de tela fica inválido rapidamente.
 */
export function passWindow(nowMs: number, periodMs = 30_000): number {
  return Math.floor(nowMs / periodMs)
}

/** Segundos restantes até a próxima rotação do QR. */
export function secondsToRotate(nowMs: number, periodMs = 30_000): number {
  return Math.ceil((periodMs - (nowMs % periodMs)) / 1000)
}
