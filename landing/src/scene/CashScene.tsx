/**
 * Cena do balcão do caixa expresso (seção Dinheiro). Aplica `cashFrame(p)`.
 */
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { damp } from '../lib/motion'
import { CASH_CODE, CASH_PHONE, CASH_RECEIVED, CASH_TERMINAL, CASH_TOTAL, cashFrame } from './cash'
import { Beam, CashNote, ChangeCoin, Counter, Phone, aimBeam, useDrawnTexture, TERMINAL_CAMERA, type CounterHandle } from './models'
import { drawScreen, screenKey, SCREEN_H, SCREEN_W } from './screenTexture'
import { Stage } from './Stage'
import { sceneStore } from './store'
import { drawTerminal } from './textures'

function CashRig() {
  const root = useRef<THREE.Group>(null!)
  const phone = useRef<THREE.Group>(null!)
  const note = useRef<THREE.Group>(null!)
  const coin = useRef<THREE.Group>(null!)
  const counter = useRef<CounterHandle>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  const okLight = useRef<THREE.PointLight>(null!)
  const shown = useRef(sceneStore.cash)
  const screen = useDrawnTexture(SCREEN_W, SCREEN_H)
  const terminal = useDrawnTexture(768, 512)

  useFrame((state, dt) => {
    shown.current = sceneStore.reducedMotion ? sceneStore.cash : damp(shown.current, sceneStore.cash, 7, Math.min(dt, 1 / 20))
    const f = cashFrame(shown.current)
    const mobile = window.innerWidth < 820
    root.current.scale.setScalar(mobile ? 0.85 : 1.2)
    root.current.position.set(mobile ? 0.15 : 0.1, mobile ? 0.35 : 0.45, 0)
    root.current.rotation.set(0.12 + sceneStore.pointerY * 0.02, -0.15 + sceneStore.pointerX * 0.05, 0)

    const float = sceneStore.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.9) * 0.03
    phone.current.position.set(CASH_PHONE.pos[0], CASH_PHONE.pos[1] + float, CASH_PHONE.pos[2])
    const data = { total: CASH_TOTAL, code: CASH_CODE }
    screen.draw(screenKey(f.phoneScreen, data), (ctx) => drawScreen(ctx, f.phoneScreen, data))
    terminal.draw(f.terminal, (ctx) =>
      drawTerminal(ctx, 768, 512, f.terminal, { total: CASH_TOTAL, received: CASH_RECEIVED, code: CASH_CODE, items: 8 }),
    )

    // feixe do tablet lendo o QR âmbar
    const [tx, ty, tz] = CASH_TERMINAL.pos
    const cam = [tx + TERMINAL_CAMERA[0], ty + TERMINAL_CAMERA[1], tz + TERMINAL_CAMERA[2]]
    aimBeam(beam.current, cam, [CASH_PHONE.pos[0], CASH_PHONE.pos[1] + 0.2, CASH_PHONE.pos[2] + 0.1], f.beam)

    // nota de R$ 100 entregue pelo cliente
    note.current.visible = f.note > 0.001
    note.current.position.set(...f.notePos)
    note.current.rotation.set(f.noteRotX, 0.1, -0.15 * (1 - f.note))

    // troco digital: moeda voa do caixa para o app
    coin.current.visible = f.coinVisible
    coin.current.position.set(...f.coinPos)
    coin.current.scale.setScalar(Math.max(0.0001, f.coinScale))
    coin.current.rotation.y = f.coin * Math.PI * 2

    counter.current?.set(f.glow, f.glow)
    okLight.current.intensity = f.glow * 6
  })

  return (
    <group ref={root}>
      <group position={CASH_TERMINAL.pos}>
        <Counter ref={counter} terminal={terminal.texture} />
      </group>
      <group ref={phone} rotation={CASH_PHONE.rot} scale={0.62}>
        <Phone screen={screen.texture} />
      </group>
      <group ref={note} visible={false}>
        <CashNote />
      </group>
      <group ref={coin} visible={false}>
        <ChangeCoin amount={CASH_RECEIVED - CASH_TOTAL} />
      </group>
      <Beam ref={beam} color="#FF9F0A" />
      <pointLight ref={okLight} color="#30D158" position={[CASH_PHONE.pos[0], 0, 1.5]} intensity={0} distance={5} />
    </group>
  )
}

export default function CashScene({ active }: { active: boolean }) {
  return (
    <Stage active={active} label="Pagamento em dinheiro no caixa expresso em 3D" z={7.5}>
      <CashRig />
    </Stage>
  )
}
