/**
 * Telas do app desenhadas num <canvas> que vira a textura do celular 3D.
 * Recebem os dados da cena (itens lidos, subtotal, total, código) para que o
 * que aparece na tela seja exatamente o que está acontecendo no 3D.
 */
import { formatBRL, type Product } from '../lib/cart'
import { qrMatrix } from '../lib/qr'
import type { ScreenKind } from './story'
import { rr, text } from './textures'

export const SCREEN_W = 512
export const SCREEN_H = 1100
const R = 70
const INK = '#0A0A0F'

type Ctx = CanvasRenderingContext2D

export interface ScreenData {
  scanned?: readonly Product[]
  subtotal?: number
  total?: number
  code?: string
}

/** Chave que muda sempre que a tela precisa ser redesenhada. */
export function screenKey(kind: ScreenKind, data: ScreenData): string {
  return `${kind}|${data.scanned?.length ?? 0}|${data.subtotal ?? 0}|${data.total ?? 0}|${data.code ?? ''}`
}

function qr(ctx: Ctx, x: number, y: number, size: number, seed: string) {
  const m = qrMatrix(seed)
  const cell = size / m.length
  ctx.fillStyle = INK
  m.forEach((row, j) => row.forEach((on, i) => on && ctx.fillRect(x + i * cell, y + j * cell, cell + 0.5, cell + 0.5)))
}

function chrome(ctx: Ctx, dark: boolean) {
  ctx.fillStyle = '#000'
  rr(ctx, SCREEN_W / 2 - 62, 26, 124, 36, 18)
  ctx.fill()
  text(ctx, '9:41', 52, 54, 24, dark ? '#fff' : INK, 600)
}

function button(ctx: Ctx, label: string, fill: string | CanvasGradient) {
  ctx.fillStyle = fill
  rr(ctx, 32, SCREEN_H - 150, SCREEN_W - 64, 96, 48)
  ctx.fill()
  text(ctx, label, SCREEN_W / 2, SCREEN_H - 90, 30, '#fff', 600, 'center')
}

function brandGradient(ctx: Ctx, horizontal = true) {
  const g = ctx.createLinearGradient(0, 0, horizontal ? SCREEN_W : 0, horizontal ? 0 : SCREEN_H)
  g.addColorStop(0, '#5E5CE6')
  g.addColorStop(1, '#32D2FF')
  return g
}

function check(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = r * 0.18
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.4, cy)
  ctx.lineTo(cx - r * 0.1, cy + r * 0.32)
  ctx.lineTo(cx + r * 0.45, cy - r * 0.35)
  ctx.stroke()
}

