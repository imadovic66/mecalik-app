import { ChevronRight, Target, Zap, Heart, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  const values = [
    {
      icon: <Target size={20} color="var(--mk-action)" />,
      titleKey: 'about.value1Title',
      descKey:  'about.value1Desc',
    },
    {
      icon: <Zap size={20} color="var(--mk-action)" />,
      titleKey: 'about.value2Title',
      descKey:  'about.value2Desc',
    },
    {
      icon: <Heart size={20} color="var(--mk-action)" />,
      titleKey: 'about.value3Title',
      descKey:  'about.value3Desc',
    },
    {
      icon: <TrendingUp size={20} color="var(--mk-action)" />,
      titleKey: 'about.value4Title',
      descKey:  'about.value4Desc',
    },
  ]

  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: '#080808' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67,188,201,0.05) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
            filter: 'blur(100px)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: 'var(--mk-action)' }}
          >
            {t('about.historyTag')}
          </p>
          <h1
            className="font-heading font-bold text-5xl lg:text-6xl mb-6 leading-tight"
            style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            {t('about.headline1')}
            <br />
            <span style={{ color: 'var(--mk-action)' }}>{t('about.headline2')}</span>
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {t('about.intro')}
          </p>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <div>
            <h2
              className="font-heading font-bold text-3xl mb-6"
              style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
            >
              {t('about.whyTitle')}
            </h2>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('about.whyDesc')}
            </p>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('about.solution')}
            </p>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('about.ambition')}
            </p>

            <div
              className="mt-8 pl-6"
              style={{ borderLeft: '2px solid var(--mk-action)' }}
            >
              <p
                className="font-heading font-semibold text-xl leading-relaxed"
                style={{ color: '#ffffff' }}
              >
                {t('about.tagline')}
              </p>
            </div>
          </div>

          {/* Right — stats */}
          <div
            className="rounded-2xl p-8"
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { value: '2 800+', labelKey: 'about.stat1Label' },
              { value: '< 90 min', labelKey: 'about.stat2Label' },
              { value: '4,9 / 5',  labelKey: 'about.stat3Label' },
              { value: '100%',     labelKey: 'about.stat4Label' },
            ].map((stat, i, arr) => (
              <div
                key={stat.labelKey}
                className="py-5"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div className="font-heading font-bold text-3xl" style={{ color: 'var(--mk-action)' }}>
                  {stat.value}
                </div>
                <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4 text-center"
            style={{ color: 'var(--mk-action)' }}
          >
            {t('about.valuesTitle')}
          </p>
          <h2
            className="font-heading font-bold text-4xl text-center mb-16"
            style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            {t('about.valuesSubtitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val) => (
              <div
                key={val.titleKey}
                className="rounded-2xl p-7 transition-all duration-300"
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{
                    background: 'rgba(67,188,201,0.08)',
                    border: '1px solid rgba(67,188,201,0.15)',
                  }}
                >
                  {val.icon}
                </div>
                <h3 className="font-heading font-semibold text-base mb-2" style={{ color: '#ffffff' }}>
                  {t(val.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t(val.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ background: '#0A0A0A' }}>
        <h2
          className="font-heading font-bold text-4xl mb-4"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          {t('about.ctaTitle')}
        </h2>
        <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t('about.ctaDesc')}
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
          className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full transition-colors duration-200"
          style={{ background: 'var(--mk-action)', color: '#080808' }}
        >
          {t('about.ctaButton')}
          <ChevronRight size={18} />
        </button>
      </section>

    </main>
  )
}
