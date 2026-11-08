/** Hero — CAFU model: big headline with a rotating service word, two CTAs (book / breakdown),
 *  a rounded photo card with floating chips, then the zones strip. */
import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useHomeCopy, openBooking } from './homeCopy'

const ZONES = ['Maârif', 'Gauthier', 'Bourgogne', 'Ain Diab', 'Sidi Maârouf', 'Bouskoura', 'Lissasfa', 'Californie', 'Anfa', 'Racine']

export default function HomeHero({ diagFrom }: { diagFrom: string | null }) {
  const c = useHomeCopy()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % c.heroWords.length), 2400)
    return () => clearInterval(id)
  }, [c.heroWords.length])

  return (
    <section className="relative overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', top: -380, right: -260,
          background: 'radial-gradient(circle, rgba(67,188,201,0.16) 0%, rgba(67,188,201,0) 62%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 pt-28 pb-10 lg:pt-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-6">
            <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-5" style={{ color: 'var(--mk-action)' }}>{c.heroEyebrow}</div>
            <h1 className="mk-hero-title">
              {c.heroBefore}{' '}
              <span className="mk-rotator" aria-live="polite">
                <span key={i} className="mk-rotator-word">{c.heroWords[i]}</span>
              </span>
              <br />{c.heroAfter}
            </h1>
            <p className="mt-6 text-base lg:text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.heroSub}</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button onClick={() => openBooking()} className="mk-btn-teal">
                {c.book} <ArrowRight size={18} />
              </button>
              <button onClick={() => openBooking('urgence')} className="mk-btn-red">
                <span className="mk-dot-red" /> {c.panne}
              </button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {c.trust.map(t => (
                <li key={t} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span className="flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: 'rgba(67,188,201,0.15)' }}>
                    <Check size={12} color="#43BCC9" strokeWidth={3} />
                  </span>{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Photo card */}
          <div className="lg:col-span-6 relative">
            <div className="relative overflow-hidden" style={{ borderRadius: 32, aspectRatio: '5 / 4', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <img src="/hero-photo.png" alt="Équipe et camionnette MecaLIK" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
            </div>
            <div className="mk-float-chip" style={{ left: -12, bottom: 36 }}>
              <img src="/services/diagnostic.png" alt="" width={40} height={40} />
              <div>
                <div className="text-sm font-bold" style={{ color: '#0F1419' }}>{c.heroChip1}</div>
                <div className="text-xs" style={{ color: '#5B6470' }}>{diagFrom ? `${c.from} ${diagFrom}` : c.onQuote}</div>
              </div>
            </div>
            <div className="mk-float-chip mk-chip-desk" style={{ right: -10, top: 28 }}>
              <img src="/services/voiture.png" alt="" width={36} height={36} />
              <div className="text-sm font-bold" style={{ color: '#0F1419' }}>{c.heroChip2}</div>
            </div>
          </div>
        </div>

        {/* Zones */}
        <div className="mt-14 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] mr-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.zones}</span>
          {ZONES.map(z => (
            <span key={z} className="text-xs px-3 py-1.5 rounded-full" style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>{z}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
