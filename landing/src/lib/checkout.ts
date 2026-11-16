/**
 * Máquina de estados da demo interativa (espelha o fluxo real do app).
 *
 *   shopping ──CHECKOUT──▶ checkout ──PAY_DIGITAL──▶ paid
 *                              │
 *                              └──PAY_CASH──▶ awaiting_cash ──CASHIER_CONFIRM──▶ paid
 *                                                  │
 *                                                  └──CHANGE_METHOD──▶ checkout
 *
 * Em `awaiting_cash` o carrinho fica travado: o total foi fechado no código
 * de pagamento e não pode mudar até o caixa confirmar ou o cliente voltar.
 */
import {
  addItem,
  CATALOG,
  calcChange,
  cartCount,
  cartSubtotal,
  createPaymentCode,
  setQty,
  type CartLine,
  type Product,
} from './cart'

export type Stage = 'shopping' | 'checkout' | 'awaiting_cash' | 'paid'
export type DigitalMethod = 'pix' | 'wallet' | 'card'
export type Method = DigitalMethod | 'cash'

export interface CheckoutState {
  stage: Stage
  cart: CartLine[]
  /** Índice do próximo produto que o "scanner" da demo vai ler. */
  scanCursor: number
  lastScanned: Product | null
  method: Method | null
  paymentCode: string | null
  /** Total congelado no momento do pagamento (centavos). */
  total: number
  /** Valor entregue em dinheiro, se aplicável. */
  received: number | null
  change: number | null
  digitalChange: boolean
  error: string | null
}

export type Action =
  | { type: 'SCAN'; product?: Product }
  | { type: 'SET_QTY'; productId: string; qty: number }
  | { type: 'CHECKOUT' }
  | { type: 'BACK_TO_CART' }
  | { type: 'PAY_DIGITAL'; method: DigitalMethod }
  | { type: 'PAY_CASH'; random?: () => number }
  | { type: 'TOGGLE_DIGITAL_CHANGE' }
  | { type: 'CHANGE_METHOD' }
  | { type: 'CASHIER_CONFIRM'; received: number }
  | { type: 'RESET' }

export const initialState: CheckoutState = {
  stage: 'shopping',
  cart: [],
  scanCursor: 0,
  lastScanned: null,
  method: null,
  paymentCode: null,
  total: 0,
  received: null,
  change: null,
  digitalChange: true,
  error: null,
}

export function checkoutReducer(state: CheckoutState, action: Action): CheckoutState {
  switch (action.type) {
    case 'SCAN': {
      if (state.stage !== 'shopping') return state
      const product = action.product ?? CATALOG[state.scanCursor % CATALOG.length]
      return {
        ...state,
        cart: addItem(state.cart, product),
        scanCursor: action.product ? state.scanCursor : state.scanCursor + 1,
        lastScanned: product,
        error: null,
      }
    }
    case 'SET_QTY': {
      if (state.stage !== 'shopping' && state.stage !== 'checkout') return state
      const cart = setQty(state.cart, action.productId, action.qty)
      // Carrinho esvaziado no checkout volta para a compra.
      const stage = cart.length === 0 ? 'shopping' : state.stage
      return { ...state, cart, stage }
    }
    case 'CHECKOUT': {
      if (state.stage !== 'shopping') return state
      if (cartCount(state.cart) === 0) {
        return { ...state, error: 'Escaneie pelo menos um item para finalizar.' }
      }
      return { ...state, stage: 'checkout', total: cartSubtotal(state.cart), error: null }
    }
    case 'BACK_TO_CART':
      return state.stage === 'checkout' ? { ...state, stage: 'shopping', method: null } : state
    case 'PAY_DIGITAL':
      if (state.stage !== 'checkout') return state
      return {
        ...state,
        stage: 'paid',
        method: action.method,
        total: cartSubtotal(state.cart),
        error: null,
      }
    case 'PAY_CASH':
      if (state.stage !== 'checkout') return state
      return {
        ...state,
        stage: 'awaiting_cash',
        method: 'cash',
        total: cartSubtotal(state.cart),
        paymentCode: createPaymentCode(action.random),
        error: null,
      }
    case 'TOGGLE_DIGITAL_CHANGE':
      return { ...state, digitalChange: !state.digitalChange }
    case 'CHANGE_METHOD':
      if (state.stage !== 'awaiting_cash') return state
      return { ...state, stage: 'checkout', method: null, paymentCode: null }
    case 'CASHIER_CONFIRM': {
      if (state.stage !== 'awaiting_cash') return state
      const result = calcChange(state.total, action.received)
      if (!result.enough) {
        return { ...state, error: `Faltam ${(result.missing / 100).toFixed(2).replace('.', ',')} reais.` }
      }
      return {
        ...state,
        stage: 'paid',
        received: action.received,
        change: result.change,
        error: null,
      }
    }
    case 'RESET':
      return initialState
    default:
      return state
  }
}
