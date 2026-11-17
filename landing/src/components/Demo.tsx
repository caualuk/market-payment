/**
 * Demo interativa: um celular em HTML que roda o fluxo completo
 * (escanear → carrinho → pagamento → passe de saída), incluindo a simulação
 * do caixa para pagamento em dinheiro.
 */
import { useEffect, useReducer, useState } from 'react'
import { CATALOG, cartCount, cartSubtotal, formatBRL, secondsToRotate, suggestReceived } from '../lib/cart'
import { checkoutReducer, initialState, type DigitalMethod, type Method } from '../lib/checkout'
import { QrCode } from './ui/QrCode'
import { Reveal } from './ui/Reveal'

const METHODS: Array<{ id: Method; label: string; hint: string; icon: string; tint: string }> = [
  { id: 'pix', label: 'Pix', hint: 'Aprovação instantânea', icon: '◆', tint: '#00A896' },
  { id: 'wallet', label: 'Carteira digital', hint: 'Apple Pay ou Google Pay', icon: '', tint: '#0A0A0F' },
  { id: 'card', label: 'Cartão de crédito', hint: 'Final 4242', icon: '▬', tint: '#5E5CE6' },
  { id: 'cash', label: 'Dinheiro no caixa', hint: 'Pague no caixa expresso', icon: 'R$', tint: '#FF9F0A' },
]

const METHOD_LABEL: Record<Method, string> = { pix: 'Pix', wallet: 'Carteira digital', card: 'Cartão', cash: 'Dinheiro' }

