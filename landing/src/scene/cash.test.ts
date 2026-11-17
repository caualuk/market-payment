import { describe, expect, it } from 'vitest'
import { calcChange } from '../lib/cart'
import { CASH_RECEIVED, CASH_STEPS, CASH_TOTAL, cashFrame, COIN_TO, NOTE_TO, type TerminalState } from './cash'

const at = (step: number, local: number) => cashFrame((step + local) / CASH_STEPS.length)
const samples = Array.from({ length: 1001 }, (_, i) => i / 1000)

describe('cena do caixa: valores do design', () => {
  it('total R$ 75,28, nota de R$ 100, troco R$ 24,72', () => {
    expect(CASH_TOTAL).toBe(7528)
    expect(calcChange(CASH_TOTAL, CASH_RECEIVED).change).toBe(2472)
  })
})

describe('cena do caixa: sequência', () => {
  it('4 passos na ordem do fluxo proposto', () => {
    expect(CASH_STEPS).toEqual(['codigo', 'leitura', 'dinheiro', 'liberado'])
    expect(at(0, 0.5).stepId).toBe('codigo')
    expect(at(3, 0.5).stepId).toBe('liberado')
    expect(cashFrame(1).stepId).toBe('liberado')
  })

  it('o tablet passa pelos estados em ordem, sem voltar', () => {
    const order: TerminalState[] = ['idle', 'reading', 'awaiting', 'received', 'released']
    let last = 0
    for (const p of samples) {
      const idx = order.indexOf(cashFrame(p).terminal)
      expect(idx).toBeGreaterThanOrEqual(last)
      last = idx
    }
    expect(cashFrame(0).terminal).toBe('idle')
    expect(cashFrame(1).terminal).toBe('released')
  })

  it('o feixe de leitura só aparece no passo "leitura"', () => {
    expect(at(0, 0.5).beam).toBe(0)
    expect(at(1, 0.3).beam).toBeGreaterThan(0.8)
    expect(at(2, 0.5).beam).toBe(0)
  })

  it('a nota entra de fora do quadro e termina no balcão — antes do troco', () => {
    expect(at(1, 0.9).note).toBe(0)
    expect(at(2, 0.45).note).toBe(1)
    expect(at(3, 0.5).notePos).toEqual(NOTE_TO)
    expect(at(3, 0.5).noteRotX).toBeCloseTo(-Math.PI / 2)
  })

  it('a moeda do troco digital só existe enquanto viaja do caixa para o app', () => {
    expect(at(2, 0.3).coinVisible).toBe(false)
    const mid = at(2, 0.72)
    expect(mid.coinVisible).toBe(true)
    expect(mid.coinScale).toBeGreaterThan(0.9)
    expect(at(3, 0.2).coinVisible).toBe(false)
    // chega ao celular antes de sumir (é "absorvida" pela carteira)
    const end = at(2, 0.94)
    expect(Math.hypot(end.coinPos[0] - COIN_TO[0], end.coinPos[1] - COIN_TO[1])).toBeLessThan(0.1)
  })

  it('o QR do cliente fica verde só depois do dinheiro recebido', () => {
    for (const p of samples) {
      const f = cashFrame(p)
      if (f.phoneScreen === 'pass') expect(['received', 'released']).toContain(f.terminal)
    }
    expect(at(2, 0.9).phoneScreen).toBe('cash')
    expect(cashFrame(1).phoneScreen).toBe('pass')
    expect(cashFrame(1).glow).toBe(1)
  })

  it('progresso fora de [0,1] é saturado', () => {
    expect(cashFrame(-1)).toEqual(cashFrame(0))
    expect(cashFrame(2)).toEqual(cashFrame(1))
  })
})
