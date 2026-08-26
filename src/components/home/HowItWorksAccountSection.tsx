/** Account benefits section — sits right after the guest "Trois étapes" flow.
 *  Promotes account creation (register vehicles, full service history,
 *  product traceability, real-time tracking). 4 benefit cards + bottom step strip. */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CARDS = [
  { icon: '🚗', titleKey: 'landing.accountCard1Title', descKey: 'landing.accountCard1Desc' },
  { icon: '🔧', titleKey: 'landing.accountCard2Title', descKey: 'landing.accountCard2Desc' },
  { icon: '🛢️', titleKey: 'landing.accountCard3Title', descKey: 'landing.accountCard3Desc' },
  { icon: '📲', titleKey: 'landing.accountCard4Title', descKey: 'landing.accountCard4Desc' },
]

const STEPS = [
  { num: '01', key: 'landing.accountStep1' },
  { num: '02', key: 'landing.accountStep2' },
  { num: '03', key: 'landing.accountStep3' },
]

export default function HowItWorksAccountSection() {
  const { t } = useTranslation()

  return (
    <section style={{
      padding: '100px 0',
      background: 'linear-gradient(180deg, #0A0A0A 0%, #0d1117 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle teal glow top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(67,188,201,0.4), transparent)',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>

        {/* Section label */}
        <p style={{
          fontSize: '12px', fontWeight: 700, color: 'var(--mk-action)',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px',
        }}>
          {t('landing.accountSectionLabel')}
        </p>

        {/* Section headline */}
        <div className="flex-col lg:flex-row" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: '64px', gap: '40px', flexWrap: 'wrap',
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800,
            color: 'white', lineHeight: 1.1, margin: 0, maxWidth: '560px',
          }}>
            {t('landing.accountSectionTitle')}
            <br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t('landing.accountSectionSubtitle')}
            </span>
          </h2>
          <p style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
            maxWidth: '400px', margin: 0,
          }}>
            {t('landing.accountSectionDesc')}
          </p>
        </div>

        {/* 4 benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{
          display: 'grid', gap: '16px', marginBottom: '80px',
        }}>
          {CARDS.map((card, i) => (
            <div key={i} style={{
              padding: '28px 24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(67,188,201,0.1)',
                border: '1px solid rgba(67,188,201,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '16px',
              }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                {t(card.titleKey)}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
                {t(card.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '32px 40px',
          background: 'rgba(67,188,201,0.05)',
          border: '1px solid rgba(67,188,201,0.15)',
          borderRadius: '16px',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          {/* Left: steps */}
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(67,188,201,0.15)',
                  border: '1px solid rgba(67,188,201,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800, color: 'var(--mk-action)', flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                  {t(step.key)}
                </span>
              </div>
            ))}
          </div>

          {/* Right: CTA button — routes to /signup (the actual register route) */}
          <Link
            to="/signup"
            style={{
              padding: '14px 28px', borderRadius: '10px',
              background: 'var(--mk-action)', color: '#0A0A0A',
              fontSize: '14px', fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '8px',
              flexShrink: 0,
            }}
          >
            {t('landing.accountCta')}
            <span style={{ fontSize: '16px' }}>→</span>
          </Link>
        </div>

      </div>
    </section>
  )
}
