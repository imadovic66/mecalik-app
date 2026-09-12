/** Finances tab — P&L income statement dashboard (QuickBooks / Xero style) */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../../data/pricing'
import { type FinanceBooking, type Booking, type ServiceDetail, normalizeDetailType } from '../adminShared'
import { supabase } from '../../../lib/supabase'
import { computeQuoteTotals, computeOfflineTotals, ttcToHT, getCustomerName, getCustomerPhone } from '../../../lib/bookingUtils'
import {
  type Invoice, invoiceTotals, invoiceLineItems, sumInvoiceTotals, isBillable,
  insertInvoice, nextInvoiceNumber, printInvoiceDocument, formatInvoiceDate,
  invoiceMoneyColumns as invoiceMoneyColumnsFrom,
} from '../../../lib/invoices'
import { useAuth } from '../../../hooks/useAuth'
import { type Period, inPeriod, getPeriodLabel, PeriodPills } from './finances/period'
import { PAYMENT_METHODS } from './finances/ui'
import InvoicesSection from './finances/InvoicesSection'
import MechanicPayrollSection from './finances/MechanicPayrollSection'
import TvaPanel from './finances/TvaPanel'

interface Props {
  /** Completed platform bookings — used only to flag the ones never invoiced. */
  financeBookings: FinanceBooking[]
  financeLoading: boolean
  mechanics: { id: string; full_name: string | null }[]
  /** Recent bookings, for the "Réservation liée" picker. */
  bookings: Booking[]
}

/** Manual devis/facture line. unitPriceTTC is TTC per unit — the price the client pays.
 *  The type matters: only 'labor' lines feed the mechanic's 65% share. */
type LineType = 'material' | 'labor' | 'discount'
type InvoiceLine = { type: LineType; description: string; quantity: number; unitPriceTTC: number }

const LINE_TYPES: { key: LineType; emoji: string; label: string; color: string; bg: string }[] = [
  { key: 'material', emoji: '🔩', label: 'Pièce',        color: '#43BCC9', bg: 'rgba(67,188,201,0.15)' },
  { key: 'labor',    emoji: '🔧', label: "Main d'œuvre", color: '#F0C040', bg: 'rgba(240,192,64,0.15)' },
  { key: 'discount', emoji: '🎁', label: 'Remise',       color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
]

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyInvoice() {
  return {
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientICE: '',
    invoiceDate: todayISO(),
    technicianName: '',
    bookingId: null as string | null,
    serviceName: '',
    paymentStatus: 'unpaid' as 'unpaid' | 'paid',
    paymentMethod: 'Espèces',
    lines: [{ type: 'material', description: '', quantity: 1, unitPriceTTC: 0 }] as InvoiceLine[],
    notes: '',
  }
}
type ExpenseCategory = 'loyer' | 'salaires' | 'marketing' | 'transport' | 'tech' | 'admin' | 'insurance' | 'autre'

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

const EXP_CATS: { key: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { key: 'loyer',     label: 'Loyer',        emoji: '🏢', color: '#43BCC9' },
  { key: 'salaires',  label: 'Salaires',     emoji: '👤', color: '#F0C040' },
  { key: 'marketing', label: 'Marketing',    emoji: '📣', color: '#A78BFA' },
  { key: 'transport', label: 'Transport',    emoji: '🚗', color: '#34D399' },
  { key: 'tech',      label: 'Tech / SaaS',  emoji: '💻', color: '#60A5FA' },
  { key: 'admin',     label: 'Admin',        emoji: '📋', color: '#FB923C' },
  { key: 'insurance', label: 'Assurance',    emoji: '🛡️', color: '#E879F9' },
  { key: 'autre',     label: 'Autre',        emoji: '📦', color: 'rgba(255,255,255,0.5)' },
]

// All money math comes from the shared TTC-first helpers (computeQuoteTotals via
// lib/invoices, computeOfflineTotals) — the adapters below only reshape data.

/** Manual lines → service_details shape, dropping untouched blank rows. */
function invoiceLinesToDetails(lines: InvoiceLine[]): ServiceDetail[] {
  return lines
    .filter(l => l.description.trim() || l.unitPriceTTC > 0)
    .map(l => ({ type: l.type, name: l.description.trim(), quantity: String(l.quantity), unit_price: l.unitPriceTTC }))
}

/**
 * Pre-fill invoice lines from a linked booking's quote — only when that quote is in
 * the TTC convention (its lines sum to the stored amount_ttc). Pre-cutover quotes
 * stored HT unit prices; copying those as TTC would under-bill by 20%.
 */
function bookingInvoiceLines(b: Booking): InvoiceLine[] | null {
  const details = (b.service_details ?? []).filter(d => normalizeDetailType(d.type) !== 'vat')
  if (details.length === 0 || !b.amount_ttc) return null
  if (Math.abs(computeQuoteTotals(details).totalTTC - b.amount_ttc) > 1) return null
  return details.map(d => ({
    type: normalizeDetailType(d.type) as LineType,
    description: d.name,
    quantity: parseFloat(d.quantity ?? '1') || 1,
    unitPriceTTC: Number(d.unit_price) || 0,
  }))
}

/** Field-wise sum of computeOfflineTotals (pure addition). */
function sumOffline(entries: OfflineEntry[]) {
  return entries.reduce((a, e) => {
    const o = computeOfflineTotals(e)
    return {
      totalTTC: a.totalTTC + o.totalTTC, totalHT: a.totalHT + o.totalHT, totalTVA: a.totalTVA + o.totalTVA,
      materialsHT: a.materialsHT + o.materialsHT, labourHT: a.labourHT + o.labourHT,
      mechanicShare: a.mechanicShare + o.mechanicShare, mecalikShare: a.mecalikShare + o.mecalikShare,
    }
  }, { totalTTC: 0, totalHT: 0, totalTVA: 0, materialsHT: 0, labourHT: 0, mechanicShare: 0, mecalikShare: 0 })
}

/** An invoice in the booking-shaped row the Grand Livre expects. */
function invoiceAsLedgerEntry(i: Invoice) {
  return {
    id: i.id,
    created_at: i.invoice_date,
    service_name: i.service_name ?? '',
    amount_ttc: invoiceTotals(i).totalTTC,
    reference: i.invoice_number,
    profiles: { full_name: i.customer_name },
    service_details: invoiceLineItems(i),
  }
}

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD'
}

