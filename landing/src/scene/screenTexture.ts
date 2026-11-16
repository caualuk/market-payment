/**
 * Desenha as telas do app em um <canvas> 2D que vira textura do celular 3D.
 * Mantém a mesma linguagem visual das telas do FigCraft (design/passa-app.figcraft).
 */
import { qrMatrix } from '../lib/qr'
import type { ScreenKind } from './keyframes'

export const SCREEN_W = 512
export const SCREEN_H = 1100
const R = 70 // raio dos cantos da tela

const INK = '#0A0A0F'
const FONT = '-apple-system, "SF Pro Display", Inter, "Segoe UI", system-ui, sans-serif'

type Ctx = CanvasRenderingContext2D

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function text(ctx: Ctx, s: string, x: number, y: number, size: number, color: string, weight = 600, align: CanvasTextAlign = 'left') {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(s, x, y)
}

function qr(ctx: Ctx, x: number, y: number, size: number, color: string, seed: string) {
  const m = qrMatrix(seed)
  const cell = size / m.length
  ctx.fillStyle = color
  m.forEach((row, j) => row.forEach((on, i) => on && ctx.fillRect(x + i * cell, y + j * cell, cell + 0.5, cell + 0.5)))
}

function chrome(ctx: Ctx, dark: boolean) {
  // dynamic island + hora
  ctx.fillStyle = '#000'
  rr(ctx, SCREEN_W / 2 - 62, 26, 124, 36, 18)
  ctx.fill()
  text(ctx, '9:41', 52, 54, 24, dark ? '#fff' : INK, 600)
}

const BG: Record<ScreenKind, string | [string, string]> = {
  home: ['#5E5CE6', '#32D2FF'],
  checkin: '#F5F5F7',
  scan: ['#1C1C24', '#0A0A0F'],
  pay: '#F5F5F7',
  pass: INK,
  cash: ['#FFF4E0', '#F5F5F7'],
}

