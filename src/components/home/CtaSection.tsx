/** Bottom CTA section — WhatsApp + phone buttons, checkmark stats, and 3 metric cards */

import { useTranslation } from 'react-i18next'

interface Props {
  onBookNow: () => void
}

export default function CtaSection({ onBookNow: _ }: Props) {
  const { t } = useTranslation()

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(67,188,201,0.3), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 50%, #0A0A0A 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>

          <div style={{
            position: 'absolute', top: '-100px', right: '-100px',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(67,188,201,0.08) 0%, transparent 60%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-100px', left: '-50px',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(67,188,201,0.04) 0%, transparent 60%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div className="relative p-10 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

              {/* Left — copy */}
              <div className="lg:col-span-7">
                <div className="text-xs uppercase tracking-[0.2em] mb-6 font-medium" style={{ color: '#43BCC9' }}>
                  {t('landing.ctaCity')}
                </div>

                <h2 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  lineHeight: '1.02',
                  letterSpacing: '-0.03em',
                  color: 'white',
                  fontWeight: 700,
                  marginBottom: '24px',
                }}>
                  {t('landing.ctaHeadline1')}<br />
                  {t('landing.ctaHeadline2')}<br />
                  <span style={{
                    background: 'linear-gradient(90deg, #43BCC9, #5FD1DD)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {t('landing.ctaHeadline3')}
                  </span>
                </h2>

                <p className="text-base lg:text-lg leading-relaxed mb-10"
                  style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '480px' }}>
                  {t('landing.ctaDesc')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm transition-all"
                    style={{ background: '#43BCC9', color: '#080808', boxShadow: '0 8px 32px rgba(67,188,201,0.3)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,188,201,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,188,201,0.3)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {t('landing.ctaButton2')}
                  </button>

                  <a href="tel:+212777348065"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-full font-semibold text-sm transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    07 77 34 80 65
                  </a>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {[t('landing.ctaStat1'), t('landing.ctaStat2'), t('landing.ctaStat3'), t('landing.ctaStat4')].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — metric cards */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-4">
                {[
                  { number: '< 5 min',  label: t('landing.ctaMetric1Label') },
                  { number: '< 90 min', label: t('landing.ctaMetric2Label') },
                  { number: '0 MAD',    label: t('landing.ctaMetric4Label') },
                ].map((stat, i) => (
                  <div key={i} className="rounded-2xl p-6 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '28px', fontWeight: 800,
                      color: '#43BCC9', letterSpacing: '-0.02em',
                      lineHeight: 1.1, marginBottom: '8px',
                    }}>
                      {stat.number}
                    </div>
                    <div className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {t('landing.ctaAvailability')}
        </div>
      </div>
    </section>
  )
}
