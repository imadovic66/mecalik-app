// MecaLIK Analytics — GA4 event tracking
// Usage: import { track } from '../lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_ID = 'G-PXH9CW2XYF'

export function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, { send_to: GA_ID, ...params })
  }
}

export function trackPageView(path: string) {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_ID, { page_path: path })
  }
}

// Convenience trackers for MecaLIK funnels
export const analytics = {
  // Auth
  signUp: (method: 'email' | 'google') =>
    track('sign_up', { method }),

  login: (method: 'email' | 'google', role: string) =>
    track('login', { method, user_role: role }),

  // Booking funnel
  beginBooking: (serviceName: string) =>
    track('begin_checkout', { service_name: serviceName, currency: 'MAD' }),

  selectService: (serviceName: string, priceFrom: number) =>
    track('select_item', {
      item_name: serviceName,
      price: priceFrom,
      currency: 'MAD',
    }),

  selectVehicle: (brand: string, model: string) =>
    track('select_vehicle', { vehicle_brand: brand, vehicle_model: model }),

  bookingCompleted: (reference: string, serviceName: string, value: number) =>
    track('purchase', {
      transaction_id: reference,
      value,
      currency: 'MAD',
      items: [{ item_name: serviceName, price: value }],
    }),

  bookingCancelled: (reference: string, reason?: string) =>
    track('booking_cancelled', { reference, reason }),

  // Engagement
  whatsappClick: (source: 'success_screen' | 'urgency_card' | 'footer' | 'support') =>
    track('whatsapp_click', { click_source: source }),

  devisGenerated: () => track('devis_generated'),
  invoiceGenerated: () => track('invoice_generated'),

  // Landing page
  ctaClick: (ctaLabel: string, location: string) =>
    track('cta_click', { cta_label: ctaLabel, cta_location: location }),
}
