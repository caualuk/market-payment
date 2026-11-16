import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CATALOG, formatBRL } from '../lib/cart'
import { CashierConsole, Demo } from './Demo'

const setup = () => {
  const user = userEvent.setup()
  render(<Demo />)
  return user
}

/** O scanner simula ~450 ms de leitura antes de adicionar o item. */
async function scan(user: ReturnType<typeof userEvent.setup>, times = 1) {
  for (let i = 0; i < times; i++) {
    await user.click(screen.getByRole('button', { name: 'Escanear produto' }))
    await screen.findByRole('button', { name: 'Escanear produto' }, { timeout: 2000 })
  }
}

describe('<Demo />', () => {
  it('começa com o carrinho vazio', () => {
    setup()
    expect(screen.getByText(/carrinho está vazio/i)).toBeInTheDocument()
    expect(screen.getByTestId('cart-total')).toHaveTextContent('R$ 0,00')
  })

  it('não deixa finalizar sem itens', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos um item/)
  })

  it('escanear adiciona itens, mostra o toast e soma o total', async () => {
    const user = setup()
    await scan(user, 2)
    expect(screen.getByText(CATALOG[0].name)).toBeInTheDocument()
    expect(screen.getAllByText(CATALOG[1].name).length).toBeGreaterThan(0)
    expect(screen.getByTestId('scan-toast')).toHaveTextContent(CATALOG[1].name)
    expect(screen.getByTestId('cart-total')).toHaveTextContent(formatBRL(CATALOG[0].price + CATALOG[1].price))
  })

  it('o stepper altera a quantidade e remove o item ao chegar a zero', async () => {
    const user = setup()
    await scan(user)
    const name = CATALOG[0].name
    await user.click(screen.getByRole('button', { name: `Adicionar um ${name}` }))
    expect(screen.getByLabelText(`Quantidade de ${name}`)).toHaveTextContent('2')
    await user.click(screen.getByRole('button', { name: `Remover um ${name}` }))
    await user.click(screen.getByRole('button', { name: `Remover um ${name}` }))
    expect(screen.getByText(/carrinho está vazio/i)).toBeInTheDocument()
  })

  it('fluxo Pix: carrinho → pagamento → passe de saída verde', async () => {
    const user = setup()
    await scan(user, 2)
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    expect(screen.getByRole('radio', { name: /Pix/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^Pagar R\$/ }))
    expect(screen.getByText('Pagamento aprovado')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /passe de saída/ })).toBeInTheDocument()
    expect(screen.getByText(/Total pago · Pix/)).toBeInTheDocument()
    expect(screen.getByText(/Novo código em \d+ s/)).toBeInTheDocument()
  })

  it('fluxo dinheiro: código âmbar → caixa confirma → passe com troco', async () => {
    const user = setup()
    await scan(user, 3) // leite + pão + abacate = R$ 19,59
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    await user.click(screen.getByRole('radio', { name: /Dinheiro no caixa/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar código para o caixa' }))

    expect(screen.getByTestId('payment-code').textContent).toMatch(/^\d{3} \d{3}$/)
    expect(screen.getByRole('img', { name: /pagamento em dinheiro/ })).toBeInTheDocument()

    const console_ = screen.getByLabelText('Console do caixa')
    // sugestões: exato, R$ 20, R$ 50 → a última vem selecionada
    expect(within(console_).getByTestId('cashier-change')).toHaveTextContent('R$ 30,41')
    await user.click(within(console_).getByRole('button', { name: 'Exato' }))
    expect(within(console_).getByTestId('cashier-change')).toHaveTextContent('R$ 0,00')
    await user.click(within(console_).getByRole('button', { name: 'R$ 20' }))
    expect(within(console_).getByTestId('cashier-change')).toHaveTextContent('R$ 0,41')

    await user.click(within(console_).getByRole('button', { name: 'Confirmar e liberar saída' }))
    expect(screen.getByText('Pagamento aprovado')).toBeInTheDocument()
    expect(screen.getByText(/Troco na carteira Passa/)).toBeInTheDocument()
    expect(screen.getByText('R$ 0,41')).toBeInTheDocument()
  })

  it('desligar o troco digital muda o texto para troco em espécie', async () => {
    const user = setup()
    await scan(user)
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    await user.click(screen.getByRole('radio', { name: /Dinheiro no caixa/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar código para o caixa' }))
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText(/Troco \(em espécie\)/)).toBeInTheDocument()
  })

  it('"Trocar forma de pagamento" volta para a escolha do método', async () => {
    const user = setup()
    await scan(user)
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    await user.click(screen.getByRole('radio', { name: /Dinheiro no caixa/ }))
    await user.click(screen.getByRole('button', { name: 'Gerar código para o caixa' }))
    await user.click(screen.getByRole('button', { name: 'Trocar forma de pagamento' }))
    expect(screen.getByRole('group', { name: 'Como você quer pagar?' })).toBeInTheDocument()
  })

  it('"Nova compra" reinicia a demo', async () => {
    const user = setup()
    await scan(user)
    await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
    await user.click(screen.getByRole('button', { name: /^Pagar R\$/ }))
    await user.click(screen.getByRole('button', { name: 'Nova compra' }))
    expect(screen.getByText(/carrinho está vazio/i)).toBeInTheDocument()
  })
})

describe('<CashierConsole />', () => {
  it('mostra total, sugestões e envia o valor escolhido', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<CashierConsole total={7528} digitalChange={false} error={null} onConfirm={onConfirm} />)
    expect(screen.getByText('R$ 75,28')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'R$ 100' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('cashier-change')).toHaveTextContent('R$ 24,72')
    await user.click(screen.getByRole('button', { name: 'R$ 80' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar e liberar saída' }))
    expect(onConfirm).toHaveBeenCalledWith(8000)
  })

  it('exibe o erro vindo do estado', () => {
    render(<CashierConsole total={1000} digitalChange error="Faltam 2,50 reais." onConfirm={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Faltam 2,50 reais.')
  })
})
