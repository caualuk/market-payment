import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { hasWebGL } from '../lib/webgl'
import { Faq, FAQ } from './Faq'
import { HowItWorks, STEPS, stepAt } from './HowItWorks'
import { CASH_COPY, CashFlow } from './CashFlow'
import { storyProgress } from './Story'
import { CASH_STEPS } from '../scene/cash'
import { CHAPTERS } from '../scene/story'
import { Nav } from './Nav'

describe('<App />', () => {
  it('renderiza todas as seções com âncoras da navegação', () => {
    const { container } = render(<App />)
    for (const id of ['top', 'como-funciona', 'demo', 'dinheiro', 'lojistas', 'faq', 'contato']) {
      expect(container.querySelector(`#${id}`)).not.toBeNull()
    }
  })

  it('cada seção declara uma superfície de fundo válida', () => {
    const { container } = render(<App />)
    const sections = container.querySelectorAll<HTMLElement>('section')
    expect(sections.length).toBe(7)
    sections.forEach((s) => expect(s.dataset.surface).toMatch(/^(dark|light|warm)$/))
  })

  it('as cenas 3D ficam dentro dos blocos que ilustram (não há canvas fixo na página)', () => {
    const { container } = render(<App />)
    const story = container.querySelector('.story')!
    expect(story.querySelector('.story-stage')).not.toBeNull()
    expect(story.querySelector('#top')).not.toBeNull()
    expect(story.querySelector('#como-funciona')).not.toBeNull()
    expect(container.querySelector('#dinheiro .cash-stage')).not.toBeNull()
    expect(container.querySelector('.scene-layer')).toBeNull()
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

describe('roteiro: texto ↔ 3D', () => {
  it('cada passo de "Como funciona" corresponde a um capítulo do roteiro 3D', () => {
    expect(STEPS).toHaveLength(CHAPTERS.length - 1) // o 1º capítulo é o hero
    STEPS.forEach((_, i) => {
      const howP = (i + 0.5) / STEPS.length
      const t = storyProgress(1, howP)
      const chapter = CHAPTERS.find((c) => t >= c.from && t < c.to)!
      expect(chapter.id).toBe(CHAPTERS[i + 1].id)
      expect(stepAt(howP)).toBe(i)
    })
  })

  it('storyProgress: hero ocupa 0→0.2 e "Como funciona" 0.2→1, sem saltos', () => {
    expect(storyProgress(0, 0)).toBe(0)
    expect(storyProgress(1, 0)).toBeCloseTo(0.2)
    expect(storyProgress(1, 0.0001)).toBeCloseTo(0.2, 3)
    expect(storyProgress(1, 1)).toBe(1)
  })

  it('a seção Dinheiro tem um texto por passo da cena do caixa', () => {
    expect(CASH_COPY).toHaveLength(CASH_STEPS.length)
  })
})

describe('<CashFlow />', () => {
  it('lista os 4 passos e marca o primeiro como atual', () => {
    render(<CashFlow />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('O QR vira passe')).toBeInTheDocument()
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
