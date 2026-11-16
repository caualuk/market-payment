/**
 * Cena 3D fixa atrás de toda a landing. O scroll (via `sceneStore`) define a
 * pose-alvo; aqui só perseguimos essa pose com amortecimento.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../lib/motion'
import { poseFor, type ScreenKind } from './keyframes'
import { drawScreen, SCREEN_H, SCREEN_W } from './screenTexture'
import { sceneStore } from './store'

const PHONE_W = 1.6
const PHONE_H = 3.3
const PHONE_D = 0.17

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 820
}

function usePhoneScreen() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = SCREEN_W
    canvas.height = SCREEN_H
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    let current: ScreenKind | null = null
    const show = (kind: ScreenKind) => {
      if (kind === current) return
      current = kind
      drawScreen(ctx, kind)
      texture.needsUpdate = true
    }
    show('home')
    return { texture, show }
  }, [])
}

function Rig() {
  const phone = useRef<THREE.Group>(null!)
  const products = useRef<THREE.Group>(null!)
  const cash = useRef<THREE.Group>(null!)
  const screen = usePhoneScreen()
  const anim = useRef({ x: 2.3, y: 0, z: 0, rx: 0, ry: -0.5, rz: 0, scale: 1, collect: 0, cash: 0, ring: 0, hidden: 0 })

  const items = useMemo(() => buildProducts(), [])
  const coins = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2, r: 1.6 + (i % 3) * 0.25, h: ((i * 37) % 10) / 10 - 0.5 })), [])

  useFrame((state, dt) => {
    const delta = Math.min(dt, 1 / 20)
    const target = poseFor(sceneStore.section, sceneStore.progress, isMobile())
    const a = anim.current
    const k = sceneStore.reducedMotion ? 30 : 4.2
    a.x = damp(a.x, target.x, k, delta)
    a.y = damp(a.y, target.y, k, delta)
    a.z = damp(a.z, target.z, k, delta)
    a.rx = damp(a.rx, target.rx + sceneStore.pointerY * 0.08, k, delta)
    a.ry = damp(a.ry, target.ry + sceneStore.pointerX * 0.12, k, delta)
    a.rz = damp(a.rz, target.rz, k, delta)
    a.scale = damp(a.scale, target.scale, k, delta)
    a.collect = damp(a.collect, target.collect, 6, delta)
    a.cash = damp(a.cash, target.cash, 5, delta)
    a.ring = damp(a.ring, target.products === 'ring' ? 1 : 0, 3, delta)
    a.hidden = damp(a.hidden, target.products === 'hidden' ? 1 : 0, 5, delta)
    screen.show(target.screen)

    const t = state.clock.elapsedTime
    const float = sceneStore.reducedMotion ? 0 : Math.sin(t * 0.8) * 0.06

    phone.current.position.set(a.x, a.y + float, a.z)
    phone.current.rotation.set(a.rx, a.ry, a.rz)
    phone.current.scale.setScalar(a.scale)

    // Produtos: órbita → entram no celular (collect) → anel (stores)
    products.current.children.forEach((child, i) => {
      const it = items[i]
      const speed = sceneStore.reducedMotion ? 0 : it.speed
      const ang = it.angle + t * speed
      const orbitR = THREE.MathUtils.lerp(it.radius, 3.4, a.ring)
      const ringAng = THREE.MathUtils.lerp(ang, (i / items.length) * Math.PI * 2 + t * 0.15, a.ring)
      const ox = a.x + Math.cos(ringAng) * orbitR * THREE.MathUtils.lerp(0.7, 1, a.ring) * a.scale
      const oy = a.y + THREE.MathUtils.lerp(it.height, Math.sin(ringAng * 2) * 0.25, a.ring) * a.scale
      const oz = a.z + Math.sin(ringAng) * orbitR * 0.9 * a.scale
      // cada produto entra no carrinho em sequência
      const local = THREE.MathUtils.clamp((a.collect - it.order * 0.7) / 0.3, 0, 1)
      const e = local * local * (3 - 2 * local)
      child.position.set(
        THREE.MathUtils.lerp(ox, a.x, e),
        THREE.MathUtils.lerp(oy, a.y + 0.3, e),
        THREE.MathUtils.lerp(oz, a.z + 0.2, e),
      )
      child.rotation.set(t * it.spin * 0.7 + i, t * it.spin + i, 0)
      child.scale.setScalar(it.size * a.scale * (1 - e) * (1 - a.hidden))
    })

    // Moedas e nota (seção dinheiro)
    cash.current.position.set(a.x, a.y, a.z)
    cash.current.children.forEach((child, i) => {
      const c = coins[i] ?? { a: 0, r: 1.8, h: 0 }
      const ang = c.a + t * 0.35
      child.position.set(Math.cos(ang) * c.r, c.h * 2 + Math.sin(t + i) * 0.1, Math.sin(ang) * c.r * 0.5)
      child.rotation.set(t * 0.8 + i, t * 0.5, 0)
      child.scale.setScalar(Math.max(0.0001, a.cash))
    })
  })

  return (
    <>
      <group ref={phone}>
        <RoundedBox args={[PHONE_W, PHONE_H, PHONE_D]} radius={0.2} smoothness={6}>
          <meshPhysicalMaterial color="#2a2a33" metalness={0.85} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
        </RoundedBox>
        <mesh position={[0, 0, PHONE_D / 2 + 0.002]}>
          <planeGeometry args={[PHONE_W - 0.1, PHONE_H - 0.1]} />
          <meshBasicMaterial map={screen.texture} transparent toneMapped={false} />
        </mesh>
        {/* câmeras traseiras */}
        <mesh position={[-0.42, 1.25, -PHONE_D / 2 - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.05, 32]} />
          <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      <group ref={products}>
        {items.map((it, i) => (
          <mesh key={i}>
            {it.shape === 'box' && <boxGeometry args={[0.5, 0.8, 0.5]} />}
            {it.shape === 'can' && <cylinderGeometry args={[0.28, 0.28, 0.7, 40]} />}
            {it.shape === 'fruit' && <sphereGeometry args={[0.36, 40, 40]} />}
            {it.shape === 'bottle' && <capsuleGeometry args={[0.22, 0.6, 8, 24]} />}
            <meshPhysicalMaterial color={it.color} roughness={0.3} metalness={it.shape === 'can' ? 0.6 : 0.05} clearcoat={0.8} />
          </mesh>
        ))}
      </group>

      <group ref={cash}>
        {coins.map((_, i) =>
          i === 0 ? (
            <mesh key={i}>
              <boxGeometry args={[1.1, 0.55, 0.02]} />
              <meshPhysicalMaterial color="#7FD6B3" roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
          ) : (
            <mesh key={i}>
              <cylinderGeometry args={[0.22, 0.22, 0.05, 40]} />
              <meshPhysicalMaterial color="#F2C14E" metalness={0.55} roughness={0.3} clearcoat={1} emissive="#7a5200" emissiveIntensity={0.25} />
            </mesh>
          ),
        )}
      </group>
    </>
  )
}

