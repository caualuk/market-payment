/**
 * Coreografia da cena 3D guiada pelo scroll.
 *
 * Cada seção da landing (marcada com `data-scene`) informa ao `sceneStore`
 * qual seção está ativa e o progresso local (0→1). `poseFor` converte isso
 * em uma pose-alvo para o celular 3D, a tela exibida e o comportamento dos
 * produtos. O loop de render persegue essa pose com `damp`, então trocas de
 * seção nunca "teleportam" o objeto (interruptibilidade — apple-design §3).
 */
import { clamp, mapRange } from '../lib/motion'

export type SectionId = 'hero' | 'how' | 'demo' | 'cash' | 'stores' | 'cta'
export type ScreenKind = 'home' | 'checkin' | 'scan' | 'pay' | 'pass' | 'cash'
export type ProductsMode = 'orbit' | 'collect' | 'ring' | 'hidden'

export interface Pose {
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  scale: number
  screen: ScreenKind
  products: ProductsMode
  /** 0→1: produtos voando para dentro do celular (passo "Escaneie"). */
  collect: number
  /** 0→1: moedas/notas visíveis (seção dinheiro). */
  cash: number
}

export const SECTIONS: readonly SectionId[] = ['hero', 'how', 'demo', 'cash', 'stores', 'cta']

export const HOW_STEPS: readonly ScreenKind[] = ['checkin', 'scan', 'pay', 'pass']

/** Passo (0..3) da seção "Como funciona" para um progresso 0→1. */
export function howStep(progress: number): number {
  return Math.min(HOW_STEPS.length - 1, Math.floor(clamp(progress) * HOW_STEPS.length))
}

export function poseFor(section: SectionId, rawProgress: number, mobile = false): Pose {
  const p = clamp(rawProgress)
  // No mobile o celular fica centralizado e menor, atrás do conteúdo.
  const side = (desktopX: number) => (mobile ? 0 : desktopX)
  const s = (desktop: number) => (mobile ? desktop * 0.72 : desktop)

  switch (section) {
    case 'hero':
      return {
        x: side(2.3),
        y: mobile ? -2.7 : -0.1,
        z: 0,
        rx: -0.12 + p * 0.25,
        ry: -0.55 + p * 0.7,
        rz: 0.08 - p * 0.08,
        scale: mobile ? 0.6 : 1,
        screen: 'home',
        products: 'orbit',
        collect: 0,
        cash: 0,
      }
    case 'how': {
      const step = howStep(p)
      return {
        x: side(2.4),
        y: mobile ? -1.4 : 0,
        z: 0.2,
        rx: -0.05,
        ry: -0.25 + Math.sin(p * Math.PI) * 0.35,
        rz: 0,
        scale: s(1.05),
        screen: HOW_STEPS[step],
        products: 'collect',
        // os produtos entram no carrinho durante o passo "Escaneie" (25%→50%)
        collect: mapRange(p, 0.22, 0.5),
        cash: 0,
      }
    }
    case 'demo':
      // A demo tem um celular HTML interativo; o 3D sai de cena.
      return {
        x: side(9),
        y: -5,
        z: -2,
        rx: 0,
        ry: 1.2,
        rz: 0,
        scale: 0.5,
        screen: 'scan',
        products: 'hidden',
        collect: 1,
        cash: 0,
      }
    case 'cash':
      return {
        x: side(-3.4),
        y: mobile ? -1.4 : -0.1,
        z: 0.1,
        rx: -0.08,
        ry: 0.5 - p * 0.6,
        rz: -0.04,
        scale: s(0.9),
        screen: p < 0.62 ? 'cash' : 'pass',
        products: 'hidden',
        collect: 1,
        cash: mapRange(p, 0, 0.35),
      }
    case 'stores':
      return {
        x: 0,
        y: mobile ? -1.2 : -0.3,
        z: -0.6,
        rx: -0.15,
        ry: p * Math.PI * 2,
        rz: 0,
        scale: s(0.8),
        screen: 'pass',
        products: 'ring',
        collect: 0,
        cash: 0,
      }
    case 'cta':
    default:
      return {
        x: 0,
        y: mobile ? -0.6 : 0.1,
        z: 0,
        rx: -0.2 + p * 0.2,
        ry: -0.3 + p * 0.3,
        rz: 0,
        scale: s(0.95),
        screen: 'home',
        products: 'orbit',
        collect: 0,
        cash: 0,
      }
  }
}
