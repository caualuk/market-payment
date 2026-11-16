import { describe, expect, it } from 'vitest'
import { CATALOG } from './cart'
import { checkoutReducer as reduce, initialState, type Action, type CheckoutState } from './checkout'

const run = (actions: Action[], from: CheckoutState = initialState) => actions.reduce(reduce, from)
const scanned = (n: number) => run(Array.from({ length: n }, () => ({ type: 'SCAN' }) as Action))

describe('compra (shopping)', () => {
  it('SCAN adiciona o próximo produto do catálogo e avança o cursor', () => {
    const s = scanned(2)
    expect(s.cart.map((l) => l.product.id)).toEqual([CATALOG[0].id, CATALOG[1].id])
    expect(s.scanCursor).toBe(2)
    expect(s.lastScanned).toBe(CATALOG[1])
  })

  it('SCAN com produto explícito não avança o cursor', () => {
    const s = run([{ type: 'SCAN', product: CATALOG[3] }])
    expect(s.cart[0].product).toBe(CATALOG[3])
    expect(s.scanCursor).toBe(0)
  })

  it('o cursor dá a volta no catálogo', () => {
    const s = scanned(CATALOG.length + 1)
    expect(s.cart[0].qty).toBe(2)
  })

  it('CHECKOUT com carrinho vazio mostra erro e não avança', () => {
    const s = run([{ type: 'CHECKOUT' }])
    expect(s.stage).toBe('shopping')
    expect(s.error).toMatch(/pelo menos um item/)
  })

  it('escanear de novo limpa o erro', () => {
    const s = run([{ type: 'CHECKOUT' }, { type: 'SCAN' }])
    expect(s.error).toBeNull()
  })
})

describe('checkout', () => {
  it('CHECKOUT fecha o total em centavos', () => {
    const s = reduce(scanned(2), { type: 'CHECKOUT' })
    expect(s.stage).toBe('checkout')
    expect(s.total).toBe(CATALOG[0].price + CATALOG[1].price)
  })

  it('BACK_TO_CART volta para a compra', () => {
    const s = run([{ type: 'CHECKOUT' }, { type: 'BACK_TO_CART' }], scanned(1))
    expect(s.stage).toBe('shopping')
  })

  it('zerar o último item no checkout volta para a compra', () => {
    const s = run([{ type: 'CHECKOUT' }, { type: 'SET_QTY', productId: CATALOG[0].id, qty: 0 }], scanned(1))
    expect(s.stage).toBe('shopping')
    expect(s.cart).toHaveLength(0)
  })

  it('SCAN é ignorado fora da etapa de compra', () => {
    const s = run([{ type: 'CHECKOUT' }, { type: 'SCAN' }], scanned(1))
    expect(s.cart).toHaveLength(1)
  })
})

describe('pagamento digital', () => {
  it.each(['pix', 'wallet', 'card'] as const)('PAY_DIGITAL (%s) aprova e gera o passe', (method) => {
    const s = run([{ type: 'CHECKOUT' }, { type: 'PAY_DIGITAL', method }], scanned(3))
    expect(s.stage).toBe('paid')
    expect(s.method).toBe(method)
    expect(s.change).toBeNull()
  })

  it('PAY_DIGITAL só funciona no checkout', () => {
    const s = reduce(scanned(1), { type: 'PAY_DIGITAL', method: 'pix' })
    expect(s.stage).toBe('shopping')
  })
})

describe('pagamento em dinheiro', () => {
  const awaiting = () => run([{ type: 'CHECKOUT' }, { type: 'PAY_CASH', random: () => 0.482913 }], scanned(3))

  it('PAY_CASH gera código de pagamento e aguarda o caixa', () => {
    const s = awaiting()
    expect(s.stage).toBe('awaiting_cash')
    expect(s.method).toBe('cash')
    expect(s.paymentCode).toBe('482 913')
  })

  it('o carrinho fica travado enquanto aguarda o dinheiro', () => {
    const s = awaiting()
    const afterScan = reduce(s, { type: 'SCAN' })
    const afterQty = reduce(s, { type: 'SET_QTY', productId: CATALOG[0].id, qty: 9 })
    expect(afterScan).toBe(s)
    expect(afterQty).toBe(s)
  })

  it('CHANGE_METHOD volta ao checkout e invalida o código', () => {
    const s = reduce(awaiting(), { type: 'CHANGE_METHOD' })
    expect(s.stage).toBe('checkout')
    expect(s.paymentCode).toBeNull()
  })

  it('CASHIER_CONFIRM com valor suficiente libera a saída com troco', () => {
    const s0 = awaiting()
    const s = reduce(s0, { type: 'CASHIER_CONFIRM', received: s0.total + 1000 })
    expect(s.stage).toBe('paid')
    expect(s.change).toBe(1000)
    expect(s.received).toBe(s0.total + 1000)
  })

  it('CASHIER_CONFIRM com valor insuficiente mantém aguardando e mostra erro', () => {
    const s0 = awaiting()
    const s = reduce(s0, { type: 'CASHIER_CONFIRM', received: s0.total - 250 })
    expect(s.stage).toBe('awaiting_cash')
    expect(s.error).toBe('Faltam 2,50 reais.')
  })

  it('troco digital vem ligado por padrão e pode ser desligado', () => {
    expect(awaiting().digitalChange).toBe(true)
    expect(reduce(awaiting(), { type: 'TOGGLE_DIGITAL_CHANGE' }).digitalChange).toBe(false)
  })

  it('CASHIER_CONFIRM fora de awaiting_cash é ignorado', () => {
    const s = scanned(1)
    expect(reduce(s, { type: 'CASHIER_CONFIRM', received: 99999 })).toBe(s)
  })
})

describe('RESET', () => {
  it('volta ao estado inicial de qualquer etapa', () => {
    const paid = run([{ type: 'CHECKOUT' }, { type: 'PAY_DIGITAL', method: 'pix' }], scanned(2))
    expect(reduce(paid, { type: 'RESET' })).toEqual(initialState)
  })
})
