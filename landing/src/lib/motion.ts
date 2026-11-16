/**
 * Utilitários de movimento inspirados nas diretrizes de "fluid interfaces"
 * da Apple (skill apple-design): amortecimento independente de frame rate,
 * rubber-banding e projeção de momento.
 */

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Mapeia `v` de [inMin, inMax] para [outMin, outMax], com clamp. */
export function mapRange(v: number, inMin: number, inMax: number, outMin = 0, outMax = 1): number {
  if (inMax === inMin) return outMin
  return lerp(outMin, outMax, clamp((v - inMin) / (inMax - inMin)))
}

export function smoothstep(t: number): number {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}

/**
 * Aproximação exponencial criticamente amortecida, independente do FPS.
 * `lambda` maior = resposta mais rápida. Usado no loop de render 3D para
 * perseguir a pose-alvo vinda do scroll sem "pular".
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

/**
 * Resistência progressiva ao arrastar além do limite.
 * Fórmula: (x * d * c) / (d + c * |x|), com c = 0.55.
 */
export function rubberBand(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

/**
 * Distância que o conteúdo percorreria após soltar com velocidade `v` (px/s),
 * com taxa de desaceleração `d` (0.998 = normal, 0.99 = rápido).
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}
