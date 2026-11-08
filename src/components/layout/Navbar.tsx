import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import {
  Menu, X, ChevronDown, LogOut, User, Car,
  LayoutDashboard, ShoppingBag, Users, BarChart3,
  Calendar, FileText, Wrench,
} from 'lucide-react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const en = i18n.language?.startsWith('en')
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Dashboard, booking confirmation, fleet dashboard, and mechanic portal have their own chrome
  if (
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/booking') ||
    location.pathname.startsWith('/fleet-dashboard') ||
    location.pathname.startsWith('/mechanic')
  ) return null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  // ── PUBLIC NAVBAR — floating pill (CAFU model) ──
  if (!user) {
    const links = [
      { to: '/services',          label: t('nav.services') },
      { to: '/tarifs',            label: t('nav.pricing') },
      { to: '/comment-ca-marche', label: t('nav.howItWorks') },
      { to: '/flottes',           label: t('nav.fleet') },
      { to: '/a-propos',          label: t('nav.about') },
    ]
    const panne = () => { setMobileOpen(false); window.dispatchEvent(new CustomEvent('openBooking', { detail: { service: 'urgence' } })) }
    const book = () => { setMobileOpen(false); window.dispatchEvent(new CustomEvent('openBooking')) }
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 pt-3">
        <div
          className="max-w-6xl mx-auto h-14 pl-4 pr-2 flex items-center justify-between rounded-full transition-all duration-300"
          style={{
            background: scrolled || mobileOpen ? 'rgba(18,18,22,0.92)' : 'rgba(18,18,22,0.6)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.35)' : 'none',
          }}
        >
          <Link to="/" className="flex items-center">
            <img src="/logo.jpg" alt="MecaLIK"
              style={{ height: '32px', width: '108px', objectFit: 'cover', borderRadius: '999px' }} />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {links.map(item => (
              <Link key={item.to} to={item.to}
                className="text-sm px-3 py-2 rounded-full transition-colors"
                style={{
                  color: isActive(item.to) ? 'white' : 'rgba(255,255,255,0.6)',
                  background: isActive(item.to) ? 'rgba(255,255,255,0.08)' : 'transparent',
                  fontWeight: isActive(item.to) ? 600 : 500,
                }}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={panne}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-full"
              style={{ color: '#FF5A5F' }}>
              <span className="mk-dot-red" /> {en ? 'Breakdown?' : 'Panne ?'}
            </button>
            <div className="hidden lg:block"><LanguageSwitcher /></div>
            <Link to="/login" className="hidden lg:block text-sm font-medium px-3 py-2"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('nav.login')}
            </Link>
            <button onClick={book}
              className="font-bold px-5 py-2.5 rounded-full text-sm"
              style={{ background: 'var(--mk-action)', color: '#062A2E' }}>
              {en ? 'Book' : 'Réserver'}
            </button>
            <button className="lg:hidden flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.06)' }}
              onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden max-w-6xl mx-auto mt-2 rounded-3xl px-5 py-4"
            style={{ background: 'rgba(18,18,22,0.97)', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideIn 0.2s ease' }}>
            {links.map(item => (
              <Link key={item.to} to={item.to} className="block text-base py-2.5"
                style={{ color: isActive(item.to) ? 'white' : 'rgba(255,255,255,0.75)' }}>
                {item.label}
              </Link>
            ))}
            <button onClick={panne} className="flex items-center gap-2 text-base font-semibold py-2.5" style={{ color: '#FF5A5F' }}>
              <span className="mk-dot-red" /> {en ? 'Breakdown? Priority help' : 'Panne ? Intervention prioritaire'}
            </button>
            <div className="pt-3 mt-2 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex gap-4">
                <Link to="/login" className="text-sm py-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('nav.login')}</Link>
                <Link to="/signup" className="text-sm py-2 font-semibold" style={{ color: 'var(--mk-action)' }}>{t('nav.signup')}</Link>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </nav>
    )
  }

  // ── LOGGED-IN NAVBAR ──
  const navItems = profile?.role === 'admin' ? [
    { to: '/admin',              icon: <LayoutDashboard size={16} />, label: t('admin.dashboard') },
    { to: '/admin?tab=bookings', icon: <ShoppingBag size={16} />,    label: t('admin.reservations') },
    { to: '/admin?tab=customers',icon: <Users size={16} />,          label: t('admin.clients') },
  ] : profile?.role === 'fleet_manager' ? [
    { to: '/fleet-dashboard',                  icon: <BarChart3 size={16} />, label: t('fleet.tabs.overview') },
    { to: '/fleet-dashboard?tab=fleet',        icon: <Car size={16} />,       label: t('fleet.vehiclesCount') },
    { to: '/fleet-dashboard?tab=calendar',     icon: <Calendar size={16} />,  label: t('fleet.tabs.reports') },
    { to: '/fleet-dashboard?tab=reports',      icon: <FileText size={16} />,  label: t('fleet.reports.fleetReport') },
  ] : []

  const roleBadge = profile?.role === 'admin'
    ? { label: 'Admin', color: 'var(--mk-action)', bg: 'rgba(67,188,201,0.1)', border: 'rgba(67,188,201,0.2)' }
    : profile?.role === 'fleet_manager'
    ? { label: 'Flotte', color: 'var(--mk-premium)', bg: 'rgba(240,192,64,0.1)', border: 'rgba(240,192,64,0.2)' }
    : null

  const homePath = profile?.role === 'admin' ? '/admin'
    : profile?.role === 'fleet_manager' ? '/fleet-dashboard'
    : '/dashboard'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,8,8,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to={homePath}>
          <img src="/logo.jpg" alt="MecaLIK"
            style={{ height: '36px', width: '120px', objectFit: 'cover', borderRadius: '6px' }} />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: isActive(item.to.split('?')[0]) ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive(item.to.split('?')[0]) ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {roleBadge && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {roleBadge.label}
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
              style={{
                background: profileOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(67,188,201,0.2)', color: 'var(--mk-action)' }}>
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium max-w-24 truncate"
                style={{ color: 'rgba(255,255,255,0.8)' }}>
                {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
              <ChevronDown size={14}
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  transform: profileOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 z-50"
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-sm font-medium" style={{ color: 'white' }}>
                    {profile?.full_name || 'Mon compte'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {user.email}
                  </div>
                </div>

                <div className="py-1">
                  <Link to={homePath + '?tab=profile'}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <User size={15} />
                    Mon profil
                  </Link>
                  {profile?.role === 'customer' && (
                    <button
                      onClick={() => { window.dispatchEvent(new CustomEvent('openBooking')); setProfileOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'rgba(255,255,255,0.65)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Wrench size={15} />
                      Nouvelle réservation
                    </button>
                  )}
                </div>

                <div className="border-t pt-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'var(--mk-urgent)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <LogOut size={15} />
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: 'rgba(255,255,255,0.7)' }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-4"
          style={{ background: 'rgba(8,8,8,0.98)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="space-y-1 mb-4">
            {navItems.map(item => (
              <Link key={item.to} to={item.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-sm mb-1" style={{ color: 'white' }}>
              {profile?.full_name || 'Mon compte'}
            </div>
            <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {user.email}
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--mk-urgent)' }}>
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
