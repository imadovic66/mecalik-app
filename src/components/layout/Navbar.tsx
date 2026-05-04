import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

type Lang = 'FR' | 'EN' | 'AR'

const navLinks: { label: string; to: string }[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Flottes', to: '/fleet' },
  { label: 'À propos', to: '/about' },
]

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('FR')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close drawer when route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  return (
    <header
      style={{
        background: '#080808',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.6)' : 'none',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/logo.jpg"
            alt="MecaLIK"
            style={{
              height: '56px',
              width: '180px',
              objectFit: 'cover',
              objectPosition: 'center center',
              borderRadius: '8px',
            }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color: isActive(to) ? '#43BCC9' : 'rgba(255,255,255,0.72)',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side: lang switcher + CTA */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language switcher */}
          <div className="flex items-center gap-1">
            {(['FR', 'EN', 'AR'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="text-xs font-medium px-2 py-1 rounded transition-colors duration-200"
                style={{
                  color: lang === l ? '#43BCC9' : 'rgba(255,255,255,0.42)',
                  background:
                    lang === l ? 'rgba(67,188,201,0.08)' : 'transparent',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* CTA */}
          <a
            href="/#booking"
            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-opacity duration-200 hover:opacity-90 active:scale-95"
            style={{ background: '#43BCC9', color: '#080808' }}
          >
            📲 Devis Gratuit
          </a>
        </div>

        {/* Mobile: lang + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <div className="flex items-center gap-1">
            {(['FR', 'EN', 'AR'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="text-xs font-medium px-1.5 py-0.5 rounded transition-colors duration-200"
                style={{
                  color: lang === l ? '#43BCC9' : 'rgba(255,255,255,0.42)',
                  background:
                    lang === l ? 'rgba(67,188,201,0.08)' : 'transparent',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-2xl leading-none"
            style={{ color: 'rgba(255,255,255,0.88)' }}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: menuOpen ? '320px' : '0px',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <nav
          className="flex flex-col px-4 pt-4 pb-6 gap-1"
          style={{ background: '#080808' }}
        >
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-base font-medium py-2.5 px-3 rounded-lg transition-colors duration-200"
              style={{
                color: isActive(to) ? '#43BCC9' : 'rgba(255,255,255,0.72)',
                background: isActive(to)
                  ? 'rgba(67,188,201,0.08)'
                  : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
          <a
            href="/#booking"
            className="mt-3 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: '#43BCC9', color: '#080808' }}
          >
            📲 Devis Gratuit
          </a>
        </nav>
      </div>
    </header>
  )
}
