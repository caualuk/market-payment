import { describe, expect, it } from 'vitest'
import { CATALOG } from './cart'
import { ean13CheckDigit, ean13Modules, isValidEan13, isVariableWeight, withCheckDigit } from './ean'

describe('EAN-13', () => {
  it('calcula o dígito verificador (exemplos conhecidos)', () => {
    expect(ean13CheckDigit('400638133393')).toBe(1) // 4006381333931
    expect(ean13CheckDigit('789100010010')).toBe(3)
    expect(withCheckDigit('200000000420')).toBe('2000000004204')
  })

  it('valida códigos', () => {
    expect(isValidEan13('4006381333931')).toBe(true)
    expect(isValidEan13('4006381333932')).toBe(false)
    expect(isValidEan13('123')).toBe(false)
    expect(isValidEan13('abcdefghijklm')).toBe(false)
  })

  it('rejeita entrada malformada no verificador', () => {
    expect(() => ean13CheckDigit('12')).toThrow()
  })

  it('todos os produtos do catálogo têm EAN-13 válido', () => {
    CATALOG.forEach((p) => expect(isValidEan13(p.barcode), p.name).toBe(true))
  })

  it('gera 95 módulos com as guardas nos lugares certos', () => {
    const m = ean13Modules('4006381333931')
    expect(m).toHaveLength(95)
    expect(m.slice(0, 3)).toBe('101')
    expect(m.slice(45, 50)).toBe('01010')
    expect(m.slice(92)).toBe('101')
  })

  it('aplica a paridade L/G pelo 1º dígito e o conjunto R à direita', () => {
    const m = ean13Modules('4006381333931')
    // 1º dígito 4 → paridade LGLLGG
    expect(m.slice(3, 10)).toBe('0001101') // 0 em L
    expect(m.slice(10, 17)).toBe('0100111') // 0 em G
    expect(m.slice(17, 24)).toBe('0101111') // 6 em L
    // lado direito: 3 em R (complemento de L)
    expect(m.slice(50, 57)).toBe('1000010')
    // cada dígito tem exatamente 2 barras e 2 espaços (7 módulos)
    for (let i = 0; i < 6; i++) {
      const left = m.slice(3 + i * 7, 10 + i * 7)
      expect(left.match(/(1+)/g)).toHaveLength(2)
    }
  })

  it('recusa desenhar código inválido', () => {
    expect(() => ean13Modules('4006381333932')).toThrow(/inválido/)
  })

  it('identifica produto de peso variável (balança da loja)', () => {
    expect(isVariableWeight('2000000004204')).toBe(true)
    expect(isVariableWeight('7891000100103')).toBe(false)
  })
})
