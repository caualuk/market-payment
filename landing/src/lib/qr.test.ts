import { describe, expect, it } from 'vitest'
import { finderOrigins, hashString, qrMatrix } from './qr'

describe('qrMatrix', () => {
  it('gera uma matriz quadrada do tamanho pedido', () => {
    const m = qrMatrix('abc', 25)
    expect(m).toHaveLength(25)
    expect(m.every((row) => row.length === 25)).toBe(true)
  })

  it('é determinística por seed', () => {
    expect(qrMatrix('passe-1')).toEqual(qrMatrix('passe-1'))
    expect(qrMatrix(42)).toEqual(qrMatrix(42))
  })

  it('seeds diferentes geram padrões diferentes (QR muda a cada janela)', () => {
    expect(qrMatrix('pass-100')).not.toEqual(qrMatrix('pass-101'))
  })

  it('desenha os três padrões de localização (finders) 7×7', () => {
    const m = qrMatrix('x')
    for (const [fx, fy] of finderOrigins(25)) {
      // borda externa preenchida
      expect(m[fy][fx]).toBe(true)
      expect(m[fy + 6][fx + 6]).toBe(true)
      // anel interno vazio
      expect(m[fy + 1][fx + 1]).toBe(false)
      // núcleo 3×3 preenchido
      expect(m[fy + 3][fx + 3]).toBe(true)
    }
  })

  it('mantém a zona de silêncio ao redor dos finders', () => {
    const m = qrMatrix('quiet')
    expect(m[7][0]).toBe(false)
    expect(m[0][7]).toBe(false)
  })

  it('tem módulos aleatórios fora dos finders (nem tudo vazio nem cheio)', () => {
    const cells = qrMatrix('density').flat()
    const on = cells.filter(Boolean).length
    expect(on).toBeGreaterThan(cells.length * 0.25)
    expect(on).toBeLessThan(cells.length * 0.75)
  })
})

describe('hashString', () => {
  it('é estável e sem sinal', () => {
    expect(hashString('passa')).toBe(hashString('passa'))
    expect(hashString('passa')).toBeGreaterThanOrEqual(0)
    expect(hashString('a')).not.toBe(hashString('b'))
  })
})
