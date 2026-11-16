import { describe, expect, it } from 'vitest'
import { HOW_STEPS, howStep, poseFor, SECTIONS } from './keyframes'

describe('howStep', () => {
  it('divide a seção "Como funciona" em 4 passos iguais', () => {
    expect(howStep(0)).toBe(0)
    expect(howStep(0.24)).toBe(0)
    expect(howStep(0.25)).toBe(1)
    expect(howStep(0.5)).toBe(2)
    expect(howStep(0.99)).toBe(3)
  })

  it('satura nos extremos', () => {
    expect(howStep(1)).toBe(3)
    expect(howStep(5)).toBe(3)
    expect(howStep(-1)).toBe(0)
  })
})

describe('poseFor', () => {
  it('retorna uma pose válida (números finitos) para toda seção e progresso', () => {
    for (const section of SECTIONS) {
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        for (const mobile of [false, true]) {
          const pose = poseFor(section, p, mobile)
          for (const k of ['x', 'y', 'z', 'rx', 'ry', 'rz', 'scale', 'collect', 'cash'] as const) {
            expect(Number.isFinite(pose[k])).toBe(true)
          }
          expect(pose.scale).toBeGreaterThan(0)
        }
      }
    }
  })

  it('a tela do celular acompanha o passo ativo em "Como funciona"', () => {
    HOW_STEPS.forEach((screen, i) => {
      const p = (i + 0.5) / HOW_STEPS.length
      expect(poseFor('how', p).screen).toBe(screen)
    })
  })

  it('os produtos entram no carrinho durante o passo "Escaneie"', () => {
    expect(poseFor('how', 0.1).collect).toBe(0)
    expect(poseFor('how', 0.36).collect).toBeGreaterThan(0)
    expect(poseFor('how', 0.36).collect).toBeLessThan(1)
    expect(poseFor('how', 0.6).collect).toBe(1)
  })

  it('na seção dinheiro o QR âmbar vira passe verde no fim', () => {
    expect(poseFor('cash', 0.2).screen).toBe('cash')
    expect(poseFor('cash', 0.9).screen).toBe('pass')
    expect(poseFor('cash', 0.5).cash).toBe(1)
  })

  it('durante a demo o celular 3D sai de cena e os produtos somem', () => {
    const pose = poseFor('demo', 0.5)
    expect(pose.products).toBe('hidden')
    expect(Math.abs(pose.x)).toBeGreaterThan(5)
  })

  it('o celular alterna de lado conforme o texto (direita → esquerda)', () => {
    expect(poseFor('hero', 0).x).toBeGreaterThan(0)
    expect(poseFor('how', 0).x).toBeGreaterThan(0)
    expect(poseFor('cash', 0).x).toBeLessThan(0)
  })

  it('no mobile o celular fica centralizado e menor', () => {
    for (const section of ['hero', 'how', 'cash'] as const) {
      expect(poseFor(section, 0.5, true).x).toBe(0)
      expect(poseFor(section, 0.5, true).scale).toBeLessThan(poseFor(section, 0.5, false).scale)
    }
  })

  it('na seção lojistas o celular dá uma volta completa ao longo do scroll', () => {
    expect(poseFor('stores', 1).ry - poseFor('stores', 0).ry).toBeCloseTo(Math.PI * 2)
    expect(poseFor('stores', 0.5).products).toBe('ring')
  })

  it('progresso fora de [0,1] é saturado', () => {
    expect(poseFor('hero', -3)).toEqual(poseFor('hero', 0))
    expect(poseFor('hero', 9)).toEqual(poseFor('hero', 1))
  })
})
