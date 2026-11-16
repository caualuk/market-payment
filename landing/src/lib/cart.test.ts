import { describe, expect, it } from 'vitest'
import {
  addItem,
  calcChange,
  CATALOG,
  cartCount,
  cartSubtotal,
  createPaymentCode,
  formatBRL,
  MAX_QTY,
  passWindow,
  secondsToRotate,
  setQty,
  suggestReceived,
  type CartLine,
} from './cart'

const [leite, pao, abacate, cafe, sabao] = CATALOG

/** Carrinho igual ao das telas do FigCraft: 8 itens, R$ 77,28. */
function figmaCart(): CartLine[] {
  let c: CartLine[] = []
  c = addItem(c, leite)
  c = addItem(c, leite)
  c = addItem(c, pao)
  c = addItem(c, abacate)
  c = addItem(c, abacate)
  c = addItem(c, abacate)
  c = addItem(c, cafe)
  c = addItem(c, sabao)
  return c
}

describe('addItem', () => {
  it('cria uma linha nova para um produto ainda não escaneado', () => {
    const cart = addItem([], leite)
    expect(cart).toEqual([{ product: leite, qty: 1 }])
  })

  it('incrementa a quantidade ao escanear o mesmo produto de novo', () => {
    const cart = addItem(addItem([], leite), leite)
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(2)
  })

  it('não muta o carrinho original (imutabilidade para o React)', () => {
    const original: CartLine[] = [{ product: leite, qty: 1 }]
    const next = addItem(original, leite)
    expect(original[0].qty).toBe(1)
    expect(next).not.toBe(original)
  })

  it(`limita a quantidade a ${MAX_QTY}`, () => {
    const cart = addItem([{ product: leite, qty: MAX_QTY }], leite)
    expect(cart[0].qty).toBe(MAX_QTY)
  })
})

describe('setQty', () => {
  it('altera a quantidade de uma linha', () => {
    expect(setQty(figmaCart(), 'leite', 5).find((l) => l.product.id === 'leite')?.qty).toBe(5)
  })

  it('remove a linha quando a quantidade chega a zero ou menos', () => {
    expect(setQty(figmaCart(), 'pao', 0).some((l) => l.product.id === 'pao')).toBe(false)
    expect(setQty(figmaCart(), 'pao', -3).some((l) => l.product.id === 'pao')).toBe(false)
  })

  it('arredonda para baixo e respeita o limite máximo', () => {
    expect(setQty(figmaCart(), 'cafe', 2.9)[3].qty).toBe(2)
    expect(setQty(figmaCart(), 'cafe', 500)[3].qty).toBe(MAX_QTY)
  })

  it('ignora valores não numéricos', () => {
    expect(setQty(figmaCart(), 'cafe', Number.NaN)).toEqual(figmaCart())
  })
})

describe('totais', () => {
  it('conta unidades, não linhas', () => {
    expect(cartCount(figmaCart())).toBe(8)
  })

  it('soma em centavos, batendo com o design (R$ 77,28)', () => {
    expect(cartSubtotal(figmaCart())).toBe(7728)
  })

  it('carrinho vazio vale zero', () => {
    expect(cartCount([])).toBe(0)
    expect(cartSubtotal([])).toBe(0)
  })
})

describe('formatBRL', () => {
  it('formata centavos em reais no padrão brasileiro', () => {
    expect(formatBRL(7528)).toBe('R$ 75,28')
    expect(formatBRL(0)).toBe('R$ 0,00')
    expect(formatBRL(123456)).toBe('R$ 1.234,56')
  })

  it('usa espaço comum em vez de NBSP', () => {
    expect(formatBRL(100)).not.toContain(' ')
  })
})

describe('calcChange', () => {
  it('calcula o troco quando o valor recebido cobre o total', () => {
    expect(calcChange(7528, 10000)).toEqual({ change: 2472, missing: 0, enough: true })
  })

  it('valor exato não gera troco', () => {
    expect(calcChange(7528, 7528)).toEqual({ change: 0, missing: 0, enough: true })
  })

  it('informa quanto falta quando o dinheiro não é suficiente', () => {
    expect(calcChange(7528, 5000)).toEqual({ change: 0, missing: 2528, enough: false })
  })
})

describe('suggestReceived', () => {
  it('sugere o valor exato e as próximas notas redondas', () => {
    expect(suggestReceived(7528)).toEqual([7528, 8000, 10000])
  })

  it('não repete valores e respeita o máximo', () => {
    const s = suggestReceived(1000, 4)
    expect(new Set(s).size).toBe(s.length)
    expect(s.length).toBeLessThanOrEqual(4)
    expect(s[0]).toBe(1000)
    expect(s.every((v, i) => i === 0 || v > 1000)).toBe(true)
  })
})

describe('createPaymentCode', () => {
  it('gera 6 dígitos no formato "000 000"', () => {
    expect(createPaymentCode(() => 0.482913)).toBe('482 913')
    expect(createPaymentCode(() => 0)).toBe('000 000')
    expect(createPaymentCode(() => 0.9999999)).toBe('999 999')
  })

  it('usa Math.random por padrão', () => {
    expect(createPaymentCode()).toMatch(/^\d{3} \d{3}$/)
  })
})

describe('rotação do QR de saída', () => {
  it('muda de janela a cada 30 s', () => {
    expect(passWindow(0)).toBe(0)
    expect(passWindow(29_999)).toBe(0)
    expect(passWindow(30_000)).toBe(1)
  })

  it('conta os segundos até a próxima rotação', () => {
    expect(secondsToRotate(0)).toBe(30)
    expect(secondsToRotate(29_001)).toBe(1)
    expect(secondsToRotate(15_000)).toBe(15)
  })
})
