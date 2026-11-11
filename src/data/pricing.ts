export type Zone = 'zone1' | 'zone2' | 'zone3'

export type ServicePrice = {
  id: string
  label: string
  labelEn?: string
  labelShort: string
  icon: string
  zone1: number | null
  zone2: number | null
  zone3: number | null
  contactOnly: boolean
  contactLabel?: string
  contactLabelEn?: string
  duration: string
  includes: string
  includesEn?: string
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

const ZONE_LABELS_EN: Record<Zone, string> = {
  zone1: 'Zone 1 — City centre',
  zone2: 'Zone 2 — Suburbs',
  zone3: 'Zone 3 — Greater Casablanca',
}

export const ZONE_DESCRIPTIONS: Record<Zone, string> = {
  zone1: 'Maarif, Anfa, Bourgogne, CIL, Gauthier, Racine',
  zone2: 'Ain Diab, Ain Sebaa, Sidi Maarouf, Hay Hassani',
  zone3: 'Bouskoura, Dar Bouazza, Nouaceur, Médiouna',
}

const ZONE_DESCRIPTIONS_EN: Record<Zone, string> = {
  zone1: 'Maarif, Anfa, Bourgogne, CIL, Gauthier, Racine',
  zone2: 'Ain Diab, Ain Sebaa, Sidi Maarouf, Hay Hassani',
  zone3: 'Bouskoura, Dar Bouazza, Nouaceur, Médiouna',
}

export function getZoneLabels(lang: string): Record<Zone, string> {
  return lang === 'en' ? ZONE_LABELS_EN : ZONE_LABELS
}

export function getZoneDescriptions(lang: string): Record<Zone, string> {
  return lang === 'en' ? ZONE_DESCRIPTIONS_EN : ZONE_DESCRIPTIONS
}

export function getServiceLabel(service: ServicePrice, lang: string): string {
  return lang === 'en' && service.labelEn ? service.labelEn : service.label
}

export function getServiceIncludes(service: ServicePrice, lang: string): string {
  return lang === 'en' && service.includesEn ? service.includesEn : service.includes
}

export const SERVICES: ServicePrice[] = [
  {
    id: 'diagnostic',
    label: 'Diagnostic Simple',
    labelEn: 'Basic Diagnostic',
    labelShort: 'Diagnostic',
    icon: '🔍',
    zone1: 220, zone2: 220, zone3: 270,
    contactOnly: false,
    duration: '~30 min',
    includes: 'Lecture des codes défauts OBD',
    includesEn: 'OBD fault code reading',
    category: 'diagnostic',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'expertise',
    label: 'Expertise Avant Achat',
    labelEn: 'Pre-Purchase Inspection',
    labelShort: 'Expertise',
    icon: '🔎',
    zone1: 700, zone2: 749, zone3: 849,
    contactOnly: false,
    duration: '~60 min',
    includes: 'Expertise professionnelle complète du véhicule',
    includesEn: 'Full professional vehicle inspection',
    category: 'diagnostic',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'batterie',
    label: 'Remplacement Batterie',
    labelEn: 'Battery Replacement',
    labelShort: 'Batterie',
    icon: '🔋',
    zone1: 210, zone2: 249, zone3: 299,
    contactOnly: false,
    duration: '~30 min',
    includes: "Main d'œuvre uniquement — batterie en sus",
    includesEn: 'Labour only — battery extra',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 600, max: 900 },
    partsMargine: 5,
  },
  {
    id: 'demarrage',
    label: 'Démarrage par Câbles',
    labelEn: 'Jump Start',
    labelShort: 'Démarrage câbles',
    icon: '⚡',
    zone1: 239, zone2: 289, zone3: 350,
    contactOnly: false,
    duration: '~20 min',
    includes: 'Intervention sur place avec câbles de démarrage',
    includesEn: 'On-site jump start with booster cables',
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'roue',
    label: 'Changement Roue de Secours',
    labelEn: 'Spare Wheel Change',
    labelShort: 'Roue de secours',
    icon: '🔧',
    zone1: 269, zone2: 319, zone3: 389,
    contactOnly: false,
    duration: '~20 min',
    includes: 'Si roue de secours disponible dans le véhicule',
    includesEn: 'Requires spare wheel in the vehicle',
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'lavage',
    label: 'Lavage Auto',
    labelEn: 'Car Wash',
    labelShort: 'Lavage',
    icon: '🚿',
    zone1: 150, zone2: 180, zone3: 220,
    contactOnly: false,
    duration: '~45 min',
    includes: 'Lavage extérieur et intérieur complet',
    includesEn: 'Full exterior and interior wash',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 50, max: 100 },
    partsMargine: 5,
  },
  {
    id: 'vidange',
    label: 'Vidange Moteur',
    labelEn: 'Oil Change',
    labelShort: 'Vidange',
    icon: '🛢️',
    zone1: 250, zone2: 250, zone3: 350,
    contactOnly: false,
    duration: '~60 min',
    includes: "Main d'œuvre uniquement — huile + filtre en sus",
    includesEn: 'Labour only — oil + filter extra',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 350, max: 500 },
    partsMargine: 5,
  },
  {
    id: 'pneus',
    label: 'Changement de Pneus',
    labelEn: 'Tyre Change',
    labelShort: 'Pneus',
    icon: '🔩',
    zone1: 200, zone2: 230, zone3: 280,
    contactOnly: false,
    duration: '~45 min',
    includes: "Main d'œuvre uniquement — pneus en sus",
    includesEn: 'Labour only — tyres extra',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 400, max: 800 },
    partsMargine: 5,
  },
  {
    id: 'freins',
    label: 'Plaquettes de Freins',
    labelEn: 'Brake Pads',
    labelShort: 'Freins',
    icon: '🛑',
    zone1: 300, zone2: 300, zone3: 400,
    contactOnly: false,
    duration: '~45 min',
    includes: "Main d'œuvre uniquement — plaquettes en sus",
    includesEn: 'Labour only — brake pads extra',
    category: 'entretien',
    hasPartsRequired: true,
    typicalPartsCost: { min: 200, max: 400 },
    partsMargine: 5,
  },
  {
    id: 'adblue',
    label: 'Reset AdBlue',
    labelEn: 'AdBlue Reset',
    labelShort: 'Reset AdBlue',
    icon: '💧',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 400 MAD',
    contactLabelEn: 'From 400 MAD',
    duration: 'Variable',
    includes: 'Réinitialisation système AdBlue',
    includesEn: 'AdBlue system reset',
    category: 'diagnostic',
    hasPartsRequired: true,
    typicalPartsCost: { min: 0, max: 0 },
    partsMargine: 5,
  },
  {
    id: 'ouverture',
    label: 'Ouverture Voiture',
    labelEn: 'Car Unlocking',
    labelShort: 'Ouverture',
    icon: '🔑',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 500 MAD',
    contactLabelEn: 'From 500 MAD',
    duration: 'Variable',
    includes: "Perte de clé ou clé laissée à l'intérieur",
    includesEn: 'Lost key or key locked inside',
    category: 'urgence',
    hasPartsRequired: false,
    partsMargine: 5,
  },
  {
    id: 'fap',
    label: 'Diagnostic / Nettoyage FAP',
    labelEn: 'DPF Diagnostic / Cleaning',
    labelShort: 'FAP',
    icon: '🌿',
    zone1: null, zone2: null, zone3: null,
    contactOnly: true,
    contactLabel: 'À partir de 450 MAD',
    contactLabelEn: 'From 450 MAD',
    duration: 'Variable',
    includes: 'Diagnostic, nettoyage et régénération FAP',
    includesEn: 'DPF diagnostic, cleaning and regeneration',
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

export function getPriceLocale(service: ServicePrice, zone: Zone, lang: string): string {
  if (service.contactOnly) {
    if (lang === 'en') return service.contactLabelEn || service.contactLabel || 'On quote'
    return service.contactLabel || 'Sur devis'
  }
  const price = service[zone]
  if (!price) return lang === 'en' ? 'On quote' : 'Sur devis'
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
