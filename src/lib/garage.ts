/** "Mon garage" data access. Guests use their private token; logged-in customers pass null (session). */
import { supabase } from './supabase'

export type Maint = {
  id: string; car_id: string; item: string; label: string
  interval_km: number | null; interval_months: number | null
  last_done_date: string | null; last_done_km: number | null
  est_km: number | null; next_km: number | null; next_date: string | null
  km_left: number | null; days_left: number | null
  status: 'overdue' | 'soon' | 'ok' | 'unknown'
}
export type Doc = {
  id: string; car_id: string; doc_type: DocType; reference: string | null; provider: string | null
  issue_date: string | null; expiry_date: string | null; amount: number | null; notes: string | null; days_left: number | null
  files?: DocFile[]
}
export type DocFile = { path: string; name: string; type: string; size: number; uploaded_at: string; url?: string | null }
export type LogEntry = {
  id: string; car_id: string; service_name: string; service_date: string; mileage: number | null; provider: string | null
  cost: number | null; notes: string | null; source: 'mecalik' | 'external' | null; category: Category | null
  liters: number | null; booking_id: string | null
}
export type Car = {
  id: string; brand: string; model: string | null; year: number | null; license_plate: string | null; mileage: number | null
  fuel_type: string | null; color: string | null; vin: string | null; first_registration: string | null
  vehicle_model_id: string | null; notes: string | null; km_per_day: number | null; mileage_updated_at: string | null
}
export type CarBundle = {
  car: Car; model_tier: string | null; est_km: number | null
  documents: Doc[]; maintenance: Maint[]; history: LogEntry[]
  spend_12m: number; spend_total: number
  bookings: { reference: string; service_name: string; status: string; created_at: string; price: number | null }[]
}
export type GarageData = {
  garage: { id: string; name: string | null; phone: string | null; linked: boolean; is_mine: boolean; token: string }
  cars: CarBundle[]
}

export type DocType = 'assurance' | 'vignette' | 'visite_technique' | 'carte_grise' | 'autre'
export type Category = 'entretien' | 'reparation' | 'carburant' | 'pneus' | 'lavage' | 'kilometrage' | 'papiers' | 'autre'

export const DOC_TYPES: { id: DocType; label: string; hint: string }[] = [
  { id: 'assurance',        label: 'Assurance',        hint: "Date de fin du contrat d'assurance" },
  { id: 'vignette',         label: 'Vignette',         hint: 'Date limite de paiement de la prochaine vignette' },
  { id: 'visite_technique', label: 'Visite technique', hint: 'Date de la prochaine visite technique' },
  { id: 'carte_grise',      label: 'Carte grise',      hint: 'Numéro et date (pas de date de fin en général)' },
]

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'entretien',   label: 'Entretien',  icon: '🔧' },
  { id: 'reparation',  label: 'Réparation', icon: '🛠️' },
  { id: 'carburant',   label: 'Carburant',  icon: '⛽' },
  { id: 'pneus',       label: 'Pneus',      icon: '🛞' },
  { id: 'lavage',      label: 'Lavage',     icon: '🧽' },
  { id: 'papiers',     label: 'Papiers',    icon: '📄' },
  { id: 'kilometrage', label: 'Kilométrage', icon: '📍' },
  { id: 'autre',       label: 'Autre',      icon: '•' },
]

