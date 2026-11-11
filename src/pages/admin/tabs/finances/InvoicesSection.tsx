/** Factures — the persisted invoice register: filterable table, PDF re-print, edit, mark paid. */

import { useMemo, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import {
  type Invoice, type PaymentStatus, PAYMENT_STATUS_CONFIG,
  invoiceTotals, sumInvoiceTotals, isBillable, printInvoiceDocument, formatInvoiceDate,
} from '../../../../lib/invoices'
import { inPeriod } from './period'
import { fmtMAD, PaymentPill, PAYMENT_METHODS, inputStyle, labelStyle, cardStyle, pillButton } from './ui'

type Filter = 'all' | 'unpaid' | 'paid' | 'month'
type Mechanic = { id: string; full_name: string | null }

const FILTERS: { key: Filter; label: string; test: (i: Invoice) => boolean }[] = [
  { key: 'all',    label: 'Toutes',     test: () => true },
  { key: 'unpaid', label: 'Non payées', test: i => i.payment_status === 'unpaid' },
  { key: 'paid',   label: 'Payées',     test: i => i.payment_status === 'paid' },
  { key: 'month',  label: 'Ce mois',    test: i => inPeriod(i.invoice_date, 'month') },
]

interface Props {
  invoices: Invoice[]
  mechanics: Mechanic[]
  loading: boolean
  error: string | null
  onNew: () => void
  onChanged: () => void
}

const th: React.CSSProperties = {
  padding: '10px 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
}
const td: React.CSSProperties = {
  padding: '10px 12px', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)',
  borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap',
}
const num: React.CSSProperties = { ...td, textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif' }
const actionBtn: React.CSSProperties = {
  padding: '5px 9px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', fontSize: '11px',
  fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
}

export default function InvoicesSection({ invoices, mechanics, loading, error, onNew, onChanged }: Props) {
  const [open, setOpen] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const test = FILTERS.find(f => f.key === filter)!.test
    return invoices
      .filter(test)
      .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date) || b.invoice_number.localeCompare(a.invoice_number))
  }, [invoices, filter])

  const footer = sumInvoiceTotals(rows.filter(isBillable))

  const markPaid = async (inv: Invoice) => {
    setBusyId(inv.id)
    const { error: err } = await supabase.from('invoices')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', inv.id)
      .eq('payment_status', 'unpaid')
    setBusyId(null)
    if (err) { window.alert(`Impossible de marquer la facture comme payée : ${err.message}`); return }
    onChanged()
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', width: '10px' }}>{open ? '▾' : '▸'}</span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>🧾 Factures ({invoices.length})</h2>
        </button>
        <button onClick={onNew} style={{ padding: '9px 16px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
          📄 Nouvelle facture
        </button>
      </div>

      {open && (
        <>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={pillButton(filter === f.key)}>
                {f.label} <span style={{ opacity: 0.6 }}>({invoices.filter(f.test).length})</span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF8888', fontSize: '12px' }}>
              Impossible de charger les factures : {error}
            </div>
          )}

          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1060px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>N°</th>
                  <th style={th}>Date</th>
                  <th style={th}>Client</th>
                  <th style={th}>Technicien</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total TTC</th>
                  <th style={{ ...th, textAlign: 'right' }}>dont TVA</th>
                  <th style={{ ...th, textAlign: 'right' }}>Part méca</th>
                  <th style={{ ...th, textAlign: 'right' }}>Profit</th>
                  <th style={th}>Paiement</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={10} style={{ ...td, textAlign: 'center', padding: '28px', color: 'rgba(255,255,255,0.35)' }}>Chargement…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10} style={{ ...td, textAlign: 'center', padding: '28px', color: 'rgba(255,255,255,0.35)' }}>Aucune facture pour ce filtre</td></tr>
                ) : rows.map(inv => {
                  const t = invoiceTotals(inv)
                  const void_ = !isBillable(inv)
                  return (
                    <tr key={inv.id} style={{ opacity: void_ ? 0.45 : 1 }}>
                      <td style={{ ...td, fontFamily: 'monospace', color: 'white' }}>{inv.invoice_number}</td>
                      <td style={td}>{formatInvoiceDate(inv.invoice_date)}</td>
                      <td style={{ ...td, color: 'white', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.customer_name || '—'}</td>
                      <td style={td}>{inv.technician_name || <span style={{ color: '#FF8888' }}>Non assigné</span>}</td>
                      <td style={{ ...num, color: 'white', fontWeight: 700, textDecoration: void_ ? 'line-through' : 'none' }}>{fmtMAD(t.totalTTC)}</td>
                      <td style={{ ...num, color: '#F0C040' }}>{fmtMAD(t.totalTVA)}</td>
                      <td style={{ ...num, color: '#FF6B6B' }}>{fmtMAD(t.mechanicShare)}</td>
                      <td style={{ ...num, color: '#43BCC9' }}>{fmtMAD(t.mecalikShare)}</td>
                      <td style={td}><PaymentPill status={inv.payment_status} /></td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button style={actionBtn} onClick={() => printInvoiceDocument(inv)}>📄 PDF</button>
                          <button style={actionBtn} onClick={() => setEditing(inv)}>✏️ Modifier</button>
                          {inv.payment_status === 'unpaid' && (
                            <button
                              style={{ ...actionBtn, borderColor: 'rgba(0,221,136,0.3)', color: '#00DD88', background: 'rgba(0,221,136,0.07)', opacity: busyId === inv.id ? 0.5 : 1 }}
                              disabled={busyId === inv.id}
                              onClick={() => markPaid(inv)}
                            >
                              {busyId === inv.id ? '…' : '💰 Marquer payé'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ ...td, fontWeight: 700, color: 'rgba(255,255,255,0.5)', borderBottom: 'none' }}>
                      Total ({rows.filter(isBillable).length} facture{rows.filter(isBillable).length > 1 ? 's' : ''}, hors annulées)
                    </td>
                    <td style={{ ...num, color: 'white', fontWeight: 800, borderBottom: 'none' }}>{fmtMAD(footer.totalTTC)}</td>
                    <td style={{ ...num, color: '#F0C040', fontWeight: 700, borderBottom: 'none' }}>{fmtMAD(footer.totalTVA)}</td>
                    <td style={{ ...num, color: '#FF6B6B', fontWeight: 700, borderBottom: 'none' }}>{fmtMAD(footer.mechanicShare)}</td>
                    <td style={{ ...num, color: '#43BCC9', fontWeight: 700, borderBottom: 'none' }}>{fmtMAD(footer.mecalikShare)}</td>
                    <td colSpan={2} style={{ ...td, borderBottom: 'none' }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {editing && (
        <EditInvoiceModal
          invoice={editing}
          mechanics={mechanics}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function EditInvoiceModal({ invoice, mechanics, onClose, onSaved }: {
  invoice: Invoice
  mechanics: Mechanic[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    customer_name:    invoice.customer_name ?? '',
    customer_phone:   invoice.customer_phone ?? '',
    customer_address: invoice.customer_address ?? '',
    customer_ice:     invoice.customer_ice ?? '',
    technician_name:  invoice.technician_name ?? '',
    payment_status:   invoice.payment_status,
    payment_method:   invoice.payment_method ?? '',
    notes:            invoice.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }))

  // A legacy technician name that isn't a current mechanic profile must stay selectable.
  const mechanicNames = mechanics.map(m => m.full_name).filter((n): n is string => !!n)
  if (invoice.technician_name && !mechanicNames.includes(invoice.technician_name)) mechanicNames.unshift(invoice.technician_name)

  // Once the mechanic's share has been paid out, reassigning the job would silently
  // move money that already changed hands — lock it.
  const techLocked = invoice.mechanic_paid

  const save = async () => {
    if (!form.customer_name.trim()) { setError('Le nom du client est requis.'); return }
    if (!form.technician_name) { setError('Le technicien est requis — la part mécanicien en dépend.'); return }
    setSaving(true)
    setError(null)
    const becamePaid = form.payment_status === 'paid' && invoice.payment_status !== 'paid'
    const leftPaid   = form.payment_status !== 'paid' && invoice.payment_status === 'paid'
    const { error: err } = await supabase.from('invoices').update({
      customer_name:    form.customer_name.trim(),
      customer_phone:   form.customer_phone.trim() || null,
      customer_address: form.customer_address.trim() || null,
      customer_ice:     form.customer_ice.trim() || null,
      technician_name:  form.technician_name,
      payment_status:   form.payment_status,
      payment_method:   form.payment_method || null,
      notes:            form.notes.trim() || null,
      ...(becamePaid ? { paid_at: new Date().toISOString() } : {}),
      ...(leftPaid ? { paid_at: null } : {}),
    }).eq('id', invoice.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '580px', background: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>✏️ Modifier la facture</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, fontFamily: 'monospace' }}>{invoice.invoice_number}</p>
          </div>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div><label style={labelStyle}>Nom / Société *</label><input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Téléphone</label><input type="tel" inputMode="tel" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Adresse</label><input value={form.customer_address} onChange={e => set('customer_address', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>ICE</label><input value={form.customer_ice} onChange={e => set('customer_ice', e.target.value)} style={inputStyle} /></div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Technicien *</label>
          <select value={form.technician_name} disabled={techLocked} onChange={e => set('technician_name', e.target.value)} style={{ ...inputStyle, cursor: techLocked ? 'not-allowed' : 'pointer', opacity: techLocked ? 0.55 : 1 }}>
            <option value="">— Choisir —</option>
            {mechanicNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {techLocked && (
            <div style={{ fontSize: '11px', color: '#F0C040', marginTop: '5px' }}>
              Part déjà versée à {invoice.technician_name} — technicien verrouillé.
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Statut de paiement</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {(Object.keys(PAYMENT_STATUS_CONFIG) as PaymentStatus[]).map(s => {
              const cfg = PAYMENT_STATUS_CONFIG[s]
              const active = form.payment_status === s
              return (
                <button key={s} onClick={() => set('payment_status', s)} style={{
                  padding: '9px 4px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                  border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.08)'}`,
                  background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                  color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                }}>{cfg.label}</button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Mode de paiement</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">—</option>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF8888', fontSize: '12px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Annuler</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
