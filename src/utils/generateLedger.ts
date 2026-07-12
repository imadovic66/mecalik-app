import * as XLSX from 'xlsx'

const LEGACY: Record<string, string> = { product: 'material', part: 'material' }

function parseDetails(details: any[]): { mats: number; labor: number } {
  const cats = (details ?? []).map((d: any) => {
    const t = LEGACY[d.type] ?? d.type
    const qty = parseFloat(String(d.quantity ?? '1')) || 1
    const line = (Number(d.unit_price) || 0) * qty
    return { type: t as string, line }
  })
  return {
    mats:  cats.filter(c => c.type === 'material').reduce((s, c) => s + c.line, 0),
    labor: cats.filter(c => c.type === 'labor').reduce((s, c) => s + c.line, 0),
  }
}

type BookingEntry = {
  id: string
  created_at: string
  service_name: string
  amount_ttc: number
  reference?: string | null
  profiles?: { full_name: string | null } | null
  service_details?: any[] | null
}

type OfflineEntry = {
  id: string
  date: string
  service_name: string
  client_name: string | null
  amount_ttc: number
  materials_cost: number
  labor_cost: number | null
}

type ExpenseEntry = {
  id: string
  date: string
  category: string
  description: string
  vendor: string | null
  amount_ttc: number
  amount_ht: number | null
  notes: string | null
}

export type LedgerData = {
  periodLabel: string
  bookings: BookingEntry[]
  offline: OfflineEntry[]
  expenses: ExpenseEntry[]
}

type SortableRow = { date: string; row: (string | number)[] }

const HEADERS = [
  'Date', 'Type', 'Référence', 'Description', 'Catégorie',
  'Vendeur / Client', 'TTC (MAD)', 'HT (MAD)', 'TVA (MAD)',
  'Matériaux (MAD)', "Main d'œuvre (MAD)",
]

export function generateLedger(data: LedgerData): void {
  const sortable: SortableRow[] = []

  for (const b of data.bookings) {
    const ttc = b.amount_ttc || 0
    const ht  = ttc / 1.2
    const tva = ttc - ht
    const { mats, labor } = parseDetails(b.service_details ?? [])
    const labFallback = labor > 0 ? labor : Math.max(0, ht - mats)
    const client = b.profiles?.full_name ?? '—'
    sortable.push({
      date: new Date(b.created_at).toISOString().slice(0, 10),
      row: [
        new Date(b.created_at).toISOString().slice(0, 10),
        'Réservation',
        (b.reference || b.id.slice(0, 8).toUpperCase()),
        `${b.service_name} — ${client}`,
        mats >= labor ? 'Matériau' : "Main d'œuvre",
        client,
        +ttc.toFixed(2), +ht.toFixed(2), +tva.toFixed(2),
        +mats.toFixed(2), +labFallback.toFixed(2),
      ],
    })
  }

  for (const e of data.offline) {
    const ttc  = e.amount_ttc || 0
    const ht   = ttc / 1.2
    const tva  = ttc - ht
    const mats = e.materials_cost || 0
    const lab  = (e.labor_cost ?? 0) > 0 ? (e.labor_cost ?? 0) : Math.max(0, ht - mats)
    sortable.push({
      date: e.date,
      row: [
        e.date, 'Offline', 'OFFLINE',
        `${e.service_name} — ${e.client_name || 'Client'}`,
        'Cash', e.client_name || '—',
        +ttc.toFixed(2), +ht.toFixed(2), +tva.toFixed(2),
        +mats.toFixed(2), +lab.toFixed(2),
      ],
    })
  }

  for (const exp of data.expenses) {
    const ttc = exp.amount_ttc || 0
    const ht  = exp.amount_ht ?? ttc / 1.2
    const tva = ttc - ht
    sortable.push({
      date: exp.date,
      row: [
        exp.date, 'Charge', '—',
        exp.description + (exp.notes ? ` (${exp.notes})` : ''),
        exp.category, exp.vendor || '—',
        +(-ttc).toFixed(2), +(-ht).toFixed(2), +(-tva).toFixed(2), '', '',
      ],
    })
  }

  sortable.sort((a, b) => b.date.localeCompare(a.date))

  const rows: (string | number)[][] = [HEADERS, ...sortable.map(s => s.row)]

  // Totals
  const sumCol = (i: number) => sortable.reduce((s, r) => s + (typeof r.row[i] === 'number' ? (r.row[i] as number) : 0), 0)
  rows.push([
    'TOTAL', '', '', `${data.periodLabel}`, '', '',
    +sumCol(6).toFixed(2), +sumCol(7).toFixed(2), +sumCol(8).toFixed(2),
    +sumCol(9).toFixed(2), +sumCol(10).toFixed(2),
  ])

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  ws['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 42 }, { wch: 18 },
    { wch: 24 }, { wch: 13 }, { wch: 13 }, { wch: 11 }, { wch: 14 }, { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Grand Livre')

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `grand-livre-mecalik-${dateStr}.xlsx`)
}
