/** Shared pricing/payout math for service_details-based bookings.
 *  Single source of truth for "mechanic's 65% share" — used by the mechanic's
 *  job card, the quote editor, the Gains tab, and the admin approval panel. */

import { normalizeDetailType, type ServiceDetail } from '../pages/admin/adminShared'

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
