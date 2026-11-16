import { lazy, Suspense } from 'react'
import { CashFlow } from './components/CashFlow'
import { Demo } from './components/Demo'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { ForStores } from './components/ForStores'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Nav } from './components/Nav'
import { useScrollScene } from './hooks/useScrollScene'

// O Three.js fica num chunk separado: o texto da página aparece antes do 3D.
const Scene = lazy(() => import('./scene/Scene'))

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  useScrollScene()
  const webgl = typeof window !== 'undefined' && hasWebGL()

  return (
    <>
      <a className="skip" href="#demo">Pular para a demo</a>
      <div className="scene-layer" aria-hidden="true">
        {webgl && (
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        )}
      </div>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Demo />
        <CashFlow />
        <ForStores />
        <Faq />
        <FinalCta />
      </main>
    </>
  )
}
