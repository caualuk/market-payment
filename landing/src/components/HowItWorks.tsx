/**
 * "Como funciona": bloco alto com conteúdo `sticky`. Cada passo do texto
 * corresponde a um capítulo do roteiro 3D (story.ts) — o que você lê é o
 * que a cena está mostrando.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { clamp } from '../lib/motion'
import { ScrollTrigger } from '../lib/gsap'

export const STEPS = [
  {
    title: 'Check-in na loja',
    body: 'Ao entrar, o cliente lê o QR da entrada. O app reconhece o Mercado Aurora e carrega os preços e promoções daquela unidade.',
  },
  {
    title: 'Escaneie e ensacole',
    body: 'A câmera lê o código de barras e o produto entra no carrinho do app. Ao mesmo tempo, ele vai para a cesta de verdade.',
  },
  {
    title: 'Pague no app',
    body: 'O total fecha com tudo que foi lido. Pix, carteira digital ou cartão aprovam na hora, e o dinheiro fica para o caixa expresso.',
  },
  {
    title: 'Mostre o passe e saia',
    body: 'Na saída, o tablet do balcão lê o QR verde, que se renova a cada 30 s, e a cancela abre. Ninguém precisa conferir item por item.',
  },
]

/** Passo ativo (0..3) para o progresso 0→1 da seção. */
export function stepAt(progress: number): number {
  return Math.min(STEPS.length - 1, Math.floor(clamp(progress) * STEPS.length))
}

export function HowItWorks({ onProgress }: { onProgress?: (p: number) => void }) {
  const ref = useRef<HTMLElement>(null)
  const cb = useRef(onProgress)
  cb.current = onProgress
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
        setStep(stepAt(self.progress))
        cb.current?.(self.progress)
      },
    })
    return () => st.kill()
  }, [])

  return (
    <section ref={ref} id="como-funciona" className="section how" data-surface="light" style={{ ['--steps' as string]: STEPS.length }}>
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
