/** Shared utility functions — replaces inline duplicates in BookingModal, TrackBooking, dashboards */

import { STATUS_COLORS, STATUS_LABELS, type BookingStatus } from './constants'

/** Returns the hex color for a booking status */
export const getStatusColor = (status: BookingStatus | string): string =>
  STATUS_COLORS[status as BookingStatus] || '#888888'

/** Returns the translated label for a booking status */
export const getStatusLabel = (status: BookingStatus | string, lang: 'fr' | 'en'): string =>
  STATUS_LABELS[status as BookingStatus]?.[lang] || status

/** Formats a date string to localised long date (e.g. "12 mai 2025") */
export const formatDate = (dateStr: string, lang: 'fr' | 'en'): string =>
  new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-MA' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

/** Generates a MecaLIK booking reference (MK-XXXXX) */
export const generateReference = (): string =>
  'MK-' + Math.random().toString(36).substring(2, 7).toUpperCase()

/** Converts a service key or object to a human-readable label */
export const resolveServiceName = (service: unknown): string => {
  if (!service) return ''
  if (typeof service === 'string') {
    return service.replace('services.', '').replace(/_/g, ' ')
  }
  const s = service as Record<string, unknown>
  return String(s.label ?? s.name ?? s.service_name ?? service)
}

/** Parses the guest name from the notes_admin field (format: "Nom: X | ...") */
export const parseGuestName = (notesAdmin: string | null): string | null => {
  if (!notesAdmin) return null
  return notesAdmin.match(/Nom:\s*([^|]+)/)?.[1]?.trim() || null
}

/** Builds a bilingual WhatsApp message body for a new booking */
export const buildWhatsAppMessage = (params: {
  service: string
  address: string
  name: string
  phone: string
  notes?: string
  reference: string
  lang: 'fr' | 'en'
}): string => {
  const { service, address, name, phone, notes, reference, lang } = params
  if (lang === 'fr') {
    return `Bonjour MecaLIK ! 👋\n\nJe souhaite réserver une intervention :\n\n🔧 *Service :* ${service}\n📍 *Adresse :* ${address}\n👤 *Nom :* ${name}\n📞 *Téléphone :* ${phone}${notes ? `\n📝 *Notes :* ${notes}` : ''}\n\n📋 *Référence :* ${reference}\n🔗 *Suivi :* https://mecalik.com/track/${reference}\n\nMerci !`
  }
  return `Hello MecaLIK! 👋\n\nI'd like to book a service:\n\n🔧 *Service:* ${service}\n📍 *Address:* ${address}\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}${notes ? `\n📝 *Notes:* ${notes}` : ''}\n\n📋 *Reference:* ${reference}\n🔗 *Track:* https://mecalik.com/track/${reference}\n\nThank you!`
}
