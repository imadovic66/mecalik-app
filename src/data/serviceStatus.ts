/** Single source of truth for which of the 6 catalog services are bookable vs. "coming soon".
 *  Customer-facing surfaces (homepage, /services, booking flow) must respect this.
 *  Admin tools intentionally ignore it — see ReservationsTab / offline intervention forms. */

export const COMING_SOON_SERVICE_IDS = ['pneus', 'lavage'] as const
export type ComingSoonServiceId = typeof COMING_SOON_SERVICE_IDS[number]

export function isServiceComingSoon(id: string): boolean {
  return (COMING_SOON_SERVICE_IDS as readonly string[]).includes(id)
}
