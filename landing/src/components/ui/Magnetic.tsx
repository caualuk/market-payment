/**
 * Botão/link "magnético": acompanha o ponteiro com leve atração e volta com
 * mola ao sair. Feedback no pointer-down via CSS (:active scale .97).
 */
import { useEffect, useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { gsap, prefersReducedMotion } from '../../lib/gsap'

interface MagneticProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  strength?: number
  variant?: 'primary' | 'ghost' | 'light'
}

export function Magnetic({ children, strength = 0.35, variant = 'primary', className = '', ...rest }: MagneticProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  return (
    <a ref={ref} className={`btn btn-${variant} ${className}`} {...rest}>
      {children}
    </a>
  )
}
