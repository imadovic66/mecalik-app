/** Finances tab — KPI row, monthly revenue chart, revenue by service, transactions, B2B/B2C split, pricing grid, invoice generator */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../../data/pricing'
import { type FinanceBooking } from '../adminShared'

interface Props {
  financeBookings: FinanceBooking[]
  financeLoading: boolean
}

type InvoiceLine = { description: string; quantity: number; unitPrice: number }

export default function FinancesTab({ financeBookings, financeLoading }: Props) {
  const { t, i18n } = useTranslation()
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')

  // ── Invoice modal state ───────────────────────────────────────────────────
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    clientICE: '',
    invoiceNumber: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    invoiceDate: new Date().toLocaleDateString('fr-MA'),
    lines: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceLine[],
    paymentMethod: 'Espèces',
    notes: '',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px',
    fontFamily: 'Outfit, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: '6px',
  }

  const totalHT  = invoiceData.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tva      = totalHT * 0.20
  const totalTTC = totalHT + tva

  const addLine = () => setInvoiceData(prev => ({
    ...prev, lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0 }]
  }))
  const removeLine = (idx: number) => setInvoiceData(prev => ({
    ...prev, lines: prev.lines.filter((_, i) => i !== idx)
  }))
  const updateLine = (idx: number, field: keyof InvoiceLine, value: string | number) => {
    setInvoiceData(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }))
  }

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const linesHtml = invoiceData.lines.map(l => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">${l.description || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;">${l.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">${l.unitPrice.toFixed(0)} MAD</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:600;">${(l.quantity * l.unitPrice).toFixed(0)} MAD</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Facture ${invoiceData.invoiceNumber} — MecaLIK</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1a1a1a; background: white; padding: 40px; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #43BCC9;">
          <div>
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;margin-bottom:4px;">
              Meca<span style="color:#43BCC9;">LIK</span>
            </div>
            <div style="font-size:12px;color:#666;line-height:1.8;">
              Mécanicien Certifié à Domicile<br>
              Casablanca, Maroc<br>
              +212 777 348 065<br>
              contact@mecalik.com<br>
              www.mecalik.com
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:32px;font-weight:800;color:#1a1a1a;margin-bottom:8px;">FACTURE</div>
            <table style="font-size:13px;margin-left:auto;">
              <tr>
                <td style="color:#666;padding:2px 8px 2px 0;">N° Facture :</td>
                <td style="font-weight:700;">${invoiceData.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color:#666;padding:2px 8px 2px 0;">Date :</td>
                <td style="font-weight:700;">${invoiceData.invoiceDate}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="margin-bottom:32px;padding:16px 20px;background:#f8f9fa;border-radius:8px;border-left:4px solid #43BCC9;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:8px;">Facturé à</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${invoiceData.clientName || '—'}</div>
          ${invoiceData.clientAddress ? `<div style="font-size:13px;color:#444;">${invoiceData.clientAddress}</div>` : ''}
          ${invoiceData.clientPhone   ? `<div style="font-size:13px;color:#444;">Tél : ${invoiceData.clientPhone}</div>` : ''}
          ${invoiceData.clientEmail   ? `<div style="font-size:13px;color:#444;">Email : ${invoiceData.clientEmail}</div>` : ''}
          ${invoiceData.clientICE     ? `<div style="font-size:13px;color:#444;">ICE : ${invoiceData.clientICE}</div>` : ''}
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#0A0A0A;color:white;">
              <th style="padding:12px;font-size:12px;text-align:left;text-transform:uppercase;letter-spacing:0.05em;border-radius:6px 0 0 6px;">Description</th>
              <th style="padding:12px;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Qté</th>
              <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">P.U. HT</th>
              <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;border-radius:0 6px 6px 0;">Total HT</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span style="font-size:13px;color:#666;">Total HT</span>
              <span style="font-size:13px;font-weight:600;">${totalHT.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span style="font-size:13px;color:#666;">TVA (20%)</span>
              <span style="font-size:13px;font-weight:600;">${tva.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fafa;border-radius:6px;padding:12px 16px;margin-top:4px;">
              <span style="font-size:16px;font-weight:800;">Total TTC</span>
              <span style="font-size:16px;font-weight:800;color:#43BCC9;">${totalTTC.toFixed(0)} MAD</span>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;">
          <div style="padding:16px;background:#f8f9fa;border-radius:8px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:6px;">Mode de paiement</div>
            <div style="font-size:14px;font-weight:600;">${invoiceData.paymentMethod}</div>
          </div>
          ${invoiceData.notes ? `
          <div style="padding:16px;background:#f8f9fa;border-radius:8px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:6px;">Notes</div>
            <div style="font-size:13px;color:#444;">${invoiceData.notes}</div>
          </div>` : '<div></div>'}
        </div>

        <div style="border-top:2px solid #f0f0f0;padding-top:20px;text-align:center;">
          <div style="font-size:13px;color:#666;line-height:1.8;">
            MecaLIK — SARL AU · Casablanca, Maroc<br>
            contact@mecalik.com · +212 777 348 065 · www.mecalik.com<br>
            <em style="font-size:12px;">Merci de votre confiance !</em>
          </div>
        </div>

        <div class="no-print" style="text-align:center;margin-top:24px;">
          <button onclick="window.print()" style="padding:12px 32px;background:#43BCC9;color:#0A0A0A;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:Arial,sans-serif;">
            🖨️ Imprimer / Enregistrer en PDF
          </button>
        </div>

      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  // ── Finance analytics ─────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()

  const totalRevenue = financeBookings.reduce((s, b) => s + b.amount_ttc, 0)
  const monthRevenue = financeBookings
    .filter(b => { const d = new Date(b.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear })
    .reduce((s, b) => s + b.amount_ttc, 0)
  const avgPerService = financeBookings.length ? Math.round(totalRevenue / financeBookings.length) : 0
  const b2bRevenue = financeBookings.filter(b => b.company_id).reduce((s, b) => s + b.amount_ttc, 0)
  const b2bPct     = totalRevenue > 0 ? Math.round((b2bRevenue / totalRevenue) * 100) : 0

  const monthLabels = i18n.language === 'fr'
    ? ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1)
    const m = d.getMonth(), y = d.getFullYear()
    const revenue = financeBookings
      .filter(b => { const bd = new Date(b.created_at); return bd.getMonth() === m && bd.getFullYear() === y })
      .reduce((s, b) => s + b.amount_ttc, 0)
    return { month: monthLabels[m], revenue }
  })

  const byService = Object.values(
    financeBookings.reduce<Record<string, { service: string; count: number; revenue: number }>>((acc, b) => {
      const key = b.service_name
      if (!acc[key]) acc[key] = { service: key, count: 0, revenue: 0 }
      acc[key].count++
      acc[key].revenue += b.amount_ttc
      return acc
    }, {})
  ).sort((a, b) => b.revenue - a.revenue)

  const recentTx    = financeBookings.slice(0, 10)
  const b2cBookings = financeBookings.filter(b => !b.company_id)
  const b2bBookings = financeBookings.filter(b => b.company_id)
  const b2cRevenue  = b2cBookings.reduce((s, b) => s + b.amount_ttc, 0)

  const priceChartData = PRICING_SERVICES
    .filter(s => !s.contactOnly)
    .map(s => {
      const moPrice  = s[selectedZone] as number
      const techCost = Math.round(moPrice * 0.60)
      const mecalikMO = Math.round(moPrice * 0.40)
      const revenue  = getTotalRevenuePerIntervention(s, selectedZone)
      const partsAvg = Math.round((revenue.partsMin + revenue.partsMax) / 2)
      return { name: s.labelShort, 'Part technicien': techCost, 'Marge MO MecaLIK': mecalikMO, 'Marge pièces (5%)': partsAvg }
    })

  const moServices = PRICING_SERVICES.filter(s => !s.contactOnly && s[selectedZone])
  const avgMO = moServices.length ? Math.round(moServices.reduce((sum, s) => sum + (s[selectedZone] as number) * 0.4, 0) / moServices.length) : 0
  const partsServices = PRICING_SERVICES.filter(s => s.hasPartsRequired && s.typicalPartsCost && s.typicalPartsCost.min > 0)
  const avgParts = partsServices.length ? Math.round(partsServices.reduce((sum, s) => sum + ((s.typicalPartsCost!.min + s.typicalPartsCost!.max) / 2 * 0.05), 0) / partsServices.length) : 0

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }

  return (
    <>
      {/* ── Tab header with invoice CTA ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'white', margin: 0 }}>
          {t('admin.finance.title')}
        </h2>
        <button
          onClick={() => setShowInvoiceModal(true)}
          style={{
            padding: '9px 18px', borderRadius: '8px',
            background: '#43BCC9', border: 'none',
            color: '#0A0A0A', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          📄 Nouvelle facture
        </button>
      </div>

      {financeLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
        </div>
      ) : financeBookings.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('admin.finance.noData')}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: t('admin.finance.totalRevenue'), value: `${totalRevenue.toLocaleString()} MAD` },
              { label: t('admin.finance.thisMonth'),    value: `${monthRevenue.toLocaleString()} MAD` },
              { label: t('admin.finance.avgPerService'),value: `${avgPerService} MAD` },
              { label: t('admin.finance.b2bShare'),     value: `${b2bPct}%` },
            ].map(kpi => (
              <div key={kpi.label} style={cardStyle}>
                <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
                <div className="text-2xl font-bold" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue by month */}
          <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('admin.finance.revenueByMonth')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                  formatter={(val: unknown) => [`${val} MAD`, '']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="revenue" fill="#43BCC9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by service */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('admin.finance.revenueByService')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[t('admin.service'), t('admin.finance.interventions'), t('admin.revenue'), t('admin.finance.avgPrice')].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byService.map(row => (
                    <tr key={row.service} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: 'white' }}>{row.service}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{row.count}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#43BCC9' }}>{row.revenue.toLocaleString()} MAD</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(row.revenue / row.count)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions + B2B/B2C */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('admin.finance.recentTransactions')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {[t('admin.date'), t('admin.service'), t('admin.amount'), t('admin.finance.type')].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map(tx => {
                      const isB2B = !!tx.company_id
                      const d = new Date(tx.created_at)
                      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-5 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{dateStr}</td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'white' }}>{tx.service_name}</td>
                          <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#43BCC9' }}>{tx.amount_ttc} MAD</td>
                          <td className="px-5 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={isB2B
                                ? { background: 'rgba(240,192,64,0.1)', color: '#F0C040', border: '1px solid rgba(240,192,64,0.2)' }
                                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                              }>
                              {isB2B ? 'B2B' : 'B2C'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('admin.finance.b2bVsB2c')}
              </h3>
              <div className="space-y-5">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>B2C</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{b2cRevenue.toLocaleString()} MAD</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{b2cBookings.length} {t('admin.finance.interventions')}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(240,192,64,0.04)', border: '1px solid rgba(240,192,64,0.12)' }}>
                  <div className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: '#F0C040' }}>B2B</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{b2bRevenue.toLocaleString()} MAD</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{b2bBookings.length} {t('admin.finance.interventions')}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pricing grid */}
      <div className="mt-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Grille tarifaire</h3>
          <div className="flex gap-2">
            {(['zone1', 'zone2', 'zone3'] as Zone[]).map(z => (
              <button key={z} onClick={() => setSelectedZone(z)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: selectedZone === z ? '#43BCC9' : 'rgba(255,255,255,0.06)', color: selectedZone === z ? '#080808' : 'rgba(255,255,255,0.5)' }}>
                {z === 'zone1' ? 'Zone 1' : z === 'zone2' ? 'Zone 2' : 'Zone 3'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Services tarifés',   value: String(PRICING_SERVICES.filter(s => !s.contactOnly).length), color: 'white' },
            { label: 'Marge MO moy.',      value: `${avgMO} MAD`,        color: 'white' },
            { label: 'Marge pièces moy.',  value: `+${avgParts} MAD`,    color: 'white' },
            { label: 'Seuil rentabilité',  value: '82 interventions',    color: 'white' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
              <div className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Tarifs et marges estimées par service
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceChartData} margin={{ top: 5, right: 20, bottom: 60, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                formatter={(val: unknown) => [`${val} MAD`]}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="Part technicien"   fill="rgba(255,68,68,0.6)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Marge MO MecaLIK"  fill="#43BCC9"             radius={[3, 3, 0, 0]} />
              <Bar dataKey="Marge pièces (5%)" fill="#F0C040"             radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Grille tarifaire complète</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#141414' }}>
                  {['Service', 'Zone 1', 'Zone 2', 'Zone 3', 'Durée'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_SERVICES.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'white' }}>{s.label}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : '#43BCC9' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone1} MAD`}
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone2} MAD`}
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone3} MAD`}
                    </td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* INVOICE MODAL                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showInvoiceModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '20px', overflowY: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: '800px',
            background: '#111114', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '32px', marginBottom: '20px',
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>
                  📄 Nouvelle Facture
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Remplissez les informations pour générer la facture
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrintInvoice}
                  style={{
                    padding: '9px 18px', borderRadius: '8px',
                    background: '#43BCC9', border: 'none',
                    color: '#0A0A0A', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  🖨️ Imprimer
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  style={{
                    padding: '9px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Section 1: Invoice meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>N° Facture</label>
                <input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData(p => ({ ...p, invoiceNumber: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Date</label>
                <input value={invoiceData.invoiceDate} onChange={e => setInvoiceData(p => ({ ...p, invoiceDate: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* Section 2: Client info */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Informations Client
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nom / Société</label>
                  <input value={invoiceData.clientName} onChange={e => setInvoiceData(p => ({ ...p, clientName: e.target.value }))} placeholder="Transport Express Casablanca" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={invoiceData.clientPhone} onChange={e => setInvoiceData(p => ({ ...p, clientPhone: e.target.value }))} placeholder="06 XX XX XX XX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Adresse</label>
                  <input value={invoiceData.clientAddress} onChange={e => setInvoiceData(p => ({ ...p, clientAddress: e.target.value }))} placeholder="Casablanca, Maroc" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={invoiceData.clientEmail} onChange={e => setInvoiceData(p => ({ ...p, clientEmail: e.target.value }))} placeholder="contact@entreprise.ma" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ICE (optionnel)</label>
                  <input value={invoiceData.clientICE} onChange={e => setInvoiceData(p => ({ ...p, clientICE: e.target.value }))} placeholder="ICE de l'entreprise" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Section 3: Service lines */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Prestations
              </h3>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px' }}>
                {['Description', 'Qté', 'P.U. HT (MAD)', 'Total HT', ''].map(h => (
                  <div key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>

              {/* Line items */}
              {invoiceData.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    value={line.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Vidange & Filtres — Toyota Hilux"
                    style={inputStyle}
                  />
                  <input
                    value={line.quantity}
                    type="number" min="1"
                    onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 1)}
                    style={inputStyle}
                  />
                  <input
                    value={line.unitPrice}
                    type="number" min="0"
                    onChange={e => updateLine(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#43BCC9', padding: '0 4px' }}>
                    {(line.quantity * line.unitPrice).toFixed(0)} MAD
                  </div>
                  {invoiceData.lines.length > 1 ? (
                    <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: 0 }}>×</button>
                  ) : <div />}
                </div>
              ))}

              <button
                onClick={addLine}
                style={{
                  padding: '8px 14px', borderRadius: '8px', marginTop: '4px',
                  background: 'rgba(67,188,201,0.08)', border: '1px dashed rgba(67,188,201,0.3)',
                  color: '#43BCC9', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}
              >
                + Ajouter une ligne
              </button>
            </div>

            {/* Section 4: Totals */}
            <div style={{ marginLeft: 'auto', width: '280px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Total HT</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{totalHT.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>TVA (20%)</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{tva.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>Total TTC</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#43BCC9' }}>{totalTTC.toFixed(0)} MAD</span>
              </div>
            </div>

            {/* Section 5: Payment + notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Mode de paiement</label>
                <select
                  value={invoiceData.paymentMethod}
                  onChange={e => setInvoiceData(p => ({ ...p, paymentMethod: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option>Espèces</option>
                  <option>Virement bancaire</option>
                  <option>Chèque</option>
                  <option>Carte bancaire</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notes / Observations</label>
                <textarea
                  value={invoiceData.notes}
                  onChange={e => setInvoiceData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Paiement à 30 jours..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
