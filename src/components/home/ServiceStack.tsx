/** Services — CAFU model: a tab row, then one big gradient card per service that stacks while you scroll.
 *  Teal for regular services, red for urgence, grey for the ones not open yet. Prices come from the live catalogue. */
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useHomeCopy, openBooking, SERVICE_ORDER, BOOKABLE, type ServiceKey } from './homeCopy'

const GRAD: Record<'teal' | 'red' | 'grey', string> = {
  teal: 'linear-gradient(135deg, #2BA4B1 0%, #157883 55%, #0C4E56 100%)',
  red: 'linear-gradient(135deg, #E5484D 0%, #B8292E 55%, #7E1A1E 100%)',
  grey: 'linear-gradient(135deg, #24282D 0%, #1A1D21 100%)',
}

export default function ServiceStack({ prices }: { prices: Partial<Record<ServiceKey, string>> }) {
  const c = useHomeCopy()
  const [active, setActive] = useState<ServiceKey>('vidange')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const tabsRef = useRef<HTMLDivElement | null>(null)

  // Keep the active tab visible in the (horizontally scrollable) tab row on phones
  useEffect(() => {
    const box = tabsRef.current
    const btn = box?.querySelector<HTMLElement>('.is-on')
    if (box && btn) box.scrollTo({ left: btn.offsetLeft - 8, behavior: 'smooth' })
  }, [active])

  // Highlight the tab of the card currently on top of the stack
  useEffect(() => {
    const onScroll = () => {
      let cur: ServiceKey = SERVICE_ORDER[0]
      SERVICE_ORDER.forEach((k, idx) => {
        const el = refs.current[k]
        if (el && el.getBoundingClientRect().top <= 150 + idx * 14 + 80) cur = k
      })
      setActive(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (k: ServiceKey) => {
    const el = refs.current[k]
    if (!el?.parentElement) return
    const idx = SERVICE_ORDER.indexOf(k)
    // Sticky cards: compute the card's natural position (previous cards' heights + gaps)
    let y = el.parentElement.getBoundingClientRect().top + window.scrollY + 24
    for (let j = 0; j < idx; j++) y += (refs.current[SERVICE_ORDER[j]]?.offsetHeight ?? 0) + 24
    window.scrollTo({ top: y - (150 + idx * 14), behavior: 'smooth' })
  }

  return (
    <section id="services" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto px-5 pt-16 lg:pt-24">
        <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4" style={{ color: 'var(--mk-action)' }}>{c.servicesEyebrow}</div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <h2 className="mk-h2">{c.servicesTitle}</h2>
          <p className="max-w-md text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.servicesSub}</p>
        </div>
      </div>

      {/* Tab row (sticks under the menu) */}
      <div className="sticky z-30 mt-8" style={{ top: 72 }}>
        <div className="max-w-6xl mx-auto px-5">
          <div ref={tabsRef} className="mk-tabs scrollbar-hide">
            {SERVICE_ORDER.map(k => (
              <button key={k} onClick={() => go(k)} className={`mk-tab ${active === k ? 'is-on' : ''} ${BOOKABLE[k] ? '' : 'is-soon'}`}>
                <img src={`/services/${k}.png`} alt="" width={26} height={26} />
                <span>{c.svc[k].name}</span>
                {!BOOKABLE[k] && <em>{c.soon}</em>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked cards */}
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-20">
        {SERVICE_ORDER.map((k, idx) => {
          const s = c.svc[k]
          const open = BOOKABLE[k]
          const tone = k === 'urgence' ? 'red' : open ? 'teal' : 'grey'
          const price = k === 'urgence' ? c.onQuote : prices[k] ? `${c.from} ${prices[k]}` : null
          return (
            <div key={k} ref={el => { refs.current[k] = el }} className="mk-stack-card"
              style={{ top: 150 + idx * 14, background: GRAD[tone], marginBottom: 24 }}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full">
                <div className="md:col-span-7 order-2 md:order-1">
                  <span className="mk-card-tag">{k === 'urgence' && <span className="mk-dot-white" />}{s.tag}</span>
                  <h3 className="mk-card-title">{s.name}</h3>
                  <p className="mt-3 text-base lg:text-lg leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.82)' }}>{s.desc}</p>
                  {s.points.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {s.points.map(p => (
                        <li key={p} className="flex items-center gap-2.5 text-sm lg:text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          <Check size={16} strokeWidth={3} color="white" />{p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    {open ? (
                      <button onClick={() => openBooking(k)} className="mk-btn-white">
                        {k === 'urgence' ? c.urgentCta : c.book} <ArrowRight size={18} />
                      </button>
                    ) : (
                      <span className="mk-btn-white is-disabled">{c.soon}</span>
                    )}
                    {price && <span className="text-lg font-bold text-white">{price}</span>}
                  </div>
                </div>
                <div className="md:col-span-5 order-1 md:order-2 flex md:justify-center">
                  <div className="mk-card-art">
                    <img src={`/services/${k}.png`} alt="" style={{ opacity: open ? 1 : 0.55 }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
