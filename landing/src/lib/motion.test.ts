import { describe, expect, it } from 'vitest'
import { clamp, damp, lerp, mapRange, projectMomentum, rubberBand, smoothstep } from './motion'

describe('clamp / lerp / mapRange', () => {
  it('clamp limita ao intervalo', () => {
    expect(clamp(-1)).toBe(0)
    expect(clamp(2)).toBe(1)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('lerp interpola linearmente', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5)
  })

  it('mapRange converte e satura', () => {
    expect(mapRange(0.36, 0.22, 0.5)).toBeCloseTo(0.5)
    expect(mapRange(0, 0.22, 0.5)).toBe(0)
    expect(mapRange(1, 0.22, 0.5)).toBe(1)
    expect(mapRange(5, 0, 10, 100, 200)).toBe(150)
  })

  it('mapRange com intervalo degenerado devolve o início da saída', () => {
    expect(mapRange(3, 1, 1, 7, 9)).toBe(7)
  })
})

describe('smoothstep', () => {
  it('tem extremos fixos e é simétrico', () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.5)).toBe(0.5)
    expect(smoothstep(0.25) + smoothstep(0.75)).toBeCloseTo(1)
  })
})

describe('damp', () => {
  it('se aproxima do alvo sem ultrapassar (criticamente amortecido)', () => {
    let v = 0
    for (let i = 0; i < 120; i++) {
      v = damp(v, 1, 4, 1 / 60)
      expect(v).toBeLessThanOrEqual(1)
    }
    expect(v).toBeGreaterThan(0.98)
  })

  it('é independente do frame rate', () => {
    let a = 0
    let b = 0
    for (let i = 0; i < 60; i++) a = damp(a, 1, 4, 1 / 60)
    for (let i = 0; i < 30; i++) b = damp(b, 1, 4, 1 / 30)
    expect(a).toBeCloseTo(b, 6)
  })
})

describe('rubberBand', () => {
  it('resiste progressivamente: nunca passa da dimensão e cresce menos que linear', () => {
    const d = 400
    const small = rubberBand(50, d)
    const big = rubberBand(500, d)
    expect(small).toBeLessThan(50)
    expect(big).toBeLessThan(d)
    expect(big / 500).toBeLessThan(small / 50)
  })

  it('preserva o sinal e é zero na origem', () => {
    expect(rubberBand(0, 300)).toBe(0)
    expect(rubberBand(-100, 300)).toBeCloseTo(-rubberBand(100, 300))
  })

  it('dimensão inválida devolve zero', () => {
    expect(rubberBand(100, 0)).toBe(0)
  })
})

describe('projectMomentum', () => {
  it('projeta a distância a partir da velocidade (d = 0.998)', () => {
    expect(projectMomentum(1000)).toBeCloseTo(499, 0)
    expect(projectMomentum(-1000)).toBeCloseTo(-499, 0)
  })

  it('taxa menor (0.99) para mais rápido', () => {
    expect(Math.abs(projectMomentum(1000, 0.99))).toBeLessThan(Math.abs(projectMomentum(1000)))
  })
})
