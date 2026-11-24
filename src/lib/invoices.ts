/** Invoices — the legal revenue document.
 *  Types, the line-item → totals adapter, collision-safe numbering, persistence,
 *  and the printable facture. All money figures route through computeQuoteTotals. */

import { supabase } from './supabase'
import { computeQuoteTotals, type QuoteTotals } from './bookingUtils'
import type { ServiceDetail } from '../pages/admin/adminShared'

export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'cancelled'

export type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  booking_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_ice: string | null
  service_name: string | null
  technician_name: string | null
  line_items: ServiceDetail[] | null
  total_ttc: number
  total_ht: number
  total_tva: number
  materials_ttc: number
  labour_ttc: number
  labour_ht: number
  mechanic_share: number
  mecalik_share: number
  payment_status: PaymentStatus
  paid_at: string | null
  payment_method: string | null
  mechanic_paid: boolean
  mechanic_paid_at: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string }> = {
  unpaid:    { label: 'Non payée', color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.3)' },
  paid:      { label: 'Payée',     color: '#00DD88', bg: 'rgba(0,221,136,0.1)',   border: 'rgba(0,221,136,0.3)' },
  partial:   { label: 'Partielle', color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.3)' },
  cancelled: { label: 'Annulée',   color: '#FF4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.3)' },
}

/** Cancelled invoices are void: excluded from revenue, TVA and mechanic pay. */
export function isBillable(inv: Pick<Invoice, 'payment_status'>): boolean {
  return inv.payment_status !== 'cancelled'
}

/**
 * The line items behind an invoice, in service_details shape.
 *
 * Invoices backfilled from before this table existed carry no stored lines — only
 * the column totals. For those, rebuild equivalent lines from materials_ttc /
 * labour_ttc (plus a balancing line for any gap to total_ttc) so that
 * computeQuoteTotals reproduces the stored figures exactly.
 */
export function invoiceLineItems(
  inv: Pick<Invoice, 'line_items' | 'materials_ttc' | 'labour_ttc' | 'total_ttc'>,
): ServiceDetail[] {
  if (inv.line_items && inv.line_items.length > 0) return inv.line_items

  const mats  = Number(inv.materials_ttc) || 0
  const lab   = Number(inv.labour_ttc) || 0
  const total = Number(inv.total_ttc) || 0
  const lines: ServiceDetail[] = []
  if (mats > 0) lines.push({ type: 'material', name: 'Pièces et fournitures', quantity: '1', unit_price: mats })
  if (lab > 0)  lines.push({ type: 'labor',    name: "Main d'œuvre",          quantity: '1', unit_price: lab })

  const gap = mats + lab - total
  if (gap > 0.005)  lines.push({ type: 'discount', name: 'Remise',     quantity: '1', unit_price: gap })
  if (gap < -0.005) lines.push({ type: 'material', name: 'Prestation', quantity: '1', unit_price: -gap })
  return lines
}

/** Every money figure for one invoice — via the shared quote math. */
export function invoiceTotals(inv: Pick<Invoice, 'line_items' | 'materials_ttc' | 'labour_ttc' | 'total_ttc'> & { invoice_date?: string | null }): QuoteTotals {
  return computeQuoteTotals(invoiceLineItems(inv), undefined, inv.invoice_date ?? null)
}

const ZERO_TOTALS: QuoteTotals = {
  materialsTTC: 0, labourTTC: 0, discountTTC: 0, totalTTC: 0, totalHT: 0,
  totalTVA: 0, labourHT: 0, mechanicShare: 0, mecalikShare: 0,
}

