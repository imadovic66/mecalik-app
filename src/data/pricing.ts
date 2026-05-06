export type Zone = 'zone1' | 'zone2' | 'zone3'

export type ServicePrice = {
  id: string
  label: string
  labelShort: string
  icon: string
  zone1: number | null
  zone2: number | null
  zone3: number | null
  contactOnly: boolean
  contactLabel?: string
  duration: string
  includes: string
  category: 'diagnostic' | 'urgence' | 'entretien' | 'assistance'
  hasPartsRequired: boolean
  typicalPartsCost?: { min: number; max: number }
  partsMargine: number
}

export const ZONE_LABELS: Record<Zone, string> = {
  zone1: 'Zone 1 — Centre ville',
  zone2: 'Zone 2 — Périphérie',
  zone3: 'Zone 3 — Grand Casablanca',
}

export const ZONE_DESCRIPTIONS: Record<Zone, string> = {
  zone1: 'Maarif, Anfa, Bourgogne, CIL, Gauthier, Racine',
  zone2: 'Ain Diab, Ain Sebaa, Sidi Maarouf, Hay Hassani',
  zone3: 'Bouskoura, Dar Bouazza, Nouaceur, Médiouna',
}

export const SERVICES: ServicePrice[] = [
  {
    id: 'diagnostic',
    label: 'Diagnostic Simple',
    labelShort: 'Diagnostic',
    icon: '🔍',
    zone1: 220, zone2: 220, zone3: 270,
    contactOnly: false,
    duration: '~30 min',
    includes: 'Lecture des codes défauts OBD',
    category: 'diagnostic',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'expertise',
    label: 'Expertise Avant Achat',
    labelShort: 'Expertise',
    icon: '🔎',
    zone1: 700, zone2: 749, zone3: 849,
    contactOnly: false,
    duration: '~60 min',
    includes: 'Expertise professionnelle complète du véhicule',
    category: 'diagnostic',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'batterie',
    label: 'Remplacement Batterie',
    labelShort: 'Batterie',
    icon: '🔋',
    zone1: 210, zone2: 249, zone3: 299,
    contactOnly: false,
    duration: '~30 min',
    includes: "Main d'œuvre uniquement — batterie en sus",
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 600, max: 900 },
    partsMargine: 5,
  },
  {
    id: 'demarrage',
    label: 'Démarrage par Câbles',
    labelShort: 'Démarrage câbles',
    icon: '⚡',
    zone1: 239, zone2: 289, zone3: 350,
    contactOnly: false,
    duration: '~20 min',
    includes: 'Intervention sur place avec câbles de démarrage',
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'roue',
    label: 'Changement Roue de Secours',
    labelShort: 'Roue de secours',
    icon: '🔧',
    zone1: 269, zone2: 319, zone3: 389,
    contactOnly: false,
    duration: '~20 min',
    includes: 'Si roue de secours disponible dans le véhicule',
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'lavage',
    label: 'Lavage Auto',
    labelShort: 'Lavage',
    icon: '🚿',
    zone1: 150, zone2: 180, zone3: 220,
    contactOnly: false,
    duration: '~45 min',
    includes: 'Lavage extérieur et intérieur complet',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 50, max: 100 },
    partsMargine: 5,
  },
  {
    id: 'vidange',
    label: 'Vidange Moteur',
    labelShort: 'Vidange',
    icon: '🛢️',
    zone1: 250, zone2: 250, zone3: 350,
    contactOnly: false,
    duration: '~60 min',
    includes: "Main d'œuvre uniquement — huile + filtre en sus",
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 350, max: 500 },
    partsMargine: 5,
  },
  {
    id: 'pneus',
    label: 'Changement de Pneus',
    labelShort: 'Pneus',
    icon: '🔩',
    zone1: 200, zone2: 230, zone3: 280,
    contactOnly: false,
    duration: '~45 min',
    includes: "Main d'œuvre uniquement — pneus en sus",
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 400, max: 800 },
    partsMargine: 5,
  },
  {
    id: 'freins',
    label: 'Plaquettes de Freins',
    labelShort: 'Freins',
    icon: '🛑',
    zone1: 300, zone2: 300, zone3: 400,
    contactOnly: false,
    duration: '~45 min',
    includes: "Main d'œuvre uniquement — plaquettes en sus",
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 200, max: 400 },
    partsMargine: 5,
  },
  {
    id: 'adblue',
    label: 'Reset AdBlue',
    labelShort: 'Reset AdBlue',
    icon: '💧',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 400 MAD',
    duration: 'Variable',
    includes: 'Réinitialisation système AdBlue',
    category: 'diagnostic',
    hasPartsRequired: true,
    typicalPartsCost: { min: 0, max: 0 },
    partsMargine: 5,
  },
  {
    id: 'ouverture',
    label: 'Ouverture Voiture',
    labelShort: 'Ouverture',
    icon: '🔑',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 500 MAD',
    duration: 'Variable',
    includes: "Perte de clé ou clé laissée à l'intérieur",
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'fap',
    label: 'Diagnostic / Nettoyage FAP',
    labelShort: 'FAP',
    icon: '🌿',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 450 MAD',
    duration: 'Variable',
    includes: 'Diagnostic, nettoyage et régénération FAP',
    category: 'diagnostic',
    hasPartsRequired: true,
    typicalPartsCost: { min: 0, max: 0 },
    partsMargine: 5,
  },
]

export function getPrice(service: ServicePrice, zone: Zone): string {
  if (service.contactOnly) return service.contactLabel || 'Sur devis'
  const price = service[zone]
  if (!price) return 'Sur devis'
  return `${price} MAD`
}

export function getPriceNumber(service: ServicePrice, zone: Zone): number | null {
  if (service.contactOnly) return null
  return service[zone] as number | null
}

export function getPartsMarginRevenue(service: ServicePrice): { min: number; max: number } {
  if (!service.hasPartsRequired || !service.typicalPartsCost) {
    return { min: 0, max: 0 }
  }
  const rate = service.partsMargine / 100
  return {
    min: Math.round(service.typicalPartsCost.min * rate),
    max: Math.round(service.typicalPartsCost.max * rate),
  }
}

export function getTotalRevenuePerIntervention(
  service: ServicePrice,
  zone: Zone
): {
  mo: number | null
  partsMin: number
  partsMax: number
  totalMin: number | null
  totalMax: number | null
} {
  const mo = getPriceNumber(service, zone)
  const parts = getPartsMarginRevenue(service)
  return {
    mo,
    partsMin: parts.min,
    partsMax: parts.max,
    totalMin: mo ? mo + parts.min : null,
    totalMax: mo ? mo + parts.max : null,
  }
}
