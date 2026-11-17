import { describe, expect, it } from 'vitest'
import { isValidEan13 } from '../lib/ean'
import {
  BASKET,
  CHAPTERS,
  chapterAt,
  isScanned,
  SCAN_POINT,
  SHELF,
  STORY_PRODUCTS,
  STORY_TOTAL,
  storyFrame,
  type Vec3,
} from './story'

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const samples = (step = 0.001) => Array.from({ length: Math.round(1 / step) + 1 }, (_, i) => i * step)
const atChapter = (id: string, local: number) => {
  const c = CHAPTERS.find((ch) => ch.id === id)!
  return storyFrame(c.from + (c.to - c.from) * local)
}

describe('roteiro: contexto', () => {
  it('usa os 5 produtos das telas do design, todos com EAN-13 válido', () => {
    expect(STORY_PRODUCTS.map((p) => p.id)).toEqual(['leite', 'pao', 'abacate', 'cafe', 'sabao'])
    STORY_PRODUCTS.forEach((p) => expect(isValidEan13(p.barcode)).toBe(true))
  })

  it('o total da compra é R$ 63,39 (1 unidade de cada)', () => {
    expect(STORY_TOTAL).toBe(6339)
  })

  it('capítulos cobrem 0→1 sem buracos, na ordem da jornada', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['hero', 'checkin', 'scan', 'pay', 'pass'])
    expect(CHAPTERS[0].from).toBe(0)
    expect(CHAPTERS.at(-1)!.to).toBe(1)
    CHAPTERS.slice(1).forEach((c, i) => expect(c.from).toBe(CHAPTERS[i].to))
  })

  it('chapterAt devolve capítulo e progresso local', () => {
    expect(chapterAt(0)).toMatchObject({ id: 'hero', local: 0 })
    expect(chapterAt(0.5)).toMatchObject({ id: 'scan', local: expect.closeTo(0.5) })
    expect(chapterAt(1)).toMatchObject({ id: 'pass', local: 1 })
  })
})

describe('roteiro: o que a tela do celular mostra', () => {
  it.each([
    ['hero', 0.5, 'home'],
    ['checkin', 0.5, 'checkin'],
    ['scan', 0.5, 'scan'],
    ['pay', 0.2, 'pay'],
    ['pay', 0.9, 'paid'],
    ['pass', 0.5, 'pass'],
  ])('%s (%s) → %s', (chapter, local, screen) => {
    expect(atChapter(chapter, local as number).screen).toBe(screen)
  })

  it('o letreiro da loja só acende no check-in e continua aceso', () => {
    expect(atChapter('hero', 1).signGlow).toBe(0)
    expect(atChapter('checkin', 0.6).signGlow).toBe(1)
    expect(atChapter('pay', 0.5).signGlow).toBe(1)
  })
})

describe('roteiro: escanear e ensacolar', () => {
  it('antes de escanear tudo está na prateleira; depois, tudo na cesta', () => {
    expect(atChapter('checkin', 1).items.every((i) => i.phase === 'shelf')).toBe(true)
    expect(atChapter('scan', 1).items.every((i) => i.phase === 'basket')).toBe(true)
  })

  it('os produtos são lidos um de cada vez, na ordem da gôndola', () => {
    for (const t of samples(0.002)) {
      const f = storyFrame(t)
      const moving = f.items.filter((i) => i.phase === 'lift' || i.phase === 'scan' || i.phase === 'drop')
      expect(moving.length).toBeLessThanOrEqual(1)
      const phases = f.items.map((i) => ['basket', 'drop', 'scan', 'lift', 'shelf'].indexOf(i.phase))
      // quem vem antes na gôndola está sempre "mais adiantado"
      phases.slice(1).forEach((ph, k) => expect(ph).toBeGreaterThanOrEqual(phases[k]))
    }
  })

  it('carrinho do app e cesta crescem juntos: contagem e subtotal nunca diminuem', () => {
    let last = { scanned: 0, subtotal: 0 }
    for (const t of samples()) {
      const f = storyFrame(t)
      expect(f.scanned).toBeGreaterThanOrEqual(last.scanned)
      expect(f.subtotal).toBeGreaterThanOrEqual(last.subtotal)
      expect(f.subtotal).toBe(f.items.filter(isScanned).reduce((s, i) => s + i.product.price, 0))
      last = f
    }
    expect(storyFrame(1).scanned).toBe(5)
    expect(storyFrame(1).subtotal).toBe(STORY_TOTAL)
  })

  it('o item é lido exatamente no ponto de leitura, com o laser aceso', () => {
    const f = atChapter('scan', (0 + 0.475) / 5) // meio da leitura do 1º item
    const reading = f.items.find((i) => i.phase === 'scan')!
    expect(reading.product.id).toBe('leite')
    expect(dist(reading.pos, SCAN_POINT)).toBeLessThan(0.1)
    expect(f.laser).toBeGreaterThan(0.9)
  })

  it('laser apagado fora das leituras', () => {
    expect(atChapter('hero', 0.5).laser).toBe(0)
    expect(atChapter('pay', 0.5).laser).toBe(0)
  })

  it('produtos ficam menores dentro da cesta e perto dela', () => {
    const f = atChapter('scan', 1)
    f.items.forEach((i) => {
      expect(i.scale).toBeLessThan(1)
      expect(dist(i.pos, [BASKET.x, BASKET.y, BASKET.z])).toBeLessThan(0.8)
    })
  })
})

