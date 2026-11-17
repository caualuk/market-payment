/**
 * - cada `[data-surface]` troca a superfície (cor de fundo) do <html>;
 * - o ponteiro alimenta uma paralaxe sutil nas cenas 3D;
 * - registra `prefers-reduced-motion` para as cenas.
 */
import { useLayoutEffect } from 'react'
import { prefersReducedMotion, ScrollTrigger } from '../lib/gsap'
import { sceneStore } from '../scene/store'

export function useSurface() {
  useLayoutEffect(() => {
    sceneStore.reducedMotion = prefersReducedMotion()
    // padrão antes dos triggers: ao recarregar no meio da página, o trigger ativo sobrescreve
    document.documentElement.dataset.surface = 'dark'

    const triggers = [...document.querySelectorAll<HTMLElement>('[data-surface]')].map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) document.documentElement.dataset.surface = el.dataset.surface
        },
      }),
    )

    const onPointer = (e: PointerEvent) => {
      sceneStore.pointerX = (e.clientX / window.innerWidth) * 2 - 1
      sceneStore.pointerY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      triggers.forEach((t) => t.kill())
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])
}
