/**
 * Seção "Como funciona": bloco alto com conteúdo `sticky`. O progresso do
 * scroll escolhe o passo ativo e, via `sceneStore`, a tela do celular 3D.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import { howStep } from '../scene/keyframes'
import { sceneStore, setSection } from '../scene/store'

export const STEPS = [
  { title: 'Check-in na loja', body: 'Ao entrar, o cliente lê o QR da entrada (ou é localizado pelo GPS). O app carrega preços e promoções daquela unidade.' },
  { title: 'Escaneie e ensacole', body: 'Aponte a câmera para o código de barras. O item entra no carrinho do app e vai direto para a sacola, no carrinho de verdade.' },
  { title: 'Pague no app', body: 'Pix, carteira digital ou cartão salvo. O total fecha com descontos do clube aplicados automaticamente.' },
  { title: 'Mostre o passe e saia', body: 'Um QR verde, que se renova a cada 30 s, é o comprovante. O caixa escaneia no balcão e libera a saída.' },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setProgress(self.progress)
        setStep(howStep(self.progress))
        if (sceneStore.section === 'how') sceneStore.progress = self.progress
      },
      onToggle: (self) => {
        if (self.isActive) setSection('how', self.progress)
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={ref} id="como-funciona" className="section how" data-scene="how" data-scene-progress="self" data-surface="light" style={{ ['--steps' as string]: STEPS.length }}>
      <div className="how-sticky">
        <div className="container how-inner">
          <span className="eyebrow">Como funciona</span>
          <h2 className="how-title">Quatro toques entre a prateleira e a porta.</h2>
          <ol className="how-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={i === step ? 'is-active' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                <span className="how-num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="how-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      </div>
    </section>
  )
}