describe('roteiro: saída', () => {
  it('a "caminhada" até a saída só acontece depois do pagamento e é monotônica', () => {
    expect(atChapter('pay', 1).walk).toBe(0)
    let last = 0
    for (const t of samples()) {
      const w = storyFrame(t).walk
      expect(w).toBeGreaterThanOrEqual(last)
      last = w
    }
    expect(storyFrame(1).walk).toBe(1)
  })

  it('a gôndola sai de quadro pela esquerda e o balcão entra pela direita, uma única vez', () => {
    const start = storyFrame(0)
    const end = storyFrame(1)
    expect(start.shelfX).toBe(SHELF.x)
    expect(end.shelfX).toBeLessThan(SHELF.x - 8)
    expect(start.exit[0]).toBeGreaterThan(end.exit[0] + 8)
  })

  it('o leitor do balcão lê o QR antes de liberar; a saída termina liberada', () => {
    const reading = atChapter('pass', 0.6)
    expect(reading.beam).toBeGreaterThan(0.5)
    expect(reading.released).toBeLessThan(0.5)
    expect(storyFrame(1).released).toBe(1)
    expect(storyFrame(1).beam).toBe(0)
  })

  it('o pagamento é aprovado antes de qualquer liberação', () => {
    for (const t of samples(0.005)) {
      const f = storyFrame(t)
      if (f.released > 0) expect(f.payApproved).toBe(1)
    }
  })
})

describe('roteiro: continuidade (nada pula, some ou volta sem motivo)', () => {
  it('nenhum objeto "teleporta": a cada 0,1% de scroll nada anda mais que ~1/3 do próprio tamanho', () => {
    // um produto tem ~0,8 de altura; o celular, ~2,4
    let prev = storyFrame(0)
    for (const t of samples(0.001).slice(1)) {
      const f = storyFrame(t)
      expect(dist(f.phone.pos, prev.phone.pos)).toBeLessThan(0.15)
      f.items.forEach((it, i) => expect(dist(it.pos, prev.items[i].pos)).toBeLessThan(0.32))
      prev = f
    }
  })

  it('a velocidade é contínua: dividir o passo pela metade divide o deslocamento (sem saltos)', () => {
    for (const t of samples(0.01).slice(1, -1)) {
      const a = storyFrame(t)
      const b1 = storyFrame(t + 0.0004)
      const b2 = storyFrame(t + 0.0002)
      a.items.forEach((it, i) => {
        const d1 = dist(it.pos, b1.items[i].pos)
        const d2 = dist(it.pos, b2.items[i].pos)
        // salto teria d2 ≈ d1; movimento contínuo tem d2 ≈ d1/2
        if (d1 > 1e-6) expect(d2).toBeLessThan(d1 * 0.75)
      })
    }
  })

  it('todos os produtos existem o tempo todo (escala sempre > 0)', () => {
    for (const t of samples(0.01)) storyFrame(t).items.forEach((i) => expect(i.scale).toBeGreaterThan(0.5))
  })

  it('é reversível: o mesmo t sempre gera o mesmo quadro (rolar para cima desfaz)', () => {
    for (const t of [0.13, 0.47, 0.71, 0.93]) expect(storyFrame(t)).toEqual(storyFrame(t))
  })

  it('t fora de [0,1] é saturado', () => {
    expect(storyFrame(-2)).toEqual(storyFrame(0))
    expect(storyFrame(3)).toEqual(storyFrame(1))
  })
})
