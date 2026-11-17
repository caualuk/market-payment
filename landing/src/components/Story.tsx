/**
 * Bloco "Hero + Como funciona": uma única cena 3D `sticky` conta a jornada de
 * uma compra. A cena pertence a este bloco — sai de quadro junto com ele,
 * nunca some e volta no meio da página.
 */
import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { ScrollTrigger } from '../lib/gsap'
import { CHAPTERS } from '../scene/story'
import { sceneStore } from '../scene/store'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'

const StoryScene = lazy(() => import('../scene/StoryScene'))

/** Fração do roteiro que pertence ao hero (o resto são os 4 passos). */
const HERO_SHARE = CHAPTERS[0].to

/** Converte o progresso do hero e do "Como funciona" no `t` do roteiro 3D. */
export function storyProgress(heroProgress: number, howProgress: number): number {
  return howProgress > 0 ? HERO_SHARE + (1 - HERO_SHARE) * howProgress : HERO_SHARE * heroProgress
}

export function Story({ webgl }: { webgl: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const how = useRef(0)
  const hero = useRef(0)
  const active = useInView(stage)

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#top',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        hero.current = self.progress
        sceneStore.story = storyProgress(hero.current, how.current)
      },
    })
    return () => st.kill()
  }, [])

  const onHowProgress = (p: number) => {
    how.current = p
    sceneStore.story = storyProgress(hero.current, p)
  }

  return (
    <div className="story">
      <div className="story-stage" ref={stage}>
        {webgl && (
          <Suspense fallback={null}>
            <StoryScene active={active} />
          </Suspense>
        )}
      </div>
      <Hero />
      <HowItWorks onProgress={onHowProgress} />
    </div>
  )
}
