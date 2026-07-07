/** Finances tab — P&L income statement dashboard (QuickBooks / Xero style) */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../../data/pricing'
import { type FinanceBooking } from '../adminShared'
import { supabase } from '../../../lib/supabase'

interface Props {
  financeBookings: FinanceBooking[]
  financeLoading: boolean
}

type InvoiceLine = { description: string; quantity: number; unitPrice: number }
type Period = 'month' | 'quarter' | 'year' | 'all'
type ExpenseCategory = 'loyer' | 'salaires' | 'marketing' | 'transport' | 'tech' | 'autre'

interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  vendor: string | null
  amount_ttc: number
  amount_ht: number | null
  recurring: boolean
  notes: string | null
  created_at: string
}

interface OfflineEntry {
  id: string
  client_name: string | null
  service_name: string
  amount_ttc: number
  materials_cost: number
  labor_cost: number | null
  date: string
  created_at: string
}

const PERIOD_OPTS: { key: Period; label: string }[] = [
  { key: 'month',   label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year',    label: 'Cette année' },
  { key: 'all',     label: 'Tout' },
]

const EXP_CATS: { key: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { key: 'loyer',     label: 'Loyer',       emoji: '🏢', color: '#43BCC9' },
  { key: 'salaires',  label: 'Salaires',    emoji: '👤', color: '#F0C040' },
  { key: 'marketing', label: 'Marketing',   emoji: '📣', color: '#A78BFA' },
  { key: 'transport', label: 'Transport',   emoji: '🚗', color: '#34D399' },
  { key: 'tech',      label: 'Tech / SaaS', emoji: '💻', color: '#60A5FA' },
  { key: 'autre',     label: 'Autre',       emoji: '📦', color: 'rgba(255,255,255,0.5)' },
]

const LEGACY_TYPE: Record<string, string> = { product: 'material', part: 'material' }

function categorizeDetails(details: any[]) {
  return (details ?? []).map((d: any) => {
    const t = LEGACY_TYPE[d.type] ?? d.type
    const qty = parseFloat(String(d.quantity ?? '1')) || 1
    const line = (Number(d.unit_price) || 0) * qty
    return { type: t as string, line }
  })
}

function bookingMaterials(b: any): number {
  return categorizeDetails(b.service_details ?? []).filter(d => d.type === 'material').reduce((s, d) => s + d.line, 0)
}
function bookingLabor(b: any): number {
  return categorizeDetails(b.service_details ?? []).filter(d => d.type === 'labor').reduce((s, d) => s + d.line, 0)
}
function bookingDiscount(b: any): number {
  return categorizeDetails(b.service_details ?? []).filter(d => d.type === 'discount').reduce((s, d) => s + d.line, 0)
}
function bookingLabourBase(b: any): number {
  const explicitLabor = bookingLabor(b)
  if (explicitLabor > 0) return Math.max(0, explicitLabor - bookingDiscount(b))
  const ht = (b.amount_ttc || 0) / 1.2
  return Math.max(0, ht - bookingMaterials(b))
}

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD'
}

function inPeriod(dateStr: string, period: Period): boolean {
  if (period === 'all') return true
  const d = new Date(dateStr)
  const now = new Date()
  if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  if (period === 'year') return d.getFullYear() === now.getFullYear()
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    const dq = Math.floor(d.getMonth() / 3)
    return dq === q && d.getFullYear() === now.getFullYear()
  }
  return true
}

