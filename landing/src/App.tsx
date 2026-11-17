import { useState } from 'react'
import { CashFlow } from './components/CashFlow'
import { Demo } from './components/Demo'
import { Faq } from './components/Faq'
import { FinalCta } from './components/FinalCta'
import { ForStores } from './components/ForStores'
import { Nav } from './components/Nav'
import { Story } from './components/Story'
import { useSurface } from './hooks/useSurface'
import { hasWebGL } from './lib/webgl'

export default function App() {
  useSurface()
  // As cenas 3D (Three.js) ficam em chunks separados: o texto aparece antes.
  const [webgl] = useState(() => typeof window !== 'undefined' && hasWebGL())

  return (
    <>
      <a className="skip" href="#demo">Pular para a demo</a>
      <Nav />
      <main>
        <Story webgl={webgl} />
        <Demo />
        <CashFlow webgl={webgl} />
        <ForStores />
        <Faq />
        <FinalCta />
      </main>
    </>
  )
}
