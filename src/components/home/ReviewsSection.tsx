/** Reviews section — 5 customer testimonials in asymmetric grid + live activity ticker */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const ACTIVITY_IDS = [
  { serviceId: 'vidange',    location: 'Hay Hassani, Casablanca', time: '6 min' },
  { serviceId: 'batterie',   location: 'Ain Diab',      time: '11 min' },
  { serviceId: 'lavage',     location: 'Anfa',          time: '18 min' },
  { serviceId: 'diagnostic', location: 'Bourgogne',     time: '23 min' },
  { serviceId: 'pneus',      location: 'CIL',           time: '31 min' },
  { serviceId: 'urgence',    location: 'Hay Hassani',   time: '42 min' },
  { serviceId: 'vidande',    location: 'Sidi Maarouf',  time: '55 min' },
]

function LiveActivityTicker() {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ACTIVITY_IDS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const activity = ACTIVITY_IDS[currentIndex]

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(67,188,201,0.04)', border: '1px solid rgba(67,188,201,0.12)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#43BCC9', opacity: 0.5 }} />
          <span className="relative rounded-full w-2 h-2" style={{ background: '#43BCC9' }} />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#43BCC9' }}>
          {t('landing.reviewLiveActivity')}
        </span>
      </div>
      <div key={currentIndex} style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="text-sm font-medium mb-0.5" style={{ color: 'white' }}>
          {t('services.' + activity.serviceId)}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {activity.location}, Casablanca
        </div>
        <div className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {t('landing.reviewDaysAgo')} {activity.time}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

const StarRow = ({ count, size = 16 }: { count: number; size?: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: count }, (_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#F0C040">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
)

export default function ReviewsSection() {
  const { t, i18n } = useTranslation()
  const isFr = i18n.language === 'fr'

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(67,188,201,0.3), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium" style={{ color: '#43BCC9' }}>
            {t('landing.reviewsTag')}
          </div>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '1.05',
            letterSpacing: '-0.025em', color: 'white', fontWeight: 700,
          }}>
            {t('landing.reviewsTitle')}
          </h2>
        </div>

        {/* Asymmetric testimonials grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

          {/* Large featured testimonial — Amine Cherkaoui */}
          <div className="lg:col-span-5 rounded-2xl p-8"
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}>
            <StarRow count={5} size={16} />
            <blockquote className="text-lg lg:text-xl leading-relaxed mb-8 mt-5"
              style={{ color: 'rgba(255,255,255,0.88)', fontStyle: 'italic' }}>
              &ldquo;{isFr
                ? "J'avais une panne de batterie à 22h devant Carrefour Maarif. Le technicien est arrivé en 18 minutes. Professionnel, rapide, prix correct."
                : "Had a battery breakdown at 10pm outside Carrefour Maarif. Technician arrived in 18 minutes. Professional, fast, fair price."
              }&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                AC
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'white' }}>Amine Cherkaoui</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Maarif, Casablanca · {isFr ? 'il y a 2 jours' : '2 days ago'} · {t('services.batterie')}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.2)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00DD88" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                <span className="text-[10px] font-semibold" style={{ color: '#00DD88' }}>{t('landing.reviewVerified')}</span>
              </div>
            </div>
          </div>

          {/* Right column — 2 stacked */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Fatima-Zahra Bennis */}
            <div className="rounded-2xl p-7 flex-1" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}>
              <StarRow count={5} size={14} />
              <blockquote className="text-sm leading-relaxed mb-6 mt-4" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                &ldquo;{isFr
                  ? "Vidange faite à domicile un samedi matin. Le technicien est venu avec tout le matériel, n'a rien laissé traîner. Je recommande."
                  : "Oil change done at home on a Saturday morning. Technician came fully equipped, left everything clean. Highly recommend."
                }&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9' }}>FB</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'white' }}>Fatima-Zahra Bennis</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Ain Diab · {isFr ? 'il y a 1 semaine' : '1 week ago'} · {t('services.vidange')}
                  </div>
                </div>
              </div>
            </div>

            {/* Rachid Benhaddou */}
            <div className="rounded-2xl p-7 flex-1" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}>
              <StarRow count={5} size={14} />
              <blockquote className="text-sm leading-relaxed mb-6 mt-4" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                &ldquo;{isFr
                  ? "Diagnostic complet en moins d'une heure. Le technicien a expliqué chaque point, pas de jargon inutile. Vraiment utile."
                  : "Full diagnostic in under an hour. The technician explained every point clearly, no unnecessary jargon. Really helpful."
                }&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9' }}>RB</div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'white' }}>Rachid Benhaddou</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Bourgogne · {isFr ? 'il y a 5 jours' : '5 days ago'} · {t('services.diagnostic')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Far right — 1 tall review + live ticker */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="rounded-2xl p-6 flex-1" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}>
              <StarRow count={5} size={12} />
              <blockquote className="text-sm leading-relaxed mb-5 mt-4" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                &ldquo;{isFr
                  ? "Service fleet pour notre entreprise. 4 véhicules entretenus régulièrement, facturation claire, aucune surprise."
                  : "Fleet service for our company. 4 vehicles regularly maintained, clear invoicing, no surprises."
                }&rdquo;
              </blockquote>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(240,192,64,0.15)', color: '#F0C040' }}>MT</div>
                <div>
                  <div className="text-xs font-medium" style={{ color: 'white' }}>Mehdi Tazi</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Sidi Maarouf · {isFr ? 'il y a 3 semaines' : '3 weeks ago'} · {isFr ? 'Flotte B2B' : 'B2B Fleet'}
                  </div>
                </div>
              </div>
            </div>
            <LiveActivityTicker />
          </div>
        </div>
      </div>
    </section>
  )
}
