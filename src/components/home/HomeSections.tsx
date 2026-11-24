/** Lower homepage sections, CAFU model: "Découvrir" photo cards, app section with phones, FAQ, Flottes banner. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUpRight, Check, Plus } from 'lucide-react'
import { useHomeCopy, openBooking } from './homeCopy'

export function DiscoverSection() {
  const c = useHomeCopy()
  return (
    <section style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: 'var(--mk-action)' }}>{c.discoverEyebrow}</div>
        <h2 className="mk-h2 mb-10">{c.discoverTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {c.discover.map(d => (
            <Link key={d.to} to={d.to} className="mk-discover group">
              <div className="mk-discover-img"><img src={d.img} alt="" loading="lazy" /></div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{d.title}</h3>
                  <span className="mk-round-arrow"><ArrowUpRight size={18} /></span>
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{d.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AppSection() {
  const c = useHomeCopy()
  return (
    <section style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto px-5 py-10 lg:py-16">
        <div className="mk-app-band">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 relative z-10">
              <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: '#062A2E' }}>{c.appEyebrow}</div>
              <h2 className="mk-h2" style={{ color: '#062A2E' }}>{c.appTitle}</h2>
              <p className="mt-3 text-lg font-semibold" style={{ color: 'rgba(6,42,46,0.75)' }}>{c.appSub}</p>
              <ul className="mt-6 space-y-3">
                {c.appPoints.map(p => (
                  <li key={p} className="flex items-center gap-3 text-base font-medium" style={{ color: '#062A2E' }}>
                    <span className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: '#062A2E' }}>
                      <Check size={13} color="#43BCC9" strokeWidth={3} />
                    </span>{p}
                  </li>
                ))}
              </ul>
              <button onClick={() => openBooking()} className="mk-btn-dark mt-8">{c.appCta} <ArrowRight size={18} /></button>
            </div>
            <div className="lg:col-span-6 relative h-[420px] lg:h-[480px]">
              <div className="mk-phone" style={{ left: '8%', top: 40, transform: 'rotate(-6deg)' }}><img src="/app/04-package.jpg" alt="" loading="lazy" /></div>
              <div className="mk-phone" style={{ right: '8%', top: 0, transform: 'rotate(4deg)' }}><img src="/app/01-home.jpg" alt="Application MecaLIK" loading="lazy" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeFAQ() {
  const c = useHomeCopy()
  const { t } = useTranslation()
  const items = [
    { q: c.faq1q, a: c.faq1a },
    { q: c.faq2q, a: c.faq2a },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q12'), a: t('faq.a12') },
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto px-5 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: 'var(--mk-action)' }}>{c.faqEyebrow}</div>
          <h2 className="mk-h2">{c.faqTitle}</h2>
          <Link to="/faq" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold" style={{ color: 'var(--mk-action)' }}>
            {c.faqAll} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="lg:col-span-8 space-y-3">
          {items.map((it, i) => {
            const on = open === i
            return (
              <div key={i} className="mk-faq">
                <button className="w-full flex items-center justify-between gap-4 text-left" onClick={() => setOpen(on ? null : i)} aria-expanded={on}>
                  <span className="text-base lg:text-lg font-semibold text-white">{it.q}</span>
                  <span className="mk-faq-plus" style={{ transform: on ? 'rotate(45deg)' : 'none' }}><Plus size={18} /></span>
                </button>
                {on && <p className="mt-3 text-sm lg:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{it.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FleetBanner() {
  const c = useHomeCopy()
  return (
    <section style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto px-5 pb-20">
        <div className="mk-fleet">
          <img src="/photo-van.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.75) 50%, rgba(8,8,8,0.25) 100%)' }} />
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <img src="/services/flottes.png" alt="" width={40} height={40} />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--mk-premium)' }}>{c.fleetEyebrow}</span>
            </div>
            <h2 className="mk-h2">{c.fleetTitle}</h2>
            <p className="mt-3 text-base lg:text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.fleetSub}</p>
            <Link to="/flottes" className="mk-btn-teal mt-7 inline-flex">{c.fleetCta} <ArrowRight size={18} /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
