import { Droplets, Battery, Wrench, Search, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type Service = {
  id: string
  icon: string
  name: string
  tagline: string
  duration: string
  price: string
  description: string
  includes: string[]
  color: string
}

const services: Service[] = [
  {
    id: 'lavage',
    icon: 'Droplets',
    name: 'Lavage Auto',
    tagline: 'Un véhicule propre, à votre emplacement.',
    duration: '~45 min',
    price: 'Sur devis',
    description:
      'Notre technicien se déplace avec tout le matériel nécessaire pour un lavage extérieur et intérieur complet. Produits professionnels, résultat showroom — sans que vous bougiez votre voiture.',
    includes: [
      'Lavage extérieur complet',
      'Nettoyage intérieur (aspirateur, surfaces)',
      'Vitres intérieur/extérieur',
      'Jantes et pneus',
      'Produits professionnels fournis',
    ],
    color: '#43BCC9',
  },
  {
    id: 'vidange',
    icon: 'Droplets',
    name: 'Vidange & Filtres',
    tagline: 'Moteur propre, voiture protégée.',
    duration: '~60 min',
    price: 'Sur devis',
    description:
      "Vidange moteur complète avec remplacement du filtre à huile d'origine. Vérification des niveaux incluse. Prix confirmé selon votre modèle avant intervention.",
    includes: [
      'Vidange huile moteur',
      'Remplacement filtre à huile',
      'Vérification niveau liquide de refroidissement',
      'Vérification niveau liquide de frein',
      "Rapport d'état fourni",
    ],
    color: '#43BCC9',
  },
  {
    id: 'batterie',
    icon: 'Battery',
    name: 'Batterie',
    tagline: 'Plus jamais en panne de batterie.',
    duration: '~30 min',
    price: 'Sur devis',
    description:
      'Diagnostic complet de votre batterie, remplacement si nécessaire. Toutes marques, tous gabarits. Notre technicien vient avec les batteries les plus courantes en stock.',
    includes: [
      'Diagnostic batterie (test de charge)',
      'Remplacement si nécessaire',
      'Test alternateur inclus',
      'Toutes marques disponibles',
      'Mise en service et vérification',
    ],
    color: '#43BCC9',
  },
  {
    id: 'pneus',
    icon: 'Wrench',
    name: 'Pneus',
    tagline: 'Changement sur place, sans lever de pont.',
    duration: '~45 min',
    price: 'Sur devis',
    description:
      "Changement, équilibrage et contrôle de pression. Notre technicien intervient sur place avec l'équipement adapté. Crevaison, usure, ou renouvellement complet.",
    includes: [
      'Démontage / montage pneus',
      'Équilibrage des roues',
      'Contrôle pression tous pneus',
      "Vérification usure et état",
      'Conseil sur le remplacement',
    ],
    color: '#43BCC9',
  },
  {
    id: 'diagnostic',
    icon: 'Search',
    name: 'Diagnostic',
    tagline: 'Savoir exactement ce qui ne va pas.',
    duration: '~30 min',
    price: 'Sur devis',
    description:
      "Lecture complète des codes erreur OBD, bilan de l'état général du véhicule. Rapport détaillé fourni. Idéal avant un achat de voiture d'occasion ou en cas de voyant allumé.",
    includes: [
      'Lecture codes erreur OBD',
      'Diagnostic électronique complet',
      "Rapport d'état détaillé",
      'Recommandations de réparation',
      'Devis pour les interventions nécessaires',
    ],
    color: '#43BCC9',
  },
  {
    id: 'urgence',
    icon: 'AlertTriangle',
    name: 'Urgence 24/7',
    tagline: "Nous intervenons quand les autres ne peuvent pas.",
    duration: 'ASAP',
    price: 'Surcharge urgence',
    description:
      "Panne sur route, batterie à plat en plein parking, crevaison un dimanche matin — notre technicien est disponible 24h/24, 7j/7. Intervention en moins de 90 minutes partout à Casablanca.",
    includes: [
      'Disponible 24h/24, 7j/7',
      'Intervention < 90 min à Casablanca',
      'Panne moteur, batterie, pneu',
      'Dépannage sur place',
      'Remorquage si nécessaire',
    ],
    color: '#F0C040',
  },
]

const iconMap: Record<string, ReactNode> = {
  Droplets: <Droplets size={22} />,
  Battery: <Battery size={22} />,
  Wrench: <Wrench size={22} />,
  Search: <Search size={22} />,
  AlertTriangle: <AlertTriangle size={22} />,
}

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
          {t('landing.servicesTitle')}
        </p>
        <h1
          className="font-heading font-bold text-5xl mb-4"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          Six services.
          <span style={{ color: '#43BCC9' }}> Un technicien.</span>
        </h1>
        <p
          className="text-lg max-w-xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {t('landing.servicesSectionTitle')}
        </p>
      </section>

      {/* ── SERVICES LIST ────────────────────────────────────────────── */}
      <section className="pb-20 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {services.map((service) => {
            const isUrgence = service.id === 'urgence'
            return (
              <div
                key={service.id}
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
                          color: service.color,
                        }}
                      >
                        {iconMap[service.icon]}
                      </div>
                      <h2
                        className="font-heading font-bold text-2xl mb-1"
                        style={{ color: '#ffffff' }}
                      >
                        {service.name}
                      </h2>
                      <p className="text-sm mb-4" style={{ color: service.color }}>
                        {service.tagline}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                      <Clock size={14} color="rgba(255,255,255,0.35)" />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {service.duration}
                      </span>
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {service.price}
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
                      {service.description}
                    </p>
                    <h3
                      className="text-xs font-semibold uppercase tracking-widest mb-4"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Inclus
                    </h3>
                    <ul className="space-y-2">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle
                            size={14}
                            style={{ color: service.color, flexShrink: 0, marginTop: '2px' }}
                          />
                          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {item}
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
                        Tarification
                      </div>
                      <div
                        className="font-heading font-bold text-2xl mb-1"
                        style={{ color: '#ffffff' }}
                      >
                        Sur devis
                      </div>
                      <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Prix confirmé avant toute intervention
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
                          Pourquoi sur devis ?
                        </div>
                        <div
                          className="text-xs leading-relaxed"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          Chaque véhicule est différent. Le prix dépend de votre modèle,
                          de l&apos;année et des pièces nécessaires. Vous recevez un prix exact
                          sur WhatsApp avant qu&apos;on touche à votre voiture.
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
                      {t('landing.servicesBook')}
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