export default function FinancesTab({ financeBookings, financeLoading, mechanics, bookings }: Props) {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')
  const [period, setPeriod] = useState<Period>('month')

  // ── Report state ──────────────────────────────────────────────────────────
  const [showTvaModal, setShowTvaModal] = useState(false)
  const [tvaQuarter, setTvaQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'>(() => {
    const q = Math.floor(new Date().getMonth() / 3) + 1
    return `Q${q}` as 'Q1'|'Q2'|'Q3'|'Q4'
  })
  const [tvaYear, setTvaYear] = useState(new Date().getFullYear())

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
    lines: [{ type: 'material', description: '', quantity: 1, unitPriceTTC: 0 }] as InvoiceLine[],
    notes: '',
  })

  // ── Invoice modal state ───────────────────────────────────────────────────
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState(emptyInvoice)
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [nextNumberPreview, setNextNumberPreview] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [linkNote, setLinkNote] = useState<string | null>(null)

  // ── Invoices (persisted) ──────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)

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

  const fetchInvoices = useCallback(async () => {
    const { data, error } = await supabase.from('invoices').select('*').order('invoice_date', { ascending: false })
    if (error) setInvoicesError(error.message)
    else {
      setInvoices((data as Invoice[]) ?? [])
      setInvoicesError(null)
    }
    setInvoicesLoading(false)
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  // Live updates: another admin creating/editing an invoice, or marking a mechanic paid.
  useEffect(() => {
    const channel = supabase.channel('finances-invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => { fetchInvoices() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchInvoices])

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
      ['Type', 'Date', 'Référence', 'Client', 'Service', 'TTC (MAD)', 'HT (MAD)', 'TVA (MAD)', 'Matériaux TTC (MAD)', "Main d'œuvre TTC (MAD)", 'Remise TTC (MAD)', 'Base MO HT (MAD)', 'Mécanicien 65% (MAD)', 'Profit MecaLIK 35% (MAD)'],
    ]
    const billable = invoices.filter(isBillable)
    billable.forEach(inv => {
      const t = invoiceTotals(inv)
      rows.push(['Facture', formatInvoiceDate(inv.invoice_date), inv.invoice_number, inv.customer_name || '', inv.service_name || '', t.totalTTC.toFixed(2), t.totalHT.toFixed(2), t.totalTVA.toFixed(2), t.materialsTTC.toFixed(2), t.labourTTC.toFixed(2), t.discountTTC.toFixed(2), t.labourHT.toFixed(2), t.mechanicShare.toFixed(2), t.mecalikShare.toFixed(2)])
    })
    offlineEntries.forEach(e => {
      const o = computeOfflineTotals(e)
      rows.push(['Offline', e.date, 'OFFLINE', e.client_name || 'Client', e.service_name || '', o.totalTTC.toFixed(2), o.totalHT.toFixed(2), o.totalTVA.toFixed(2), (e.materials_cost || 0).toFixed(2), (e.labor_cost ?? 0).toFixed(2), '0.00', o.labourHT.toFixed(2), o.mechanicShare.toFixed(2), o.mecalikShare.toFixed(2)])
    })
    const it = sumInvoiceTotals(billable)
    const ot = sumOffline(offlineEntries)
    const allMatsTTC = it.materialsTTC + offlineEntries.reduce((s, e) => s + (e.materials_cost || 0), 0)
    rows.push(['TOTAL', '', '', '', '', (it.totalTTC + ot.totalTTC).toFixed(2), (it.totalHT + ot.totalHT).toFixed(2), (it.totalTVA + ot.totalTVA).toFixed(2), allMatsTTC.toFixed(2), '', '', (it.labourHT + ot.labourHT).toFixed(2), (it.mechanicShare + ot.mechanicShare).toFixed(2), (it.mecalikShare + ot.mecalikShare).toFixed(2)])
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `rapport-mecalik-${dateStr}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── Report handlers ───────────────────────────────────────────────────────
  const handlePLReport = async () => {
    const { generatePLReport } = await import('../../../utils/generatePLReport')
    generatePLReport({
      periodLabel:     getPeriodLabel(period),
      platformRevTTC,
      offlineRevTTC,
      revTTC, revHT, tvaCollected,
      totalMats, mechanicPayout,
      grossProfit, grossMargin,
      opexByCategory: EXP_CATS.map(c => ({
        label:  `${c.emoji} ${c.label}`,
        amount: filteredExpenses.filter(e => e.category === c.key).reduce((s, e) => s + (e.amount_ttc || 0), 0),
      })),
      totalOpex, netProfit, netMargin,
    })
  }

  const handleLedger = async () => {
    const { generateLedger } = await import('../../../utils/generateLedger')
    generateLedger({
      periodLabel: getPeriodLabel(period),
      bookings:    filteredInvoices.map(invoiceAsLedgerEntry),
      offline:     filteredOffline,
      expenses:    filteredExpenses,
    })
  }

  const handleVatDeclaration = async () => {
    const { generateVatDeclaration } = await import('../../../utils/generateVatDeclaration')
    generateVatDeclaration({
      quarter:  tvaQuarter,
      year:     tvaYear,
      bookings: invoices.filter(isBillable).map(i => ({ created_at: i.invoice_date, amount_ttc: invoiceTotals(i).totalTTC })),
      offline:  offlineEntries,
      expenses,
    })
    setShowTvaModal(false)
  }

  // ── Invoice helpers ───────────────────────────────────────────────────────
  const invoiceLineTotals = (lines: InvoiceLine[]) => computeQuoteTotals(invoiceLinesToDetails(lines))

  const addLine    = () => setInvoiceData(p => ({ ...p, lines: [...p.lines, { type: 'material', description: '', quantity: 1, unitPriceTTC: 0 }] }))
  const removeLine = (i: number) => setInvoiceData(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))
  const updateLine = (i: number, field: keyof InvoiceLine, val: string | number) =>
    setInvoiceData(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, [field]: val } : l) }))

  const openInvoiceModal = () => {
    setInvoiceData(emptyInvoice())
    setInvoiceError(null)
    setBookingSearch('')
    setLinkNote(null)
    setNextNumberPreview('')
    setShowInvoiceModal(true)
    nextInvoiceNumber(new Date().getFullYear()).then(setNextNumberPreview).catch(() => setNextNumberPreview(''))
  }

  const linkBooking = (b: Booking) => {
    const lines = bookingInvoiceLines(b)
    const name = getCustomerName(b)
    setInvoiceData(p => ({
      ...p,
      bookingId: b.id,
      clientName: name !== 'Client' ? name : p.clientName,
      clientPhone: getCustomerPhone(b) ?? p.clientPhone,
      clientAddress: b.address || p.clientAddress,
      technicianName: b.technician_name || p.technicianName,
      serviceName: b.service_name || p.serviceName,
      lines: lines ?? p.lines,
    }))
    setBookingSearch('')
    setLinkNote(lines
      ? `Client, technicien et ${lines.length} ligne(s) repris du devis.`
      : b.service_details?.length
        ? "Client et technicien repris. Lignes du devis non reprises (devis HT d'avant la bascule TTC) — saisissez les prix TTC."
        : 'Client et technicien repris.')
  }

  /** Persist first, print second: an invoice that exists on paper but not in the
   *  system is exactly the gap this closes. If the insert fails, no PDF. */
  const saveInvoice = async () => {
    if (invoiceSaving) return
    const lines = invoiceLinesToDetails(invoiceData.lines)
    const draft = computeQuoteTotals(lines)
    const missing: string[] = []
    if (!invoiceData.clientName.trim()) missing.push('nom du client')
    if (!invoiceData.technicianName) missing.push('technicien')
    if (!invoiceData.invoiceDate) missing.push('date de facture')
    if (draft.totalTTC <= 0) missing.push('au moins une prestation chiffrée')
    if (missing.length) { setInvoiceError(`Champs requis : ${missing.join(', ')}.`); return }

    // Open the print window synchronously inside the click — after the await, the
    // popup blocker would swallow it.
    const printWin = window.open('', '_blank')
    printWin?.document.write('<p style="font-family:Arial,sans-serif;padding:40px;color:#666">Enregistrement de la facture…</p>')

    setInvoiceSaving(true)
    setInvoiceError(null)
    const { invoice, error } = await insertInvoice({
      invoice_date:     invoiceData.invoiceDate,
      booking_id:       invoiceData.bookingId,
      customer_name:    invoiceData.clientName.trim(),
      customer_phone:   invoiceData.clientPhone.trim() || null,
      customer_address: invoiceData.clientAddress.trim() || null,
      customer_ice:     invoiceData.clientICE.trim() || null,
      service_name:     invoiceData.serviceName.trim() || null,
      technician_name:  invoiceData.technicianName,
      line_items:       lines,
      ...invoiceMoneyColumnsFrom(lines),
      payment_status:   invoiceData.paymentStatus,
      paid_at:          invoiceData.paymentStatus === 'paid' ? new Date().toISOString() : null,
      payment_method:   invoiceData.paymentMethod || null,
      mechanic_paid:    false,
      mechanic_paid_at: null,
      notes:            invoiceData.notes.trim() || null,
      created_by:       user?.id ?? null,
    })
    setInvoiceSaving(false)

    if (error || !invoice) {
      printWin?.close()
      setInvoiceError(`La facture n'a pas été enregistrée — aucun PDF généré. ${error ?? ''}`)
      return
    }
    printInvoiceDocument(invoice, printWin)
    setInvoices(prev => [invoice, ...prev.filter(i => i.id !== invoice.id)])
    setShowInvoiceModal(false)
    fetchInvoices()
  }

  const { totalTTC: quoteTotalTTC, totalHT: quoteTotalHT, totalTVA: quoteTva } = invoiceLineTotals(quoteData.lines)

  const addQuoteLine    = () => setQuoteData(p => ({ ...p, lines: [...p.lines, { type: 'material', description: '', quantity: 1, unitPriceTTC: 0 }] }))
  const removeQuoteLine = (i: number) => setQuoteData(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))
  const updateQuoteLine = (i: number, field: keyof InvoiceLine, val: string | number) =>
    setQuoteData(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, [field]: val } : l) }))

  // ── P&L computations (period-filtered) ───────────────────────────────────
  // Revenue source of truth is the invoice — the legal document — plus offline cash
  // jobs, which never get a formal invoice. Completed bookings no longer feed revenue
  // directly: once invoiced, counting both would double the revenue.
  const filteredInvoices = invoices.filter(isBillable).filter(i => inPeriod(i.invoice_date, period))
  const filteredOffline  = offlineEntries.filter(e => inPeriod(e.date, period))
  const filteredExpenses = expenses.filter(e => inPeriod(e.date, period))

  const invTotals = sumInvoiceTotals(filteredInvoices)
  const offTotals = sumOffline(filteredOffline)

  // Revenue is HT; TVA is collected for the state and shown separately, never as revenue.
  const platformRevTTC = invTotals.totalTTC
  const offlineRevTTC  = offTotals.totalTTC
  const revTTC       = platformRevTTC + offlineRevTTC
  const revHT        = invTotals.totalHT + offTotals.totalHT
  const tvaCollected = invTotals.totalTVA + offTotals.totalTVA

  const totalMats      = ttcToHT(invTotals.materialsTTC) + offTotals.materialsHT
  const mechanicPayout = invTotals.mechanicShare + offTotals.mechanicShare

  const cogs           = totalMats + mechanicPayout
  const grossProfit    = revHT - cogs
  const grossMargin    = revHT > 0 ? (grossProfit / revHT * 100) : 0

  const totalOpex  = filteredExpenses.reduce((s, e) => s + (e.amount_ttc || 0), 0)
  const netProfit  = grossProfit - totalOpex
  const netMargin  = revHT > 0 ? (netProfit / revHT * 100) : 0

  // Completed bookings never invoiced are now invisible to revenue — surface them.
  const invoicedBookingIds = new Set(invoices.map(i => i.booking_id).filter((id): id is string => !!id))
  const uninvoicedBookings = financeBookings.filter(b => !invoicedBookingIds.has(b.id))

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
    const mInv = sumInvoiceTotals(invoices.filter(isBillable).filter(i => inM(i.invoice_date)))
    const mOff = sumOffline(offlineEntries.filter(e => inM(e.date)))
    const mRevTTC = mInv.totalTTC + mOff.totalTTC
    const mRevHT  = mInv.totalHT + mOff.totalHT
    const mMatsHT = ttcToHT(mInv.materialsTTC) + mOff.materialsHT
    const mMech   = mInv.mechanicShare + mOff.mechanicShare
    const mOpex   = expenses.filter(e => inM(e.date)).reduce((s, e) => s + (e.amount_ttc || 0), 0)
    const mNet    = mRevHT - mMatsHT - mMech - mOpex
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
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">${l.unitPriceTTC.toFixed(0)} MAD</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:600;">${(l.quantity * l.unitPriceTTC).toFixed(0)} MAD</td>
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
              <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">P.U. TTC</th>
              <th style="padding:12px;font-size:12px;text-align:right;text-transform:uppercase;letter-spacing:0.05em;border-radius:0 6px 6px 0;">Total TTC</th>
            </tr>
          </thead>
          <tbody>${linesHtml}</tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <div style="width:280px;">
            <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fafa;border-radius:6px;padding:12px 16px;margin-bottom:4px;">
              <span style="font-size:16px;font-weight:800;">Total TTC</span>
              <span style="font-size:16px;font-weight:800;color:#43BCC9;">${quoteTotalTTC.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 16px;">
              <span style="font-size:12px;color:#888;">dont HT</span>
              <span style="font-size:12px;color:#888;">${quoteTotalHT.toFixed(0)} MAD</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 16px;">
              <span style="font-size:12px;color:#888;">dont TVA (20%)</span>
              <span style="font-size:12px;color:#888;">${quoteTva.toFixed(0)} MAD</span>
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
          <PeriodPills value={period} onChange={setPeriod} />
          <button onClick={downloadReport} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📊 CSV
          </button>
          <button onClick={() => setShowQuoteModal(true)} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)', color: '#F0C040', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📋 Devis
          </button>
          <button onClick={openInvoiceModal} style={{ padding: '9px 16px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            📄 Facture
          </button>
        </div>
      </div>

      {financeLoading || invoicesLoading ? (
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
                { label: 'CA TTC (factures + offline)', value: revTTC,          color: 'white',                  indent: false, sep: false },
                { label: '− TVA collectée (20%)',     value: -tvaCollected,   color: '#F0C040',                indent: true,  sep: false },
                { label: 'CA Hors Taxes',             value: revHT,           color: 'white',                  indent: false, sep: true,  bold: true },
                { label: '− Matériaux HT (COGS)',     value: -totalMats,      color: 'rgba(255,255,255,0.5)',  indent: true,  sep: false },
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
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* FACTURES                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

      {uninvoicedBookings.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', background: 'rgba(240,192,64,0.07)', border: '1px solid rgba(240,192,64,0.25)', fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
          ⚠️ <strong style={{ color: '#F0C040' }}>{uninvoicedBookings.length} réservation{uninvoicedBookings.length > 1 ? 's' : ''} terminée{uninvoicedBookings.length > 1 ? 's' : ''} sans facture</strong> — elles ne comptent plus dans le chiffre d'affaires.
          Créez la facture via « Nouvelle facture › Réservation liée ».
        </div>
      )}

      <InvoicesSection
        invoices={invoices}
        mechanics={mechanics}
        loading={invoicesLoading}
        error={invoicesError}
        onNew={openInvoiceModal}
        onChanged={fetchInvoices}
      />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* PAIE MÉCANICIENS + TVA                                        */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <MechanicPayrollSection invoices={invoices} onChanged={fetchInvoices} />
        <TvaPanel invoices={filteredInvoices} expenses={filteredExpenses} periodLabel={getPeriodLabel(period)} />
      </div>

      {/* RAPPORTS                                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '24px 0' }} />

      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 12px 0' }}>📊 Rapports</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* P&L PDF */}
          <button
            onClick={handlePLReport}
            style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
          >📄 Rapport P&L (PDF)</button>

          {/* Grand Livre Excel */}
          <button
            onClick={handleLedger}
            style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
          >📊 Grand Livre (Excel)</button>

          {/* TVA Declaration */}
          <button
            onClick={() => setShowTvaModal(true)}
            style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.3)', color: '#F0C040', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
          >🧾 Déclaration TVA (PDF)</button>

          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginLeft: '4px' }}>
            Période active : {getPeriodLabel(period)}
          </span>
        </div>

        {/* TVA quarter selector */}
        {showTvaModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px 28px 24px', width: '340px', maxWidth: '90vw' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 18px 0' }}>🧾 Déclaration TVA</h3>

              {/* Quarter selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Trimestre</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['Q1','Q2','Q3','Q4'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setTvaQuarter(q)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit, sans-serif', background: tvaQuarter === q ? '#F0C040' : 'rgba(255,255,255,0.07)', color: tvaQuarter === q ? '#0A0A0A' : 'rgba(255,255,255,0.5)' }}
                    >{q}</button>
                  ))}
                </div>
              </div>

              {/* Year input */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>Année</label>
                <input
                  type="number"
                  value={tvaYear}
                  onChange={e => setTvaYear(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowTvaModal(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >Annuler</button>
                <button
                  onClick={handleVatDeclaration}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: '#F0C040', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >Générer</button>
              </div>
            </div>
          </div>
        )}
      </div>

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
          >+ Ajouter une dépense</button>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                    amount_ht: parseFloat(ttcToHT(newExpense.amount_ttc).toFixed(2)),
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
              {['Date', 'Client', 'Service', 'TTC', 'Matériaux TTC', 'Mécanicien (65%)', 'Profit (35%)', ''].map(h => (
                <div key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
              ))}
            </div>
            {offlineEntries.map(entry => {
              const o = computeOfflineTotals(entry)
              const mechPayout = o.mechanicShare
              const profit     = o.mecalikShare
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
                  <label style={{ fontSize: '11px', color: 'rgba(67,188,201,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>🔩 Matériaux TTC (MAD)</label>
                  <input type="number" value={newEntry.materials_cost || ''} placeholder="Ex: 200" onChange={e => setNewEntry(prev => ({ ...prev, materials_cost: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.2)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(240,192,64,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>🔧 Main d'œuvre TTC (MAD)</label>
                  <input type="number" value={newEntry.labor_cost || ''} placeholder="Ex: 175" onChange={e => setNewEntry(prev => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Tous les montants sont TTC. Si "Main d'œuvre" est renseigné, le 65/35 se base sur sa
                part HT. Sinon : (TTC − matériaux) ÷ 1,2.
              </div>
              {newEntry.amount_ttc > 0 && (() => {
                const o = computeOfflineTotals(newEntry)
                const mechPayoutPreview = o.mechanicShare
                const profitPreview = o.mecalikShare
                return (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.15)' }}>
                    <div style={{ fontSize: '11px', color: '#43BCC9', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu</div>
                    {([
                      { label: 'Total TTC',                value: o.totalTTC.toFixed(0) + ' MAD',                     color: 'white', bold: true },
                      { label: 'dont HT',                  value: o.totalHT.toFixed(0) + ' MAD',                      color: 'rgba(255,255,255,0.6)' },
                      { label: 'dont TVA (20%)',           value: o.totalTVA.toFixed(0) + ' MAD',                     color: '#F0C040' },
                      { label: '🔩 Matériaux (TTC)',      value: (newEntry.materials_cost || 0).toFixed(0) + ' MAD', color: '#43BCC9' },
                      { label: "🔧 Main d'œuvre (TTC)",   value: (newEntry.labor_cost || 0).toFixed(0) + ' MAD',     color: '#F0C040' },
                      { label: "Base MO retenue (HT)",     value: o.labourHT.toFixed(0) + ' MAD',                     color: 'rgba(255,255,255,0.7)' },
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
                {['Description', 'Qté', 'P.U. TTC (MAD)', 'Total TTC', ''].map(h => (
                  <div key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {quoteData.lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 100px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={line.description} onChange={e => updateQuoteLine(i, 'description', e.target.value)} placeholder="Vidange & Filtres — Toyota Hilux" style={inputStyle} />
                  <input value={line.quantity} type="number" min="1" onChange={e => updateQuoteLine(i, 'quantity', parseFloat(e.target.value) || 1)} style={inputStyle} />
                  <div>
                    <input value={line.unitPriceTTC} type="number" min="0" onChange={e => updateQuoteLine(i, 'unitPriceTTC', parseFloat(e.target.value) || 0)} style={inputStyle} />
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', lineHeight: 1.25 }}>Prix client, TVA incluse</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0C040', padding: '0 4px' }}>{(line.quantity * line.unitPriceTTC).toFixed(0)} MAD</div>
                  {quoteData.lines.length > 1 ? (
                    <button onClick={() => removeQuoteLine(i)} style={{ background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: 0 }}>×</button>
                  ) : <div />}
                </div>
              ))}
              <button onClick={addQuoteLine} style={{ padding: '8px 14px', borderRadius: '8px', marginTop: '4px', background: 'rgba(240,192,64,0.06)', border: '1px dashed rgba(240,192,64,0.3)', color: '#F0C040', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Ajouter une ligne</button>
            </div>

            <div style={{ marginLeft: 'auto', width: '280px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>TOTAL TTC</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{quoteTotalTTC.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>dont HT</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{quoteTotalHT.toFixed(0)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>dont TVA (20%)</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{quoteTva.toFixed(0)} MAD</span>
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
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* INVOICE MODAL — persisted to public.invoices, then printed     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showInvoiceModal && (() => {
        const draft = invoiceLineTotals(invoiceData.lines)
        const q = bookingSearch.trim().toLowerCase()
        const bookingMatches = q
          ? bookings
              .filter(b => b.status !== 'cancelled' && ((b.reference ?? '').toLowerCase().includes(q) || getCustomerName(b).toLowerCase().includes(q)))
              .slice(0, 8)
          : []
        const linked = invoiceData.bookingId ? bookings.find(b => b.id === invoiceData.bookingId) ?? null : null
        const invoicedIds = new Set(invoices.map(i => i.booking_id).filter((id): id is string => !!id))
        const mechanicNames = mechanics.map(m => m.full_name).filter((n): n is string => !!n)
        if (invoiceData.technicianName && !mechanicNames.includes(invoiceData.technicianName)) mechanicNames.unshift(invoiceData.technicianName)
        const closeModal = () => { if (!invoiceSaving) setShowInvoiceModal(false) }
        const sectionTitle: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }
        const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12px', overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '800px', background: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(16px, 4vw, 32px)', margin: '8px 0 24px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>📄 Nouvelle Facture</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    N° attribué à l'enregistrement
                    {nextNumberPreview && <> — prochain : <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>{nextNumberPreview}</span></>}
                  </p>
                </div>
                <button onClick={closeModal} disabled={invoiceSaving} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>✕</button>
              </div>

              {/* Facture */}
              <div style={{ ...grid, marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Date de facture *</label>
                  <input type="date" value={invoiceData.invoiceDate} onChange={e => setInvoiceData(p => ({ ...p, invoiceDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Statut de paiement</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {([['unpaid', 'Non payé', '#F0C040', 'rgba(240,192,64,0.12)'], ['paid', 'Payé', '#00DD88', 'rgba(0,221,136,0.12)']] as const).map(([key, label, color, bg]) => {
                      const active = invoiceData.paymentStatus === key
                      return (
                        <button key={key} onClick={() => setInvoiceData(p => ({ ...p, paymentStatus: key }))} style={{
                          flex: 1, padding: '9px 6px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                          border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                          background: active ? bg : 'rgba(255,255,255,0.03)',
                          color: active ? color : 'rgba(255,255,255,0.4)',
                        }}>{label}</button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Mode de paiement</label>
                  <select value={invoiceData.paymentMethod} onChange={e => setInvoiceData(p => ({ ...p, paymentMethod: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Intervention */}
              <h3 style={sectionTitle}>Intervention</h3>
              <div style={{ ...grid, marginBottom: linkNote ? '8px' : '24px' }}>
                <div>
                  <label style={labelStyle}>Technicien *</label>
                  <select value={invoiceData.technicianName} onChange={e => setInvoiceData(p => ({ ...p, technicianName: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">— Choisir le technicien —</option>
                    {mechanicNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Requis — sa part (65% de la MO HT) en dépend</div>
                </div>

                <div>
                  <label style={labelStyle}>Réservation liée (optionnel)</label>
                  {linked ? (
                    <>
                      <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(67,188,201,0.08)', borderColor: 'rgba(67,188,201,0.3)' }}>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', color: '#43BCC9' }}>{linked.reference ?? linked.id.slice(0, 8)}</span> · {getCustomerName(linked)}
                        </span>
                        <button onClick={() => { setInvoiceData(p => ({ ...p, bookingId: null })); setLinkNote(null) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>✕</button>
                      </div>
                      {invoicedIds.has(linked.id) && <div style={{ fontSize: '11px', color: '#F0C040', marginTop: '4px' }}>⚠️ Cette réservation a déjà une facture.</div>}
                    </>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Réf. MK-… ou nom du client" style={inputStyle} />
                      {q && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 5, background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                          {bookingMatches.length === 0 ? (
                            <div style={{ padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Aucune réservation trouvée</div>
                          ) : bookingMatches.map(b => (
                            <button key={b.id} onClick={() => linkBooking(b)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                              <span style={{ fontFamily: 'monospace', color: '#43BCC9' }}>{b.reference ?? b.id.slice(0, 8)}</span> · {getCustomerName(b)}
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                {b.service_name}{b.technician_name ? ` · ${b.technician_name}` : ''}{invoicedIds.has(b.id) ? ' · déjà facturée' : ''}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Prestation</label>
                  <input value={invoiceData.serviceName} onChange={e => setInvoiceData(p => ({ ...p, serviceName: e.target.value }))} placeholder="Ex: Vidange & Filtres" style={inputStyle} />
                </div>
              </div>
              {linkNote && <div style={{ fontSize: '11px', color: '#43BCC9', marginBottom: '24px' }}>ℹ️ {linkNote}</div>}

              {/* Client */}
              <h3 style={sectionTitle}>Informations Client</h3>
              <div style={{ ...grid, marginBottom: '24px' }}>
                <div><label style={labelStyle}>Nom / Société *</label><input value={invoiceData.clientName} onChange={e => setInvoiceData(p => ({ ...p, clientName: e.target.value }))} placeholder="Transport Express Casablanca" style={inputStyle} /></div>
                <div><label style={labelStyle}>Téléphone</label><input type="tel" inputMode="tel" value={invoiceData.clientPhone} onChange={e => setInvoiceData(p => ({ ...p, clientPhone: e.target.value }))} placeholder="06 XX XX XX XX" style={inputStyle} /></div>
                <div><label style={labelStyle}>Adresse</label><input value={invoiceData.clientAddress} onChange={e => setInvoiceData(p => ({ ...p, clientAddress: e.target.value }))} placeholder="Casablanca, Maroc" style={inputStyle} /></div>
                <div><label style={labelStyle}>ICE (optionnel)</label><input value={invoiceData.clientICE} onChange={e => setInvoiceData(p => ({ ...p, clientICE: e.target.value }))} placeholder="ICE de l'entreprise" style={inputStyle} /></div>
              </div>

              {/* Prestations */}
              <h3 style={sectionTitle}>Prestations</h3>
              {invoiceData.lines.map((line, i) => {
                const lineTotal = line.quantity * line.unitPriceTTC
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {LINE_TYPES.map(lt => {
                          const active = line.type === lt.key
                          return (
                            <button key={lt.key} onClick={() => updateLine(i, 'type', lt.key)} title={lt.label} style={{
                              padding: '7px 9px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                              fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
                              background: active ? lt.bg : 'rgba(255,255,255,0.04)',
                              color: active ? lt.color : 'rgba(255,255,255,0.35)',
                            }}>{lt.emoji} {lt.label}</button>
                          )
                        })}
                      </div>
                      <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} placeholder="Vidange & Filtres — Toyota Hilux" style={{ ...inputStyle, flex: '1 1 200px', width: 'auto' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <div style={{ width: '80px' }}>
                        <label style={labelStyle}>Qté</label>
                        <input value={line.quantity} type="number" min="1" inputMode="decimal" onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 1)} style={inputStyle} />
                      </div>
                      <div style={{ flex: '1 1 140px' }}>
                        <label style={labelStyle}>P.U. TTC (MAD)</label>
                        <input value={line.unitPriceTTC} type="number" min="0" inputMode="decimal" onChange={e => updateLine(i, 'unitPriceTTC', parseFloat(e.target.value) || 0)} style={inputStyle} />
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', lineHeight: 1.25 }}>Prix client, TVA incluse</div>
                      </div>
                      <div style={{ flex: '1 1 110px', textAlign: 'right' }}>
                        <label style={{ ...labelStyle, textAlign: 'right' }}>Total TTC</label>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: line.type === 'discount' ? '#FF6B6B' : '#43BCC9', padding: '8px 0' }}>
                          {line.type === 'discount' ? '−' : ''}{lineTotal.toFixed(2)} MAD
                        </div>
                      </div>
                      {invoiceData.lines.length > 1 && (
                        <button onClick={() => removeLine(i)} style={{ alignSelf: 'center', background: 'rgba(255,68,68,0.1)', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, width: '32px', height: '32px', borderRadius: '8px' }}>×</button>
                      )}
                    </div>
                  </div>
                )
              })}
              <button onClick={addLine} style={{ padding: '8px 14px', borderRadius: '8px', marginTop: '4px', background: 'rgba(67,188,201,0.08)', border: '1px dashed rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>+ Ajouter une ligne</button>

              {/* Totals — TTC leads; HT and TVA are components of it */}
              <div style={{ width: '100%', maxWidth: '320px', margin: '20px 0 24px auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>TOTAL TTC</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{draft.totalTTC.toFixed(2)} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>dont HT</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{draft.totalHT.toFixed(2)} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>dont TVA (20%)</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{draft.totalTVA.toFixed(2)} MAD</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Part technicien (65% MO HT)</span>
                  <span style={{ fontSize: '12px', color: '#FF6B6B', fontWeight: 600 }}>{draft.mechanicShare.toFixed(2)} MAD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Profit MecaLIK (35%)</span>
                  <span style={{ fontSize: '12px', color: '#43BCC9', fontWeight: 600 }}>{draft.mecalikShare.toFixed(2)} MAD</span>
                </div>
                {draft.totalTTC > 0 && draft.labourTTC === 0 && (
                  <div style={{ fontSize: '11px', color: '#F0C040', marginTop: '6px', lineHeight: 1.4 }}>
                    ⚠️ Aucune ligne « Main d'œuvre » — la part technicien sera de 0 MAD.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Notes / Observations</label>
                <textarea value={invoiceData.notes} onChange={e => setInvoiceData(p => ({ ...p, notes: e.target.value }))} placeholder="Paiement à 30 jours..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {invoiceError && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.35)', color: '#FF8888', fontSize: '13px', lineHeight: 1.45 }}>
                  {invoiceError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={closeModal} disabled={invoiceSaving} style={{ padding: '11px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Annuler</button>
                <button onClick={saveInvoice} disabled={invoiceSaving} style={{ padding: '11px 22px', borderRadius: '10px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: invoiceSaving ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: invoiceSaving ? 0.7 : 1 }}>
                  {invoiceSaving ? 'Enregistrement…' : '💾 Enregistrer & générer la facture'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
