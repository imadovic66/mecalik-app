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
  const { t } = useTranslation()
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

  // ── PUBLIC NAVBAR ──
  if (!user) {
    return (
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(8,8,8,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.jpg" alt="MecaLIK"
              style={{ height: '36px', width: '120px', objectFit: 'cover', borderRadius: '6px' }} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { to: '/',         label: t('nav.home') },
              { to: '/services', label: t('nav.services') },
              { to: '/devis',    label: t('nav.pricing') },
              { to: '/fleet',    label: t('nav.fleet') },
              { to: '/about',    label: t('nav.about') },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="text-sm transition-colors"
                style={{
                  color: isActive(item.to) ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: isActive(item.to) ? 500 : 400,
                  borderBottom: isActive(item.to) ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                  paddingBottom: '2px',
                }}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('nav.login')}
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
              style={{ background: '#43BCC9', color: '#080808' }}>
              {t('nav.quickQuote')}
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-3"
            style={{ background: 'rgba(8,8,8,0.98)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {[
              { to: '/',         label: t('nav.home') },
              { to: '/services', label: t('nav.services') },
              { to: '/devis',    label: t('nav.pricing') },
              { to: '/fleet',    label: t('nav.fleet') },
              { to: '/about',    label: t('nav.about') },
            ].map(item => (
              <Link key={item.to} to={item.to} className="block text-sm py-2"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Link to="/login" className="block text-sm py-2" style={{ color: '#43BCC9' }}>
                {t('nav.login')}
              </Link>
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
    ? { label: 'Admin', color: '#43BCC9', bg: 'rgba(67,188,201,0.1)', border: 'rgba(67,188,201,0.2)' }
    : profile?.role === 'fleet_manager'
    ? { label: 'Flotte', color: '#F0C040', bg: 'rgba(240,192,64,0.1)', border: 'rgba(240,192,64,0.2)' }
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
                style={{ background: 'rgba(67,188,201,0.2)', color: '#43BCC9' }}>
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
                    style={{ color: '#FF4444' }}
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
              style={{ color: '#FF4444' }}>
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