export function drawScreen(ctx: Ctx, kind: ScreenKind) {
  const W = SCREEN_W
  const H = SCREEN_H
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  rr(ctx, 0, 0, W, H, R)
  ctx.clip()

  const bg = BG[kind]
  if (Array.isArray(bg)) {
    const g = ctx.createLinearGradient(0, 0, kind === 'home' ? W : 0, H)
    g.addColorStop(0, bg[0])
    g.addColorStop(1, bg[1])
    ctx.fillStyle = g
  } else ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const dark = kind === 'home' || kind === 'scan' || kind === 'pass'
  chrome(ctx, dark)

  switch (kind) {
    case 'home': {
      text(ctx, 'passa', 44, 150, 44, '#fff', 800)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.beginPath()
      ctx.arc(W / 2, 430, 150, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      const bars = [8, 4, 12, 4, 8, 4, 12, 4, 8, 4, 6]
      let bx = W / 2 - 80
      bars.forEach((w, i) => {
        if (i % 2 === 0) ctx.fillRect(bx, 380, w, 100)
        bx += w + 4
      })
      ctx.fillStyle = '#30D158'
      ctx.fillRect(W / 2 - 110, 428, 220, 4)
      text(ctx, 'Escaneie.', 44, 760, 64, '#fff', 800)
      text(ctx, 'Pague. Passe.', 44, 830, 64, '#fff', 800)
      ctx.fillStyle = INK
      rr(ctx, 32, H - 150, W - 64, 96, 48)
      ctx.fill()
      text(ctx, 'Começar compra', W / 2, H - 90, 30, '#fff', 600, 'center')
      break
    }
    case 'checkin': {
      text(ctx, 'Você está em', 40, 170, 26, '#6E6E73', 400)
      ctx.fillStyle = '#fff'
      rr(ctx, 28, 200, W - 56, 150, 40)
      ctx.fill()
      const g = ctx.createLinearGradient(56, 228, 150, 322)
      g.addColorStop(0, '#FF9F0A')
      g.addColorStop(1, '#FF375F')
      ctx.fillStyle = g
      rr(ctx, 56, 228, 94, 94, 28)
      ctx.fill()
      text(ctx, 'A', 103, 292, 44, '#fff', 800, 'center')
      text(ctx, 'Mercado Aurora', 176, 266, 30, INK, 700)
      text(ctx, 'Unidade Centro', 176, 306, 24, '#6E6E73', 400)
      qr(ctx, 106, 430, 300, INK, 'loja-aurora-centro')
      text(ctx, 'Check-in feito ✓', W / 2, 800, 32, '#30A14E', 700, 'center')
      break
    }
    case 'scan': {
      ctx.fillStyle = 'rgba(255,159,10,0.25)'
      ctx.beginPath()
      ctx.arc(80, 380, 200, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      const [x0, y0, x1, y1, c] = [86, 300, W - 86, 600, 50]
      ctx.beginPath()
      ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0)
      ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c)
      ctx.moveTo(x1, y1 - c); ctx.lineTo(x1, y1); ctx.lineTo(x1 - c, y1)
      ctx.moveTo(x0 + c, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - c)
      ctx.stroke()
      ctx.fillStyle = '#30D158'
      ctx.fillRect(x0 + 20, 448, x1 - x0 - 40, 4)
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      rr(ctx, 40, 150, W - 80, 90, 45)
      ctx.fill()
      ctx.fillStyle = '#30D158'
      ctx.beginPath()
      ctx.arc(95, 195, 32, 0, Math.PI * 2)
      ctx.fill()
      text(ctx, '+1', 95, 205, 26, '#fff', 800, 'center')
      text(ctx, 'Leite Integral 1L', 145, 205, 26, INK, 600)
      ctx.fillStyle = '#fff'
      rr(ctx, 0, 760, W, 400, 56)
      ctx.fill()
      text(ctx, 'Seu carrinho', 40, 840, 36, INK, 800)
      text(ctx, 'R$ 64,90', W - 40, 840, 36, INK, 800, 'right')
      ;['#E5F0FF', '#FFF1DB', '#E3F9E9', '#F2F2F7'].forEach((col, i) => {
        ctx.fillStyle = col
        rr(ctx, 40 + i * 110, 880, 96, 96, 26)
        ctx.fill()
      })
      break
    }
    case 'pay': {
      text(ctx, 'Total a pagar', W / 2, 200, 26, '#6E6E73', 400, 'center')
      text(ctx, 'R$ 75,28', W / 2, 290, 92, INK, 800, 'center')
      const methods: Array<[string, string, boolean]> = [
        ['Pix', '#00A896', true],
        ['Carteira digital', INK, false],
        ['Cartão final 4242', '#5E5CE6', false],
        ['Dinheiro no caixa', '#FF9F0A', false],
      ]
      methods.forEach(([label, color, sel], i) => {
        const y = 370 + i * 130
        ctx.fillStyle = '#fff'
        rr(ctx, 28, y, W - 56, 112, 34)
        ctx.fill()
        if (sel) {
          ctx.strokeStyle = '#5E5CE6'
          ctx.lineWidth = 5
          rr(ctx, 30, y + 2, W - 60, 108, 32)
          ctx.stroke()
        }
        ctx.fillStyle = color
        rr(ctx, 54, y + 26, 60, 60, 18)
        ctx.fill()
        text(ctx, label, 136, y + 68, 28, INK, 600)
      })
      const g = ctx.createLinearGradient(0, 0, W, 0)
      g.addColorStop(0, '#5E5CE6')
      g.addColorStop(1, '#32D2FF')
      ctx.fillStyle = g
      rr(ctx, 32, H - 150, W - 64, 96, 48)
      ctx.fill()
      text(ctx, 'Pagar com Pix', W / 2, H - 90, 30, '#fff', 600, 'center')
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
      text(ctx, isPass ? 'Pagamento aprovado' : 'Pague no caixa', W / 2, 150, 26, accent, 700, 'center')
      text(ctx, isPass ? 'Passe de saída' : 'Código de pagamento', W / 2, 210, isPass ? 44 : 38, isPass ? '#fff' : INK, 800, 'center')
      ctx.fillStyle = '#fff'
      rr(ctx, 56, 270, W - 112, 560, 56)
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 6
      rr(ctx, 96, 310, W - 192, W - 192, 36)
      ctx.stroke()
      qr(ctx, 126, 340, W - 252, INK, isPass ? 'passe-A7F3-219' : 'dinheiro-482913')
      if (isPass) {
        text(ctx, 'R$ 75,28', W / 2, 770, 48, INK, 800, 'center')
      } else {
        text(ctx, '482 913', W / 2, 770, 56, INK, 800, 'center')
      }
      text(ctx, isPass ? 'Mostre no balcão de saída' : 'Mostre ao operador', W / 2, 920, 26, isPass ? 'rgba(255,255,255,0.7)' : '#6E6E73', 500, 'center')
      break
    }
  }
  ctx.restore()
}
