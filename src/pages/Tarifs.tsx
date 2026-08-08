import { useTranslation } from 'react-i18next'

export default function Tarifs() {
  const { t } = useTranslation()

  const services = [
    { name: t('tarifs.lavage'),      range: t('tarifs.lavageRange'),      duration: t('tarifs.lavageDuration') },
    { name: t('tarifs.vidange'),     range: t('tarifs.vidangeRange'),     duration: t('tarifs.vidangeDuration') },
    { name: t('tarifs.batterie'),    range: t('tarifs.batterieRange'),    duration: t('tarifs.batterieDuration') },
    { name: t('tarifs.pneus'),       range: t('tarifs.pneusRange'),       duration: t('tarifs.pneusDuration') },
    { name: t('tarifs.diagnostic'),  range: t('tarifs.diagnosticRange'),  duration: t('tarifs.diagnosticDuration') },
    { name: t('tarifs.urgence'),     range: t('tarifs.urgenceRange'),     duration: t('tarifs.urgenceDuration') },
  ]

  return (
    <main style={{ background: '#0A0A0A', color: 'white', fontFamily: 'Outfit, sans-serif', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Hero */}
      <section style={{ padding: '80px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.3)', borderRadius: '100px', padding: '6px 16px', marginBottom: '24px', fontSize: '12px', color: 'var(--mk-action)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t('tarifs.pageTitle')}
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>
          {t('tarifs.pageSubtitle')}
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: 1.7 }}>
          {t('tarifs.howDesc')}
        </p>
      </section>

      {/* How it works - 4 steps */}
      <section style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '40px' }}>{t('tarifs.howTitle')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '24px' }}>
          {[t('tarifs.step1'), t('tarifs.step2'), t('tarifs.step3'), t('tarifs.step4')].map((step, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '36px', height: '36px', background: 'var(--mk-action)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '16px', color: '#0A0A0A' }}>{i + 1}</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee */}
      <section style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.2)', borderRadius: '20px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '28px', color: 'var(--mk-action)' }}>{t('tarifs.guaranteeTitle')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '16px' }}>
            {[t('tarifs.guarantee1'), t('tarifs.guarantee2'), t('tarifs.guarantee3'), t('tarifs.guarantee4')].map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--mk-action)', fontSize: '20px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price table */}
      <section style={{ padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>{t('tarifs.rangeTitle')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>{t('tarifs.rangeSubtitle')}</p>
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', background: 'rgba(255,255,255,0.05)', padding: '14px 24px', fontWeight: 600, fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <span>{t('tarifs.serviceCol')}</span>
            <span>{t('tarifs.rangeCol')}</span>
            <span>{t('tarifs.durationCol')}</span>
          </div>
          {services.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', padding: '18px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <span style={{ color: 'var(--mk-action)', fontWeight: 700 }}>{s.range}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{s.duration}</span>
            </div>
          ))}
        </div>
      </section>

      {/* B2B */}
      <section style={{ padding: '40px 5% 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)', borderRadius: '20px', padding: '40px', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: 'var(--mk-premium)' }}>{t('tarifs.b2bTitle')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{t('tarifs.b2bDesc')}</p>
          </div>
          <a href="https://wa.me/212777348065" style={{ background: 'var(--mk-premium)', color: '#0A0A0A', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {t('tarifs.b2bCta')}
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 5%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>{t('tarifs.ctaTitle')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontSize: '18px' }}>{t('tarifs.ctaDesc')}</p>
        <a href="https://wa.me/212777348065" style={{ background: 'var(--mk-action)', color: '#0A0A0A', padding: '16px 36px', borderRadius: '14px', fontWeight: 800, textDecoration: 'none', fontSize: '16px' }}>
          {t('tarifs.ctaButton')}
        </a>
      </section>

    </main>
  )
}
