import { useState } from 'react'
import {
  ChevronRight, Shield, Clock, FileText,
  CheckCircle, Phone, Mail,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const WA_FLEET =
  'https://wa.me/212777348065?text=' +
  encodeURIComponent(
    "Bonjour MecaLIK, je représente une entreprise et souhaite discuter d'une solution flotte."
  )

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#141414',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '14px',
  padding: '14px 16px',
  outline: 'none',
}
const inputErr: React.CSSProperties = {
  ...inputBase,
  border: '1px solid #FF4444',
}

export default function Fleet() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' })
  const [errors, setErrors] = useState({ name: false, company: false, email: false, phone: false })
  const [submitted, setSubmitted] = useState(false)

  const update = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: false }))
  }

  const handleSubmit = () => {
    const newErrors = {
      name: !formData.name.trim(),
      company: !formData.company.trim(),
      email: !formData.email.trim(),
      phone: !formData.phone.trim(),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    const msg =
      `Bonjour MecaLIK — Demande flotte entreprise\n\n` +
      `Nom: ${formData.name}\n` +
      `Entreprise: ${formData.company}\n` +
      `Email: ${formData.email}\n` +
      `Telephone: ${formData.phone}`
    window.open('https://wa.me/212777348065?text=' + encodeURIComponent(msg), '_blank')
    setSubmitted(true)
  }

  return (
    <>
      <main>

        {/* ── B2B HERO ─────────────────────────────────────────────────── */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden px-6 py-24" style={{ background: '#080808' }}>
          {/* Gold glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(240,192,64,0.06) 0%, transparent 70%)',
              top: '-150px',
              right: '-150px',
              filter: 'blur(120px)',
            }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
                style={{ border: '1px solid rgba(240,192,64,0.3)' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F0C040' }} />
                <span className="text-sm font-medium" style={{ color: '#F0C040' }}>
                  {t('landing.footerFleetsLink')}
                </span>
              </div>

              <h1
                className="font-heading font-bold text-5xl lg:text-6xl mb-6"
                style={{ color: '#ffffff', letterSpacing: '-0.02em', lineHeight: '1.05' }}
              >
                {t('fleet.heroTitle')}
                <br />
                <span style={{ color: '#F0C040' }}>{t('fleet.heroTitleAccent')}</span>
              </h1>

              <p
                className="text-lg mb-10 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '480px' }}
              >
                {t('fleet.heroDesc')}
              </p>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => window.open(WA_FLEET, '_blank')}
                  className="flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-colors duration-200"
                  style={{ background: '#F0C040', color: '#080808' }}
                >
                  {t('fleet.heroCta1')}
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => document.getElementById('fleet-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="font-medium px-8 py-4 rounded-full transition-all duration-200"
                  style={{
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    background: 'transparent',
                  }}
                >
                  {t('fleet.heroCta2')}
                </button>
              </div>
            </div>

            {/* Right — stats card */}
            <div
              className="rounded-2xl p-8"
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="font-heading font-bold text-lg" style={{ color: '#ffffff' }}>
                  {t('fleet.statsTitle')}
                </div>
                <div
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: 'rgba(240,192,64,0.1)',
                    border: '1px solid rgba(240,192,64,0.2)',
                    color: '#F0C040',
                  }}
                >
                  {t('fleet.statsBadge')}
                </div>
              </div>

              {[
                {
                  label: t('fleet.stat1Label'),
                  value: '24',
                  pillBg: 'rgba(0,221,136,0.1)',
                  pillColor: '#00DD88',
                  pillText: t('fleet.stat1Pill'),
                },
                {
                  label: t('fleet.stat2Label'),
                  value: '47',
                  pillBg: 'rgba(67,188,201,0.1)',
                  pillColor: '#43BCC9',
                  pillText: t('fleet.stat2Pill'),
                },
                {
                  label: t('fleet.stat3Label'),
                  value: t('fleet.stat3Value'),
                  pillBg: 'rgba(240,192,64,0.1)',
                  pillColor: '#F0C040',
                  pillText: t('fleet.stat3Pill'),
                },
              ].map((stat, i, arr) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between py-4"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                    <div className="font-heading font-bold text-2xl mt-1" style={{ color: '#ffffff' }}>
                      {stat.value}
                    </div>
                  </div>
                  <div
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: stat.pillBg, color: stat.pillColor }}
                  >
                    {stat.pillText}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── VALUE PROPS ──────────────────────────────────────────────── */}
        <section className="py-20 px-6" style={{ background: '#0A0A0A' }}>
          <div className="max-w-7xl mx-auto">

            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#F0C040' }}>
                {t('fleet.whyTag')}
              </p>
              <h2
                className="font-heading text-4xl font-bold"
                style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
              >
                {t('fleet.whyTitle')}
                <span style={{ color: '#F0C040' }}> {t('fleet.whyTitleAccent')}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Shield size={22} color="#F0C040" />,
                  title: t('fleet.card1Title'),
                  desc: t('fleet.card1Desc'),
                },
                {
                  icon: <Clock size={22} color="#F0C040" />,
                  title: t('fleet.card2Title'),
                  desc: t('fleet.card2Desc'),
                },
                {
                  icon: <FileText size={22} color="#F0C040" />,
                  title: t('fleet.card3Title'),
                  desc: t('fleet.card3Desc'),
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-8"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.15)' }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-3" style={{ color: '#ffffff' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── HOW B2B WORKS ────────────────────────────────────────────── */}
        <section className="py-20 px-6" style={{ background: '#080808' }}>
          <div className="max-w-7xl mx-auto">

            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#F0C040' }}>
                {t('fleet.processTag')}
              </p>
              <h2
                className="font-heading text-4xl font-bold"
                style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
              >
                {t('fleet.processTitle')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { num: '01', title: t('fleet.step1Title'), desc: t('fleet.step1Desc') },
                { num: '02', title: t('fleet.step2Title'), desc: t('fleet.step2Desc') },
                { num: '03', title: t('fleet.step3Title'), desc: t('fleet.step3Desc') },
                { num: '04', title: t('fleet.step4Title'), desc: t('fleet.step4Desc') },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-heading font-bold text-lg"
                    style={{
                      background: 'rgba(240,192,64,0.1)',
                      border: '1px solid rgba(240,192,64,0.25)',
                      color: '#F0C040',
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-heading font-semibold text-base mb-2" style={{ color: '#ffffff' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── B2B CONTACT FORM ─────────────────────────────────────────── */}
        <section id="fleet-form" className="py-20 px-6" style={{ background: '#0A0A0A' }}>
          <div className="max-w-2xl mx-auto">

            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#F0C040' }}>
                {t('fleet.contactTag')}
              </p>
              <h2
                className="font-heading text-4xl font-bold"
                style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
              >
                {t('fleet.contactTitle')}
              </h2>
              <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {t('fleet.contactDesc')}
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle size={48} color="#43BCC9" className="mx-auto mb-4" />
                <h3 className="font-heading font-bold text-2xl mb-2" style={{ color: '#ffffff' }}>
                  {t('fleet.successTitle')}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {t('fleet.successDesc')}
                </p>
                <button
                  onClick={() => window.open(WA_FLEET, '_blank')}
                  className="mt-6 font-semibold px-8 py-4 rounded-full transition-colors duration-200"
                  style={{ background: '#43BCC9', color: '#080808' }}
                >
                  {t('fleet.successWa')}
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl p-8"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t('fleet.formName')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('fleet.formNamePlaceholder')}
                      value={formData.name}
                      onChange={(e) => update('name', e.target.value)}
                      style={errors.name ? inputErr : inputBase}
                    />
                    {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>{t('fleet.formRequired')}</p>}
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t('fleet.formCompany')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('fleet.formCompanyPlaceholder')}
                      value={formData.company}
                      onChange={(e) => update('company', e.target.value)}
                      style={errors.company ? inputErr : inputBase}
                    />
                    {errors.company && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>{t('fleet.formRequired')}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t('fleet.formEmail')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('fleet.formEmailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => update('email', e.target.value)}
                      style={errors.email ? inputErr : inputBase}
                    />
                    {errors.email && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>{t('fleet.formRequired')}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t('fleet.formPhone')}
                    </label>
                    <input
                      type="tel"
                      placeholder="06 XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      style={errors.phone ? inputErr : inputBase}
                    />
                    {errors.phone && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>{t('fleet.formRequired')}</p>}
                  </div>

                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  className="w-full mt-6 flex items-center justify-center gap-2 font-bold py-4 rounded-full transition-colors duration-200 text-sm"
                  style={{ background: '#F0C040', color: '#080808' }}
                >
                  {t('fleet.formSubmit')}
                  <ChevronRight size={18} />
                </button>

                {/* Alt contact */}
                <div
                  className="mt-6 pt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <a
                    href="tel:+212777348065"
                    className="flex items-center gap-2 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    <Phone size={15} color="#43BCC9" />
                    +212 777 348 065
                  </a>
                  <a
                    href="mailto:contact@mecalik.com"
                    className="flex items-center gap-2 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    <Mail size={15} color="#43BCC9" />
                    contact@mecalik.com
                  </a>
                </div>
              </div>
            )}

          </div>
        </section>

      </main>

    </>
  )
}
