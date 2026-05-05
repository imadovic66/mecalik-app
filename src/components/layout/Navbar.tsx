import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type Lang = 'FR' | 'EN' | 'AR'

const navLinks: { label: string; to: string }[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Flottes', to: '/fleet' },
  { label: 'À propos', to: '/about' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('FR')
  const { user, signOut } = useAuth()

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
                  background: lang === l ? 'rgba(67,188,201,0.08)' : 'transparent',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="hidden md:inline-flex items-center bg-[#43BCC9] text-[#080808] font-semibold px-5 py-2.5 rounded-full hover:bg-[#2FA8B5] transition-colors duration-200 text-sm"
              >
                Mon espace
              </Link>
              <button
                onClick={signOut}
                className="text-xs transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Connexion
              </Link>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                className="font-semibold px-5 py-2.5 rounded-full text-sm transition-colors duration-200"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                Devis Gratuit
              </button>
            </div>
          )}
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
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="mt-3 flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                Mon espace
              </Link>
              <button
                onClick={signOut}
                className="mt-2 text-sm text-center w-full py-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mt-3 flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium border"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
              >
                Connexion
              </Link>
              <button
                onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('openBooking')) }}
                className="mt-2 flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold w-full"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                Devis Gratuit
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
