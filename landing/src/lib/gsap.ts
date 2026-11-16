/** Registro central dos plugins GSAP (todos gratuitos desde a v3.13). */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** Curva padrão: ease-out forte, sem overshoot (apple-design §4: damping 1.0). */
export const EASE = 'expo.out'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export { gsap, ScrollTrigger, SplitText }
