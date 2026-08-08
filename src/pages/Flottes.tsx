import { useTranslation } from 'react-i18next'

export default function Flottes() {
  const { t } = useTranslation()

  return (
    <main style={{ background: '#0A0A0A', color: 'white', fontFamily: 'Outfit, sans-serif', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Hero */}
      <section style={{ padding: '80px 5% 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)', borderRadius: '100px', padding: '6px 16px', marginBottom: '24px', fontSize: '12px', color: 'var(--mk-premium)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {t('flottes.pageTitle')}
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, marginBottom: '20px', lineHeight: 1.1 }}>
          {t('flottes.pageSubtitle')}
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: 1.7, marginBottom: '36px' }}>
          {t('flottes.pageDesc')}
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a href="https://wa.me/212777348065" style={{ background: 'var(--mk-action)', color: '#0A0A0A', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none' }}>
            {t('flottes.ctaContact')}
          </a>
          <a href="mailto:contact@mecalik.com" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '14px 28px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none' }}>
            {t('flottes.ctaDemo')}
          </a>
        </div>
      </section>

      {/* Problems */}
      <section style={{ padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>{t('flottes.problemTitle')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '16px' }}>
          {[t('flottes.problem1'), t('flottes.problem2'), t('flottes.problem3'), t('flottes.problem4')].map((p, i) => (
            <div key={i} style={{ background: 'var(--mk-urgent-faint)', border: '1px solid var(--mk-urgent-dim)', borderRadius: '14px', padding: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--mk-urgent)', fontSize: '18px', marginTop: '2px' }}>✗</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section style={{ padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>{t('flottes.solutionTitle')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '24px' }}>
          {[
            { title: t('flottes.solution1Title'), desc: t('flottes.solution1Desc') },
            { title: t('flottes.solution2Title'), desc: t('flottes.solution2Desc') },
            { title: t('flottes.solution3Title'), desc: t('flottes.solution3Desc') },
            { title: t('flottes.solution4Title'), desc: t('flottes.solution4Desc') },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(67,188,201,0.05)', border: '1px solid rgba(67,188,201,0.15)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(67,188,201,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--mk-action)', fontWeight: 800 }}>{i + 1}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '10px', fontSize: '17px' }}>{s.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '15px' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '60px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '40px', textAlign: 'center' }}>{t('flottes.plansTitle')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '24px' }}>
          {[
            {
              title: t('flottes.planStartTitle'),
              vehicles: t('flottes.planStartVehicles'),
              features: [t('flottes.planStartF1'), t('flottes.planStartF2'), t('flottes.planStartF3'), t('flottes.planStartF4')],
              accent: 'rgba(255,255,255,0.04)',
              border: 'rgba(255,255,255,0.1)',
              color: 'white',
            },
            {
              title: t('flottes.planProTitle'),
              vehicles: t('flottes.planProVehicles'),
              features: [t('flottes.planProF1'), t('flottes.planProF2'), t('flottes.planProF3'), t('flottes.planProF4')],
              accent: 'rgba(67,188,201,0.06)',
              border: 'rgba(67,188,201,0.25)',
              color: 'var(--mk-action)',
            },
            {
              title: t('flottes.planEnterpriseTitle'),
              vehicles: t('flottes.planEnterpriseVehicles'),
              features: [t('flottes.planEntF1'), t('flottes.planEntF2'), t('flottes.planEntF3'), t('flottes.planEntF4')],
              accent: 'rgba(240,192,64,0.06)',
              border: 'rgba(240,192,64,0.25)',
              color: 'var(--mk-premium)',
            },
          ].map((plan, i) => (
            <div key={i} style={{ background: plan.accent, border: `1px solid ${plan.border}`, borderRadius: '20px', padding: '32px' }}>
              <div style={{ color: plan.color, fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{plan.title}</div>
              <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '24px', color: 'rgba(255,255,255,0.7)' }}>{plan.vehicles}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: plan.color }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '28px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Sur devis / On quote</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 5%', textAlign: 'center', background: 'rgba(240,192,64,0.03)' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>{t('flottes.contactTitle')}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '36px', fontSize: '18px', maxWidth: '500px', margin: '0 auto 36px' }}>{t('flottes.contactDesc')}</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://wa.me/212777348065" style={{ background: 'var(--mk-action)', color: '#0A0A0A', padding: '16px 36px', borderRadius: '14px', fontWeight: 800, textDecoration: 'none' }}>
            {t('flottes.contactCta')}
          </a>
          <a href="mailto:contact@mecalik.com" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '16px 36px', borderRadius: '14px', fontWeight: 700, textDecoration: 'none' }}>
            {t('flottes.contactEmail')}
          </a>
        </div>
      </section>

    </main>
  )
}
