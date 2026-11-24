/** TVA panel — TVA collected on invoices vs deductible on purchases, and the net to remit. */

import { type Invoice, sumInvoiceTotals } from '../../../../lib/invoices'
import { tvaOf } from '../../../../lib/bookingUtils'
import { fmtMAD, cardStyle } from './ui'

/** Expense categories with no recoverable TVA: salaries are outside the scope of TVA,
 *  and insurance premiums bear the taxe sur les contrats d'assurance instead. */
const NO_VAT_CATEGORIES = new Set(['salaires', 'insurance'])

type ExpenseLike = { category: string; amount_ttc: number; amount_ht: number | null }

interface Props {
  /** Billable invoices already filtered to the period. */
  invoices: Invoice[]
  /** Expenses already filtered to the period. */
  expenses: ExpenseLike[]
  periodLabel: string
}

export default function TvaPanel({ invoices, expenses, periodLabel }: Props) {
  const totals = sumInvoiceTotals(invoices)
  const collected = totals.totalTVA

  // TVA paid on parts bought for jobs (materials are billed TTC, so the TVA inside them).
  const onMaterials = tvaOf(totals.materialsTTC)
  // TVA on operating expenses — trust a manually entered HT when present.
  const onExpenses = expenses
    .filter(e => !NO_VAT_CATEGORIES.has(e.category))
    .reduce((s, e) => s + (e.amount_ht != null ? Math.max(0, e.amount_ttc - e.amount_ht) : tvaOf(e.amount_ttc)), 0)

  const deductible = onMaterials + onExpenses
  const net = collected - deductible

  const row = (label: string, value: number, color: string, sub = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: sub ? '2px 0 2px 12px' : '5px 0' }}>
      <span style={{ fontSize: sub ? '11px' : '12.5px', color: sub ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span style={{ fontSize: sub ? '11px' : '13px', fontWeight: sub ? 500 : 700, color, fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap' }}>{fmtMAD(value)}</span>
    </div>
  )

  return (
    <div style={{ flex: '0 1 360px', minWidth: 'min(100%, 300px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px', gap: '10px', minHeight: '37px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>🧾 TVA</h2>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{periodLabel}</span>
      </div>

      <div style={{ ...cardStyle, padding: '18px 20px', borderColor: 'rgba(240,192,64,0.25)' }}>
        {row('TVA collectée (sur factures)', collected, 'white')}
        {row('TVA déductible (sur achats)', deductible, '#00DD88')}
        {row('dont pièces / matériaux', onMaterials, 'rgba(255,255,255,0.45)', true)}
        {row("dont charges d'exploitation", onExpenses, 'rgba(255,255,255,0.45)', true)}

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {net >= 0 ? 'TVA nette à reverser' : 'Crédit de TVA'}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#F0C040', fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap' }}>
            {fmtMAD(Math.abs(net))}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '12px', lineHeight: 1.45 }}>
          La TVA déductible nécessite des factures fournisseurs avec ICE.
          <br />Salaires et assurances exclus (pas de TVA récupérable).
        </div>
      </div>
    </div>
  )
}
