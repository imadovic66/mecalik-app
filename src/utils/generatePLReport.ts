import jsPDF from 'jspdf'

export type PLReportData = {
  periodLabel: string
  platformRevTTC: number
  offlineRevTTC: number
  revTTC: number
  revHT: number
  tvaCollected: number
  totalMats: number
  mechanicPayout: number
  grossProfit: number
  grossMargin: number
  opexByCategory: { label: string; amount: number }[]
  totalOpex: number
  netProfit: number
  netMargin: number
}

export function generatePLReport(data: PLReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  const TEAL: [number, number, number] = [67, 188, 201]
  const DARK: [number, number, number] = [8, 8, 8]
  const RED: [number, number, number]  = [220, 53, 69]
  const GREEN: [number, number, number] = [0, 190, 110]

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
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPTE DE RÉSULTAT', pageWidth - 15, 18, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 160, 160)
  doc.text(data.periodLabel, pageWidth - 15, 26, { align: 'right' })
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 32, { align: 'right' })

  // ── Helpers ────────────────────────────────────────────────────
  const R   = 15
  const RR  = pageWidth - 15
  let y = 55

  function addPage() { doc.addPage(); y = 20 }
  function guardY() { if (y > 268) addPage() }

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

  function row(
    label: string,
    value: number,
    opts: {
      bold?: boolean; indent?: boolean
      textColor?: [number, number, number]
      bgColor?: [number, number, number]
      fs?: number
    } = {}
  ) {
    guardY()
    if (opts.bgColor) {
      doc.setFillColor(...opts.bgColor)
      doc.rect(R, y - 4, RR - R, opts.fs && opts.fs > 10 ? 11 : 8, 'F')
    }
    const fs = opts.fs ?? (opts.bold ? 10 : 9)
    doc.setFontSize(fs)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    const tc: [number, number, number] = opts.textColor ?? (opts.bold ? [255, 255, 255] : [180, 180, 180])
    doc.setTextColor(...tc)
    const lx = opts.indent ? R + 8 : R + 3
    doc.text(label, lx, y + 1)
    const absV = Math.abs(value)
    const sign = value < 0 ? '−' : ''
    const str  = `${sign}${absV.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MAD`
    doc.text(str, RR, y + 1, { align: 'right' })
    y += opts.fs && opts.fs > 10 ? 12 : 8
  }

  function sep() {
    guardY()
    doc.setDrawColor(45, 45, 45)
    doc.line(R, y - 1, RR, y - 1)
    y += 3
  }

  function pct(label: string, pctVal: number) {
    guardY()
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(90, 90, 90)
    doc.text(label, R + 3, y + 1)
    doc.text(`${pctVal.toFixed(1)} %`, RR, y + 1, { align: 'right' })
    y += 7
  }

  // ── REVENUS ────────────────────────────────────────────────────
  sectionBar('REVENUS')
  row('Réservations plateforme', data.platformRevTTC, { indent: true })
  row('Interventions offline',   data.offlineRevTTC,   { indent: true })
  sep()
  row('TOTAL REVENUS TTC', data.revTTC,       { bold: true, textColor: TEAL })
  row('− TVA collectée (20%)',  -data.tvaCollected, { indent: true, textColor: [150, 150, 150] })
  row('REVENUS HT',             data.revHT,         { bold: true })
  y += 4

  // ── COÛT DES SERVICES ──────────────────────────────────────────
  sectionBar('COÛT DES SERVICES (COGS)')
  row('Matériaux',            -data.totalMats,       { indent: true })
  row('Part mécaniciens (65%)', -data.mechanicPayout, { indent: true })
  sep()
  row('TOTAL COGS', -(data.totalMats + data.mechanicPayout), { bold: true, textColor: RED })
  y += 4

  // ── MARGE BRUTE ────────────────────────────────────────────────
  const gbColor: [number, number, number] = data.grossProfit >= 0 ? TEAL : RED
  const gbBg: [number, number, number]    = data.grossProfit >= 0 ? [0, 35, 42] : [38, 8, 8]
  row('MARGE BRUTE', data.grossProfit, { bold: true, bgColor: gbBg, textColor: gbColor, fs: 11 })
  pct('Marge brute / CA HT', data.grossMargin)
  y += 5

  // ── CHARGES D'EXPLOITATION ─────────────────────────────────────
  sectionBar("CHARGES D'EXPLOITATION (OPEX)")
  data.opexByCategory.forEach(c => {
    if (c.amount > 0) row(c.label, -c.amount, { indent: true })
  })
  if (data.opexByCategory.every(c => c.amount === 0)) {
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(80, 80, 80)
    doc.text('Aucune charge pour cette période', R + 8, y + 1); y += 8
  }
  sep()
  row('TOTAL OPEX', -data.totalOpex, { bold: true, textColor: RED })
  y += 5

  // ── RÉSULTAT NET ───────────────────────────────────────────────
  const npColor: [number, number, number] = data.netProfit >= 0 ? GREEN : RED
  const npBg: [number, number, number]    = data.netProfit >= 0 ? [0, 32, 18] : [38, 8, 8]
  row('RÉSULTAT NET', data.netProfit, { bold: true, bgColor: npBg, textColor: npColor, fs: 13 })
  pct('Marge nette / CA HT', data.netMargin)
  y += 10

  // ── TVA box ────────────────────────────────────────────────────
  guardY()
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(R, y, RR - R, 22, 3, 3, 'F')
  doc.setDrawColor(55, 55, 55)
  doc.roundedRect(R, y, RR - R, 22, 3, 3, 'S')
  doc.setTextColor(100, 100, 100); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold')
  doc.text('TVA COLLECTÉE — À REVERSER À L\'ÉTAT', R + 5, y + 7)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(70, 70, 70)
  doc.text("Montant non inclus dans le résultat net. À déclarer auprès de la DGI.", R + 5, y + 13)
  doc.setTextColor(200, 200, 200); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  const tvaStr = data.tvaCollected.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  doc.text(`${tvaStr} MAD`, RR - 5, y + 11, { align: 'right' })
  y += 30

  // ── Footer ─────────────────────────────────────────────────────
  const fy = 284
  doc.setDrawColor(35, 35, 35)
  doc.line(R, fy - 5, RR, fy - 5)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 70)
  doc.text('Document généré automatiquement par MecaLIK. Ne nécessite pas de cachet.', pageWidth / 2, fy, { align: 'center' })
  doc.text('MecaLIK SARL AU  ·  Casablanca, Maroc  ·  hello@mecalik.com  ·  +212 777 348 065', pageWidth / 2, fy + 5, { align: 'center' })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`pl-mecalik-${dateStr}.pdf`)
}