export function Demo() {
  const [state, dispatch] = useReducer(checkoutReducer, initialState)
  const [method, setMethod] = useState<Method>('pix')
  const [scanning, setScanning] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const next = CATALOG[state.scanCursor % CATALOG.length]
  const total = state.stage === 'shopping' ? cartSubtotal(state.cart) : state.total

  useEffect(() => {
    if (state.stage !== 'paid') return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [state.stage])

  const scan = () => {
    if (scanning) return
    setScanning(true)
    window.setTimeout(() => {
      dispatch({ type: 'SCAN' })
      setScanning(false)
    }, 450)
  }

  const pay = () => {
    if (method === 'cash') dispatch({ type: 'PAY_CASH' })
    else dispatch({ type: 'PAY_DIGITAL', method: method as DigitalMethod })
  }

  return (
    <section id="demo" className="section demo" data-surface="light">
      <div className="container">
        <header className="section-head">
          <span className="eyebrow">Experimente</span>
          <Reveal as="h2">Faça uma compra agora mesmo.</Reveal>
          <p className="lede">Toque em escanear, monte o carrinho e escolha como pagar. No dinheiro, você também faz o papel do caixa.</p>
        </header>

        <div className="demo-grid">
          <div className="device" data-stage={state.stage}>
            <div className="device-island" />
            <div className="device-screen">
              {state.stage === 'shopping' && (
                <div className="screen screen-scan">
                  <div className="cam">
                    <div className="cam-glow" />
                    <div className={`viewfinder ${scanning ? 'is-scanning' : ''}`}>
                      <div className="barcode" aria-hidden="true">
                        <span className="barcode-emoji">{next.emoji}</span>
                        <span className="barcode-digits">{next.barcode}</span>
                      </div>
                      <div className="scanline" />
                    </div>
                    <div className="toast" role="status" aria-live="polite" data-testid="scan-toast">
                      {state.lastScanned && (
                        <span key={`${state.lastScanned.id}-${cartCount(state.cart)}`} className="toast-pill">
                          <b>+1</b> {state.lastScanned.name} <em>{formatBRL(state.lastScanned.price)}</em>
                        </span>
                      )}
                    </div>
                    <button className="scan-btn" onClick={scan} disabled={scanning}>
                      {scanning ? 'Lendo…' : 'Escanear produto'}
                    </button>
                  </div>
                  <div className="sheet">
                    <div className="sheet-head">
                      <div>
                        <strong>Seu carrinho</strong>
                        <span>{cartCount(state.cart)} {cartCount(state.cart) === 1 ? 'item' : 'itens'}</span>
                      </div>
                      <strong data-testid="cart-total">{formatBRL(total)}</strong>
                    </div>
                    <ul className="lines">
                      {state.cart.length === 0 && <li className="empty">Seu carrinho está vazio. Escaneie o primeiro item.</li>}
                      {state.cart.map((l) => (
                        <li key={l.product.id}>
                          <span className="thumb" style={{ background: l.product.tint }}>{l.product.emoji}</span>
                          <span className="line-name">
                            {l.product.name}
                            <small>{formatBRL(l.product.price)} un.</small>
                          </span>
                          <span className="stepper">
                            <button aria-label={`Remover um ${l.product.name}`} onClick={() => dispatch({ type: 'SET_QTY', productId: l.product.id, qty: l.qty - 1 })}>−</button>
                            <output aria-label={`Quantidade de ${l.product.name}`}>{l.qty}</output>
                            <button aria-label={`Adicionar um ${l.product.name}`} onClick={() => dispatch({ type: 'SET_QTY', productId: l.product.id, qty: l.qty + 1 })}>+</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {state.error && <p className="error" role="alert">{state.error}</p>}
                    <button className="cta-dark" onClick={() => dispatch({ type: 'CHECKOUT' })}>
                      Finalizar compra
                    </button>
                  </div>
                </div>
              )}

              {state.stage === 'checkout' && (
                <div className="screen screen-pay">
                  <button className="back" onClick={() => dispatch({ type: 'BACK_TO_CART' })}>‹ Carrinho</button>
                  <p className="muted center">Total a pagar</p>
                  <p className="big-total">{formatBRL(state.total)}</p>
                  <fieldset className="methods">
                    <legend>Como você quer pagar?</legend>
                    {METHODS.map((m) => (
                      <label key={m.id} className={`method ${method === m.id ? 'is-on' : ''}`}>
                        <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                        <span className="method-icon" style={{ background: m.tint }}>{m.icon}</span>
                        <span className="method-text">
                          {m.label}
                          <small>{m.hint}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <button className="cta-gradient" onClick={pay}>
                    {method === 'cash' ? 'Gerar código para o caixa' : `Pagar ${formatBRL(state.total)}`}
                  </button>
                </div>
              )}

              {state.stage === 'awaiting_cash' && (
                <div className="screen screen-cash">
                  <p className="pill pill-amber">Pague no caixa expresso</p>
                  <h3>Código de pagamento</h3>
                  <div className="ticket">
                    <div className="qr-frame amber">
                      <QrCode seed={`cash-${state.paymentCode}`} size={150} label="QR code de pagamento em dinheiro" />
                    </div>
                    <p className="code" data-testid="payment-code">{state.paymentCode}</p>
                    <p className="ticket-row"><span>Valor em dinheiro</span><b>{formatBRL(state.total)}</b></p>
                  </div>
                  <label className="switch-row">
                    <span>
                      Troco digital
                      <small>Receba o troco como crédito Passa</small>
                    </span>
                    <input type="checkbox" role="switch" checked={state.digitalChange} onChange={() => dispatch({ type: 'TOGGLE_DIGITAL_CHANGE' })} />
                  </label>
                  <button className="link" onClick={() => dispatch({ type: 'CHANGE_METHOD' })}>Trocar forma de pagamento</button>
                </div>
              )}

              {state.stage === 'paid' && (
                <div className="screen screen-pass">
                  <p className="pill pill-green">Pagamento aprovado</p>
                  <h3>Seu passe de saída</h3>
                  <div className="ticket">
                    <div className="qr-frame green">
                      <QrCode seed={`pass-${Math.floor(now / 30000)}`} size={150} label="QR code do passe de saída" />
                    </div>
                    <p className="ticket-row"><span>Total pago · {state.method && METHOD_LABEL[state.method]}</span><b>{formatBRL(state.total)}</b></p>
                    {state.change !== null && state.change > 0 && (
                      <p className="ticket-row small">
                        <span>Troco {state.digitalChange ? 'na carteira Passa' : 'em espécie'}</span>
                        <b>{formatBRL(state.change)}</b>
                      </p>
                    )}
                  </div>
                  <p className="timer">Novo código em {secondsToRotate(now)} s</p>
                  <button className="cta-ghost" onClick={() => { setMethod('pix'); dispatch({ type: 'RESET' }) }}>Nova compra</button>
                </div>
              )}
            </div>
          </div>

          <aside className="demo-side" aria-live="polite">
            {state.stage === 'awaiting_cash' ? (
              <CashierConsole total={state.total} digitalChange={state.digitalChange} error={state.error} onConfirm={(v) => dispatch({ type: 'CASHIER_CONFIRM', received: v })} />
            ) : (
              <StageExplainer stage={state.stage} />
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

function StageExplainer({ stage }: { stage: string }) {
  const copy: Record<string, [string, string]> = {
    shopping: ['1 · Escaneie e ensacole', 'Cada leitura entra no carrinho do app enquanto o produto vai direto para a sua sacola. Nada de esteira, nada de fila.'],
    checkout: ['2 · Escolha como pagar', 'Pix, carteira digital e cartão aprovam na hora. Prefere dinheiro? O app gera um código e você paga no caixa expresso.'],
    paid: ['3 · Mostre e saia', 'O passe verde muda a cada 30 segundos e só vale uma vez. No balcão, o caixa escaneia e libera em cerca de 1 segundo.'],
  }
  const [title, body] = copy[stage] ?? copy.shopping
  return (
    <div className="explainer glass">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}

interface CashierProps {
  total: number
  digitalChange: boolean
  error: string | null
  onConfirm: (received: number) => void
}

export function CashierConsole({ total, digitalChange, error, onConfirm }: CashierProps) {
  const options = suggestReceived(total)
  const [received, setReceived] = useState(options[options.length - 1])
  const change = Math.max(0, received - total)

  return (
    <div className="cashier glass" aria-label="Console do caixa">
      <p className="pill pill-amber">Você é o caixa agora</p>
      <h3>Receber em dinheiro</h3>
      <p className="muted">Total</p>
      <p className="cashier-total">{formatBRL(total)}</p>
      <p className="muted">Valor recebido</p>
      <div className="chips" role="group" aria-label="Valor recebido">
        {options.map((v, i) => (
          <button key={v} className={`chip ${received === v ? 'is-on' : ''}`} aria-pressed={received === v} onClick={() => setReceived(v)}>
            {i === 0 ? 'Exato' : formatBRL(v).replace(',00', '')}
          </button>
        ))}
      </div>
      <p className="muted">Troco {digitalChange ? '(vai para a carteira Passa)' : '(em espécie)'}</p>
      <p className="cashier-change" data-testid="cashier-change">{formatBRL(change)}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="cta-green" onClick={() => onConfirm(received)}>Confirmar e liberar saída</button>
    </div>
  )
}
