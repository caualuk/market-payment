/**
 * Modelos 3D procedurais do universo do Passa. Nada abstrato: cada objeto é
 * algo que existe no mercado — embalagens com código de barras real, cesta de
 * arame, gôndola com etiqueta de preço, balcão de saída com tablet e cancela.
 * Todos têm a base em y = 0 para "pousar" em prateleiras e balcões.
 */
import { RoundedBox } from '@react-three/drei'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Product } from '../lib/cart'
import { drawLabel, drawPriceTag, drawSign, drawCoin, drawNote } from './textures'

// ---------------------------------------------------------------- texturas
export function makeCanvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, ctx }
}

/** Textura redesenhada só quando a `key` muda (evita reupload por frame). */
export function useDrawnTexture(w: number, h: number) {
  const tex = useMemo(() => makeCanvasTexture(w, h, () => {}), [w, h])
  const key = useRef<string | null>(null)
  const draw = (k: string, fn: (ctx: CanvasRenderingContext2D) => void) => {
    if (k === key.current) return
    key.current = k
    tex.ctx.clearRect(0, 0, w, h)
    fn(tex.ctx)
    tex.texture.needsUpdate = true
  }
  return { texture: tex.texture, draw }
}

function useStaticTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeCanvasTexture(w, h, draw).texture, deps)
}

// ---------------------------------------------------------------- celular
export const PHONE_SIZE = { w: 1.6, h: 3.3, d: 0.17 }

export function Phone({ screen }: { screen: THREE.Texture }) {
  const { w, h, d } = PHONE_SIZE
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={0.2} smoothness={6}>
        <meshPhysicalMaterial color="#2a2a33" metalness={0.85} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0, d / 2 + 0.002]}>
        <planeGeometry args={[w - 0.1, h - 0.1]} />
        <meshBasicMaterial map={screen} transparent toneMapped={false} />
      </mesh>
      {/* câmera traseira: é ela que lê o código de barras */}
      <mesh position={[-0.42, 1.25, -d / 2 - 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 32]} />
        <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------- produtos
function Label({ product, w, h, y, z }: { product: Product; w: number; h: number; y: number; z: number }) {
  const map = useStaticTexture(512, Math.round(512 * (h / w)), (ctx) => drawLabel(ctx, 512, Math.round(512 * (h / w)), product), [product.id, w, h])
  return (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} roughness={0.55} />
    </mesh>
  )
}

function MilkCarton({ product }: { product: Product }) {
  const gable = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.25, 0)
    s.lineTo(0.25, 0)
    s.lineTo(0, 0.2)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false })
    g.translate(0, 0, -0.25)
    return g
  }, [])
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#FAFAFC" roughness={0.6} />
      </mesh>
      <mesh geometry={gable} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#F2F2F7" roughness={0.6} />
      </mesh>
      <mesh position={[0.12, 0.92, 0.12]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 20]} />
        <meshStandardMaterial color="#0A84FF" roughness={0.4} />
      </mesh>
      <Label product={product} w={0.46} h={0.62} y={0.42} z={0.252} />
    </group>
  )
}

function Bread({ product }: { product: Product }) {
  return (
    <group>
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.78, 0.34, 0.42]} />
        <meshStandardMaterial color="#D9A066" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.55, 1, 1]}>
        <cylinderGeometry args={[0.21, 0.21, 0.78, 32]} />
        <meshStandardMaterial color="#C98A4B" roughness={0.85} />
      </mesh>
      {/* saquinho plástico */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.82, 0.52, 0.46]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.1} />
      </mesh>
      <Label product={product} w={0.6} h={0.26} y={0.17} z={0.232} />
    </group>
  )
}

function Avocado({ product }: { product: Product }) {
  return (
    <group>
      <mesh position={[0, 0.34, 0]} scale={[0.82, 1.12, 0.82]}>
        <sphereGeometry args={[0.3, 40, 40]} />
        <meshPhysicalMaterial color="#2F4A22" roughness={0.75} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 0.69, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.06, 10]} />
        <meshStandardMaterial color="#5A3E1B" />
      </mesh>
      {/* etiqueta da balança (EAN de peso variável, prefixo 2) */}
      <Label product={product} w={0.3} h={0.22} y={0.34} z={0.248} />
    </group>
  )
}

function Coffee({ product }: { product: Product }) {
  return (
    <group>
      <RoundedBox args={[0.42, 0.78, 0.24]} radius={0.03} smoothness={3} position={[0, 0.39, 0]}>
        <meshStandardMaterial color="#2B1A12" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <Label product={product} w={0.38} h={0.62} y={0.4} z={0.123} />
    </group>
  )
}

function Soap({ product }: { product: Product }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.82, 0.32]} radius={0.09} smoothness={4} position={[0, 0.41, 0]}>
        <meshPhysicalMaterial color="#C9C6FF" roughness={0.25} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0.1, 0.88, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.13, 24]} />
        <meshStandardMaterial color="#5E5CE6" roughness={0.4} />
      </mesh>
      <Label product={product} w={0.42} h={0.5} y={0.4} z={0.162} />
    </group>
  )
}

