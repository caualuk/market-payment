/**
 * Ambiente de testes (jsdom). O jsdom não implementa algumas APIs de
 * navegador usadas por GSAP/ScrollTrigger; aqui ficam stubs mínimos.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver
window.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver

// jsdom não tem canvas: getContext devolve null sem logar "not implemented".
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
