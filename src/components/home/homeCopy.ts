/** Homepage copy (FR / EN). Kept here so the CAFU-style sections stay readable. */
import { useTranslation } from 'react-i18next'

const fr = {
  heroEyebrow: 'Mécanicien à domicile · Casablanca',
  heroBefore: 'Votre',
  heroWords: ['vidange', 'batterie', 'diagnostic', 'dépannage'],
  heroAfter: 'à domicile, partout à Casablanca.',
  heroSub: "Un mécanicien MecaLIK vient chez vous, au bureau ou au parking, avec les pièces. Prix estimé avant de réserver, paiement après le service.",
  book: 'Réserver',
  panne: 'Panne ? Intervention prioritaire',
  urgentCta: 'Demander une intervention',
  trust: ['Prix affiché avant de réserver', 'Paiement après le service', 'Domicile, bureau ou parking'],
  zones: "Zones d'intervention",
  heroChip1: 'Diagnostic',
  heroChip2: 'Paiement après le service',
  from: 'dès',
  onQuote: 'Sur devis',
  servicesEyebrow: 'Nos services',
  servicesTitle: "Tout l'entretien, sans bouger.",
  servicesSub: 'Choisissez un service, votre voiture et l’adresse. Le mécanicien vient sur place.',
  soon: 'Bientôt',
  priority: 'Prioritaire',
  svc: {
    vidange: { name: 'Vidange', tag: '~60 min', desc: 'Huile moteur et filtre remplacés sur place, niveaux vérifiés.', points: ['Huile adaptée à votre moteur', 'Prix selon la taille de la voiture', 'Le mécanicien apporte les pièces'] },
    batterie: { name: 'Batterie', tag: '~30 min', desc: 'Test de la batterie et remplacement sur place si nécessaire.', points: ['Test avant tout remplacement', 'Batterie adaptée à votre voiture', 'Prix selon votre voiture'] },
    diagnostic: { name: 'Diagnostic', tag: '~30 min', desc: 'Bilan complet de la voiture, pour savoir exactement ce qui ne va pas.', points: ['Lecture des codes erreur', 'Explication claire du problème', 'Devis avant toute réparation'] },
    urgence: { name: 'Urgence', tag: 'Prioritaire', desc: 'Panne, batterie à plat, voiture qui ne démarre pas : on intervient en priorité selon disponibilité.', points: ['Demande traitée en priorité', 'Devis confirmé avec vous sur place', 'Rien n’est fait sans votre accord'] },
    pneus: { name: 'Pneus', tag: 'Bientôt', desc: 'Changement, équilibrage et contrôle de pression sur place.', points: [] as string[] },
    lavage: { name: 'Lavage', tag: 'Bientôt', desc: 'Lavage intérieur et extérieur là où la voiture est garée.', points: [] as string[] },
  },
  discoverEyebrow: 'Découvrir MecaLIK',
  discoverTitle: 'Le garage qui se déplace.',
  discover: [
    { title: 'Comment ça marche', text: 'Service, voiture, adresse : trois étapes, et le mécanicien vient à vous.', to: '/comment-ca-marche', img: '/photo-intervention.jpg' },
    { title: 'Nos tarifs', text: 'Prix TTC estimés selon votre voiture, affichés avant de réserver.', to: '/tarifs', img: '/photo-casablanca.jpg' },
    { title: 'Qui sommes-nous', text: 'Une équipe de Casablanca, avec ses mécaniciens et sa camionnette.', to: '/a-propos', img: '/photo-van.jpg' },
  ],
  appEyebrow: "L'application",
  appTitle: 'MecaLIK dans votre poche.',
  appSub: 'Bientôt sur Android et iPhone.',
  appPoints: ['Réservez en quelques étapes', 'Suivez l’intervention en direct', 'Le carnet de votre voiture et les rappels d’entretien'],
  appCta: 'En attendant, réservez sur le site',
  faqEyebrow: 'Questions fréquentes',
  faqTitle: 'Vous vous demandez…',
  faqAll: 'Toutes les questions',
  faq1q: 'Comment ça marche ?',
  faq1a: "Choisissez le service et votre voiture, indiquez l'adresse et le créneau. Un mécanicien MecaLIK vient sur place avec les pièces et intervient devant chez vous.",
  faq2q: 'Comment sont fixés les prix ?',
  faq2a: "Le prix estimé TTC s'affiche avant de réserver, selon le service et la taille de votre voiture. Le prix exact est confirmé avec vous avant l'intervention.",
  fleetEyebrow: 'Entreprises',
  fleetTitle: 'Vous gérez une flotte ?',
  fleetSub: 'Entretien de vos véhicules sur votre site, et le suivi de chaque voiture dans votre espace flotte.',
  fleetCta: "Découvrir l'offre Flottes",
}