export function Product3D({ product }: { product: Product }) {
  switch (product.id) {
    case 'leite':
      return <MilkCarton product={product} />
    case 'pao':
      return <Bread product={product} />
    case 'abacate':
      return <Avocado product={product} />
    case 'cafe':
      return <Coffee product={product} />
    default:
      return <Soap product={product} />
  }
}

// ---------------------------------------------------------------- cesta de arame
const BASKET_DIM = { w: 1.35, d: 0.78, h: 0.46 }

export function Basket() {
  const { w, d, h } = BASKET_DIM
  const bars = useMemo(() => {
    const out: Array<{ pos: [number, number, number]; len: number; axis: 'x' | 'y' | 'z' }> = []
    const step = 0.13
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += step) {
      out.push({ pos: [x, h / 2, d / 2], len: h, axis: 'y' })
      out.push({ pos: [x, h / 2, -d / 2], len: h, axis: 'y' })
      out.push({ pos: [x, 0, 0], len: d, axis: 'z' })
    }
    for (let z = -d / 2; z <= d / 2 + 1e-6; z += step) {
      out.push({ pos: [w / 2, h / 2, z], len: h, axis: 'y' })
      out.push({ pos: [-w / 2, h / 2, z], len: h, axis: 'y' })
      out.push({ pos: [0, 0, z], len: w, axis: 'x' })
    }
    for (const y of [0.16, 0.32]) {
      out.push({ pos: [0, y, d / 2], len: w, axis: 'x' })
      out.push({ pos: [0, y, -d / 2], len: w, axis: 'x' })
      out.push({ pos: [w / 2, y, 0], len: d, axis: 'z' })
      out.push({ pos: [-w / 2, y, 0], len: d, axis: 'z' })
    }
    return out
  }, [w, d, h])
  const wire = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#E8304B', roughness: 0.35, metalness: 0.3, clearcoat: 1 }), [])
  const rot = { x: [0, 0, Math.PI / 2], y: [0, 0, 0], z: [Math.PI / 2, 0, 0] } as const

  return (
    <group>
      {bars.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={rot[b.axis] as unknown as [number, number, number]} material={wire}>
          <cylinderGeometry args={[0.011, 0.011, b.len, 6]} />
        </mesh>
      ))}
      {/* aro superior (plástico) */}
      {[
        { p: [0, h, d / 2], s: [w + 0.06, 0.05, 0.05] },
        { p: [0, h, -d / 2], s: [w + 0.06, 0.05, 0.05] },
        { p: [w / 2, h, 0], s: [0.05, 0.05, d + 0.06] },
        { p: [-w / 2, h, 0], s: [0.05, 0.05, d + 0.06] },
      ].map((r, i) => (
        <mesh key={`rim${i}`} position={r.p as [number, number, number]} material={wire}>
          <boxGeometry args={r.s as [number, number, number]} />
        </mesh>
      ))}
      {/* alças */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.28, h, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.36, 0.022, 10, 32, Math.PI]} />
          <meshPhysicalMaterial color="#1C1C24" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- gôndola
export const SHELF_DIM = { w: 3.7, d: 0.8 }

/** Letreiro desenhado pelo pai (acende no check-in sem re-render do React). */
export function drawSignTexture(ctx: CanvasRenderingContext2D, glow: boolean) {
  drawSign(ctx, 1024, 200, glow)
}

export const Shelf = forwardRef<THREE.Group, { products: readonly Product[]; slots: readonly number[]; sign: THREE.Texture }>(
  function Shelf({ products, slots, sign }, ref) {
    const tags = useMemo(() => products.map((p) => makeCanvasTexture(320, 96, (ctx) => drawPriceTag(ctx, 320, 96, p)).texture), [products])
    return (
      <group ref={ref}>
        {/* fundo da gôndola */}
        <mesh position={[0, 0.85, -SHELF_DIM.d / 2]}>
          <boxGeometry args={[SHELF_DIM.w + 0.1, 2.0, 0.05]} />
          <meshStandardMaterial color="#23232C" roughness={0.8} />
        </mesh>
        {/* prateleira */}
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[SHELF_DIM.w, 0.08, SHELF_DIM.d]} />
          <meshStandardMaterial color="#E5E5EA" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* trilho das etiquetas */}
        <mesh position={[0, -0.1, SHELF_DIM.d / 2 + 0.01]}>
          <boxGeometry args={[SHELF_DIM.w, 0.16, 0.02]} />
          <meshStandardMaterial color="#F5F5F7" />
        </mesh>
        {tags.map((map, i) => (
          <mesh key={i} position={[slots[i], -0.1, SHELF_DIM.d / 2 + 0.022]}>
            <planeGeometry args={[0.52, 0.15]} />
            <meshBasicMaterial map={map} toneMapped={false} />
          </mesh>
        ))}
        {/* letreiro da loja: acende no check-in */}
        <mesh position={[0, 1.95, -SHELF_DIM.d / 2 + 0.05]}>
          <planeGeometry args={[2.6, 0.51]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      </group>
    )
  },
)

