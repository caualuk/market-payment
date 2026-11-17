/**
 * Cena da jornada de compra (Hero + Como funciona). Lê `sceneStore.story`,
 * suaviza com `damp` e aplica `storyFrame(t)` a todos os objetos.
 */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../lib/motion'
import { Stage } from './Stage'
import { Basket, Beam, Counter, Phone, Product3D, Shelf, aimBeam, drawSignTexture, useDrawnTexture, TERMINAL_CAMERA, type CounterHandle } from './models'
import { drawScreen, screenKey, SCREEN_H, SCREEN_W } from './screenTexture'
import { BASKET, isScanned, SHELF, SHELF_SLOTS, STORY_PRODUCTS, STORY_TOTAL, storyFrame } from './story'
import { sceneStore } from './store'
import { drawTerminal } from './textures'

/** O celular é menor que a gôndola: o protagonista é a compra, não o aparelho. */
const PHONE_SCALE = 0.72

function isMobile() {
  return window.innerWidth < 820
}

function StoryRig() {
  const root = useRef<THREE.Group>(null!)
  const phone = useRef<THREE.Group>(null!)
  const shelf = useRef<THREE.Group>(null!)
  const exit = useRef<THREE.Group>(null!)
  const counter = useRef<CounterHandle>(null!)
  const laser = useRef<THREE.Mesh>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  const okLight = useRef<THREE.PointLight>(null!)
  const items = useRef<Array<THREE.Group | null>>([])
  const shown = useRef(sceneStore.story)

  const screen = useDrawnTexture(SCREEN_W, SCREEN_H)
  const terminal = useDrawnTexture(768, 512)
  const sign = useDrawnTexture(1024, 200)

  useFrame((state, dt) => {
    const target = sceneStore.story
    shown.current = sceneStore.reducedMotion ? target : damp(shown.current, target, 7, Math.min(dt, 1 / 20))
    const f = storyFrame(shown.current)
    const mobile = isMobile()

    // enquadramento: à direita do texto no desktop; embaixo e menor no mobile
    root.current.position.set(mobile ? 0.1 : 1.9, mobile ? -1.15 : 0.05, 0)
    root.current.scale.setScalar(mobile ? 0.5 : 0.92)
    const tilt = sceneStore.reducedMotion ? 0 : 1
    root.current.rotation.set(sceneStore.pointerY * 0.03 * tilt, -0.12 + sceneStore.pointerX * 0.06 * tilt, 0)

    // celular
    const float = sceneStore.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.04
    phone.current.position.set(f.phone.pos[0], f.phone.pos[1] + float, f.phone.pos[2])
    phone.current.rotation.set(...f.phone.rot)
    const scanned = f.items.filter(isScanned).map((it) => it.product)
    const data = { scanned, subtotal: f.subtotal, total: STORY_TOTAL }
    screen.draw(screenKey(f.screen, data), (ctx) => drawScreen(ctx, f.screen, data))

    // gôndola + letreiro (acende no check-in)
    shelf.current.position.set(f.shelfX, SHELF.y, SHELF.z)
    const glow = f.signGlow > 0.5
    sign.draw(`sign-${glow}`, (ctx) => drawSignTexture(ctx, glow))

    // produtos
    f.items.forEach((it, i) => {
      const g = items.current[i]
      if (!g) return
      g.position.set(...it.pos)
      g.rotation.set(0, it.rotY, it.phase === 'drop' ? Math.sin(it.k * Math.PI) * 0.4 : 0)
      g.scale.setScalar(it.scale)
    })

    // laser do celular → código de barras do produto em leitura
    const reading = f.items.find((it) => it.phase === 'scan')
    const p = f.phone.pos
    // a câmera traseira fica no canto superior: o feixe sai dali até o código de barras
    aimBeam(laser.current, [p[0] - 0.45, p[1] + 0.95, p[2] - 0.05], reading ? reading.pos.map((v, k) => v + (k === 1 ? 0.3 : 0)) : [0, 0, 0], f.laser)

    // balcão de saída: entra quando "caminhamos" até a saída
    exit.current.position.set(...f.exit)
    exit.current.visible = f.walk > 0.001
    counter.current?.set(f.released, f.released)
    const termState = f.released > 0.5 ? 'released' : f.beam > 0.05 ? 'reading' : 'idle'
    terminal.draw(termState, (ctx) => drawTerminal(ctx, 768, 512, termState, { total: STORY_TOTAL, title: 'Pedido #A7F3-219 · pago com Pix' }))
    const cam = [f.exit[0] + TERMINAL_CAMERA[0], f.exit[1] + TERMINAL_CAMERA[1], f.exit[2] + TERMINAL_CAMERA[2]]
    aimBeam(beam.current, cam, [p[0], p[1] + 0.2, p[2] + 0.1], f.beam)
    okLight.current.position.set(p[0], p[1], p[2] + 1)
    okLight.current.intensity = f.released * 6
  })

  return (
    <group ref={root}>
      <Shelf ref={shelf} products={STORY_PRODUCTS} slots={SHELF_SLOTS} sign={sign.texture} />
      {STORY_PRODUCTS.map((p, i) => (
        <group key={p.id} ref={(el) => void (items.current[i] = el)}>
          <Product3D product={p} />
        </group>
      ))}
      <group position={[BASKET.x, BASKET.y, BASKET.z]} rotation={[0.08, 0.15, 0]}>
        <Basket />
      </group>
      <group ref={phone}>
        <group scale={PHONE_SCALE}>
          <Phone screen={screen.texture} />
        </group>
      </group>
      <Beam ref={laser} color="#30D158" />
      <group ref={exit} visible={false}>
        <Counter ref={counter} terminal={terminal.texture} />
      </group>
      <Beam ref={beam} color="#32D2FF" />
      <pointLight ref={okLight} color="#30D158" intensity={0} distance={5} />
    </group>
  )
}

export default function StoryScene({ active }: { active: boolean }) {
  return (
    <Stage active={active} label="Jornada de compra em 3D">
      <StoryRig />
    </Stage>
  )
}
