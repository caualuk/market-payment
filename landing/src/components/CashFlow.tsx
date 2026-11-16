import { Reveal } from './ui/Reveal'
import { TiltCard } from './ui/TiltCard'

const CASH_STEPS = [
  {
    n: '01',
    title: 'Escolha “Dinheiro no caixa”',
    body: 'O app gera um código de pagamento (QR âmbar + 6 dígitos) com o total fechado. O carrinho trava para edição até o pagamento.',
  },
  {
    n: '02',
    title: 'Vá ao caixa expresso',
    body: 'Sem passar item por item: o operador escaneia o código, vê o pedido, recebe o dinheiro e toca no valor entregue. O troco aparece calculado.',
  },
  {
    n: '03',
    title: 'O QR vira passe na hora',
    body: 'Ao confirmar, o QR âmbar do cliente fica verde em tempo real. Pagamento e liberação da saída acontecem no mesmo balcão, com um único scan.',
  },
]

export function CashFlow() {
  return (
    <section id="dinheiro" className="section cash" data-scene="cash" data-surface="warm">
      <div className="container cash-inner">
        <header className="section-head">
          <span className="eyebrow amber">Dinheiro também passa</span>
          <Reveal as="h2">Quem paga em espécie não fica para trás.</Reveal>
          <p className="lede">
            O cliente usa o app normalmente e só vai ao caixa para entregar o dinheiro. Nada de recontar a compra.
          </p>
        </header>
        <div className="cash-cards">
          {CASH_STEPS.map((s) => (
            <TiltCard key={s.n} className="cash-card">
              <span className="cash-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </TiltCard>
          ))}
        </div>
        <TiltCard className="cash-extra">
          <div>
            <h3>Troco digital</h3>
            <p>O troco pode virar crédito na carteira Passa, o que acaba com a falta de moedas no caixa e traz o cliente de volta.</p>
          </div>
          <span className="cash-coin" aria-hidden="true">R$</span>
        </TiltCard>
      </div>
    </section>
  )
}
