/**
 * Roteiro 3D da seção "Dinheiro também passa" — acontece no balcão do caixa expresso.
 *
 *  0  código    O celular do cliente mostra o QR âmbar + 6 dígitos.
 *  1  leitura   O tablet do caixa lê o QR (feixe) e abre o pedido: "Receber R$ 75,28".
 *  2  dinheiro  O cliente entrega uma nota de R$ 100 (entra pela esquerda, como uma mão);
 *               o troco de R$ 24,72 vira uma moeda que voa do caixa para o app (troco digital).
 *  3  liberado  O QR do cliente fica verde e a cancela da saída abre.
 *
 * Função pura do progresso da seção, reversível pelo scroll.
 */
import { clamp, lerp, smoothstep } from '../lib/motion'
import { arc, type ScreenKind, type Vec3 } from './story'

export const CASH_STEPS = ['codigo', 'leitura', 'dinheiro', 'liberado'] as const
export type CashStep = (typeof CASH_STEPS)[number]
export type TerminalState = 'idle' | 'reading' | 'awaiting' | 'received' | 'released'

/** Valores do exemplo, iguais às telas 06/07 do FigCraft. */
export const CASH_TOTAL = 7528
export const CASH_RECEIVED = 10000
export const CASH_CODE = '482 913'

export const CASH_PHONE: { pos: Vec3; rot: Vec3 } = { pos: [-1.0, -0.17, 0.35], rot: [-0.08, 0.38, 0] }
export const CASH_TERMINAL: { pos: Vec3; rotY: number } = { pos: [0.75, -1.2, 0], rotY: -0.5 }
/** A nota vem de fora do quadro, na altura da mão, e pousa no balcão. */
export const NOTE_FROM: Vec3 = [-4.4, -0.1, 1.7]
export const NOTE_TO: Vec3 = [0.35, -1.13, 0.3]
export const COIN_FROM: Vec3 = [0.35, 0.05, 0.3]
export const COIN_TO: Vec3 = [-1.0, -0.05, 0.5]

export interface CashFrame {
  p: number
  step: number
  stepId: CashStep
  local: number
  phoneScreen: ScreenKind
  terminal: TerminalState
  beam: number
  /** posição da nota no trajeto (0 = fora do quadro, 1 = no balcão) */
  note: number
  notePos: Vec3
  /** rotação X da nota: em pé na mão → deitada no balcão */
  noteRotX: number
  /** moeda do troco digital: visível só durante a transferência */
  coin: number
  coinVisible: boolean
  coinPos: Vec3
  coinScale: number
  /** brilho verde de liberação */
  glow: number
}

const bell = (x: number, from: number, to: number) => (x <= from || x >= to ? 0 : Math.sin(((x - from) / (to - from)) * Math.PI))

export function cashFrame(raw: number): CashFrame {
  const p = clamp(raw)
  const step = Math.min(CASH_STEPS.length - 1, Math.floor(p * CASH_STEPS.length))
  const local = p * CASH_STEPS.length - step
  const at = (s: number) => clamp(p * CASH_STEPS.length - s) // progresso do passo s, saturado

  const reading = at(1)
  const money = at(2)
  const release = at(3)

  let terminal: TerminalState = 'idle'
  if (step === 1) terminal = reading < 0.5 ? 'reading' : 'awaiting'
  else if (step === 2) terminal = money < 0.45 ? 'awaiting' : 'received'
  else if (step === 3) terminal = release < 0.35 ? 'received' : 'released'

  const note = smoothstep(money / 0.45)
  const coinK = clamp((money - 0.5) / 0.45)
  const coinVisible = money > 0.5 && money < 0.95
  // a moeda "nasce" no caixa e é absorvida pelo celular
  const coinScale = coinVisible ? Math.min(smoothstep(coinK / 0.15), smoothstep((1 - coinK) / 0.15)) : 0

  return {
    p,
    step,
    stepId: CASH_STEPS[step],
    local,
    phoneScreen: release >= 0.35 ? 'pass' : 'cash',
    terminal,
    beam: bell(reading, 0.05, 0.6),
    note,
    notePos: arc(NOTE_FROM, NOTE_TO, 0.25, note),
    noteRotX: lerp(-0.2, -Math.PI / 2, note),
    coin: coinK,
    coinVisible,
    coinPos: arc(COIN_FROM, COIN_TO, 0.9, smoothstep(coinK)),
    coinScale,
    glow: smoothstep((release - 0.35) / 0.3),
  }
}
