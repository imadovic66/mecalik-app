import jsPDF from 'jspdf'
import { normalizeDetailType, type ServiceDetail } from '../pages/admin/adminShared'

export type QuoteData = {
  quoteReference: string
  bookingReference: string
  customerName: string
  customerPhone: string | null
  serviceName: string
  technicianName: string | null
  lineItems: ServiceDetail[]
  totals: { ht: number; tva: number; ttc: number }
  notes?: string | null
}

export function generateQuote(data: QuoteData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  const TEAL: [number, number, number] = [67, 188, 201]
  const DARK: [number, number, number] = [8, 8, 8]

  // Header background
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Company name
  doc.setTextColor(...TEAL)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('MecaLIK', 15, 20)

  // Tagline
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Mécanicien à Domicile — Casablanca', 15, 28)
  doc.text('contact@mecalik.com | +212 777 348 065', 15, 34)
  doc.text('mecalik.com', 15, 40)

  // DEVIS title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', pageWidth - 15, 20, { align: 'right' })

  // Quote details
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(`N° ${data.quoteReference}`, pageWidth - 15, 28, { align: 'right' })
  doc.text(`Réservation: ${data.bookingReference}`, pageWidth - 15, 34, { align: 'right' })
  doc.text(`Émis le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 40, { align: 'right' })

  // Client info box
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(15, 52, 85, 30, 3, 3, 'F')
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(8)
  doc.text('CLIENT', 20, 60)
  doc.setFillColor(67, 188, 201)
  doc.rect(20, 62, 20, 0.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(data.customerName, 20, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  if (data.customerPhone) doc.text(data.customerPhone, 20, 77)

  // Service info box
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(110, 52, 85, 30, 3, 3, 'F')
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(8)
  doc.text('SERVICE', 115, 60)
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(9)
  doc.text(data.serviceName.substring(0, 32), 115, 68)
  if (data.technicianName) doc.text(`Technicien: ${data.technicianName}`, 115, 75)

  // Table header
  let y = 95
  doc.setFillColor(20, 20, 20)
  doc.rect(15, y, pageWidth - 30, 8, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIPTION', 20, y + 5.5)
  doc.text('QTÉ', 120, y + 5.5)
  doc.text('P.U. TTC', 140, y + 5.5)
  doc.text('TOTAL TTC', pageWidth - 20, y + 5.5, { align: 'right' })

  y += 12
  doc.setFont('helvetica', 'normal')
  let rowCount = 0

  data.lineItems.forEach(item => {
    const cat = normalizeDetailType(item.type)
    const qty = parseFloat(item.quantity || '1') || 1
    const unitPrice = item.unit_price || 0
    const lineTotal = unitPrice * qty

    if (rowCount % 2 === 0) {
      doc.setFillColor(16, 16, 16)
      doc.rect(15, y - 4, pageWidth - 30, 8, 'F')
    }

    doc.setTextColor(200, 200, 200)
    doc.setFontSize(8)
    doc.text((item.name || '').substring(0, 52), 20, y + 1)
    doc.text(String(qty), 120, y + 1)
    doc.text(`${unitPrice.toFixed(0)} MAD`, 140, y + 1)
    doc.setTextColor(255, 255, 255)
    doc.text(`${cat === 'discount' ? '-' : ''}${lineTotal.toFixed(0)} MAD`, pageWidth - 20, y + 1, { align: 'right' })

    y += 8
    rowCount++

    if (y > 230) {
      doc.addPage()
      y = 20
    }
  })

  // Notes
  if (data.notes) {
    y += 6
    doc.setFillColor(20, 20, 20)
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40) as string[]
    const boxHeight = 10 + noteLines.length * 5
    doc.roundedRect(15, y, pageWidth - 30, boxHeight, 2, 2, 'F')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7.5)
    doc.text('OBSERVATIONS', 20, y + 7)
    doc.setTextColor(190, 190, 190)
    doc.setFontSize(8.5)
    doc.text(noteLines, 20, y + 13)
    y += boxHeight + 6
  }

  // Totals
  y += 8
  const totalsX = pageWidth - 80

  // TTC leads — HT and TVA follow as components of it, not as additions.
  doc.setFillColor(...TEAL)
  doc.rect(totalsX - 5, y - 4, 80, 10, 'F')
  doc.setTextColor(8, 8, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Total TTC:', totalsX, y + 2)
  doc.text(`${data.totals.ttc.toFixed(2)} MAD`, pageWidth - 20, y + 2, { align: 'right' })
  y += 12

  doc.setFillColor(20, 20, 20)
  doc.rect(totalsX - 5, y - 4, 80, 8, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8.5)
  doc.text('dont HT:', totalsX, y + 1)
  doc.text(`${data.totals.ht.toFixed(2)} MAD`, pageWidth - 20, y + 1, { align: 'right' })
  y += 9

  doc.setFillColor(16, 16, 16)
  doc.rect(totalsX - 5, y - 4, 80, 8, 'F')
  doc.setTextColor(150, 150, 150)
  doc.text('dont TVA (20%):', totalsX, y + 1)
  doc.text(`${data.totals.tva.toFixed(2)} MAD`, pageWidth - 20, y + 1, { align: 'right' })

  // Footer
  y += 20
  if (y > 265) { doc.addPage(); y = 20 }
  doc.setFillColor(20, 20, 20)
  doc.rect(15, y, pageWidth - 30, 18, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Devis valable 15 jours. Paiement après service uniquement.', pageWidth / 2, y + 6, { align: 'center' })
  doc.text('MecaLIK — Casablanca, Maroc | contact@mecalik.com | +212 777 348 065', pageWidth / 2, y + 11, { align: 'center' })
  doc.text('mecalik.com', pageWidth / 2, y + 16, { align: 'center' })

  doc.save(`Devis_MecaLIK_${data.quoteReference}.pdf`)
}
