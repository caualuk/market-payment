import { useMemo } from 'react'
import { qrMatrix } from '../../lib/qr'

interface QrCodeProps {
  seed: string
  size?: number
  color?: string
  label: string
}

/** QR ilustrativo em SVG (um único <path>, leve e nítido em qualquer escala). */
export function QrCode({ seed, size = 200, color = '#0A0A0F', label }: QrCodeProps) {
  const { d, n } = useMemo(() => {
    const m = qrMatrix(seed)
    let path = ''
    m.forEach((row, y) => row.forEach((on, x) => on && (path += `M${x} ${y}h1v1h-1z`)))
    return { d: path, n: m.length }
  }, [seed])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={d} fill={color} />
    </svg>
  )
}