// ---------------------------------------------------------------- balcão de saída
/** Posição (relativa ao balcão) da câmera do tablet — origem do feixe de leitura. */
export const TERMINAL_CAMERA: [number, number, number] = [-0.45, 1.22, 0.1]

export interface CounterHandle {
  /** abre a cancela (0→1) e pinta de verde quando liberado */
  set(open: number, released: number): void
}

const GLASS = '#BFE3FF'
const GLASS_OK = '#9BF0B3'

export const Counter = forwardRef<CounterHandle, { terminal: THREE.Texture }>(function Counter({ terminal }, ref) {
  const left = useRef<THREE.Group>(null!)
  const right = useRef<THREE.Group>(null!)
  const stripe = useMemo(() => new THREE.MeshBasicMaterial({ color: '#5E5CE6', toneMapped: false }), [])
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: GLASS, transparent: true, opacity: 0.45, roughness: 0.05 }), [])
  useImperativeHandle(ref, () => ({
    set(open, released) {
      left.current.rotation.y = open * 1.35
      right.current.rotation.y = -open * 1.35
      stripe.color.set(released > 0.5 ? '#30D158' : '#5E5CE6')
      glass.color.set(released > 0.5 ? GLASS_OK : GLASS)
    },
  }), [stripe, glass])
  return (
    <group>
      {/* tampo + frente do balcão */}
      <RoundedBox args={[2.4, 0.12, 1.1]} radius={0.04} smoothness={3} position={[-0.3, -0.06, 0]}>
        <meshStandardMaterial color="#F5F5F7" roughness={0.35} />
      </RoundedBox>
      <mesh position={[-0.3, -0.75, 0.52]}>
        <boxGeometry args={[2.4, 1.3, 0.06]} />
        <meshStandardMaterial color="#E5E5EA" roughness={0.6} />
      </mesh>
      <mesh position={[-0.3, -0.3, 0.556]}>
        <boxGeometry args={[2.4, 0.06, 0.01]} />
        <primitive object={stripe} attach="material" />
      </mesh>
      {/* tablet de validação */}
      <group position={[-0.45, 0, -0.1]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.5, 16]} />
          <meshStandardMaterial color="#8E8E93" metalness={0.8} roughness={0.3} />
        </mesh>
        <group position={[0, 0.82, 0]} rotation={[-0.22, 0, 0]}>
          <RoundedBox args={[1.0, 0.7, 0.05]} radius={0.05} smoothness={4}>
            <meshPhysicalMaterial color="#1C1C24" metalness={0.6} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0, 0.027]}>
            <planeGeometry args={[0.92, 0.62]} />
            <meshBasicMaterial map={terminal} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* cancela de vidro da saída */}
      <group position={[1.35, 0, 0.2]}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, -0.55, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.3, 20]} />
            <meshStandardMaterial color="#C7C7CC" metalness={0.8} roughness={0.25} />
          </mesh>
        ))}
        <group ref={left} position={[-0.56, -0.45, 0]}>
          <mesh position={[0.27, 0, 0]}>
            <boxGeometry args={[0.54, 0.75, 0.025]} />
            <primitive object={glass} attach="material" />
          </mesh>
        </group>
        <group ref={right} position={[0.56, -0.45, 0]}>
          <mesh position={[-0.27, 0, 0]}>
            <boxGeometry args={[0.54, 0.75, 0.025]} />
            <primitive object={glass} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  )
})

// ---------------------------------------------------------------- dinheiro
export function CashNote() {
  const map = useStaticTexture(640, 300, (ctx) => drawNote(ctx, 640, 300), [])
  return (
    <mesh>
      <planeGeometry args={[1.15, 0.54]} />
      <meshStandardMaterial map={map} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  )
}

export function ChangeCoin({ amount }: { amount: number }) {
  const face = useStaticTexture(256, 256, (ctx) => drawCoin(ctx, 256, amount), [amount])
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 48]} />
      <meshStandardMaterial attach="material-0" color="#B8860B" metalness={0.7} roughness={0.3} />
      <meshBasicMaterial attach="material-1" map={face} toneMapped={false} />
      <meshBasicMaterial attach="material-2" map={face} toneMapped={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- feixes de luz
/** Feixe entre dois pontos (laser do scanner / leitor do balcão). */
export const Beam = forwardRef<THREE.Mesh, { color: string }>(function Beam({ color }, ref) {
  return (
    <mesh ref={ref} visible={false}>
      <cylinderGeometry args={[0.018, 0.05, 1, 12, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  )
})

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
/** Posiciona e orienta um `Beam` de `from` até `to`. */
export function aimBeam(mesh: THREE.Mesh, from: readonly number[], to: readonly number[], intensity: number) {
  _a.set(from[0], from[1], from[2])
  _b.set(to[0], to[1], to[2])
  const len = _a.distanceTo(_b)
  mesh.visible = intensity > 0.01
  mesh.position.copy(_a).add(_b).multiplyScalar(0.5)
  mesh.scale.set(1 + intensity, len, 1 + intensity)
  mesh.quaternion.setFromUnitVectors(_up, _b.sub(_a).normalize())
  ;(mesh.material as THREE.MeshBasicMaterial).opacity = intensity * 0.9
}
