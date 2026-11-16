import { Magnetic } from './ui/Magnetic'
import { Reveal } from './ui/Reveal'

const YEAR = new Date().getFullYear()

export function FinalCta() {
  return (
    <>
      <section id="contato" className="section final" data-scene="cta" data-surface="dark">
        <div className="aurora aurora-2" aria-hidden="true" />
        <div className="container final-inner">
          <Reveal as="h2" className="display">A fila acabou de sair do seu mercado.</Reveal>
          <p className="lede">Implantação em dias. Piloto em uma loja, sem custo de equipamento.</p>
          <div className="hero-ctas center">
            <Magnetic href="mailto:contato@passa.app?subject=Quero%20o%20Passa" variant="light">Falar com a gente</Magnetic>
            <Magnetic href="#demo" variant="ghost">Ver a demo de novo</Magnetic>
          </div>
        </div>
      </section>
      <footer className="footer" data-surface="dark">
        <div className="container footer-inner">
          <span className="logo"><span className="logo-mark" aria-hidden="true" />passa</span>
          <span>© {YEAR} Passa · Escaneie. Pague. Passe.</span>
        </div>
      </footer>
    </>
  )
}
