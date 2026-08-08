/** Services section — asymmetric 6-card grid for Lavage, Vidange, Batterie, Pneus, Diagnostic, Urgence */

import { useTranslation } from 'react-i18next'

interface Props {
  onBookNow: () => void
}

export default function ServicesSection({ onBookNow }: Props) {
  const { t } = useTranslation()

  const cardBase: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    minHeight: '220px',
  }
  const accentBorder = '1px solid rgba(67,188,201,0.25)'
  const defaultBorder = '1px solid rgba(255,255,255,0.06)'

  return (
    <section id="services" className="relative py-16 lg:py-20" style={{ background: '#080808' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-5">
            <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium" style={{ color: 'var(--mk-action)' }}>
              {t('landing.servicesTitle')}
            </div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '1.05',
              letterSpacing: '-0.025em', color: 'white', fontWeight: 700, wordBreak: 'break-word',
            }}>
              {t('landing.servicesSectionTitle')}
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('landing.servicesSectionSubtitle')}
            </p>
          </div>
        </div>

        {/* Row 1: large (5) + medium (4) + small accent (3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

          {/* SERVICE 1 — Lavage Auto */}
          <div
            className="lg:col-span-5 group relative rounded-xl p-8 overflow-hidden cursor-pointer transition-all duration-300"
            style={cardBase}
            onMouseEnter={e => { e.currentTarget.style.border = accentBorder; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = defaultBorder; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={onBookNow}
          >
            <div className="relative">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: 'rgba(67,188,201,0.08)', color: 'var(--mk-action)', border: '1px solid rgba(67,188,201,0.15)' }}>
                  ~45 min
                </span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 600, color: 'white', marginBottom: '12px', letterSpacing: '-0.015em' }}>
                {t('services.lavage')}
              </h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '280px' }}>
                {t('landing.lavageDesc')}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--mk-action)' }}>
                {t('landing.servicesBook')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>

          {/* SERVICE 2 — Vidange */}
          <div
            className="lg:col-span-4 group relative rounded-xl p-7 overflow-hidden cursor-pointer transition-all duration-300"
            style={cardBase}
            onMouseEnter={e => { e.currentTarget.style.border = accentBorder; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = defaultBorder; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={onBookNow}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="1.5">
                  <ellipse cx="12" cy="12" rx="10" ry="10" /><path d="M12 8v4l3 3" />
                </svg>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(67,188,201,0.08)', color: 'var(--mk-action)', border: '1px solid rgba(67,188,201,0.15)' }}>
                ~60 min
              </span>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 600, color: 'white', marginBottom: '10px', letterSpacing: '-0.015em' }}>
              {t('services.vidange')}
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('landing.vidangeDesc')}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--mk-action)' }}>
              {t('landing.servicesBook')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </div>

          {/* SERVICE 3 — Batterie (teal accent) */}
          <div
            className="lg:col-span-3 group relative rounded-xl p-6 overflow-hidden cursor-pointer transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(67,188,201,0.06) 0%, rgba(67,188,201,0.02) 100%)', border: '1px solid rgba(67,188,201,0.15)', minHeight: '220px' }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(67,188,201,0.35)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(67,188,201,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={onBookNow}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
              style={{ background: 'rgba(67,188,201,0.15)', border: '1px solid rgba(67,188,201,0.25)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '8px', letterSpacing: '-0.015em' }}>
              {t('services.batterie')}
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('landing.batterieDesc')}
            </p>
            <div className="text-xs font-medium" style={{ color: 'var(--mk-action)' }}>~30 min</div>
          </div>
        </div>

        {/* Row 2: small (3) + medium (4) + large urgence accent (5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SERVICE 4 — Pneus */}
          <div
            className="lg:col-span-3 group relative rounded-xl p-6 overflow-hidden cursor-pointer transition-all duration-300"
            style={cardBase}
            onMouseEnter={e => { e.currentTarget.style.border = accentBorder; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = defaultBorder; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={onBookNow}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
              style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '8px', letterSpacing: '-0.015em' }}>
              {t('services.pneus')}
            </h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('landing.pneusDesc')}
            </p>
            <div className="text-xs font-medium" style={{ color: 'var(--mk-action)' }}>~45 min</div>
          </div>

          {/* SERVICE 5 — Diagnostic */}
          <div
            className="lg:col-span-4 group relative rounded-xl p-7 overflow-hidden cursor-pointer transition-all duration-300"
            style={cardBase}
            onMouseEnter={e => { e.currentTarget.style.border = accentBorder; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = defaultBorder; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={onBookNow}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(67,188,201,0.08)', color: 'var(--mk-action)', border: '1px solid rgba(67,188,201,0.15)' }}>
                ~30 min
              </span>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 600, color: 'white', marginBottom: '10px', letterSpacing: '-0.015em' }}>
              Diagnostic
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('landing.diagnosticDesc')}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--mk-action)' }}>
              {t('landing.servicesBook')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          </div>

          {/* SERVICE 6 — Urgence (red accent) */}
          <div
            className="lg:col-span-5 group relative rounded-xl p-8 overflow-hidden cursor-pointer transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(255,68,68,0.06) 0%, rgba(255,68,68,0.02) 100%)', border: '1px solid rgba(255,68,68,0.18)', minHeight: '220px' }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(255,68,68,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,68,68,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={() => window.dispatchEvent(new CustomEvent('openBooking', { detail: { service: 'urgence' } }))}
          >
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--mk-urgent)', opacity: 0.5 }} />
                    <span className="relative rounded-full w-2.5 h-2.5" style={{ background: 'var(--mk-urgent)' }} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--mk-urgent)' }}>
                    {t('landing.serviceAvailable')}
                  </span>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--mk-urgent)', border: '1px solid rgba(255,68,68,0.2)' }}>
                  ASAP
                </span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '12px', letterSpacing: '-0.015em' }}>
                {t('services.urgence')}
              </h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '280px' }}>
                {t('landing.urgenceDesc')}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--mk-action)' }}>
                {t('landing.serviceCallNow')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
