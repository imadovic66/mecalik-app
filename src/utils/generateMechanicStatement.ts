/** Mechanic pay statement (relevé de paie) — the PDF a technician signs as a receipt.
 *  Pure presentation: every figure is computed by the caller via computeQuoteTotals. */

import jsPDF from 'jspdf'

export type StatementRow = {
  invoiceNumber: string
  date: string          // already formatted dd/mm/yyyy
  client: string
  labourHT: number
  share: number
  paid: boolean
  paidAt: string | null // already formatted
}

export type StatementData = {
  mechanicName: string
  periodLabel: string
  rows: StatementRow[]
  totals: { labourHT: number; share: number; paid: number; due: number }
}

/** jsPDF's built-in fonts are WinAnsi: toLocaleString('fr-FR') emits U+202F (narrow
 *  no-break space) as the thousands separator, which renders as garbage. Format by hand. */
function money(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${n < 0 ? '-' : ''}${grouped},${dec} MAD`
}

export function generateMechanicStatement(data: StatementData): void {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const TEAL: [number, number, number] = [67, 188, 201]
  const today = new Date()
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`

  // ── Header ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 20, 20)
  doc.text('Meca', 15, 20)
  doc.setTextColor(...TEAL)
  doc.text('LIK', 15 + doc.getTextWidth('Meca'), 20)
  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.8)
  doc.line(15, 25, W - 15, 25)

  doc.setTextColor(20, 20, 20)
  doc.setFontSize(14)
  doc.text('RELEVÉ DE PAIE TECHNICIEN', W - 15, 20, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Technicien : ${data.mechanicName}`, 15, 35)
  doc.text(`Période : ${data.periodLabel}`, 15, 41)
  doc.text(`Édité le : ${todayStr}`, W - 15, 35, { align: 'right' })
  doc.text(`${data.rows.length} intervention(s)`, W - 15, 41, { align: 'right' })

  // ── Table ──
  const cols = { num: 15, date: 50, client: 75, labour: 142, share: 172, status: W - 15 }
  const header = (y: number) => {
    doc.setFillColor(20, 20, 20)
    doc.rect(15, y - 5, W - 30, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEAL)
    doc.text('N° FACTURE', cols.num + 2, y)
    doc.text('DATE', cols.date, y)
    doc.text('CLIENT', cols.client, y)
    doc.text('MO HT', cols.labour, y, { align: 'right' })
    doc.text('PART TECH.', cols.share, y, { align: 'right' })
    doc.text('STATUT', cols.status - 2, y, { align: 'right' })
  }

  let y = 54
  header(y)
  y += 8
  doc.setFont('helvetica', 'normal')

  data.rows.forEach((r, i) => {
    if (y > H - 30) {
      doc.addPage()
      y = 20
      header(y)
      y += 8
      doc.setFont('helvetica', 'normal')
    }
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 248)
      doc.rect(15, y - 4.5, W - 30, 7, 'F')
    }
    doc.setFontSize(8.5)
    doc.setTextColor(40, 40, 40)
    doc.text(r.invoiceNumber, cols.num + 2, y)
    doc.text(r.date, cols.date, y)
    doc.text(r.client.substring(0, 32), cols.client, y)
    doc.text(money(r.labourHT), cols.labour, y, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(money(r.share), cols.share, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    if (r.paid) doc.setTextColor(0, 150, 90)
    else doc.setTextColor(190, 130, 0)
    doc.text(r.paid ? `Payé${r.paidAt ? ' ' + r.paidAt : ''}` : 'À payer', cols.status - 2, y, { align: 'right' })
    y += 7
  })

  // ── Totals ──
  if (y > H - 95) { doc.addPage(); y = 20 }
  y += 6
  const tx = W - 95
  const totalRow = (label: string, value: string, bold = false, color: [number, number, number] = [40, 40, 40]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 11 : 9.5)
    doc.setTextColor(...color)
    doc.text(label, tx, y)
    doc.text(value, W - 15, y, { align: 'right' })
    y += bold ? 8 : 6.5
  }
  totalRow("Total main d'œuvre HT", money(data.totals.labourHT))
  totalRow('Total part technicien', money(data.totals.share), true)
  totalRow('Déjà payé', money(data.totals.paid), false, [0, 150, 90])
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(tx, y - 3, W - 15, y - 3)
  y += 2
  totalRow('RESTE À PAYER', money(data.totals.due), true, TEAL)

  // ── Receipt + signatures ──
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(40, 40, 40)
  const receipt = `Je soussigné(e) ${data.mechanicName}, reconnais avoir reçu de MecaLIK SARL AU la somme de ________________ MAD, au titre des interventions listées ci-dessus.`
  const wrapped = doc.splitTextToSize(receipt, W - 30)
  doc.text(wrapped, 15, y)
  y += wrapped.length * 5 + 8
  doc.text('Fait à Casablanca, le ____ / ____ / ________', 15, y)
  y += 12

  const boxW = (W - 40) / 2
  doc.setDrawColor(160, 160, 160)
  doc.rect(15, y, boxW, 28)
  doc.rect(25 + boxW, y, boxW, 28)
  doc.setFontSize(8.5)
  doc.setTextColor(110, 110, 110)
  doc.text('Signature du technicien', 18, y + 5)
  doc.text('Pour MecaLIK (cachet et signature)', 28 + boxW, y + 5)

  // ── Footer ──
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(140, 140, 140)
    doc.text('MecaLIK SARL AU · ICE : 003942374000016 · RC : 726381 · IF : 72071701 · hello@mecalik.com', W / 2, H - 10, { align: 'center' })
    doc.text(`${p} / ${pages}`, W - 15, H - 10, { align: 'right' })
  }

  const safe = data.mechanicName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
  doc.save(`releve-paie-${safe}-${today.toISOString().slice(0, 10)}.pdf`)
}
