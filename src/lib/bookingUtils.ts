/** Shared pricing/payout math and customer-identity resolution for bookings.
 *  Single source of truth for "mechanic's 65% share" — used by the mechanic's
 *  job card, the quote editor, the Gains tab, and the admin approval panel. */

import { normalizeDetailType, type ServiceDetail } from '../pages/admin/adminShared'

type BookingIdentity = {
  profiles?: { full_name?: string | null; phone?: string | null } | null
  customer_name?: string | null
  customer_phone?: string | null
  notes_admin?: string | null
}

/** Resolves a booking's customer-facing name: linked account > manual-entry column >
 *  legacy notes_admin encoding (pre-migration guest bookings) > fallback. */
export function getCustomerName(booking: BookingIdentity): string {
  if (booking.profiles?.full_name) return booking.profiles.full_name
  if (booking.customer_name) return booking.customer_name
  if (booking.notes_admin) {
    const m = booking.notes_admin.match(/Nom:\s*([^|]+)/)
    if (m) return m[1].trim()
  }
  return 'Client'
}

/** Resolves a booking's customer-facing phone: linked account > manual-entry column. */
export function getCustomerPhone(booking: BookingIdentity): string | null {
  return booking.profiles?.phone || booking.customer_phone || null
}

export type BookingSource = 'platform' | 'phone' | 'whatsapp' | 'walkin'

export const SOURCE_BADGES: Record<BookingSource, { emoji: string; label: string; color: string; bg: string }> = {
  platform: { emoji: '🌐', label: 'Site',      color: 'var(--mk-action)',  bg: 'rgba(67,188,201,0.1)' },
  phone:    { emoji: '📞', label: 'Tél',        color: 'var(--mk-premium)', bg: 'rgba(240,192,64,0.1)' },
  whatsapp: { emoji: '💬', label: 'WA',         color: 'var(--mk-success)', bg: 'rgba(0,221,136,0.1)' },
  walkin:   { emoji: '🚶', label: 'Sur place',  color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' },
}

export function getSourceBadge(source: string | null | undefined) {
  return SOURCE_BADGES[(source as BookingSource) ?? 'platform'] ?? SOURCE_BADGES.platform
}

function lineTotal(d: ServiceDetail): number {
  return (Number(d.unit_price) || 0) * (parseFloat(String(d.quantity ?? '1')) || 1)
}

export function getMaterialsTotal(details: ServiceDetail[] | null | undefined): number {
  return (details ?? [])
    .filter(d => normalizeDetailType(d.type) === 'material')
    .reduce((s, d) => s + lineTotal(d), 0)
}

export function getLaborTotal(details: ServiceDetail[] | null | undefined): number {
  return (details ?? [])
    .filter(d => normalizeDetailType(d.type) === 'labor')
    .reduce((s, d) => s + lineTotal(d), 0)
}

/** The labor amount the 65/35 split is computed on: the explicit labor line total when
 *  present, otherwise a fallback for legacy bookings with no labor line — HT minus materials. */
export function getLabourBase(details: ServiceDetail[] | null | undefined, amountTtc: number | null | undefined): number {
  const labourBase = getLaborTotal(details)
  if (labourBase > 0) return labourBase
  const materialsSum = getMaterialsTotal(details)
  return Math.max(0, (amountTtc ?? 0) / 1.2 - materialsSum)
}

/** The mechanic's 65% share of the labour base. */
export function getMechanicShare(details: ServiceDetail[] | null | undefined, amountTtc: number | null | undefined): number {
  return getLabourBase(details, amountTtc) * 0.65
}

/** MecaLIK's 35% share of the labour base. */
export function getMecalikProfit(details: ServiceDetail[] | null | undefined, amountTtc: number | null | undefined): number {
  return getLabourBase(details, amountTtc) * 0.35
}
