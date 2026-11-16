import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App, { hasWebGL } from '../App'
import { Faq, FAQ } from './Faq'
import { HowItWorks, STEPS } from './HowItWorks'
import { Nav } from './Nav'

describe('<App />', () => {
  it('renderiza todas as seções com âncoras da navegação', () => {
    const { container } = render(<App />)
    for (const id of ['top', 'como-funciona', 'demo', 'dinheiro', 'lojistas', 'faq', 'contato']) {
      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }
  })

  it('cada seção declara a cena 3D e a superfície de fundo', () => {
    const { container } = render(<App />)
    const scenes = [...container.querySelectorAll<HTMLElement>('[data-scene]')].map((el) => el.dataset.scene)
    expect(scenes).toEqual(['hero', 'how', 'demo', 'cash', 'stores', 'demo', 'cta'])
    container.querySelectorAll<HTMLElement>('section').forEach((s) => expect(s.dataset.surface).toMatch(/dark|light|warm/))
  })

  it('tem um único h1 com a proposta de valor', () => {
    render(<App />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    // o SplitText divide em palavras, mas mantém o nome acessível (aria-label) intacto
    expect(screen.getByRole('heading', { level: 1, name: 'Escaneie. Pague. Passe.' })).toBeInTheDocument()
  })

  it('sem WebGL (jsdom) não monta o canvas 3D e a página continua funcional', () => {
    expect(hasWebGL()).toBe(false)
    const { container } = render(<App />)
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.getByRole('button', { name: 'Escanear produto' })).toBeInTheDocument()
  })

  it('oferece link para pular direto para a demo', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Pular para a demo' })).toHaveAttribute('href', '#demo')
  })
})

describe('<Nav />', () => {
  it('links apontam para as seções', () => {
    render(<Nav />)
    expect(screen.getByRole('link', { name: 'Como funciona' })).toHaveAttribute('href', '#como-funciona')
    expect(screen.getByRole('link', { name: 'Dinheiro' })).toHaveAttribute('href', '#dinheiro')
  })

  it('botão de menu (mobile) alterna aria-expanded', async () => {
    const user = userEvent.setup()
    render(<Nav />)
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('<HowItWorks />', () => {
  it('lista os 4 passos e marca o primeiro como atual', () => {
    render(<HowItWorks />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(STEPS.length)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
  })
})

describe('<Faq />', () => {
  it('abre a primeira pergunta por padrão', () => {
    render(<Faq />)
    expect(screen.getByRole('button', { name: FAQ[0].q })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(FAQ[0].a)).toBeVisible()
  })

  it('funciona como acordeão: abrir uma fecha a outra', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.click(screen.getByRole('button', { name: FAQ[2].q }))
    expect(screen.getByRole('button', { name: FAQ[2].q })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: FAQ[0].q })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(FAQ[0].a)).not.toBeVisible()
  })

  it('clicar na pergunta aberta fecha', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.click(screen.getByRole('button', { name: FAQ[0].q }))
    expect(screen.getByRole('button', { name: FAQ[0].q })).toHaveAttribute('aria-expanded', 'false')
  })
})
