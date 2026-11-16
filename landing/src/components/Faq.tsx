import { useId, useState } from 'react'

export const FAQ = [
  {
    q: 'Preciso baixar um app?',
    a: 'Não necessariamente. O Passa funciona como site (PWA): o cliente lê o QR da entrada e já começa a comprar. O app nativo é opcional.',
  },
  {
    q: 'E se o cliente esquecer de escanear algum item?',
    a: 'A conferência por amostragem sorteia pedidos para conferir no balcão, e lojas podem ativar a checagem de peso da sacola. O histórico de cada cliente também entra na avaliação de risco.',
  },
  {
    q: 'Como funciona o pagamento em dinheiro?',
    a: 'O cliente escolhe “Dinheiro no caixa”, recebe um código e paga no caixa expresso. O operador confirma o valor e o mesmo QR vira o passe de saída.',
  },
  {
    q: 'Um print do QR de saída funciona?',
    a: 'Não. O QR é renovado a cada 30 segundos, é assinado no servidor e só pode ser usado uma vez.',
  },
  {
    q: 'Produtos pesados, como frutas a granel?',
    a: 'A balança da loja imprime a etiqueta com código de barras de peso variável (EAN-13 iniciado por 2), que o app lê normalmente.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()

  return (
    <section id="faq" className="section faq" data-scene="demo" data-surface="light">
      <div className="container faq-inner">
        <header className="section-head">
          <span className="eyebrow">Dúvidas</span>
          <h2>Perguntas frequentes</h2>
        </header>
        <div className="faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button aria-expanded={isOpen} aria-controls={`${base}-${i}`} id={`${base}-q-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                    {item.q}
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`${base}-${i}`} role="region" aria-labelledby={`${base}-q-${i}`} className="faq-a" hidden={!isOpen}>
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
