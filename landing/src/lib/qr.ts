/**
 * Gera uma matriz *ilustrativa* com aparência de QR Code (finders nos 3 cantos
 * e módulos pseudoaleatórios). É determinística por `seed` e serve apenas para
 * a demo visual da landing — o app real usa um token assinado no servidor.
 */
export function qrMatrix(seed: string | number, size = 25): boolean[][] {
  let h = typeof seed === 'number' ? seed : hashString(seed)
  h = (h >>> 0) || 1
  const next = () => {
    // xorshift32
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    h >>>= 0
    return h / 0xffffffff
  }

  const grid: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false))
  const reserved = (x: number, y: number) => isInFinderZone(x, y, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!reserved(x, y)) grid[y][x] = next() > 0.5
    }
  }
  for (const [fx, fy] of finderOrigins(size)) drawFinder(grid, fx, fy)
  return grid
}

export function finderOrigins(size: number): Array<[number, number]> {
  return [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]
}

function isInFinderZone(x: number, y: number, size: number): boolean {
  return finderOrigins(size).some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7)
}

function drawFinder(grid: boolean[][], fx: number, fy: number) {
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const ring = x === 0 || y === 0 || x === 6 || y === 6
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
      grid[fy + y][fx + x] = ring || core
    }
  }
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
