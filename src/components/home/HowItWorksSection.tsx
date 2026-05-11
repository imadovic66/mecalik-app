/** How it works section — 3 numbered steps (book, get quote, service) + photo strip */

import { useTranslation } from 'react-i18next'
import {
  ArrowDownRight, CheckCircle2, Smartphone,
  MessageSquare, Wrench, ArrowRight,
} from 'lucide-react'

interface Props {
  onBookNow: () => void
}

export default function HowItWorksSection({ onBookNow }: Props) {
  const { t } = useTranslation()

  return (
    <>
      <section className="relative py-16 lg:py-20" style={{ background: '#080808' }}>

        {/* Large decorative background number */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute', top: '15%', left: '-2%',
            fontSize: 'clamp(280px, 30vw, 480px)', fontWeight: 800,
            color: 'rgba(255,255,255,0.015)', lineHeight: 0.8,
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.05em', userSelect: 'none',
          }}>
            03
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">

          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 lg:mb-12">
            <div className="lg:col-span-5">
              <div className="text-xs uppercase tracking-[0.2em] mb-5 font-medium" style={{ color: '#43BCC9' }}>
                {t('landing.howTitle')}
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: '1.02',
                letterSpacing: '-0.025em', color: 'white', fontWeight: 700,
              }}>
                {t('landing.howHeadline1')}<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>{t('landing.howHeadline2')}</span>
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-6">
              <p className="text-base lg:text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {t('landing.howDesc')}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <ArrowDownRight size={16} style={{ color: '#43BCC9' }} />
                {t('landing.howScroll')}
              </div>
            </div>
          </div>

          <div className="space-y-10 lg:space-y-16">

            {/* STEP 01 — Book */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>01</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    {t('landing.step1Time')}
                  </div>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(28px, 3.2vw, 40px)', lineHeight: '1.1', color: 'white', fontWeight: 600, marginBottom: '20px', letterSpacing: '-0.02em' }}>
                  {t('landing.howStep1Title')}
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t('landing.step1Desc3')}
                </p>
                <div className="space-y-3">
                  {[t('landing.step1Feature1'), t('landing.step1Feature2'), t('landing.step1Feature3')].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', padding: '32px', overflowX: 'hidden' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.2)' }}>
                      <Smartphone size={18} style={{ color: '#43BCC9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>{t('landing.step1FormTitle')}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('landing.step1FormVia')}</div>
                    </div>
                  </div>
                  {[
                    { label: t('landing.step1FormService'), value: t('services.vidange') },
                    { label: t('landing.step1FormCar'),     value: 'Dacia Logan 2019' },
                    { label: t('landing.step1FormAddress'), value: 'Maarif, Casablanca' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</span>
                      <span className="text-sm font-medium" style={{ color: 'white' }}>{row.value}</span>
                    </div>
                  ))}
                  <button
                    onClick={onBookNow}
                    className="w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: '#43BCC9', color: '#080808' }}>
                    {t('landing.step1FormSend')}
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 02 — Get quote */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5 order-1">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', padding: '32px', overflowX: 'hidden' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,221,136,0.1)', border: '1px solid rgba(0,221,136,0.2)' }}>
                      <MessageSquare size={18} style={{ color: '#00DD88' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>{t('landing.step1FormQuote')}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00DD88' }} />
                        <span className="text-xs" style={{ color: '#00DD88' }}>{t('landing.step1QuoteLabel')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('landing.quoteDetail')}</div>
                    {[
                      { labelKey: 'landing.quoteLabour',    value: '180 MAD' },
                      { labelKey: 'landing.quoteMotorOil',  value: '220 MAD' },
                      { labelKey: 'landing.quoteOilFilter', value: '45 MAD' },
                      { labelKey: 'landing.quoteTravel',    value: '0 MAD' },
                    ].map(row => (
                      <div key={row.labelKey} className="flex justify-between py-1.5">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(row.labelKey)}</span>
                        <span className="text-sm font-medium" style={{ color: row.value === '0 MAD' ? '#00DD88' : 'white' }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="text-sm font-bold" style={{ color: 'white' }}>{t('landing.quoteTotalTTC')}</span>
                      <span className="text-base font-bold" style={{ color: '#43BCC9' }}>445 MAD</span>
                    </div>
                  </div>
                  <div className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('landing.quoteGuaranteed')}</div>
                </div>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 order-2">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>02</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    &lt; 5 minutes
                  </div>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(28px, 3.2vw, 40px)', lineHeight: '1.1', color: 'white', fontWeight: 600, marginBottom: '20px', letterSpacing: '-0.02em' }}>
                  {t('landing.howStep2Title')}
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t('landing.step3QuoteDesc')}
                </p>
                <div className="space-y-3">
                  {[t('landing.step3Feature1'), t('landing.step3Feature2'), t('landing.step3Feature3')].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 03 — Service at your location */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>03</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    &lt; 90 min
                  </div>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(28px, 3.2vw, 40px)', lineHeight: '1.1', color: 'white', fontWeight: 600, marginBottom: '20px', letterSpacing: '-0.02em' }}>
                  {t('landing.howStep3Title')}
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t('landing.step2Desc2')}
                </p>
                <div className="space-y-3 mb-10">
                  {[t('landing.step3Feature1b'), t('landing.step3Feature2b'), t('landing.step3Feature3b')].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onBookNow}
                  className="flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm transition-all"
                  style={{ background: '#43BCC9', color: '#080808', boxShadow: '0 8px 32px rgba(67,188,201,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,188,201,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,188,201,0.2)')}
                >
                  {t('landing.step3Cta')}
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img
                    src="/photo-intervention.jpg"
                    alt="Technicien MecaLIK en intervention"
                    className="w-full object-cover"
                    style={{ aspectRatio: '4/3' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 55%)' }} />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wrench size={11} style={{ color: '#43BCC9' }} />
                        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {t('landing.step3TechLabel')}
                        </span>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>{t('landing.step3StatusLabel')}</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ background: 'rgba(0,221,136,0.15)', border: '1px solid rgba(0,221,136,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00DD88' }} />
                      <span className="text-[10px] font-bold" style={{ color: '#00DD88' }}>{t('landing.step3DoneLabel')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Photo strip */}
      <section className="py-0 overflow-hidden">
        <div className="grid grid-cols-2 h-72 lg:h-96">
          <div className="relative overflow-hidden">
            <img src="/photo-casablanca.jpg" alt="MecaLIK Casablanca" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-heading font-bold text-white text-xl">Casablanca</div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm mt-1">{t('landing.mapTitle')}</div>
            </div>
          </div>
          <div className="relative overflow-hidden">
            <img src="/photo-van.jpg" alt="MecaLIK Van" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-heading font-bold text-white text-xl">{t('landing.fleetTitle2')}</div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm mt-1">{t('landing.fleetSubtitle2')}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
