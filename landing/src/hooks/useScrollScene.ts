/**
 * Conecta as seções da página à cena 3D e ao tema de fundo:
 * - cada `[data-scene]` informa seção ativa + progresso ao `sceneStore`;
 * - cada `[data-surface]` troca a superfície (cor de fundo) do <html>;
 * - o ponteiro alimenta a leve paralaxe do celular.
 */
import { useLayoutEffect } from 'react'
import { prefersReducedMotion, ScrollTrigger } from '../lib/gsap'
import type { SectionId } from '../scene/keyframes'
import { sceneStore, setSection } from '../scene/store'

export function useScrollScene() {
  useLayoutEffect(() => {
    sceneStore.reducedMotion = prefersReducedMotion()
    const triggers: ScrollTrigger[] = []
    // padrão antes dos triggers: ao recarregar no meio da página, o trigger ativo sobrescreve
    document.documentElement.dataset.surface = 'dark'

    document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
      const id = el.dataset.scene as SectionId
      // Seções com `data-scene-progress="self"` (ex.: "Como funciona", que é
      // sticky) publicam o próprio progresso para casar texto e celular 3D.
      const selfProgress = el.dataset.sceneProgress === 'self'
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setSection(id, selfProgress ? (self.direction > 0 ? 0 : 1) : self.progress),
          onUpdate: (self) => !selfProgress && self.isActive && setSection(id, self.progress),
        }),
      )
    })

    document.querySelectorAll<HTMLElement>('[data-surface]').forEach((el) => {
      const surface = el.dataset.surface!
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) document.documentElement.dataset.surface = surface
          },
        }),
      )
    })
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