const ERRORS: Record<string, string> = {
  garage_not_found: 'Ce lien de garage est invalide ou a expiré.',
  not_authenticated: 'Connectez-vous pour accéder à votre garage.',
  car_not_in_garage: "Ce véhicule n'appartient pas à ce garage.",
  mecalik_entry_locked: 'Les interventions MecaLIK ne peuvent pas être modifiées.',
  garage_linked_to_other_account: 'Ce garage est déjà lié à un autre compte.',
  too_large: 'Fichier trop lourd (8 Mo maximum).',
  bad_type: 'Format accepté : photo (JPG, PNG) ou PDF.',
  too_many_files: 'Maximum 10 fichiers par document.',
}
export function garageError(e: unknown): string {
  const msg = (e as { message?: string })?.message || String(e)
  const key = Object.keys(ERRORS).find(k => msg.includes(k))
  return key ? ERRORS[key] : 'Une erreur est survenue. Réessayez.'
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const garageApi = (token: string | null) => ({
  load:            () => call<GarageData>('garage_data', { p_token: token }),
  saveCar:         (p: Partial<Car>) => call<string>('garage_save_car', { p_token: token, p }),
  archiveCar:      (id: string) => call<boolean>('garage_archive_car', { p_token: token, p_car: id }),
  saveDocument:    (p: Partial<Doc> & { car_id?: string }) => call<string>('garage_save_document', { p_token: token, p }),
  deleteDocument:  (id: string) => call<boolean>('garage_delete_document', { p_token: token, p_id: id }),
  saveMaintenance: (p: Record<string, unknown>) => call<string>('garage_save_maintenance', { p_token: token, p }),
  saveLog:         (p: Record<string, unknown>) => call<string>('garage_save_log', { p_token: token, p }),
  deleteLog:       (id: string) => call<boolean>('garage_delete_log', { p_token: token, p_id: id }),
})

export const linkGarageToAccount = (token: string) => call<boolean>('garage_link_account', { p_token: token })

export type AdminVehicle = {
  id: string; brand: string; model: string | null; year: number | null; license_plate: string | null; fuel_type: string | null
  mileage: number | null; est_km: number | null; created_at: string
  owner_name: string | null; owner_phone: string | null; token: string; has_account: boolean
  bookings_count: number; last_mecalik: string | null; mecalik_revenue: number
  due: { label: string; status: string; km_left: number | null; days_left: number | null }[] | null
  docs_due: { doc_type: DocType; expiry_date: string; days_left: number }[] | null
  unknown_count: number; urgency: number
}
export const loadAdminVehicles = () => call<AdminVehicle[]>('admin_vehicles', {})

// ── formatting ──
export const fmtKm = (n: number | null | undefined) => n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ')} km`
export const fmtMoney = (n: number | null | undefined) => n == null ? '—' : `${Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ')} MAD`
export const fmtDate = (d: string | null | undefined) => d ? new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
export const daysText = (n: number | null | undefined) => n == null ? '' : n < 0 ? `il y a ${-n} j` : n === 0 ? "aujourd'hui" : `dans ${n} j`
export const carName = (c: Pick<Car, 'brand' | 'model' | 'year'>) => `${c.brand}${c.model ? ' ' + c.model : ''}${c.year ? ' ' + c.year : ''}`
export const docLabel = (t: DocType) => DOC_TYPES.find(d => d.id === t)?.label ?? 'Document'

export function dueText(m: Pick<Maint, 'km_left' | 'days_left' | 'status'>) {
  if (m.status === 'unknown') return 'À renseigner'
  const parts: string[] = []
  if (m.km_left != null) parts.push(m.km_left <= 0 ? `dépassé de ${fmtKm(-m.km_left)}` : `dans ${fmtKm(m.km_left)}`)
  if (m.days_left != null) parts.push(m.days_left <= 0 ? `en retard de ${-m.days_left} j` : `dans ${m.days_left} j`)
  return parts.join(' · ')
}

export const STATUS_COLOR: Record<string, string> = { overdue: '#FF6B6B', soon: '#F0C040', ok: '#00DD88', unknown: 'rgba(255,255,255,0.35)' }
export const STATUS_LABEL: Record<string, string> = { overdue: 'En retard', soon: 'Bientôt', ok: 'OK', unknown: 'À renseigner' }

export const waNumber = (phone: string | null | undefined) => {
  let d = (phone || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '212' + d.slice(1)
  else if (d.length === 9) d = '212' + d
  return d
}
export const garageUrl = (token: string) => `https://mecalik.com/garage/${token}`

// ── Photos / PDFs of papers (private storage, short-lived links) ──
async function docsFn(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('garage-docs', { body })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return (data?.files ?? []) as DocFile[]
}
export const signDocFiles = (token: string | null, docId: string) => docsFn({ action: 'sign', token, doc_id: docId })
export const deleteDocFile = (token: string | null, docId: string, path: string) => docsFn({ action: 'delete', token, doc_id: docId, path })

const readAsDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(b) })

/** Phone photos are large: resize to 1600 px and re-encode as JPEG before upload. PDFs go as-is. */
async function prepareFile(file: File): Promise<{ base64: string; type: string; name: string }> {
  if (file.type === 'application/pdf') {
    if (file.size > 8 * 1024 * 1024) throw new Error('too_large')
    return { base64: await readAsDataUrl(file), type: file.type, name: file.name }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('encode')), 'image/jpeg', 0.82))
    return { base64: await readAsDataUrl(blob), type: 'image/jpeg', name: file.name.replace(/\.[^.]+$/, '') + '.jpg' }
  } finally { URL.revokeObjectURL(url) }
}
export async function uploadDocFile(token: string | null, docId: string, file: File) {
  const f = await prepareFile(file)
  return docsFn({ action: 'upload', token, doc_id: docId, file_base64: f.base64, file_type: f.type, file_name: f.name })
}
