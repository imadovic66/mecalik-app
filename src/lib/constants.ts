/** Shared constants — single source of truth for magic values used across the app */

export const WHATSAPP_NUMBER = '212777348065'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export const GOOGLE_REVIEW_URL = 'https://g.page/r/CactTpE5lu6jEAE/review'

/** Public-safe Supabase credentials (anon key is safe to expose in client-side code) */
export const SUPABASE_URL = 'https://nggvlwiisvvjczpyccfj.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZ3Zsd2lpc3Z2amN6cHljY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA3ODksImV4cCI6MjA5MDYyNjc4OX0.qjYAD4YVjEMANIVXfvfbj5O6VvkXqagwZIo_6sbrQ6Y'

export const SERVICE_PRICES: Record<string, { fr: string; en: string }> = {
  'lavage auto':          { fr: 'À partir de 150 MAD', en: 'From 150 MAD' },
  'car wash':             { fr: 'À partir de 150 MAD', en: 'From 150 MAD' },
  'vidange':              { fr: 'À partir de 250 MAD', en: 'From 250 MAD' },
  'vidange & filtres':    { fr: 'À partir de 250 MAD', en: 'From 250 MAD' },
  'oil change & filters': { fr: 'À partir de 250 MAD', en: 'From 250 MAD' },
  'batterie':             { fr: 'À partir de 210 MAD', en: 'From 210 MAD' },
  'battery':              { fr: 'À partir de 210 MAD', en: 'From 210 MAD' },
  'pneus':                { fr: 'À partir de 200 MAD', en: 'From 200 MAD' },
  'tyres':                { fr: 'À partir de 200 MAD', en: 'From 200 MAD' },
  'diagnostic':           { fr: 'À partir de 220 MAD', en: 'From 220 MAD' },
  'diagnostic simple':    { fr: 'À partir de 220 MAD', en: 'From 220 MAD' },
  'urgence':              { fr: 'Sur devis', en: 'On quote' },
  'urgence & dépannage':  { fr: 'Sur devis', en: 'On quote' },
  'emergency & roadside': { fr: 'Sur devis', en: 'On quote' },
  // Legacy keys kept for bookings placed before the "Urgence 24/7" → "Urgence & Dépannage" rename
  'urgence 24/7':         { fr: 'Sur devis', en: 'On quote' },
  'emergency 24/7':       { fr: 'Sur devis', en: 'On quote' },
}

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'on_the_way',
  'quote_pending',
  'quote_sent',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type BookingStatus = typeof BOOKING_STATUSES[number]

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending:       '#F0C040',
  confirmed:     '#43BCC9',
  on_the_way:    '#F0C040',
  quote_pending: '#F0C040',
  quote_sent:    '#43BCC9',
  in_progress:   '#43BCC9',
  completed:     '#22C55E',
  cancelled:     '#FF4444',
}

export const STATUS_LABELS: Record<BookingStatus, { fr: string; en: string }> = {
  pending:       { fr: 'En attente',          en: 'Pending' },
  confirmed:     { fr: 'Confirmée',           en: 'Confirmed' },
  on_the_way:    { fr: 'Mécanicien en route', en: 'On the way' },
  quote_pending: { fr: 'Devis à valider',     en: 'Quote pending approval' },
  quote_sent:    { fr: 'Devis envoyé',        en: 'Quote sent' },
  in_progress:   { fr: 'En cours',            en: 'In progress' },
  completed:     { fr: 'Terminée',            en: 'Completed' },
  cancelled:     { fr: 'Annulée',             en: 'Cancelled' },
}
