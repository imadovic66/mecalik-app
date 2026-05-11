/** Hero section — landing page headline, CTA buttons, mechanic photo, and company trust strip */

import { useTranslation } from 'react-i18next'
import { Clock, ShieldCheck, ArrowRight, Phone, Wallet } from 'lucide-react'

interface Props {
  onBookNow: () => void
}

export default function HeroSection({ onBookNow }: Props) {
  const { t } = useTranslation()
  const techCount = 6

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#080808', overflowX: 'hidden' }}
    >
      {/* Ambient background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute',
          width: '900px', height: '900px',
          borderRadius: '50%',
          top: '-300px', right: '-200px',
          background: 'radial-gradient(circle, rgba(67,188,201,0.10) 0%, rgba(67,188,201,0) 60%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '700px', height: '700px',
          borderRadius: '50%',
          bottom: '-200px', left: '-150px',
          background: 'radial-gradient(circle, rgba(232,102,61,0.06) 0%, rgba(232,102,61,0) 60%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }} />
      </div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-6 pt-4 pb-12 lg:pt-24 lg:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-start">

          {/* Left — editorial copy */}
          <div className="lg:col-span-7 order-2 lg:order-1" style={{ overflowX: 'hidden' }}>

            {/* Live availability eyebrow */}
            <div
              className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full"
              style={{ background: 'rgba(0,221,136,0.06)', border: '1px solid rgba(0,221,136,0.18)' }}
            >
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#00DD88', opacity: 0.6 }} />
                <span className="relative rounded-full w-2 h-2" style={{ background: '#00DD88' }} />
              </span>
              <span className="text-[11px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {techCount} {t('landing.heroAvailable')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="pr-20 lg:pr-0" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(28px, 8vw, 88px)',
              lineHeight: '0.98',
              letterSpacing: '-0.03em',
              color: 'white',
              fontWeight: 600,
              marginBottom: '24px',
            }}>
              <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)', display: 'block' }}>{t('landing.heroTitle1')}</span>
              <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)', display: 'block' }}>{t('landing.heroTitle2')}</span>
              <span style={{
                fontWeight: 700, display: 'block',
                background: 'linear-gradient(90deg, #43BCC9 0%, #5FD1DD 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {t('landing.heroTitle3')}
              </span>
            </h1>

            {/* Subhead */}
            <p className="max-w-xl text-base lg:text-lg leading-relaxed mb-10"
              style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>
              {t('landing.heroSubtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={onBookNow}
                className="group flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm transition-all"
                style={{ background: '#43BCC9', color: '#080808', boxShadow: '0 8px 32px rgba(67,188,201,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,188,201,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,188,201,0.25)' }}
              >
                {t('landing.heroCta')}
                <ArrowRight size={16} className="group-hover:translate-x-0.5" style={{ transition: 'transform 0.2s' }} />
              </button>
              <a
                href="tel:+212777348065"
                className="flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.02)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                <Phone size={15} />
                07 77 34 80 65
              </a>
            </div>

            {/* Trust micro-row */}
            <div className="flex items-center gap-x-6 gap-y-3 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { icon: <Clock size={13} />,       label: t('landing.heroBadge1') },
                { icon: <Wallet size={13} />,      label: t('landing.heroBadge2') },
                { icon: <ShieldCheck size={13} />, label: t('landing.heroBadge3') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs whitespace-nowrap flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: '#43BCC9' }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — photo card */}
          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <div
              className="relative rounded-3xl overflow-hidden w-full aspect-video lg:aspect-[4/5]"
              style={{ maxHeight: '280px', boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              <img
                src="/hero-photo.png"
                alt="Technicien MecaLIK en intervention"
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.05) saturate(1.05)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)' }} />
              <div className="absolute top-4 right-4">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,221,136,0.15)', border: '1px solid rgba(0,221,136,0.3)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00DD88' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#00DD88' }}>{t('landing.heroLive')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company trust strip */}
        <div className="mt-8 lg:mt-10 pt-8 border-t flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="text-xs uppercase tracking-widest flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('landing.trustTitle')}
          </div>
          <div className="lg:hidden text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Casablanca Finance City · Royal Air Maroc · OCP Group · BMCE Bank · Inwi
          </div>
          <div className="hidden lg:flex items-center gap-x-10 gap-y-3 flex-wrap" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {['Casablanca Finance City', 'Royal Air Maroc', 'OCP Group', 'BMCE Bank', 'Inwi'].map(name => (
              <span key={name} className="text-sm font-medium tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  )
}