export function drawScreen(ctx: Ctx, kind: ScreenKind, data: ScreenData = {}) {
  const W = SCREEN_W
  const H = SCREEN_H
  const total = data.total ?? 0
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  rr(ctx, 0, 0, W, H, R)
  ctx.clip()

  const dark = kind === 'home' || kind === 'scan' || kind === 'pass'
  if (kind === 'home') ctx.fillStyle = brandGradient(ctx, false)
  else if (kind === 'scan' || kind === 'pass') ctx.fillStyle = INK
  else if (kind === 'cash') ctx.fillStyle = '#FFF4E0'
  else ctx.fillStyle = '#F5F5F7'
  ctx.fillRect(0, 0, W, H)
  chrome(ctx, dark)

  switch (kind) {
    case 'home': {
      text(ctx, 'passa', 44, 150, 44, '#fff', 800)
      text(ctx, 'Escaneie.', 44, 700, 66, '#fff', 800)
      text(ctx, 'Pague. Passe.', 44, 772, 66, '#fff', 800)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.beginPath()
      ctx.arc(W / 2, 410, 140, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ;[8, 4, 12, 4, 8, 4, 12, 4, 8].reduce((x, w, i) => {
        if (i % 2 === 0) ctx.fillRect(x, 360, w, 100)
        return x + w + 4
      }, W / 2 - 64)
      ctx.fillStyle = '#30D158'
      ctx.fillRect(W / 2 - 100, 408, 200, 4)
      button(ctx, 'Começar compra', INK)
      break
    }
    case 'checkin': {
      text(ctx, 'Você está em', 40, 170, 26, '#6E6E73', 400)
      ctx.fillStyle = '#fff'
      rr(ctx, 28, 196, W - 56, 150, 40)
      ctx.fill()
      const g = ctx.createLinearGradient(56, 224, 150, 318)
      g.addColorStop(0, '#FF9F0A')
      g.addColorStop(1, '#FF375F')
      ctx.fillStyle = g
      rr(ctx, 56, 224, 94, 94, 28)
      ctx.fill()
      text(ctx, 'A', 103, 288, 44, '#fff', 800, 'center')
      text(ctx, 'Mercado Aurora', 172, 262, 30, INK, 700)
      text(ctx, 'Unidade Centro', 172, 302, 24, '#6E6E73', 400)
      check(ctx, W / 2, 520, 90, '#30D158')
      text(ctx, 'Check-in feito', W / 2, 680, 38, INK, 800, 'center')
      text(ctx, 'Preços e promoções desta loja', W / 2, 726, 24, '#6E6E73', 400, 'center')
      text(ctx, 'carregados.', W / 2, 760, 24, '#6E6E73', 400, 'center')
      button(ctx, 'Abrir scanner', INK)
      break
    }
    case 'scan': {
      // câmera
      const g = ctx.createRadialGradient(W * 0.3, 320, 20, W * 0.3, 320, 360)
      g.addColorStop(0, 'rgba(255,159,10,0.35)')
      g.addColorStop(1, 'rgba(255,159,10,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, 600)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      const [x0, y0, x1, y1, c] = [90, 180, W - 90, 440, 46]
      ctx.beginPath()
      ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0)
      ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c)
      ctx.moveTo(x1, y1 - c); ctx.lineTo(x1, y1); ctx.lineTo(x1 - c, y1)
      ctx.moveTo(x0 + c, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - c)
      ctx.stroke()
      ctx.fillStyle = '#30D158'
      ctx.fillRect(x0 + 18, 308, x1 - x0 - 36, 4)
      text(ctx, 'Aponte para o código de barras', W / 2, 500, 22, 'rgba(255,255,255,0.7)', 600, 'center')
      // carrinho do app
      const items = data.scanned ?? []
      ctx.fillStyle = '#fff'
      rr(ctx, 0, 560, W, 600, 56)
      ctx.fill()
      text(ctx, 'Seu carrinho', 40, 636, 34, INK, 800)
      text(ctx, `${items.length} ${items.length === 1 ? 'item' : 'itens'}`, 40, 674, 22, '#6E6E73', 400)
      text(ctx, formatBRL(data.subtotal ?? 0), W - 40, 636, 34, INK, 800, 'right')
      items.slice(-4).forEach((p, i) => {
        const y = 712 + i * 84
        ctx.fillStyle = p.tint
        rr(ctx, 40, y, 64, 64, 18)
        ctx.fill()
        text(ctx, p.name, 124, y + 30, 24, INK, 600)
        text(ctx, formatBRL(p.price), 124, y + 58, 20, '#6E6E73', 400)
      })
      if (items.length === 0) text(ctx, 'Escaneie o primeiro produto', W / 2, 760, 24, '#8E8E93', 500, 'center')
      break
    }
    case 'pay': {
      text(ctx, 'Total a pagar', W / 2, 190, 26, '#6E6E73', 400, 'center')
      text(ctx, formatBRL(total), W / 2, 280, 84, INK, 800, 'center')
      const methods: Array<[string, string, boolean]> = [
        ['Pix', '#00A896', true],
        ['Carteira digital', INK, false],
        ['Cartão final 4242', '#5E5CE6', false],
        ['Dinheiro no caixa', '#FF9F0A', false],
      ]
      methods.forEach(([label, color, sel], i) => {
        const y = 360 + i * 128
        ctx.fillStyle = '#fff'
        rr(ctx, 28, y, W - 56, 110, 34)
        ctx.fill()
        if (sel) {
          ctx.strokeStyle = '#5E5CE6'
          ctx.lineWidth = 5
          rr(ctx, 30, y + 2, W - 60, 106, 32)
          ctx.stroke()
        }
        ctx.fillStyle = color
        rr(ctx, 54, y + 25, 60, 60, 18)
        ctx.fill()
        text(ctx, label, 136, y + 66, 28, INK, 600)
      })
      button(ctx, 'Pagar com Pix', brandGradient(ctx))
      break
    }
    case 'paid': {
      check(ctx, W / 2, 400, 110, '#30D158')
      text(ctx, 'Pix aprovado', W / 2, 590, 46, INK, 800, 'center')
      text(ctx, formatBRL(total), W / 2, 650, 32, '#6E6E73', 600, 'center')
      text(ctx, 'Gerando seu passe de saída…', W / 2, 760, 24, '#6E6E73', 400, 'center')
      break
    }
    case 'pass':
    case 'cash': {
      const isPass = kind === 'pass'
      const accent = isPass ? '#30D158' : '#FF9F0A'
      if (isPass) {
        const g = ctx.createRadialGradient(W / 2, 520, 10, W / 2, 520, 420)
        g.addColorStop(0, 'rgba(48,209,88,0.55)')
        g.addColorStop(1, 'rgba(48,209,88,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }
      text(ctx, isPass ? 'Pagamento aprovado' : 'Pague no caixa expresso', W / 2, 150, 26, isPass ? accent : '#B36B00', 700, 'center')
      text(ctx, isPass ? 'Passe de saída' : 'Código de pagamento', W / 2, 210, isPass ? 44 : 38, isPass ? '#fff' : INK, 800, 'center')
      ctx.fillStyle = '#fff'
      rr(ctx, 56, 270, W - 112, 560, 56)
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 6
      rr(ctx, 96, 310, W - 192, W - 192, 36)
      ctx.stroke()
      qr(ctx, 126, 340, W - 252, isPass ? 'passe-A7F3-219' : `dinheiro-${data.code}`)
      if (isPass) text(ctx, formatBRL(total), W / 2, 770, 48, INK, 800, 'center')
      else text(ctx, data.code ?? '', W / 2, 770, 56, INK, 800, 'center', '"JetBrains Mono", Consolas, monospace')
      text(ctx, isPass ? 'Mostre no balcão de saída' : `Valor: ${formatBRL(total)}`, W / 2, 920, 26, isPass ? 'rgba(255,255,255,0.7)' : '#6B5A43', 500, 'center')
      break
    }
  }
  ctx.restore()
}