const en: typeof fr = {
  heroEyebrow: 'Mobile mechanic · Casablanca',
  heroBefore: 'Your',
  heroWords: ['oil change', 'battery', 'diagnostic', 'breakdown help'],
  heroAfter: 'at your door, anywhere in Casablanca.',
  heroSub: 'A MecaLIK mechanic comes to your home, office or car park with the parts. Estimated price before you book, pay after the service.',
  book: 'Book',
  panne: 'Breakdown? Priority help',
  urgentCta: 'Request help now',
  trust: ['Price shown before you book', 'Pay after the service', 'Home, office or car park'],
  zones: 'Areas we cover',
  heroChip1: 'Diagnostic',
  heroChip2: 'Pay after the service',
  from: 'from',
  onQuote: 'On quote',
  servicesEyebrow: 'Our services',
  servicesTitle: 'Car care, without moving.',
  servicesSub: 'Pick a service, your car and the address. The mechanic comes to you.',
  soon: 'Soon',
  priority: 'Priority',
  svc: {
    vidange: { name: 'Oil change', tag: '~60 min', desc: 'Engine oil and filter replaced on the spot, fluid levels checked.', points: ['Oil matched to your engine', 'Price based on car size', 'The mechanic brings the parts'] },
    batterie: { name: 'Battery', tag: '~30 min', desc: 'Battery test, and replacement on the spot if needed.', points: ['Tested before any replacement', 'Battery matched to your car', 'Price based on your car'] },
    diagnostic: { name: 'Diagnostic', tag: '~30 min', desc: 'A full check of the car, so you know exactly what is wrong.', points: ['Error codes read', 'Clear explanation of the problem', 'Quote before any repair'] },
    urgence: { name: 'Emergency', tag: 'Priority', desc: 'Breakdown, flat battery, car won’t start: we come first, depending on availability.', points: ['Handled as a priority', 'Quote agreed with you on site', 'Nothing done without your OK'] },
    pneus: { name: 'Tyres', tag: 'Soon', desc: 'Tyre change, balancing and pressure check on the spot.', points: [] },
    lavage: { name: 'Car wash', tag: 'Soon', desc: 'Inside and outside wash wherever the car is parked.', points: [] },
  },
  discoverEyebrow: 'Discover MecaLIK',
  discoverTitle: 'The garage that comes to you.',
  discover: [
    { title: 'How it works', text: 'Service, car, address: three steps, and the mechanic comes to you.', to: '/comment-ca-marche', img: '/photo-intervention.jpg' },
    { title: 'Prices', text: 'Estimated prices including VAT, based on your car, shown before you book.', to: '/tarifs', img: '/photo-casablanca.jpg' },
    { title: 'About us', text: 'A Casablanca team, with its own mechanics and van.', to: '/a-propos', img: '/photo-van.jpg' },
  ],
  appEyebrow: 'The app',
  appTitle: 'MecaLIK in your pocket.',
  appSub: 'Coming soon on Android and iPhone.',
  appPoints: ['Book in a few steps', 'Follow the job live', 'Your car’s logbook and service reminders'],
  appCta: 'Meanwhile, book on the website',
  faqEyebrow: 'FAQ',
  faqTitle: 'You may be wondering…',
  faqAll: 'All questions',
  faq1q: 'How does it work?',
  faq1a: 'Choose the service and your car, enter the address and time slot. A MecaLIK mechanic comes with the parts and does the job where your car is parked.',
  faq2q: 'How are prices set?',
  faq2a: 'The estimated price including VAT is shown before you book, based on the service and your car’s size. The exact price is confirmed with you before the work starts.',
  fleetEyebrow: 'Business',
  fleetTitle: 'Running a fleet?',
  fleetSub: 'Servicing for your vehicles on your premises, and every car tracked in your fleet space.',
  fleetCta: 'See the Fleet offer',
}

export type HomeCopy = typeof fr
export function useHomeCopy(): HomeCopy {
  const { i18n } = useTranslation()
  return i18n.language?.startsWith('en') ? en : fr
}

export const SERVICE_ORDER = ['vidange', 'batterie', 'diagnostic', 'urgence', 'pneus', 'lavage'] as const
export type ServiceKey = typeof SERVICE_ORDER[number]
export const BOOKABLE: Record<ServiceKey, boolean> = { vidange: true, batterie: true, diagnostic: true, urgence: true, pneus: false, lavage: false }

export const openBooking = (service?: string) => {
  const w = window as unknown as { fbq?: (...a: unknown[]) => void }
  if (w.fbq) w.fbq('track', 'InitiateCheckout')
  window.dispatchEvent(new CustomEvent('openBooking', service ? { detail: { service } } : undefined))
}
