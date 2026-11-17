/**
 * "Dinheiro também passa": seção sticky com a cena do balcão do caixa
 * expresso. Cada passo do texto corresponde a um passo de `cash.ts`.
 */
import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'
import { ScrollTrigger } from '../lib/gsap'
import { CASH_STEPS } from '../scene/cash'
import { sceneStore } from '../scene/store'

const CashScene = lazy(() => import('../scene/CashScene'))

export const CASH_COPY = [
  {
    title: 'Escolha “Dinheiro no caixa”',
    body: 'O app gera um código de pagamento: um QR âmbar e 6 dígitos com o total fechado. O carrinho trava até o pagamento.',
  },
  {
    title: 'O caixa lê o código',
    body: 'No caixa expresso, sem esteira, o tablet lê o QR e abre o pedido inteiro. Ninguém passa os itens de novo.',
  },
  {
    title: 'Entregue o dinheiro',
    body: 'O operador toca no valor recebido e o troco aparece calculado. Com o troco digital, ele vai direto para a carteira Passa, sem caçar moedas.',
  },
  {
    title: 'O QR vira passe',
    body: 'Ao confirmar, o QR âmbar do cliente fica verde em tempo real e a cancela abre. Pagamento e saída acontecem no mesmo balcão.',
  },
]

export function CashFlow({ webgl = false }: { webgl?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const active = useInView(stage)
  const [step, setStep] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        sceneStore.cash = self.progress
        setStep(Math.min(CASH_STEPS.length - 1, Math.floor(self.progress * CASH_STEPS.length)))
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={ref} id="dinheiro" className="section cash" data-surface="warm" style={{ ['--steps' as string]: CASH_STEPS.length }}>
      <div className="cash-sticky">
        <div className="container cash-grid">
          <div className="cash-copy">
            <span className="eyebrow amber">Dinheiro também passa</span>
            <h2>Quem paga em espécie não fica para trás.</h2>
            <ol className="cash-steps">
              {CASH_COPY.map((s, i) => (
                <li key={s.title} className={i === step ? 'is-active' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                  <span className="cash-n">0{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="cash-stage" ref={stage}>
            {webgl && (
              <Suspense fallback={null}>
                <CashScene active={active} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
