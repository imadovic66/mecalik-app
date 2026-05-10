import { Droplets, Battery, Wrench, Search, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ServiceId = 'lavage' | 'vidange' | 'batterie' | 'pneus' | 'diagnostic' | 'urgence'

const iconMap: Record<string, ReactNode> = {
  Droplets: <Droplets size={22} />,
  Battery: <Battery size={22} />,
  Wrench: <Wrench size={22} />,
  Search: <Search size={22} />,
  AlertTriangle: <AlertTriangle size={22} />,
}

type ServiceDef = {
  id: ServiceId
  icon: string
  color: string
  duration: string
  includesKeys: string[]
}

const serviceDefs: ServiceDef[] = [
  {
    id: 'lavage',
    icon: 'Droplets',
    color: '#43BCC9',
    duration: '~45 min',
    includesKeys: ['lavageI1', 'lavageI2', 'lavageI3', 'lavageI4', 'lavageI5'],
  },
  {
    id: 'vidange',
    icon: 'Droplets',
    color: '#43BCC9',
    duration: '~60 min',
    includesKeys: ['vidangeI1', 'vidangeI2', 'vidangeI3', 'vidangeI4', 'vidangeI5'],
  },
  {
    id: 'batterie',
    icon: 'Battery',
    color: '#43BCC9',
    duration: '~30 min',
    includesKeys: ['batterieI1', 'batterieI2', 'batterieI3', 'batterieI4', 'batterieI5'],
  },
  {
    id: 'pneus',
    icon: 'Wrench',
    color: '#43BCC9',
    duration: '~45 min',
    includesKeys: ['pneusI1', 'pneusI2', 'pneusI3', 'pneusI4', 'pneusI5'],
  },
  {
    id: 'diagnostic',
    icon: 'Search',
    color: '#43BCC9',
    duration: '~30 min',
    includesKeys: ['diagnosticI1', 'diagnosticI2', 'diagnosticI3', 'diagnosticI4', 'diagnosticI5'],
  },
  {
    id: 'urgence',
    icon: 'AlertTriangle',
    color: '#F0C040',
    duration: 'ASAP',
    includesKeys: ['urgenceI1', 'urgenceI2', 'urgenceI3', 'urgenceI4', 'urgenceI5'],
  },
]

export default function Services() {
  const { t } = useTranslation()

  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ background: '#080808' }}>
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#43BCC9' }}
        >
          {t('services.pageTitle')}
        </p>
        <h1
          className="font-heading font-bold text-5xl mb-4"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          {t('services.pageSubtitle').split('. ')[0]}.
          <span style={{ color: '#43BCC9' }}> {t('services.pageSubtitle').split('. ')[1]}</span>
        </h1>
        <p
          className="text-lg max-w-xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {t('services.pageLead')}
        </p>
      </section>

      {/* ── SERVICES LIST ────────────────────────────────────────────── */}
      <section className="pb-20 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {serviceDefs.map((def) => {
            const isUrgence = def.id === 'urgence'
            const titleKey = `services.${def.id}Title` as const
            const descKey  = `services.${def.id}Desc`  as const

            return (
              <div
                key={def.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: '#0F0F0F',
                  border: isUrgence
                    ? '1px solid rgba(240,192,64,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3">

                  {/* Left */}
                  <div
                    className="p-8 flex flex-col justify-between"
                    style={{ background: '#141414' }}
                  >
                    <div>
                      <div
                        className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                        style={{
                          background: isUrgence
                            ? 'rgba(240,192,64,0.1)'
                            : 'rgba(67,188,201,0.08)',
                          border: isUrgence
                            ? '1px solid rgba(240,192,64,0.2)'
                            : '1px solid rgba(67,188,201,0.15)',
                          color: def.color,
                        }}
                      >
                        {iconMap[def.icon]}
                      </div>
                      <h2
                        className="font-heading font-bold text-2xl mb-1"
                        style={{ color: '#ffffff' }}
                      >
                        {t(`services.${def.id}`)}
                      </h2>
                      <p className="text-sm mb-4" style={{ color: def.color }}>
                        {t(titleKey)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <Clock size={14} color="rgba(255,255,255,0.35)" />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {def.duration}
                      </span>
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {isUrgence ? t('services.emergencySurcharge') : t('services.onQuote')}
                      </span>
                    </div>
                  </div>

                  {/* Middle */}
                  <div className="p-8">
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest mb-5"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Description
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-8"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {t(descKey)}
                    </p>
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {t('services.included')}
                    </h3>
                    <ul className="space-y-2">
                      {def.includesKeys.map((key) => (
                        <li key={key} className="flex items-start gap-2">
                          <CheckCircle
                            size={14}
                            style={{ color: def.color, flexShrink: 0, marginTop: '2px' }}
                          />
                          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {t(`services.${key}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right */}
                  <div
                    className="p-8 flex flex-col justify-between"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div>
                      <div
                        className="text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {t('services.pricing')}
                      </div>
                      <div
                        className="font-heading font-bold text-2xl mb-1"
                        style={{ color: '#ffffff' }}
                      >
                        {t('services.onQuote')}
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {t('services.priceConfirmed')}
                      </div>

                      <div
                        className="mt-6 p-4 rounded-xl"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div
                          className="text-xs mb-2"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        >
                          {t('services.whyQuoteTitle')}
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          {t('services.whyQuoteDesc')}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                      className="w-full mt-6 py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-200"
                      style={{
                        background: isUrgence ? '#F0C040' : '#43BCC9',
                        color: '#080808',
                      }}
                    >
                      {t('services.getQuote')}
                      <ChevronRight size={16} />
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      </section>

    </main>
  )
}
