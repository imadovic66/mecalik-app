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

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE MATH — TTC-first
//
// CUTOVER NOTE (no data migration):
//   Line items created from this release onward store `unit_price` as **TTC per
//   unit** — the price the customer actually pays, VAT included. Mechanics and
//   admins type TTC; HT and TVA are reverse-calculated for display and for the
//   payout split.
//
//   Bookings created BEFORE this cutover stored HT unit prices. They are NOT
//   migrated: their `amount_ttc` column already holds the correct customer
//   total, and `computeQuoteTotals` falls back to that column whenever a
//   booking has no explicit labour line (see `labourHT` below).
//
// TAX INVARIANT:
//   The 65/35 split runs on the **HT** labour base, never on TTC. TVA is
//   collected on behalf of the state and is never shared with mechanics.
// ─────────────────────────────────────────────────────────────────────────────

export const TVA_RATE = 0.20
/** Divide a TTC amount by this to get HT. */
const TTC_TO_HT = 1 + TVA_RATE

/** Convert any TTC amount to HT. The one place the 1.2 divisor lives. */
export function ttcToHT(ttc: number): number {
  return ttc / TTC_TO_HT
}

/** The TVA component contained within a TTC amount. */
export function tvaOf(ttc: number): number {
  return ttc - ttcToHT(ttc)
}

export type QuoteTotals = {
  /** Sum of material lines, TTC */
  materialsTTC: number
  /** Sum of labour lines, TTC */
  labourTTC: number
  /** Sum of discount lines, TTC */
  discountTTC: number
  /** materialsTTC + labourTTC − discountTTC */
  totalTTC: number
  /** totalTTC / 1.2 */
  totalHT: number
  /** totalTTC − totalHT */
  totalTVA: number
  /** The HT labour base the 65/35 split runs on */
  labourHT: number
  /** labourHT × 0.65 */
  mechanicShare: number
  /** labourHT × 0.35 */
  mecalikShare: number
}

function lineTotal(d: ServiceDetail): number {
  return (Number(d.unit_price) || 0) * (parseFloat(String(d.quantity ?? '1')) || 1)
}

function sumByType(details: ServiceDetail[] | null | undefined, type: string): number {
  return (details ?? [])
    .filter(d => normalizeDetailType(d.type) === type)
    .reduce((s, d) => s + lineTotal(d), 0)
}

/**
 * Single source of truth for every money figure on a quote/booking.
 * Every screen (mechanic editor, admin review, PDFs, finance P&L) must read its
 * totals from here — no local arithmetic.
 *
 * @param details      the booking's service_details line items (unit_price = TTC/unit)
 * @param amountTtc    the booking's stored amount_ttc, used only as the legacy fallback
 *                     for pre-cutover bookings that have no explicit labour line
 */
export function computeQuoteTotals(
  details: ServiceDetail[] | null | undefined,
  amountTtc?: number | null,
): QuoteTotals {
  const materialsTTC = sumByType(details, 'material')
  const labourTTC    = sumByType(details, 'labor')
  const discountTTC  = sumByType(details, 'discount')

  const totalTTC = Math.max(0, materialsTTC + labourTTC - discountTTC)
  const totalHT  = totalTTC / TTC_TO_HT
  const totalTVA = totalTTC - totalHT

  // The split base. Discounts come off labour before the split, so a discount
  // reduces both parties' share proportionally rather than only MecaLIK's.
  let labourHT: number
  if (labourTTC > 0) {
    labourHT = Math.max(0, (labourTTC - discountTTC) / TTC_TO_HT)
  } else {
    // Legacy fallback: pre-cutover booking with no explicit labour line. Derive
    // the labour base from the stored customer total minus materials.
    labourHT = Math.max(0, (amountTtc ?? 0) / TTC_TO_HT - materialsTTC / TTC_TO_HT)
  }

  return {
    materialsTTC,
    labourTTC,
    discountTTC,
    totalTTC,
    totalHT,
    totalTVA,
    labourHT,
    mechanicShare: labourHT * 0.65,
    mecalikShare:  labourHT * 0.35,
  }
}

/**
 * The authoritative customer total for revenue reporting.
 *
 * `amount_ttc` is the stored source of truth: it is written on every quote
 * submit/approval (where it equals `totalTTC`), and for pre-cutover bookings it
 * is the ONLY correct figure — those rows may have HT line items or none at all.
 * Falls back to the line-item total only when the column is empty.
 */
export function getBookingRevenueTTC(
  details: ServiceDetail[] | null | undefined,
  amountTtc: number | null | undefined,
): number {
  const stored = amountTtc ?? 0
  return stored > 0 ? stored : computeQuoteTotals(details).totalTTC
}

/**
 * Same TTC-first math for offline (phone/cash) interventions, which store flat
 * TTC amounts on `offline_interventions` instead of `service_details` line items.
 */
export function computeOfflineTotals(entry: {
  amount_ttc?: number | null
  materials_cost?: number | null
  labor_cost?: number | null
}): { totalTTC: number; totalHT: number; totalTVA: number; materialsHT: number; labourHT: number; mechanicShare: number; mecalikShare: number } {
  const totalTTC     = entry.amount_ttc ?? 0
  const totalHT      = ttcToHT(totalTTC)
  const totalTVA     = totalTTC - totalHT
  const materialsTTC = entry.materials_cost ?? 0
  const labourTTC    = entry.labor_cost ?? 0
  const materialsHT  = ttcToHT(materialsTTC)
  const labourHT = labourTTC > 0
    ? ttcToHT(labourTTC)
    : Math.max(0, totalHT - materialsHT)
  return {
    totalTTC, totalHT, totalTVA, materialsHT, labourHT,
    mechanicShare: labourHT * 0.65,
    mecalikShare:  labourHT * 0.35,
  }
}

/** The mechanic's 65% share of the HT labour base. */
export function getMechanicShare(details: ServiceDetail[] | null | undefined, amountTtc: number | null | undefined): number {
  return computeQuoteTotals(details, amountTtc).mechanicShare
}

/** MecaLIK's 35% share of the HT labour base. */
export function getMecalikProfit(details: ServiceDetail[] | null | undefined, amountTtc: number | null | undefined): number {
  return computeQuoteTotals(details, amountTtc).mecalikShare
}
