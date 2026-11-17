import { useEffect, useState, type RefObject } from 'react'

/** `true` enquanto o elemento está (perto de estar) na tela. Pausa o 3D fora dela. */
export function useInView(ref: RefObject<Element | null>, rootMargin = '200px'): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}
