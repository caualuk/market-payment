/**
 * Revelação de texto palavra por palavra com blur (estilo Skiper UI "text reveal").
 * Com `prefers-reduced-motion`, o texto só faz um cross-fade.
 */
import { createElement, useLayoutEffect, useRef, type ReactNode } from 'react'
import { EASE, gsap, prefersReducedMotion, SplitText } from '../../lib/gsap'

interface RevealProps {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  children: ReactNode
  className?: string
  delay?: number
  /** Anima ao entrar na viewport (padrão) ou imediatamente. */
  onScroll?: boolean
}

export function Reveal({ as = 'p', children, className, delay = 0, onScroll = true }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      const trigger = onScroll ? { trigger: el, start: 'top 85%', once: true } : undefined
      if (prefersReducedMotion()) {
        gsap.from(el, { opacity: 0, duration: 0.6, delay, scrollTrigger: trigger })
        return
      }
      const split = SplitText.create(el, { type: 'words', wordsClass: 'reveal-word' })
      gsap.from(split.words, {
        yPercent: 60,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 1.1,
        ease: EASE,
        stagger: 0.06,
        delay,
        scrollTrigger: trigger,
      })
    }, el)
    return () => ctx.revert()
  }, [delay, onScroll])

  return createElement(as, { ref, className }, children)
}
