/** Paie mécaniciens — what MecaLIK owes each technician, grouped from invoices.
 *  Each technician's due is the sum of their 65% share of the HT labour base
 *  (via computeQuoteTotals), split into already-paid and still-owed. */

import { useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { type Invoice, invoiceTotals, sumInvoiceTotals, isBillable, formatInvoiceDate } from '../../../../lib/invoices'
import { type Period, inPeriod, getPeriodLabel, PeriodPills } from './period'
import { fmtMAD, cardStyle } from './ui'

interface Props {
  invoices: Invoice[]
  onChanged: () => void
}

type Group = {
  key: string
  name: string
  assigned: boolean
  invoices: Invoice[]
  labourHT: number
  share: number
  paid: number
  due: number
}

const UNASSIGNED = '__unassigned__'

export default function MechanicPayrollSection({ invoices, onChanged }: Props) {
  // Default to "Tout": a debt from last month is still a debt — hiding it behind
  // "Ce mois" is how a technician goes unpaid.
  const [period, setPeriod] = useState<Period>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Invoice[]>()
    invoices
      .filter(isBillable)
      .filter(inv => inPeriod(inv.invoice_date, period))
      .forEach(inv => {
        const key = inv.technician_name?.trim() || UNASSIGNED
        map.set(key, [...(map.get(key) ?? []), inv])
      })

    return [...map.entries()].map(([key, invs]) => {
      const sorted = [...invs].sort((a, b) => b.invoice_date.localeCompare(a.invoice_date) || b.invoice_number.localeCompare(a.invoice_number))
      const all  = sumInvoiceTotals(sorted)
      const paid = sumInvoiceTotals(sorted.filter(i => i.mechanic_paid))
      const due  = sumInvoiceTotals(sorted.filter(i => !i.mechanic_paid))
      return {
        key,
        name: key === UNASSIGNED ? 'Non assigné' : key,
        assigned: key !== UNASSIGNED,
        invoices: sorted,
        labourHT: all.labourHT,
        share: all.mechanicShare,
        paid: paid.mechanicShare,
        due: due.mechanicShare,
      }
    }).sort((a, b) => Number(b.assigned) - Number(a.assigned) || b.due - a.due || a.name.localeCompare(b.name))
  }, [invoices, period])

  const totalDue  = groups.reduce((s, g) => s + g.due, 0)
  const totalPaid = groups.reduce((s, g) => s + g.paid, 0)

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const markPaid = async (g: Group) => {
    const unpaid = g.invoices.filter(i => !i.mechanic_paid)
    const picked = unpaid.filter(i => selected.has(i.id))
    const targets = picked.length > 0 ? picked : unpaid
    if (targets.length === 0) return
    const amount = sumInvoiceTotals(targets).mechanicShare
    const ok = window.confirm(
      `Marquer ${targets.length} facture(s) comme payée(s) à ${g.name} ?\n\nMontant versé : ${fmtMAD(amount)}`,
    )
    if (!ok) return

    setBusy(g.key)
    const { error } = await supabase.from('invoices')
      .update({ mechanic_paid: true, mechanic_paid_at: new Date().toISOString() })
      .in('id', targets.map(i => i.id))
      .eq('mechanic_paid', false)
    setBusy(null)
    if (error) { window.alert(`Échec de l'enregistrement du paiement : ${error.message}`); return }
    setSelected(prev => {
      const next = new Set(prev)
      targets.forEach(i => next.delete(i.id))
      return next
    })
    onChanged()
  }

  const exportStatement = async (g: Group) => {
    setExporting(g.key)
    try {
      const { generateMechanicStatement } = await import('../../../../utils/generateMechanicStatement')
      generateMechanicStatement({
        mechanicName: g.name,
        periodLabel: getPeriodLabel(period),
        rows: g.invoices.map(inv => {
          const t = invoiceTotals(inv)
          return {
            invoiceNumber: inv.invoice_number,
            date: formatInvoiceDate(inv.invoice_date),
            client: inv.customer_name || '—',
            labourHT: t.labourHT,
            share: t.mechanicShare,
            paid: inv.mechanic_paid,
            paidAt: inv.mechanic_paid_at ? formatInvoiceDate(inv.mechanic_paid_at) : null,
          }
        }),
        totals: { labourHT: g.labourHT, share: g.share, paid: g.paid, due: g.due },
      })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div style={{ flex: '1 1 540px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>🔧 Paie mécaniciens</h2>
        <PeriodPills value={period} onChange={setPeriod} />
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <div style={{ ...cardStyle, padding: '16px 18px', borderColor: 'rgba(67,188,201,0.3)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Total à payer</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(totalDue)}</div>
        </div>
        <div style={{ ...cardStyle, padding: '16px 18px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Déjà payé</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#00DD88', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(totalPaid)}</div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ ...cardStyle, padding: '28px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
          Aucune facture sur la période — {getPeriodLabel(period)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {groups.map(g => {
            const isOpen = expanded.has(g.key)
            const selectedHere = g.invoices.filter(i => !i.mechanic_paid && selected.has(i.id))
            const selectedAmount = sumInvoiceTotals(selectedHere).mechanicShare
            return (
              <div key={g.key} style={{ ...cardStyle, padding: '16px 18px', borderColor: g.assigned ? 'rgba(255,255,255,0.08)' : 'rgba(255,68,68,0.3)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: g.assigned ? 'white' : '#FF8888' }}>{g.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
                      {g.invoices.length} intervention{g.invoices.length > 1 ? 's' : ''} · {fmtMAD(g.labourHT)} de main d'œuvre HT
                    </div>
                    {!g.assigned && (
                      <div style={{ fontSize: '11px', color: '#FF8888', marginTop: '4px' }}>Assignez un technicien à ces factures (✏️ Modifier) pour pouvoir les régler.</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: g.due > 0 ? '#43BCC9' : 'rgba(255,255,255,0.4)', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(g.due)}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>à payer · sur {fmtMAD(g.share)}</div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(prev => toggle(prev, g.key))}
                  style={{ marginTop: '10px', background: 'none', border: 'none', padding: 0, color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  {isOpen ? '▾ Masquer les factures' : `▸ Voir les ${g.invoices.length} factures`}
                </button>

                {/* Invoice list */}
                {isOpen && (
                  <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['', 'N° facture', 'Date', 'Client', 'MO HT', 'Part 65%'].map((h, i) => (
                            <th key={i} style={{ padding: '6px 8px', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 4 ? 'right' : 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.invoices.map(inv => {
                          const t = invoiceTotals(inv)
                          const cell: React.CSSProperties = { padding: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }
                          return (
                            <tr key={inv.id} style={{ opacity: inv.mechanic_paid ? 0.55 : 1 }}>
                              <td style={{ ...cell, width: '28px' }}>
                                {inv.mechanic_paid ? (
                                  <span title={inv.mechanic_paid_at ? `Payé le ${formatInvoiceDate(inv.mechanic_paid_at)}` : 'Payé'} style={{ color: '#00DD88' }}>✓</span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={selected.has(inv.id)}
                                    disabled={!g.assigned}
                                    onChange={() => setSelected(prev => toggle(prev, inv.id))}
                                    style={{ width: '16px', height: '16px', accentColor: '#43BCC9', cursor: 'pointer' }}
                                  />
                                )}
                              </td>
                              <td style={{ ...cell, fontFamily: 'monospace', color: 'white' }}>{inv.invoice_number}</td>
                              <td style={cell}>{formatInvoiceDate(inv.invoice_date)}</td>
                              <td style={{ ...cell, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.customer_name || '—'}</td>
                              <td style={{ ...cell, textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(t.labourHT)}</td>
                              <td style={{ ...cell, textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: inv.mechanic_paid ? '#00DD88' : 'white' }}>{fmtMAD(t.mechanicShare)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      <span>Déjà payé</span><span style={{ color: '#00DD88', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(g.paid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '14px', fontWeight: 800, color: 'white' }}>
                      <span>Reste à payer</span><span style={{ color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{fmtMAD(g.due)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => exportStatement(g)}
                      disabled={exporting === g.key}
                      style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                    >
                      {exporting === g.key ? 'Export…' : '📄 Exporter le relevé'}
                    </button>
                    <button
                      onClick={() => markPaid(g)}
                      disabled={!g.assigned || g.due <= 0 || busy === g.key}
                      style={{
                        padding: '9px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                        background: !g.assigned || g.due <= 0 ? 'rgba(0,221,136,0.15)' : '#00DD88',
                        color: !g.assigned || g.due <= 0 ? 'rgba(0,221,136,0.5)' : '#0A0A0A',
                        cursor: !g.assigned || g.due <= 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busy === g.key
                        ? 'Enregistrement…'
                        : selectedHere.length > 0
                          ? `✅ Marquer payé (${selectedHere.length} · ${fmtMAD(selectedAmount)})`
                          : '✅ Marquer comme payé'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