interface ProductSpec {
  shape: 'box' | 'can' | 'fruit' | 'bottle'
  color: string
  radius: number
  angle: number
  height: number
  speed: number
  spin: number
  size: number
  order: number
}

function buildProducts(): ProductSpec[] {
  const shapes: ProductSpec['shape'][] = ['box', 'fruit', 'can', 'bottle', 'fruit', 'box', 'can', 'fruit', 'bottle']
  const colors = ['#F2F2F7', '#FF453A', '#5E5CE6', '#32D2FF', '#30D158', '#FFD60A', '#FF9F0A', '#BF5AF2', '#FF375F']
  return shapes.map((shape, i) => ({
    shape,
    color: colors[i],
    radius: 1.45 + (i % 3) * 0.3,
    angle: (i / shapes.length) * Math.PI * 2,
    height: Math.sin(i * 1.7) * 1.4,
    speed: 0.12 + (i % 4) * 0.03,
    spin: 0.3 + (i % 3) * 0.2,
    size: 0.75 + (i % 3) * 0.12,
    order: i / shapes.length,
  }))
}

export default function Scene() {
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <Rig />
      {/* Iluminação de estúdio sem baixar HDR externo */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#5E5CE6" position={[-5, 0, 2]} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#32D2FF" position={[5, 0, 2]} scale={[2, 6, 1]} />
      </Environment>
    </Canvas>
  )
}
