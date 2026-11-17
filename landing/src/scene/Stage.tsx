/** Canvas + iluminação de estúdio compartilhados pelas cenas. */
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import type { ReactNode } from 'react'

interface StageProps {
  children: ReactNode
  /** Fora da tela o loop de render pausa (economia de bateria/GPU). */
  active: boolean
  label: string
  fov?: number
  z?: number
}

export function Stage({ children, active, label, fov = 35, z = 8 }: StageProps) {
  return (
    <Canvas
      className="scene-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, 0, z], fov }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-label={label}
      role="img"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} />
      <directionalLight position={[-5, 2, 3]} intensity={0.5} color="#C9D4FF" />
      {children}
      {/* iluminação de estúdio sem baixar HDR externo */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#5E5CE6" position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#32D2FF" position={[5, 0, 2]} scale={[2, 6, 1]} />
      </Environment>
    </Canvas>
  )
}