/** Field-wise sum of invoiceTotals over a set of invoices (pure addition, no formula). */
export function sumInvoiceTotals(invs: Invoice[]): QuoteTotals {
  return invs.reduce<QuoteTotals>((acc, inv) => {
    const t = invoiceTotals(inv)
    return {
      materialsTTC:  acc.materialsTTC  + t.materialsTTC,
      labourTTC:     acc.labourTTC     + t.labourTTC,
      discountTTC:   acc.discountTTC   + t.discountTTC,
      totalTTC:      acc.totalTTC      + t.totalTTC,
      totalHT:       acc.totalHT       + t.totalHT,
      totalTVA:      acc.totalTVA      + t.totalTVA,
      labourHT:      acc.labourHT      + t.labourHT,
      mechanicShare: acc.mechanicShare + t.mechanicShare,
      mecalikShare:  acc.mecalikShare  + t.mecalikShare,
    }
  }, { ...ZERO_TOTALS })
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** The denormalised money columns stored on an invoice row, computed from its lines. */
export function invoiceMoneyColumns(lines: ServiceDetail[], invoiceDate?: string | null) {
  const t = computeQuoteTotals(lines, undefined, invoiceDate ?? null)
  return {
    total_ttc:      round2(t.totalTTC),
    total_ht:       round2(t.totalHT),
    total_tva:      round2(t.totalTVA),
    materials_ttc:  round2(t.materialsTTC),
    labour_ttc:     round2(t.labourTTC),
    labour_ht:      round2(t.labourHT),
    mechanic_share: round2(t.mechanicShare),
    mecalik_share:  round2(t.mecalikShare),
  }
}

/**
 * Next FAC-YYYY-NNNN number for the given year: the highest existing sequence + 1.
 * Parses every number for the year rather than sorting strings, so it keeps working
 * past 9999 (where lexical order would break).
 */
export async function nextInvoiceNumber(year: number): Promise<string> {
  const prefix = `FAC-${year}-`
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
  if (error) throw new Error(error.message)
  const max = (data ?? []).reduce((m: number, r: { invoice_number: string }) => {
    const n = parseInt(String(r.invoice_number).slice(prefix.length), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'invoice_number' | 'created_at'>

/**
 * Insert an invoice with a freshly allocated number. If another admin grabbed the
 * same number in the meantime, the unique constraint rejects it (23505) and we
 * re-read the max and retry — so two concurrent saves can never share a number.
 */
export async function insertInvoice(row: InvoiceInsert): Promise<{ invoice: Invoice | null; error: string | null }> {
  const year = parseInt(row.invoice_date.slice(0, 4), 10) || new Date().getFullYear()
  for (let attempt = 0; attempt < 5; attempt++) {
    let invoice_number: string
    try {
      invoice_number = await nextInvoiceNumber(year)
    } catch (e) {
      return { invoice: null, error: e instanceof Error ? e.message : String(e) }
    }
    const { data, error } = await supabase.from('invoices').insert({ ...row, invoice_number }).select().single()
    if (!error) return { invoice: data as Invoice, error: null }
    if (error.code !== '23505') return { invoice: null, error: error.message }
  }
  return { invoice: null, error: 'Conflit de numérotation persistant — réessayez.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Printable facture
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s: string | null | undefined) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

const LINE_LABEL: Record<string, string> = { material: 'Pièce', labor: "Main d'œuvre", discount: 'Remise', vat: 'TVA' }

export function formatInvoiceDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

/**
 * Render the facture into a print window (Imprimer / Enregistrer en PDF).
 * Pass a window opened synchronously in the click handler when the render happens
 * after an await — otherwise the browser's popup blocker eats it.
 */
export function printInvoiceDocument(inv: Invoice, target?: Window | null): void {
  const win = target ?? window.open('', '_blank')
  if (!win) return

  const lines = invoiceLineItems(inv)
  const t = invoiceTotals(inv)

  const linesHtml = lines.map(l => {
    const qty = parseFloat(String(l.quantity ?? '1')) || 1
    const unit = Number(l.unit_price) || 0
    const isDiscount = l.type === 'discount'
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${esc(l.name) || '—'}<div style="font-size:10px;color:#999;">${LINE_LABEL[l.type] ?? ''}</div></td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;">${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">${unit.toFixed(2)} MAD</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:600;">${isDiscount ? '−' : ''}${(qty * unit).toFixed(2)} MAD</td>
      </tr>`
  }).join('')

  const statusCfg = PAYMENT_STATUS_CONFIG[inv.payment_status]
  const paidLine = inv.payment_status === 'paid' && inv.paid_at
    ? `Payée le ${formatInvoiceDate(inv.paid_at)}`
    : statusCfg.label

  win.document.open()
  win.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Facture ${esc(inv.invoice_number)} — MecaLIK</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #1a1a1a; background: white; padding: 40px; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #43BCC9;">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="https://mecalik.com/icons/icon-192x192.png" style="width:56px;height:56px;border-radius:10px;object-fit:contain;background:#0A0A0A;padding:4px;" alt="MecaLIK Logo" />
          <div>
            <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;line-height:1;">Meca<span style="color:#43BCC9;">LIK</span></div>
            <div style="font-size:11px;color:#666;margin-top:2px;letter-spacing:0.03em;">Your car, your place. Our problem.</div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;gap:24px;">
        <div style="flex:1;padding:16px 20px;background:#f8f9fa;border-radius:8px;border-left:4px solid #43BCC9;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:8px;">Facturé à</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${esc(inv.customer_name) || '—'}</div>
          ${inv.customer_address ? `<div style="font-size:13px;color:#444;">${esc(inv.customer_address)}</div>` : ''}
          ${inv.customer_phone ? `<div style="font-size:13px;color:#444;">Tél : ${esc(inv.customer_phone)}</div>` : ''}
          ${inv.customer_ice ? `<div style="font-size:13px;color:#444;">ICE : ${esc(inv.customer_ice)}</div>` : ''}
        </div>
        <div style="text-align:right;min-width:220px;">
          <div style="font-size:32px;font-weight:800;color:#1a1a1a;margin-bottom:10px;">FACTURE</div>
          <table style="font-size:13px;margin-left:auto;">
            <tr><td style="color:#666;padding:3px 8px 3px 0;">N° Facture :</td><td style="font-weight:700;">${esc(inv.invoice_number)}</td></tr>
            <tr><td style="color:#666;padding:3px 8px 3px 0;">Date :</td><td style="font-weight:700;">${formatInvoiceDate(inv.invoice_date)}</td></tr>
            ${inv.service_name ? `<tr><td style="color:#666;padding:3px 8px 3px 0;">Prestation :</td><td style="font-weight:700;">${esc(inv.service_name)}</td></tr>` : ''}
            ${inv.technician_name ? `<tr><td style="color:#666;padding:3px 8px 3px 0;">Technicien :</td><td style="font-weight:700;">${esc(inv.technician_name)}</td></tr>` : ''}
          </table>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#0A0A0A;color:white;">
            <th style="padding:12px;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Description</th>
            <th style="padding:12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Qté</th>
            <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">P.U. TTC</th>
            <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Total TTC</th>
          </tr>
        </thead>
        <tbody>${linesHtml}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
        <div style="width:280px;">
          <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fafa;border-radius:6px;padding:12px 16px;margin-bottom:4px;">
            <span style="font-size:16px;font-weight:800;">Total TTC</span>
            <span style="font-size:16px;font-weight:800;color:#43BCC9;">${t.totalTTC.toFixed(2)} MAD</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 16px;">
            <span style="font-size:12px;color:#888;">dont HT</span>
            <span style="font-size:12px;color:#888;">${t.totalHT.toFixed(2)} MAD</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 16px;">
            <span style="font-size:12px;color:#888;">dont TVA (20%)</span>
            <span style="font-size:12px;color:#888;">${t.totalTVA.toFixed(2)} MAD</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;">
        <div style="padding:16px;background:#f8f9fa;border-radius:8px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:6px;">Paiement</div>
          <div style="font-size:14px;font-weight:600;">${esc(paidLine)}${inv.payment_method ? ` · ${esc(inv.payment_method)}` : ''}</div>
        </div>
        ${inv.notes ? `
        <div style="padding:16px;background:#f8f9fa;border-radius:8px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:6px;">Notes</div>
          <div style="font-size:13px;color:#444;">${esc(inv.notes)}</div>
        </div>` : '<div></div>'}
      </div>

      <div style="text-align:center;margin:24px 0 16px;">
        <span style="display:inline-block;padding:6px 16px;border-radius:20px;border:1px solid #43BCC9;font-size:11px;color:#43BCC9;letter-spacing:0.05em;">
          ✦ Document généré électroniquement — Ne nécessite pas de cachet ni de signature
        </span>
      </div>

      <div style="border-top:2px solid #f0f0f0;padding-top:20px;text-align:center;margin-top:40px;">
        <div style="font-size:13px;color:#333;font-weight:600;margin-bottom:6px;">+212 777 348 065 &nbsp;·&nbsp; hello@mecalik.com</div>
        <div style="font-size:12px;color:#555;margin-bottom:4px;">82 ANG BD Abdelmoumen et Soumaya, Résidence Shahrazad 1 Etg 4 Appt 17, Casablanca, Maroc</div>
        <div style="font-size:11px;color:#888;">MecaLIK SARL AU &nbsp;·&nbsp; ICE : 003942374000016 &nbsp;·&nbsp; RC : 726381 &nbsp;·&nbsp; IF : 72071701</div>
      </div>

      <div class="no-print" style="text-align:center;margin-top:24px;">
        <button onclick="window.print()" style="padding:12px 32px;background:#43BCC9;color:#0A0A0A;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:Arial,sans-serif;">
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}
