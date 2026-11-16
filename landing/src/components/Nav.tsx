import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#demo', label: 'Demo' },
  { href: '#dinheiro', label: 'Dinheiro' },
  { href: '#lojistas', label: 'Para mercados' },
  { href: '#faq', label: 'Dúvidas' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`} aria-label="Principal">
      <a href="#top" className="logo" aria-label="Passa, início">
        <span className="logo-mark" aria-hidden="true" />
        passa
      </a>
      <ul id="nav-links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          </li>
        ))}
      </ul>
      <a className="nav-cta" href="#contato">Levar para meu mercado</a>
      <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" aria-label="Abrir menu" onClick={() => setOpen((o) => !o)}>
        <span />
        <span />
      </button>
    </nav>
  )
}
