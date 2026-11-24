/** Fixed-price catalogue (Supabase tables catalog_* / vehicle_*). Prices are TTC. */
import { supabase } from './supabase'

export type Tier = 'S' | 'M' | 'L'

export type PackagePrice = {
  package_id: string
  slug: string
  name_fr: string
  description_fr: string | null
  tier: Tier | null
  fuel: 'essence' | 'diesel' | null
  is_default: boolean
  sort_order: number
  service_id: string
  service_slug: string
  service_name: string
  price_mode: 'fixed' | 'from' | 'quote'
  service_fee_ttc: number
  parts_ttc: number
  total_ttc: number
  total_ht: number
  mechanic_share_ht: number
  mecalik_margin_ht: number
  parts: { sku: string; name: string; qty: number; unit_ttc: number; line_ttc: number }[]
}

export type VehicleModel = { id: string; brand: string; model: string; tier: Tier; fuel: string | null }
export type VehicleTier = { code: Tier; label_fr: string; examples: string | null; sort_order: number }

export type Catalog = { packages: PackagePrice[]; models: VehicleModel[]; tiers: VehicleTier[] }

let cache: Promise<Catalog> | null = null

export function loadCatalog(force = false): Promise<Catalog> {
  if (cache && !force) return cache
  cache = (async () => {
    const [p, m, t] = await Promise.all([
      supabase.from('catalog_package_prices').select('*').order('sort_order'),
      supabase.from('vehicle_models').select('id, brand, model, tier, fuel').order('brand').order('model'),
      supabase.from('vehicle_tiers').select('*').order('sort_order'),
    ])
    if (p.error) throw p.error
    const num = (x: unknown) => Number(x ?? 0)
    const packages = (p.data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      service_fee_ttc: num(r.service_fee_ttc), parts_ttc: num(r.parts_ttc), total_ttc: num(r.total_ttc),
      total_ht: num(r.total_ht), mechanic_share_ht: num(r.mechanic_share_ht), mecalik_margin_ht: num(r.mecalik_margin_ht),
      parts: Array.isArray(r.parts) ? r.parts : [],
    })) as PackagePrice[]
    return { packages, models: (m.data ?? []) as VehicleModel[], tiers: (t.data ?? []) as VehicleTier[] }
  })()
  cache.catch(() => { cache = null })
  return cache
}

/** Booking-modal service ids → catalogue service slugs */
export const SERVICE_TO_SLUG: Record<string, string> = {
  vidange: 'vidange', batterie: 'batterie', diagnostic: 'diagnostic', urgence: 'urgence',
}

/** Packages a given car can take: tier-specific first, then tier-agnostic; fuel filter for vidange filters */
export function packagesFor(cat: Catalog, serviceSlug: string, tier: Tier | null, fuel: string | null): PackagePrice[] {
  return cat.packages
    .filter(p => p.service_slug === serviceSlug)
    .filter(p => !p.tier || !tier || p.tier === tier)
    .filter(p => !p.fuel || !fuel || p.fuel === fuel)
    .sort((a, b) => a.sort_order - b.sort_order || a.total_ttc - b.total_ttc)
}

/** Lowest price for a service, for "dès X MAD" labels */
export function fromPrice(cat: Catalog, serviceSlug: string): number | null {
  const list = cat.packages.filter(p => p.service_slug === serviceSlug)
  if (!list.length) return null
  return Math.min(...list.map(p => p.total_ttc))
}

export const fmtMAD = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ')} MAD`