export default function FinancesTab({ financeBookings, financeLoading }: Props) {
  const { i18n } = useTranslation()
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')
  const [period, setPeriod] = useState<Period>('month')

  // ── Expenses state ────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expCatFilter, setExpCatFilter] = useState<ExpenseCategory | 'all'>('all')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().substring(0, 10),
    category: 'autre' as ExpenseCategory,
    description: '',
    vendor: '',
    amount_ttc: 0,
    notes: '',
  })

  // ── Offline state ─────────────────────────────────────────────────────────
  const [offlineEntries, setOfflineEntries] = useState<OfflineEntry[]>([])
  const [_offlineLoading, setOfflineLoading] = useState(false)
  const [showAddOffline, setShowAddOffline] = useState(false)
  const [newEntry, setNewEntry] = useState({
    client_name: '',
    service_name: '',
    amount_ttc: 0,
    materials_cost: 0,
    labor_cost: 0,
    date: new Date().toISOString().substring(0, 10),
  })

  // ── Quote modal state ─────────────────────────────────────────────────────
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteData, setQuoteData] = useState({
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    clientICE: '',
    quoteNumber: `DEV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
    quoteDate: new Date().toLocaleDateString('fr-MA'),
    validityDays: 30,
    lines: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceLine[],
    notes: '',
  })

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

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(() => {
    supabase.from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => setExpenses((data as Expense[]) ?? []))
  }, [])

  useEffect(() => {
    fetchExpenses()
    setOfflineLoading(true)
    supabase.from('offline_interventions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data }) => {
        setOfflineEntries((data as OfflineEntry[]) ?? [])
        setOfflineLoading(false)
      })
  }, [fetchExpenses])

  useEffect(() => {
    const channel = supabase.channel('finances-expenses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchExpenses])

  // ── Shared input styles ───────────────────────────────────────────────────
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

  // ── CSV report ────────────────────────────────────────────────────────────
  const downloadReport = () => {
    const dateStr = new Date().toLocaleDateString('fr-MA').replace(/\//g, '-')
    const rows: string[][] = [
      ['Type', 'Date', 'Référence', 'Client', 'Service', 'TTC (MAD)', 'HT (MAD)', 'TVA (MAD)', 'Matériaux (MAD)', "Main d'œuvre (MAD)", 'TVA lignes (MAD)', 'Remise (MAD)', 'Base MO (MAD)', 'Mécanicien 65% (MAD)', 'Profit MecaLIK 35% (MAD)'],
    ]
    financeBookings.forEach((b: any) => {
      const ttc = b.amount_ttc || 0
      const ht = ttc / 1.2
      const tvaAmt = ttc - ht
      const cats = categorizeDetails(b.service_details ?? [])
      const mats    = cats.filter(d => d.type === 'material').reduce((s, d) => s + d.line, 0)
      const lab     = cats.filter(d => d.type === 'labor').reduce((s, d) => s + d.line, 0)
      const vatLine = cats.filter(d => d.type === 'vat').reduce((s, d) => s + d.line, 0)
      const disc    = cats.filter(d => d.type === 'discount').reduce((s, d) => s + d.line, 0)
      const labour  = bookingLabourBase(b)
      rows.push(['Plateforme', new Date(b.created_at).toLocaleDateString('fr-MA'), b.reference || '', b.profiles?.full_name || '', b.service_name || '', ttc.toFixed(2), ht.toFixed(2), tvaAmt.toFixed(2), mats.toFixed(2), lab.toFixed(2), vatLine.toFixed(2), disc.toFixed(2), labour.toFixed(2), (labour * 0.65).toFixed(2), (labour * 0.35).toFixed(2)])
    })
    offlineEntries.forEach(e => {
      const ttc = e.amount_ttc || 0
      const ht = ttc / 1.2
      const tvaAmt = ttc - ht
      const mats = e.materials_cost || 0
      const lab  = e.labor_cost ?? 0
      const labour = (lab > 0) ? lab : Math.max(0, ht - mats)
      rows.push(['Offline', e.date, 'OFFLINE', e.client_name || 'Client', e.service_name || '', ttc.toFixed(2), ht.toFixed(2), tvaAmt.toFixed(2), mats.toFixed(2), lab.toFixed(2), '0.00', '0.00', labour.toFixed(2), (labour * 0.65).toFixed(2), (labour * 0.35).toFixed(2)])
    })
    const allTTC = [...financeBookings.map(b => b.amount_ttc || 0), ...offlineEntries.map(e => e.amount_ttc || 0)].reduce((s, v) => s + v, 0)
    const allHT  = allTTC / 1.2
    const allMats = financeBookings.reduce((s, b: any) => s + bookingMaterials(b), 0) + offlineEntries.reduce((s, e) => s + (e.materials_cost || 0), 0)
    const allLab  = financeBookings.reduce((s, b: any) => s + bookingLabourBase(b), 0) + offlineEntries.reduce((s, e) => {
      if ((e.labor_cost ?? 0) > 0) return s + (e.labor_cost ?? 0)
      return s + Math.max(0, e.amount_ttc / 1.2 - (e.materials_cost || 0))
    }, 0)
    rows.push(['TOTAL', '', '', '', '', allTTC.toFixed(2), allHT.toFixed(2), (allTTC - allHT).toFixed(2), allMats.toFixed(2), '', '', '', allLab.toFixed(2), (allLab * 0.65).toFixed(2), (allLab * 0.35).toFixed(2)])
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `rapport-mecalik-${dateStr}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── Invoice helpers ───────────────────────────────────────────────────────
  const totalHT  = invoiceData.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tva      = totalHT * 0.20
  const totalTTC = totalHT + tva

  const addLine    = () => setInvoiceData(p => ({ ...p, lines: [...p.lines, { description: '', quantity: 1, unitPrice: 0 }] }))
  const removeLine = (i: number) => setInvoiceData(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))
  const updateLine = (i: number, field: keyof InvoiceLine, val: string | number) =>
    setInvoiceData(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, [field]: val } : l) }))

  const quoteTotalHT  = quoteData.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const quoteTva      = quoteTotalHT * 0.20
  const quoteTotalTTC = quoteTotalHT + quoteTva

  const addQuoteLine    = () => setQuoteData(p => ({ ...p, lines: [...p.lines, { description: '', quantity: 1, unitPrice: 0 }] }))
  const removeQuoteLine = (i: number) => setQuoteData(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))
  const updateQuoteLine = (i: number, field: keyof InvoiceLine, val: string | number) =>
    setQuoteData(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, [field]: val } : l) }))

  // ── P&L computations (period-filtered) ───────────────────────────────────
  const filteredBookings = financeBookings.filter(b => inPeriod(b.created_at, period))
  const filteredOffline  = offlineEntries.filter(e => inPeriod(e.date, period))
  const filteredExpenses = expenses.filter(e => inPeriod(e.date, period))

  const revTTC       = filteredBookings.reduce((s, b) => s + (b.amount_ttc || 0), 0)
                     + filteredOffline.reduce((s, e) => s + (e.amount_ttc || 0), 0)
  const revHT        = revTTC / 1.2
  const tvaCollected = revTTC - revHT

  const totalMats    = filteredBookings.reduce((s, b: any) => s + bookingMaterials(b), 0)
                     + filteredOffline.reduce((s, e) => s + (e.materials_cost || 0), 0)

  const totalLabBase = filteredBookings.reduce((s, b: any) => s + bookingLabourBase(b), 0)
                     + filteredOffline.reduce((s, e) => {
                         if ((e.labor_cost ?? 0) > 0) return s + (e.labor_cost ?? 0)
                         return s + Math.max(0, e.amount_ttc / 1.2 - (e.materials_cost || 0))
                       }, 0)

  const mechanicPayout = totalLabBase * 0.65
  const cogs           = totalMats + mechanicPayout
  const grossProfit    = revHT - cogs
  const grossMargin    = revHT > 0 ? (grossProfit / revHT * 100) : 0

  const totalOpex  = filteredExpenses.reduce((s, e) => s + (e.amount_ttc || 0), 0)
  const netProfit  = grossProfit - totalOpex
  const netMargin  = revHT > 0 ? (netProfit / revHT * 100) : 0

  // ── 12-month chart data ───────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()
  const monthLabels = i18n.language === 'fr'
    ? ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 11 + i, 1)
    const m = d.getMonth(), y = d.getFullYear()
    const inM = (s: string) => { const dd = new Date(s); return dd.getMonth() === m && dd.getFullYear() === y }
    const mRevTTC = financeBookings.filter(b => inM(b.created_at)).reduce((s, b) => s + (b.amount_ttc || 0), 0)
                  + offlineEntries.filter(e => inM(e.date)).reduce((s, e) => s + (e.amount_ttc || 0), 0)
    const mRevHT  = mRevTTC / 1.2
    const mMats   = financeBookings.filter(b => inM(b.created_at)).reduce((s, b: any) => s + bookingMaterials(b), 0)
                  + offlineEntries.filter(e => inM(e.date)).reduce((s, e) => s + (e.materials_cost || 0), 0)
    const mLab    = financeBookings.filter(b => inM(b.created_at)).reduce((s, b: any) => s + bookingLabourBase(b), 0)
                  + offlineEntries.filter(e => inM(e.date)).reduce((s, e) => {
                      if ((e.labor_cost ?? 0) > 0) return s + (e.labor_cost ?? 0)
                      return s + Math.max(0, e.amount_ttc / 1.2 - (e.materials_cost || 0))
                    }, 0)
    const mOpex   = expenses.filter(e => inM(e.date)).reduce((s, e) => s + (e.amount_ttc || 0), 0)
    const mNet    = mRevHT - mMats - mLab * 0.65 - mOpex
    return { month: monthLabels[m], revenueTTC: Math.round(mRevTTC), netProfit: Math.round(mNet) }
  })

  // ── Pricing chart ─────────────────────────────────────────────────────────
  const priceChartData = PRICING_SERVICES
    .filter(s => !s.contactOnly)
    .map(s => {
      const moPrice   = s[selectedZone] as number
      const techCost  = Math.round(moPrice * 0.60)
      const mecalikMO = Math.round(moPrice * 0.40)
      const revenue   = getTotalRevenuePerIntervention(s, selectedZone)
      const partsAvg  = Math.round((revenue.partsMin + revenue.partsMax) / 2)
      return { name: s.labelShort, 'Part technicien': techCost, 'Marge MO MecaLIK': mecalikMO, 'Marge pièces (5%)': partsAvg }
    })

  const moServices   = PRICING_SERVICES.filter(s => !s.contactOnly && s[selectedZone])
  const avgMO        = moServices.length ? Math.round(moServices.reduce((sum, s) => sum + (s[selectedZone] as number) * 0.4, 0) / moServices.length) : 0
  const partsServices = PRICING_SERVICES.filter(s => s.hasPartsRequired && s.typicalPartsCost && s.typicalPartsCost.min > 0)
  const avgParts     = partsServices.length ? Math.round(partsServices.reduce((sum, s) => sum + ((s.typicalPartsCost!.min + s.typicalPartsCost!.max) / 2 * 0.05), 0) / partsServices.length) : 0

  const handlePrintQuote = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const validityDate = new Date()
    validityDate.setDate(validityDate.getDate() + quoteData.validityDays)
    const validityStr = validityDate.toLocaleDateString('fr-MA')

    const linesHtml = quoteData.lines.map(l => `
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
        <title>Devis ${quoteData.quoteNumber} — MecaLIK</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #1a1a1a; background: white; padding: 40px; }
          @media print { body { padding: 20px; } .no-print { display: none; } }
        </style>
      </head>
      <body>

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #43BCC9;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="https://mecalik.com/icons/icon-192x192.png"
                 style="width:56px;height:56px;border-radius:10px;object-fit:contain;background:#0A0A0A;padding:4px;"
                 alt="MecaLIK Logo"
            />
            <div>
              <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;line-height:1;">
                Meca<span style="color:#43BCC9;">LIK</span>
              </div>
              <div style="font-size:11px;color:#666;margin-top:2px;letter-spacing:0.03em;">
                Your car, your place. Our problem.
              </div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:32px;font-weight:800;color:#1a1a1a;margin-bottom:6px;">DEVIS</div>
            <div style="font-size:12px;color:#888;font-style:italic;">Estimation — non contractuel jusqu'à acceptation</div>
          </div>
        </div>

        <!-- Quote meta + client info -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;gap:24px;">
          <div style="flex:1;padding:16px 20px;background:#f8f9fa;border-radius:8px;border-left:4px solid #43BCC9;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:8px;">Devis établi pour</div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${quoteData.clientName || '—'}</div>
            ${quoteData.clientAddress ? `<div style="font-size:13px;color:#444;">${quoteData.clientAddress}</div>` : ''}
            ${quoteData.clientPhone ? `<div style="font-size:13px;color:#444;">Tél : ${quoteData.clientPhone}</div>` : ''}
            ${quoteData.clientEmail ? `<div style="font-size:13px;color:#444;">Email : ${quoteData.clientEmail}</div>` : ''}
            ${quoteData.clientICE ? `<div style="font-size:13px;color:#444;">ICE : ${quoteData.clientICE}</div>` : ''}
          </div>
          <div style="min-width:220px;">
            <table style="font-size:13px;margin-left:auto;">
              <tr>
                <td style="color:#666;padding:4px 8px 4px 0;">N° Devis :</td>
                <td style="font-weight:700;">${quoteData.quoteNumber}</td>
              </tr>
              <tr>
                <td style="color:#666;padding:4px 8px 4px 0;">Date d'émission :</td>
                <td style="font-weight:700;">${quoteData.quoteDate}</td>
              </tr>
              <tr>
                <td style="color:#666;padding:4px 8px 4px 0;">Valable jusqu'au :</td>
                <td style="font-weight:700;color:#43BCC9;">${validityStr}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Line items table -->
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

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span style="font-size:13px;color:#666;">Sous-total HT</span>
              <span style="font-size:13px;font-weight:600;">${quoteTotalHT.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
              <span style="font-size:13px;color:#666;">TVA (20%)</span>
              <span style="font-size:13px;font-weight:600;">${quoteTva.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fafa;border-radius:6px;padding:12px 16px;margin-top:4px;">
              <span style="font-size:16px;font-weight:800;">Total TTC</span>
              <span style="font-size:16px;font-weight:800;color:#43BCC9;">${quoteTotalTTC.toFixed(0)} MAD</span>
            </div>
          </div>
        </div>

        ${quoteData.notes ? `
        <!-- Notes -->
        <div style="padding:14px 18px;background:#f8f9fa;border-radius:8px;margin-bottom:32px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:6px;">Notes</div>
          <div style="font-size:13px;color:#444;">${quoteData.notes}</div>
        </div>` : ''}

        <!-- Approval section -->
        <div style="border:1px solid #ddd;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
          <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:16px;">BON POUR ACCORD — Signature client</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div>
              <div style="font-size:12px;color:#666;margin-bottom:8px;">Date :</div>
              <div style="border-bottom:1px solid #999;padding-bottom:4px;min-height:28px;"></div>
            </div>
            <div>
              <div style="font-size:12px;color:#666;margin-bottom:8px;">Signature :</div>
              <div style="border-bottom:1px solid #999;padding-bottom:4px;min-height:28px;"></div>
            </div>
          </div>
        </div>

        <!-- Validity notice -->
        <div style="background:#fffbea;border:1px solid #f0c040;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
          <div style="font-size:12px;color:#7a6200;">
            ⚠️ Ce devis est valable <strong>${quoteData.validityDays} jours</strong> à compter de sa date d'émission (${quoteData.quoteDate}).
            Une fois accepté, ce devis servira de base à l'établissement de la facture.
          </div>
        </div>

        <!-- System generated notice -->
        <div style="text-align:center;margin:20px 0 16px;">
          <span style="display:inline-block;padding:6px 16px;border-radius:20px;border:1px solid #43BCC9;font-size:11px;color:#43BCC9;letter-spacing:0.05em;">
            ✦ Document généré électroniquement — Ne nécessite pas de cachet ni de signature
          </span>
        </div>

        <!-- Footer -->
        <div style="border-top:2px solid #f0f0f0;padding-top:20px;text-align:center;margin-top:32px;">
          <div style="font-size:13px;color:#333;font-weight:600;margin-bottom:6px;">
            +212 777 348 065 &nbsp;·&nbsp; hello@mecalik.com
          </div>
          <div style="font-size:12px;color:#555;margin-bottom:4px;">
            82 ANG BD Abdelmoumen et Soumaya, Résidence Shahrazad 1 Etg 4 Appt 17, Casablanca, Maroc
          </div>
          <div style="font-size:11px;color:#888;">
            MecaLIK SARL AU &nbsp;·&nbsp; ICE : 003942374000016 &nbsp;·&nbsp; RC : 726381 &nbsp;·&nbsp; IF : 72071701
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

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:24px;border-bottom:3px solid #43BCC9;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="https://mecalik.com/icons/icon-192x192.png"
                 style="width:56px;height:56px;border-radius:10px;object-fit:contain;background:#0A0A0A;padding:4px;"
                 alt="MecaLIK Logo"
            />
            <div>
              <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;line-height:1;">
                Meca<span style="color:#43BCC9;">LIK</span>
              </div>
              <div style="font-size:11px;color:#666;margin-top:2px;letter-spacing:0.03em;">
                Your car, your place. Our problem.
              </div>
            </div>
          </div>
          <div></div>
        </div>

        <!-- Invoice title + client info -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;gap:24px;">
          <div style="flex:1;padding:16px 20px;background:#f8f9fa;border-radius:8px;border-left:4px solid #43BCC9;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:8px;">Facturé à</div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${invoiceData.clientName || '—'}</div>
            ${invoiceData.clientAddress ? `<div style="font-size:13px;color:#444;">${invoiceData.clientAddress}</div>` : ''}
            ${invoiceData.clientPhone ? `<div style="font-size:13px;color:#444;">Tél : ${invoiceData.clientPhone}</div>` : ''}
            ${invoiceData.clientEmail ? `<div style="font-size:13px;color:#444;">Email : ${invoiceData.clientEmail}</div>` : ''}
            ${invoiceData.clientICE ? `<div style="font-size:13px;color:#444;">ICE : ${invoiceData.clientICE}</div>` : ''}
          </div>
          <div style="text-align:right;min-width:220px;">
            <div style="font-size:32px;font-weight:800;color:#1a1a1a;margin-bottom:10px;">FACTURE</div>
            <table style="font-size:13px;margin-left:auto;">
              <tr>
                <td style="color:#666;padding:3px 8px 3px 0;">N° Facture :</td>
                <td style="font-weight:700;">${invoiceData.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color:#666;padding:3px 8px 3px 0;">Date :</td>
                <td style="font-weight:700;">${invoiceData.invoiceDate}</td>
              </tr>
            </table>
          </div>
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

        <!-- System generated notice -->
        <div style="text-align:center;margin:24px 0 16px;">
          <span style="display:inline-block;padding:6px 16px;border-radius:20px;border:1px solid #43BCC9;font-size:11px;color:#43BCC9;letter-spacing:0.05em;">
            ✦ Document généré électroniquement — Ne nécessite pas de cachet ni de signature
          </span>
        </div>

        <!-- Footer -->
        <div style="border-top:2px solid #f0f0f0;padding-top:20px;text-align:center;margin-top:40px;">
          <div style="font-size:13px;color:#333;font-weight:600;margin-bottom:6px;">
            +212 777 348 065 &nbsp;·&nbsp; hello@mecalik.com
          </div>
          <div style="font-size:12px;color:#555;margin-bottom:4px;">
            82 ANG BD Abdelmoumen et Soumaya, Résidence Shahrazad 1 Etg 4 Appt 17, Casablanca, Maroc
          </div>
          <div style="font-size:11px;color:#888;">
            MecaLIK SARL AU &nbsp;·&nbsp; ICE : 003942374000016 &nbsp;·&nbsp; RC : 726381 &nbsp;·&nbsp; IF : 72071701
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

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* P&L DASHBOARD                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
          📊 Compte de Résultat
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {PERIOD_OPTS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: period === p.key ? '#43BCC9' : 'transparent',
                  color: period === p.key ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
                }}
              >{p.label}</button>
            ))}
          </div>
          <button onClick={downloadReport} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📊 CSV
          </button>
          <button onClick={() => setShowQuoteModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)', color: '#F0C040', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📋 Devis
          </button>
          <button onClick={() => setShowInvoiceModal(true)} style={{ padding: '9px 16px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📄 Facture
          </button>
        </div>
      </div>

      {financeLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="w-8 h-8 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* 4 KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: "Chiffre d'Affaires TTC", value: fmt(revTTC),      sub: `${fmt(revHT)} HT`,                    color: 'white',   border: 'rgba(255,255,255,0.15)' },
              { label: 'TVA Collectée',           value: fmt(tvaCollected), sub: '20% du CA HT',                        color: '#F0C040', border: 'rgba(240,192,64,0.2)' },
              { label: 'Marge Brute',             value: fmt(grossProfit),  sub: `${grossMargin.toFixed(1)}% du CA HT`, color: grossProfit >= 0 ? '#43BCC9' : '#FF4444', border: grossProfit >= 0 ? 'rgba(67,188,201,0.25)' : 'rgba(255,68,68,0.25)' },
              { label: 'Résultat Net',            value: fmt(netProfit),    sub: `${netMargin.toFixed(1)}% du CA HT`,   color: netProfit >= 0 ? '#00DD88' : '#FF4444',   border: netProfit >= 0 ? 'rgba(0,221,136,0.25)' : 'rgba(255,68,68,0.25)' },
            ].map((kpi, idx) => (
              <div key={idx} style={{ padding: '20px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${kpi.border}`, borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>{kpi.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* P&L statement + 12-month chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '16px', marginBottom: '24px' }}>

            {/* Income statement */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                Compte de résultat
              </div>
              {([
                { label: 'CA TTC',                    value: revTTC,          color: 'white',                  indent: false, sep: false },
                { label: '− TVA collectée (20%)',     value: -tvaCollected,   color: '#F0C040',                indent: true,  sep: false },
                { label: 'CA Hors Taxes',             value: revHT,           color: 'white',                  indent: false, sep: true,  bold: true },
                { label: '− Matériaux (COGS)',        value: -totalMats,      color: 'rgba(255,255,255,0.5)',  indent: true,  sep: false },
                { label: '− Part mécaniciens (65%)',  value: -mechanicPayout, color: '#FF6B6B',               indent: true,  sep: false },
                { label: 'Marge Brute',               value: grossProfit,     color: grossProfit >= 0 ? '#43BCC9' : '#FF4444', indent: false, sep: true, bold: true, pct: grossMargin },
                { label: "− Charges d'exploitation", value: -totalOpex,      color: 'rgba(255,255,255,0.5)',  indent: true,  sep: false },
                { label: 'Résultat Net',              value: netProfit,       color: netProfit >= 0 ? '#00DD88' : '#FF4444',   indent: false, sep: true, bold: true, pct: netMargin },
              ] as { label: string; value: number; color: string; indent: boolean; sep: boolean; bold?: boolean; pct?: number }[]).map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: row.sep ? '10px' : '5px', paddingBottom: '5px',
                  paddingLeft: row.indent ? '10px' : '0',
                  borderTop: row.sep ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  marginTop: row.sep ? '4px' : '0',
                }}>
                  <span style={{ fontSize: row.bold ? '13px' : '12px', fontWeight: row.bold ? 700 : 400, color: row.bold ? 'white' : 'rgba(255,255,255,0.5)' }}>
                    {row.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.pct !== undefined && (
                      <span style={{ fontSize: '10px', color: row.color, opacity: 0.75 }}>{row.pct.toFixed(1)}%</span>
                    )}
                    <span style={{ fontSize: row.bold ? '13px' : '12px', fontWeight: row.bold ? 700 : 500, color: row.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                      {Math.abs(row.value).toFixed(0)} MAD
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 12-month line chart */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                Évolution 12 mois
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                    formatter={(val: unknown) => [`${val} MAD`, '']}
                    cursor={{ stroke: 'rgba(255,255,255,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="revenueTTC" stroke="#43BCC9" strokeWidth={2} dot={false} name="CA TTC" />
                  <Line type="monotone" dataKey="netProfit"  stroke="#00DD88" strokeWidth={2} dot={false} name="Résultat Net" strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CHARGES D'EXPLOITATION                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>📂 Charges d'exploitation</h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setExpCatFilter('all')}
            style={{ padding: '4px 12px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', background: expCatFilter === 'all' ? '#43BCC9' : 'rgba(255,255,255,0.07)', color: expCatFilter === 'all' ? '#0A0A0A' : 'rgba(255,255,255,0.5)' }}
          >Tout</button>
          {EXP_CATS.map(c => (
            <button
              key={c.key}
              onClick={() => setExpCatFilter(c.key)}
              style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', background: expCatFilter === c.key ? c.color : 'rgba(255,255,255,0.07)', color: expCatFilter === c.key ? '#0A0A0A' : 'rgba(255,255,255,0.5)' }}
            >{c.emoji} {c.label}</button>
          ))}
          <button
            onClick={() => setShowAddExpense(true)}
            style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
          >+ Charge</button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)', marginBottom: '24px' }}>
          Aucune charge enregistrée — cliquez sur "+ Charge" pour en ajouter
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 140px 110px 32px', gap: '8px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            {['Date', 'Catégorie', 'Description', 'Fournisseur', 'Montant TTC', ''].map(h => (
              <div key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>
          {expenses
            .filter(e => expCatFilter === 'all' || e.category === expCatFilter)
            .map(exp => {
              const cat = EXP_CATS.find(c => c.key === exp.category) ?? EXP_CATS[5]
              return (
                <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '90px 110px 1fr 140px 110px 32px', gap: '8px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{exp.date}</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: `${cat.color}22`, color: cat.color, fontWeight: 600, display: 'inline-block' }}>{cat.emoji} {cat.label}</span>
                  <div>
                    <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{exp.description}</div>
                    {exp.notes && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{exp.notes}</div>}
                  </div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{exp.vendor || '—'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B6B' }}>{exp.amount_ttc.toFixed(0)} MAD</span>
                  <button
                    onClick={async () => {
                      await supabase.from('expenses').delete().eq('id', exp.id)
                      setExpenses(prev => prev.filter(e => e.id !== exp.id))
                    }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}
                  >×</button>
                </div>
              )
            })
          }
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Total OPEX (période filtrée)</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#FF6B6B' }}>{fmt(totalOpex)}</span>
          </div>
        </div>
      )}

      {/* Add expense modal */}
      {showAddExpense && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111114', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>📂 Ajouter une charge</h3>
              <button onClick={() => setShowAddExpense(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {EXP_CATS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setNewExpense(p => ({ ...p, category: c.key }))}
                      style={{
                        padding: '8px 6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontFamily: 'Outfit, sans-serif', fontSize: '12px', fontWeight: 600,
                        background: newExpense.category === c.key ? c.color : 'rgba(255,255,255,0.06)',
                        color: newExpense.category === c.key ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.15s',
                      }}
                    >{c.emoji} {c.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Montant TTC (MAD)</label>
                  <input type="number" value={newExpense.amount_ttc || ''} placeholder="Ex: 1500" onChange={e => setNewExpense(p => ({ ...p, amount_ttc: parseFloat(e.target.value) || 0 }))} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input type="text" value={newExpense.description} placeholder="Loyer bureau, campagne Google Ads..." onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fournisseur (optionnel)</label>
                <input type="text" value={newExpense.vendor} placeholder="Google, AWS, Propriétaire..." onChange={e => setNewExpense(p => ({ ...p, vendor: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notes (optionnel)</label>
                <input type="text" value={newExpense.notes} placeholder="" onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))} style={inputStyle} />
              </div>
              <button
                onClick={async () => {
                  if (!newExpense.description || !newExpense.amount_ttc) return
                  const { data, error } = await supabase.from('expenses').insert({
                    date: newExpense.date,
                    category: newExpense.category,
                    description: newExpense.description,
                    vendor: newExpense.vendor || null,
                    amount_ttc: newExpense.amount_ttc,
                    amount_ht: parseFloat((newExpense.amount_ttc / 1.2).toFixed(2)),
                    notes: newExpense.notes || null,
                  }).select().single()
                  if (!error && data) {
                    setExpenses(prev => [data as Expense, ...prev])
                    setNewExpense({ date: new Date().toISOString().substring(0, 10), category: 'autre', description: '', vendor: '', amount_ttc: 0, notes: '' })
                    setShowAddExpense(false)
                  }
                }}
                style={{ padding: '12px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
              >
                Enregistrer la charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* OFFLINE INTERVENTIONS                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>📞 Interventions offline</h2>
        <button
          onClick={() => setShowAddOffline(true)}
          style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
        >
          + Intervention offline
        </button>
      </div>

      {offlineEntries.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 80px 110px 90px 32px', gap: '8px', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              {['Date', 'Client', 'Service', 'TTC', 'Matériaux', 'Mécanicien (65%)', 'Profit (35%)', ''].map(h => (
                <div key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>
            {offlineEntries.map(entry => {
              const ht = entry.amount_ttc / 1.2
              const labourBase = (entry.labor_cost ?? 0) > 0 ? (entry.labor_cost ?? 0) : Math.max(0, ht - (entry.materials_cost || 0))
              const mechPayout = labourBase * 0.65
              const profit     = labourBase * 0.35
              return (
                <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 80px 110px 90px 32px', gap: '8px', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{entry.date}</span>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{entry.client_name || '—'}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{entry.service_name}</span>
                  <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{entry.amount_ttc} MAD</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{entry.materials_cost || 0} MAD</span>
                  <span style={{ fontSize: '12px', color: '#FF6B6B' }}>{mechPayout.toFixed(0)} MAD</span>
                  <span style={{ fontSize: '13px', color: '#43BCC9', fontWeight: 700 }}>{profit.toFixed(0)} MAD</span>
                  <button
                    onClick={async () => {
                      await supabase.from('offline_interventions').delete().eq('id', entry.id)
                      setOfflineEntries(prev => prev.filter(e => e.id !== entry.id))
                    }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}
                  >×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add offline modal */}
      {showAddOffline && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111114', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>📞 Ajouter une intervention offline</h3>
              <button onClick={() => setShowAddOffline(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {([
                { label: 'Date',             field: 'date',         type: 'date' },
                { label: 'Nom du client',    field: 'client_name',  type: 'text', placeholder: 'Ex: Khalid Sekkaki' },
                { label: 'Service effectué', field: 'service_name', type: 'text', placeholder: 'Ex: Vidange & Filtres' },
              ] as { label: string; field: string; type: string; placeholder?: string }[]).map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input type={type} value={(newEntry as Record<string, string | number>)[field] as string} placeholder={placeholder} onChange={e => setNewEntry(prev => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Montant TTC (MAD)</label>
                <input type="number" value={newEntry.amount_ttc || ''} placeholder="Ex: 450" onChange={e => setNewEntry(prev => ({ ...prev, amount_ttc: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(67,188,201,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>🔩 Matériaux (MAD)</label>
                  <input type="number" value={newEntry.materials_cost || ''} placeholder="Ex: 200" onChange={e => setNewEntry(prev => ({ ...prev, materials_cost: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.2)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(240,192,64,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>🔧 Main d'œuvre (MAD)</label>
                  <input type="number" value={newEntry.labor_cost || ''} placeholder="Ex: 175" onChange={e => setNewEntry(prev => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Si "Main d'œuvre" est renseigné, le calcul 65/35 se base dessus. Sinon : HT − matériaux.
              </div>
              {newEntry.amount_ttc > 0 && (() => {
                const ht = newEntry.amount_ttc / 1.2
                const tvaPreview = newEntry.amount_ttc - ht
                const labourBase = (newEntry.labor_cost > 0) ? newEntry.labor_cost : Math.max(0, ht - (newEntry.materials_cost || 0))
                const mechPayoutPreview = labourBase * 0.65
                const profitPreview = labourBase * 0.35
                return (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.15)' }}>
                    <div style={{ fontSize: '11px', color: '#43BCC9', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu</div>
                    {([
                      { label: 'CA HT',                   value: ht.toFixed(0) + ' MAD',                            color: 'white' },
                      { label: 'TVA (20%)',                value: tvaPreview.toFixed(0) + ' MAD',                    color: '#F0C040' },
                      { label: '🔩 Matériaux',            value: (newEntry.materials_cost || 0).toFixed(0) + ' MAD', color: '#43BCC9' },
                      { label: "🔧 Main d'œuvre",         value: (newEntry.labor_cost || 0).toFixed(0) + ' MAD',     color: '#F0C040' },
                      { label: 'Base MO retenue',         value: labourBase.toFixed(0) + ' MAD',                    color: 'rgba(255,255,255,0.7)' },
                      { label: 'Part mécanicien (65%)',   value: mechPayoutPreview.toFixed(0) + ' MAD',              color: '#FF6B6B' },
                      { label: '→ Profit MecaLIK (35%)', value: profitPreview.toFixed(0) + ' MAD',                 color: '#43BCC9', bold: true },
                    ] as { label: string; value: string; color: string; bold?: boolean }[]).map((row, ri) => (
                      <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: row.bold ? 700 : 500, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <button
                onClick={async () => {
                  if (!newEntry.service_name || !newEntry.amount_ttc) return
                  const { data, error } = await supabase.from('offline_interventions').insert({
                    date: newEntry.date,
                    client_name: newEntry.client_name || null,
                    service_name: newEntry.service_name,
                    amount_ttc: newEntry.amount_ttc,
                    materials_cost: newEntry.materials_cost || 0,
                    labor_cost: newEntry.labor_cost || null,
                  }).select().single()
                  if (!error && data) {
                    setOfflineEntries(prev => [data as OfflineEntry, ...prev])
                    setNewEntry({ client_name: '', service_name: '', amount_ttc: 0, materials_cost: 0, labor_cost: 0, date: new Date().toISOString().substring(0, 10) })
                    setShowAddOffline(false)
                  }
                }}
                style={{ padding: '12px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}
              >
                Ajouter à la comptabilité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PRICING GRID                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

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
            { label: 'Services tarifés',  value: String(PRICING_SERVICES.filter(s => !s.contactOnly).length) },
            { label: 'Marge MO moy.',     value: `${avgMO} MAD` },
            { label: 'Marge pièces moy.', value: `+${avgParts} MAD` },
            { label: 'Seuil rentabilité', value: '82 interventions' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
              <div className="text-xl font-bold" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Tarifs et marges estimées par service</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceChartData} margin={{ top: 5, right: 20, bottom: 60, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }} formatter={(val: unknown) => [`${val} MAD`]} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
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
      {/* QUOTE MODAL                                                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: '#111114', borderRadius: '16px', border: '1px solid rgba(240,192,64,0.15)', padding: '32px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>📋 Nouveau Devis</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Estimation avant travaux — non contractuel jusqu'à acceptation</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintQuote} style={{ padding: '9px 18px', borderRadius: '8px', background: '#F0C040', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>🖨️ Générer PDF</button>
                <button onClick={() => setShowQuoteModal(false)} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div><label style={labelStyle}>N° Devis</label><input value={quoteData.quoteNumber} onChange={e => setQuoteData(p => ({ ...p, quoteNumber: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Date d'émission</label><input value={quoteData.quoteDate} onChange={e => setQuoteData(p => ({ ...p, quoteDate: e.target.value }))} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Validité</label>
                <select value={quoteData.validityDays} onChange={e => setQuoteData(p => ({ ...p, validityDays: parseInt(e.target.value) }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value={15}>15 jours</option><option value={30}>30 jours</option><option value={60}>60 jours</option><option value={90}>90 jours</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F0C040', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Informations Client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Nom / Société</label><input value={quoteData.clientName} onChange={e => setQuoteData(p => ({ ...p, clientName: e.target.value }))} placeholder="Transport Express Casablanca" style={inputStyle} /></div>
                <div><label style={labelStyle}>Téléphone</label><input value={quoteData.clientPhone} onChange={e => setQuoteData(p => ({ ...p, clientPhone: e.target.value }))} placeholder="06 XX XX XX XX" style={inputStyle} /></div>
                <div><label style={labelStyle}>Adresse</label><input value={quoteData.clientAddress} onChange={e => setQuoteData(p => ({ ...p, clientAddress: e.target.value }))} placeholder="Casablanca, Maroc" style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input value={quoteData.clientEmail} onChange={e => setQuoteData(p => ({ ...p, clientEmail: e.target.value }))} placeholder="contact@entreprise.ma" style={inputStyle} /></div>
                <div><label style={labelStyle}>ICE (optionnel)</label><input value={quoteData.clientICE} onChange={e => setQuoteData(p => ({ ...p, clientICE: e.target.value }))} placeholder="ICE de l'entreprise" style={inputStyle} /></div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#F0C040', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Prestations estimées</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px' }}>
                {['Description', 'Qté', 'P.U. HT (MAD)', 'Total HT', ''].map(h => (
                  <div key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {quoteData.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={line.description} onChange={e => updateQuoteLine(i, 'description', e.target.value)} placeholder="Vidange & Filtres — Toyota Hilux" style={inputStyle} />
                  <input value={line.quantity} type="number" min="1" onChange={e => updateQuoteLine(i, 'quantity', parseFloat(e.target.value) || 1)} style={inputStyle} />
                  <input value={line.unitPrice} type="number" min="0" onChange={e => updateQuoteLine(i, 'unitPrice', parseFloat(e.target.value) || 0)} style={inputStyle} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0C040', padding: '0 4px' }}>{(line.quantity * line.unitPrice).toFixed(0)} MAD</div>
                  {quoteData.lines.length > 1 ? (
                    <button onClick={() => removeQuoteLine(i)} style={{ background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: 0 }}>×</button>
                  ) : <div />}
                </div>
              ))}
              <button onClick={addQuoteLine} style={{ padding: '8px 14px', borderRadius: '8px', marginTop: '4px', background: 'rgba(240,192,64,0.06)', border: '1px dashed rgba(240,192,64,0.3)', color: '#F0C040', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Ajouter une ligne</button>
            </div>

            <div style={{ marginLeft: 'auto', width: '280px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Sous-total HT</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{quoteTotalHT.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>TVA (20%)</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{quoteTva.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>Total TTC</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#F0C040' }}>{quoteTotalTTC.toFixed(0)} MAD</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Notes / Observations (optionnel)</label>
              <textarea value={quoteData.notes} onChange={e => setQuoteData(p => ({ ...p, notes: e.target.value }))} placeholder="Délai d'intervention estimé, conditions particulières..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* INVOICE MODAL                                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '32px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>📄 Nouvelle Facture</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Remplissez les informations pour générer la facture</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrintInvoice} style={{ padding: '9px 18px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>🖨️ Imprimer</button>
                <button onClick={() => setShowInvoiceModal(false)} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div><label style={labelStyle}>N° Facture</label><input value={invoiceData.invoiceNumber} onChange={e => setInvoiceData(p => ({ ...p, invoiceNumber: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Date</label><input value={invoiceData.invoiceDate} onChange={e => setInvoiceData(p => ({ ...p, invoiceDate: e.target.value }))} style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Informations Client</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Nom / Société</label><input value={invoiceData.clientName} onChange={e => setInvoiceData(p => ({ ...p, clientName: e.target.value }))} placeholder="Transport Express Casablanca" style={inputStyle} /></div>
                <div><label style={labelStyle}>Téléphone</label><input value={invoiceData.clientPhone} onChange={e => setInvoiceData(p => ({ ...p, clientPhone: e.target.value }))} placeholder="06 XX XX XX XX" style={inputStyle} /></div>
                <div><label style={labelStyle}>Adresse</label><input value={invoiceData.clientAddress} onChange={e => setInvoiceData(p => ({ ...p, clientAddress: e.target.value }))} placeholder="Casablanca, Maroc" style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input value={invoiceData.clientEmail} onChange={e => setInvoiceData(p => ({ ...p, clientEmail: e.target.value }))} placeholder="contact@entreprise.ma" style={inputStyle} /></div>
                <div><label style={labelStyle}>ICE (optionnel)</label><input value={invoiceData.clientICE} onChange={e => setInvoiceData(p => ({ ...p, clientICE: e.target.value }))} placeholder="ICE de l'entreprise" style={inputStyle} /></div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Prestations</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px' }}>
                {['Description', 'Qté', 'P.U. HT (MAD)', 'Total HT', ''].map(h => (
                  <div key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {invoiceData.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Vidange & Filtres — Toyota Hilux" style={inputStyle} />
                  <input value={line.quantity} type="number" min="1" onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 1)} style={inputStyle} />
                  <input value={line.unitPrice} type="number" min="0" onChange={e => updateLine(i, 'unitPrice', parseFloat(e.target.value) || 0)} style={inputStyle} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#43BCC9', padding: '0 4px' }}>{(line.quantity * line.unitPrice).toFixed(0)} MAD</div>
                  {invoiceData.lines.length > 1 ? (
                    <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: 0 }}>×</button>
                  ) : <div />}
                </div>
              ))}
              <button onClick={addLine} style={{ padding: '8px 14px', borderRadius: '8px', marginTop: '4px', background: 'rgba(67,188,201,0.08)', border: '1px dashed rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Ajouter une ligne</button>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Mode de paiement</label>
                <select value={invoiceData.paymentMethod} onChange={e => setInvoiceData(p => ({ ...p, paymentMethod: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option>Espèces</option><option>Virement bancaire</option><option>Chèque</option><option>Carte bancaire</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notes / Observations</label>
                <textarea value={invoiceData.notes} onChange={e => setInvoiceData(p => ({ ...p, notes: e.target.value }))} placeholder="Paiement à 30 jours..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
