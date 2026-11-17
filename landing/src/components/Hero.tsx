import { Magnetic } from './ui/Magnetic'
import { Reveal } from './ui/Reveal'

export function Hero() {
  return (
    <section id="top" className="section hero" data-surface="dark">
      <div className="aurora" aria-hidden="true" />
      <div className="container hero-inner">
        <p className="pill pill-glass">
          <span className="dot" /> Self-checkout pelo celular para mercados
        </p>
        <Reveal as="h1" onScroll={false} className="display">
          Escaneie. Pague. Passe.
        </Reveal>
        <Reveal as="p" onScroll={false} delay={0.35} className="lede">
          O cliente escaneia os produtos com a câmera do celular, ensacola enquanto compra, paga no app e sai mostrando um QR code. Sem fila, sem esteira, sem hardware novo.
        </Reveal>
        <div className="hero-ctas">
          <Magnetic href="#demo" variant="light">Experimentar a demo</Magnetic>
          <Magnetic href="#como-funciona" variant="ghost">Ver como funciona</Magnetic>
        </div>
        <ul className="hero-facts" aria-label="Destaques">
          <li><b>Pix, cartão e carteira</b><span>aprovação na hora</span></li>
          <li><b>Dinheiro também</b><span>no caixa expresso</span></li>
          <li><b>QR dinâmico</b><span>validação em ~1 s</span></li>
        </ul>
      </div>
      <a href="#como-funciona" className="scroll-hint" aria-label="Rolar para baixo">
        <span />
      </a>
    </section>
  )
}
