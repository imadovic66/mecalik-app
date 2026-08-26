import jsPDF from 'jspdf'

const Q_MONTHS: Record<string, number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
}

const MONTH_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const CAT_LABELS: Record<string, string> = {
  loyer:     '🏢 Loyer',
  salaires:  '👤 Salaires',
  marketing: '📣 Marketing',
  transport: '🚗 Transport',
  tech:      '💻 Tech / SaaS',
  admin:     '📋 Admin',
  insurance: '🛡️ Assurance',
  autre:     '📦 Autre',
}

type BookingEntry  = { created_at: string; amount_ttc: number }
type OfflineEntry  = { date: string; amount_ttc: number }
type ExpenseEntry  = { date: string; amount_ttc: number; amount_ht: number | null; category: string }

export type VatDeclarationData = {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  year: number
  bookings: BookingEntry[]
  offline: OfflineEntry[]
  expenses: ExpenseEntry[]
}

export function generateVatDeclaration(data: VatDeclarationData): void {
  const { quarter, year } = data
  const months = Q_MONTHS[quarter]

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  const TEAL: [number, number, number]  = [67, 188, 201]
  const DARK: [number, number, number]  = [8, 8, 8]
  const RED: [number, number, number]   = [220, 53, 69]
  const GREEN: [number, number, number] = [0, 190, 110]
  const AMBER: [number, number, number] = [240, 192, 64]

  // ── Header ─────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(...TEAL)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MecaLIK', 15, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text('MecaLIK SARL AU  ·  ICE : 003942374000016  ·  RC : 726381  ·  IF : 72071701', 15, 26)
  doc.text('82 ANG BD Abdelmoumen et Soumaya, Casablanca, Maroc', 15, 32)
  doc.text('+212 777 348 065  ·  hello@mecalik.com', 15, 38)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('DÉCLARATION TVA', pageWidth - 15, 18, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...AMBER)
  doc.text(`${quarter} — ${year}`, pageWidth - 15, 27, { align: 'right' })
  doc.setTextColor(160, 160, 160)
  doc.setFontSize(8)
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 34, { align: 'right' })

  // ── Helpers ────────────────────────────────────────────────────
  const R  = 15
  const RR = pageWidth - 15
  let y = 55

  function guardY() { if (y > 268) { doc.addPage(); y = 20 } }

  function sectionBar(title: string) {
    guardY()
    doc.setFillColor(25, 25, 25)
    doc.rect(R, y - 4, RR - R, 8, 'F')
    doc.setTextColor(...TEAL)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(title, R + 3, y + 1)
    y += 11
  }

  function dataRow(
    label: string,
    value: number,
    opts: { indent?: boolean; bold?: boolean; textColor?: [number, number, number] } = {}
  ) {
    guardY()
    doc.setFontSize(opts.bold ? 10 : 9)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    const tc: [number, number, number] = opts.textColor ?? (opts.bold ? [255, 255, 255] : [180, 180, 180])
    doc.setTextColor(...tc)
    doc.text(label, opts.indent ? R + 8 : R + 3, y + 1)
    const str = value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
    doc.text(str, RR, y + 1, { align: 'right' })
    y += 7
  }

  function sep() {
    guardY()
    doc.setDrawColor(45, 45, 45)
    doc.line(R, y - 1, RR, y - 1)
    y += 3
  }

  // ── TVA collectée ──────────────────────────────────────────────
  sectionBar('TVA COLLECTÉE (réservations + interventions offline)')

  const collectedByMonth = months.map(m => {
    const bRev = data.bookings
      .filter(b => { const d = new Date(b.created_at); return d.getMonth() === m && d.getFullYear() === year })
      .reduce((s, b) => s + (b.amount_ttc || 0), 0)
    const oRev = data.offline
      .filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === year })
      .reduce((s, e) => s + (e.amount_ttc || 0), 0)
    const ttc = bRev + oRev
    return { month: m, tva: ttc - ttc / 1.2, ttc }
  })

  collectedByMonth.forEach(({ month, tva, ttc }) => {
    dataRow(
      `${MONTH_FR[month]}  (CA TTC : ${ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD)`,
      tva,
      { indent: true }
    )
  })

  sep()
  const totalCollected = collectedByMonth.reduce((s, r) => s + r.tva, 0)
  dataRow('TOTAL TVA COLLECTÉE', totalCollected, { bold: true, textColor: TEAL })
  y += 5

  // ── TVA déductible ─────────────────────────────────────────────
  sectionBar('TVA DÉDUCTIBLE (charges)')

  const deductByCategory: Record<string, number> = {}
  data.expenses.forEach(e => {
    const d = new Date(e.date)
    if (!months.includes(d.getMonth()) || d.getFullYear() !== year) return
    const ht  = e.amount_ht ?? e.amount_ttc / 1.2
    const tva = e.amount_ttc - ht
    deductByCategory[e.category] = (deductByCategory[e.category] ?? 0) + tva
  })

  let totalDeductible = 0
  const cats = Object.entries(deductByCategory).filter(([, v]) => v > 0)
  if (cats.length === 0) {
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(80, 80, 80)
    guardY()
    doc.text('Aucune charge avec TVA enregistrée pour ce trimestre', R + 8, y + 1)
    y += 9
  } else {
    cats.forEach(([cat, tva]) => {
      dataRow(CAT_LABELS[cat] ?? cat, tva, { indent: true })
      totalDeductible += tva
    })
  }

  sep()
  dataRow('TOTAL TVA DÉDUCTIBLE', totalDeductible, { bold: true, textColor: [160, 160, 160] })
  y += 5

  // ── TVA nette ──────────────────────────────────────────────────
  const vatDue    = totalCollected - totalDeductible
  const isOwed    = vatDue >= 0
  const vatColor: [number, number, number] = isOwed ? RED : GREEN
  const vatBg: [number, number, number]    = isOwed ? [38, 8, 8] : [0, 30, 16]
  const vatLabel  = isOwed ? 'TVA À PAYER' : 'TVA À RÉCUPÉRER'

  guardY()
  doc.setFillColor(...vatBg)
  doc.rect(R, y - 4, RR - R, 13, 'F')
  doc.setTextColor(...vatColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(vatLabel, R + 3, y + 4)
  const dueStr = Math.abs(vatDue).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'
  doc.text(dueStr, RR, y + 4, { align: 'right' })
  y += 18

  // ── Summary box ────────────────────────────────────────────────
  guardY()
  doc.setFillColor(18, 18, 18)
  doc.roundedRect(R, y, RR - R, 28, 3, 3, 'F')
  doc.setDrawColor(50, 50, 50)
  doc.roundedRect(R, y, RR - R, 28, 3, 3, 'S')

  const col2 = R + (RR - R) / 2
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(90, 90, 90)
  doc.text('TVA COLLECTÉE', R + 6, y + 8)
  doc.text('TVA DÉDUCTIBLE', col2 + 6, y + 8)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEAL)
  doc.text(`${totalCollected.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`, R + 6, y + 18)
  doc.setTextColor(160, 160, 160)
  doc.text(`${totalDeductible.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`, col2 + 6, y + 18)
  y += 34

  // ── Footer ─────────────────────────────────────────────────────
  const fy = 284
  doc.setDrawColor(35, 35, 35)
  doc.line(R, fy - 5, RR, fy - 5)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70)
  doc.text("À joindre à votre déclaration DGI. Taux TVA appliqué : 20 %.", pageWidth / 2, fy, { align: 'center' })
  doc.text('MecaLIK SARL AU  ·  Casablanca, Maroc  ·  hello@mecalik.com  ·  +212 777 348 065', pageWidth / 2, fy + 5, { align: 'center' })

  doc.save(`declaration-tva-${quarter}-${year}.pdf`)
}
