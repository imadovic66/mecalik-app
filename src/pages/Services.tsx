import { Droplets, Battery, Wrench, Search, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/SEO'
import { WHATSAPP_NUMBER } from '../lib/constants'
import { isServiceComingSoon } from '../data/serviceStatus'

// Only the 4 active services get Service schema — advertising Pneus/Lavage here while they're
// not bookable would misrepresent availability to search engines.
const SERVICE_SCHEMAS = [
  {
    serviceType: 'Vidange à Domicile',
    description: 'Vidange moteur complète avec remplacement du filtre à huile d\'origine. Vérification des niveaux incluse. Prix confirmé selon votre modèle avant intervention.',
    minPrice: 250,
  },
  {
    serviceType: 'Remplacement Batterie à Domicile',
    description: 'Diagnostic complet de votre batterie, remplacement si nécessaire. Toutes marques, tous gabarits. Notre technicien vient avec les batteries les plus courantes en stock.',
    minPrice: 210,
  },
  {
    serviceType: 'Diagnostic Auto à Domicile',
    description: "Lecture complète des codes erreur OBD, bilan de l'état général du véhicule. Rapport détaillé fourni. Idéal avant un achat de voiture d'occasion ou en cas de voyant allumé.",
    minPrice: 220,
  },
  {
    serviceType: 'Urgence & Dépannage à Domicile',
    description: "Panne sur route, batterie à plat en plein parking, démarrage impossible — nous intervenons en priorité selon disponibilité. Contactez-nous pour un créneau rapide.",
    minPrice: undefined,
  },
].map(s => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: s.serviceType,
  provider: { '@type': 'LocalBusiness', name: 'MecaLIK', '@id': 'https://mecalik.com/#business' },
  areaServed: { '@type': 'City', name: 'Casablanca' },
  description: s.description,
  ...(s.minPrice != null ? {
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MAD',
      priceSpecification: { '@type': 'PriceSpecification', minPrice: s.minPrice, priceCurrency: 'MAD' },
    },
  } : {}),
}))

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://mecalik.com/' },
    { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://mecalik.com/services' },
  ],
}

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
  isComingSoon: boolean
}

// Active services first, coming-soon last
const serviceDefs: ServiceDef[] = [
  {
    id: 'vidange',
    icon: 'Droplets',
    color: 'var(--mk-action)',
    duration: '~60 min',
    includesKeys: ['vidangeI1', 'vidangeI2', 'vidangeI3', 'vidangeI4', 'vidangeI5'],
    isComingSoon: isServiceComingSoon('vidange'),
  },
  {
    id: 'batterie',
    icon: 'Battery',
    color: 'var(--mk-action)',
    duration: '~30 min',
    includesKeys: ['batterieI1', 'batterieI2', 'batterieI3', 'batterieI4', 'batterieI5'],
    isComingSoon: isServiceComingSoon('batterie'),
  },
  {
    id: 'diagnostic',
    icon: 'Search',
    color: 'var(--mk-action)',
    duration: '~30 min',
    includesKeys: ['diagnosticI1', 'diagnosticI2', 'diagnosticI3', 'diagnosticI4', 'diagnosticI5'],
    isComingSoon: isServiceComingSoon('diagnostic'),
  },
  {
    id: 'urgence',
    icon: 'AlertTriangle',
    color: 'var(--mk-premium)',
    duration: 'Selon disponibilité',
    includesKeys: ['urgenceI1', 'urgenceI2', 'urgenceI3', 'urgenceI4', 'urgenceI5'],
    isComingSoon: isServiceComingSoon('urgence'),
  },
  {
    id: 'pneus',
    icon: 'Wrench',
    color: 'var(--mk-action)',
    duration: '~45 min',
    includesKeys: ['pneusI1', 'pneusI2', 'pneusI3', 'pneusI4', 'pneusI5'],
    isComingSoon: isServiceComingSoon('pneus'),
  },
  {
    id: 'lavage',
    icon: 'Droplets',
    color: 'var(--mk-action)',
    duration: '~45 min',
    includesKeys: ['lavageI1', 'lavageI2', 'lavageI3', 'lavageI4', 'lavageI5'],
    isComingSoon: isServiceComingSoon('lavage'),
  },
]

export default function Services() {
  const { t } = useTranslation()

  return (
    <main>
      <SEO
        title="Nos Services — Vidange, Batterie, Diagnostic à Domicile | MecaLIK"
        description="Quatre services auto à domicile à Casablanca : vidange & filtres, batterie, diagnostic et urgence. Technicien certifié, prix confirmé avant intervention."
        path="/services"
        jsonLd={[...SERVICE_SCHEMAS, BREADCRUMB_SCHEMA]}
      />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ background: '#080808' }}>
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--mk-action)' }}
        >
          {t('services.pageTitle')}
        </p>
        <h1
          className="font-heading font-bold text-5xl mb-4"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          {t('services.pageSubtitle').split('. ')[0]}.
          <span style={{ color: 'var(--mk-action)' }}> {t('services.pageSubtitle').split('. ')[1]}</span>
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
            const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par le service ${t('services.' + def.id)} (bientôt disponible).`)}`

            return (
              <div
                key={def.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: '#0F0F0F',
                  border: isUrgence
                    ? '1px solid rgba(240,192,64,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
                  opacity: def.isComingSoon ? 0.55 : 1,
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

                    {def.isComingSoon ? (
                      <div className="mt-6">
                        <div
                          className="w-full py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--mk-text-muted)',
                          }}
                        >
                          🔜 Bientôt disponible
                        </div>
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center mt-3 text-xs"
                          style={{ color: 'var(--mk-action)', textDecoration: 'none' }}
                        >
                          Vous êtes intéressé ? Dites-le nous sur WhatsApp
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                        className="w-full mt-6 py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-200"
                        style={{
                          background: isUrgence ? 'var(--mk-premium)' : 'var(--mk-action)',
                          color: '#080808',
                        }}
                      >
                        {t('services.getQuote')}
                        <ChevronRight size={16} />
                      </button>
                    )}
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
