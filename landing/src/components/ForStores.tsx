import { Reveal } from './ui/Reveal'
import { TiltCard } from './ui/TiltCard'

const FEATURES = [
  { title: 'Sem hardware novo', body: 'Roda no celular do cliente e num tablet ou celular no balcão de saída.', size: 'wide', accent: 'indigo' },
  { title: 'QR dinâmico', body: 'Assinado no servidor, renova a cada 30 s e vale uma vez só.', size: '', accent: 'green' },
  { title: 'Conferência por amostragem', body: 'O sistema sorteia pedidos para conferir e avisa o operador na hora.', size: '', accent: 'pink' },
  { title: 'Painel em tempo real', body: 'Saídas, ticket médio, formas de pagamento e alertas por loja.', size: '', accent: 'cyan' },
  { title: 'Integra com seu ERP', body: 'Catálogo, preços e promoções sincronizados por API ou arquivo.', size: '', accent: 'amber' },
]

export function ForStores() {
  return (
    <section id="lojistas" className="section stores" data-surface="dark">
      <div className="container">
        <header className="section-head center">
          <span className="eyebrow">Para mercados e comércios</span>
          <Reveal as="h2">Menos fila. Mesma equipe. Mais controle.</Reveal>
          <p className="lede">Seus caixas viram pontos de validação. Cada saída leva cerca de um segundo.</p>
        </header>
        <div className="bento">
          {FEATURES.map((f) => (
            <TiltCard key={f.title} className={`bento-card ${f.size} accent-${f.accent}`} max={6}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}
