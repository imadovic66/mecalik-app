/** Period filter shared by the Finances tab sections (P&L, invoices, mechanic pay). */

export type Period = 'month' | 'quarter' | 'year' | 'all'

export const PERIOD_OPTS: { key: Period; label: string }[] = [
  { key: 'month',   label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year',    label: 'Cette année' },
  { key: 'all',     label: 'Tout' },
]

/** Parse a date-only 'YYYY-MM-DD' as LOCAL midnight (new Date() would read it as UTC,
 *  which shifts it to the previous day west of Greenwich). Timestamps parse normally. */
function parseLocal(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr)
}

export function inPeriod(dateStr: string, period: Period): boolean {
  if (period === 'all') return true
  const d = parseLocal(dateStr)
  const now = new Date()
  if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === 'year') return d.getFullYear() === now.getFullYear()
  if (period === 'quarter') {
    return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear()
  }
  return true
}

export function getPeriodLabel(p: Period): string {
  const now = new Date()
  if (p === 'month')   return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  if (p === 'quarter') return `T${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
  if (p === 'year')    return `Année ${now.getFullYear()}`
  return 'Toutes périodes'
}

export function PeriodPills({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px', gap: '2px', flexWrap: 'wrap' }}>
      {PERIOD_OPTS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: 'none',
            background: value === p.key ? '#43BCC9' : 'transparent',
            color: value === p.key ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
          }}
        >{p.label}</button>
      ))}
    </div>
  )
}
