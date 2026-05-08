import jsPDF from 'jspdf'

type InvoiceData = {
  companyName: string
  companyEmail: string | null
  month: string
  year: number
  vehicles: Array<{
    plate: string | null
    make: string
    model: string
    services: Array<{
      date: string
      service: string
      amount_ht: number
    }>
  }>
  totals: {
    ht: number
    tva: number
    ttc: number
  }
}

export function generateInvoice(data: InvoiceData): void {
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

  // FACTURE title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pageWidth - 15, 20, { align: 'right' })

  // Invoice details
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  const invoiceNum = `MK-${data.year}-${data.month.replace('/', '')}`
  doc.text(`N° ${invoiceNum}`, pageWidth - 15, 28, { align: 'right' })
  doc.text(`Période: ${data.month} ${data.year}`, pageWidth - 15, 34, { align: 'right' })
  doc.text(`Émise le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 40, { align: 'right' })

  // Client info box
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(15, 52, 85, 30, 3, 3, 'F')
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(8)
  doc.text('FACTURÉ À', 20, 60)
  doc.setFillColor(67, 188, 201)
  doc.rect(20, 62, 20, 0.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName, 20, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  if (data.companyEmail) doc.text(data.companyEmail, 20, 77)

  // Fiscal info box
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(110, 52, 85, 30, 3, 3, 'F')
  doc.setTextColor(120, 120, 120)
  doc.setFontSize(8)
  doc.text('INFORMATIONS FISCALES', 115, 60)
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(9)
  doc.text('TVA: 20%', 115, 68)
  doc.text('Devise: MAD (Dirham Marocain)', 115, 75)

  // Table header
  let y = 95
  doc.setFillColor(20, 20, 20)
  doc.rect(15, y, pageWidth - 30, 8, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VÉHICULE', 20, y + 5.5)
  doc.text('SERVICE', 75, y + 5.5)
  doc.text('DATE', 130, y + 5.5)
  doc.text('MONTANT HT', pageWidth - 20, y + 5.5, { align: 'right' })

  y += 12

  // Service rows
  doc.setFont('helvetica', 'normal')
  let rowCount = 0

  data.vehicles.forEach(vehicle => {
    const vehicleName = `${vehicle.make} ${vehicle.model}${vehicle.plate ? ` (${vehicle.plate})` : ''}`

    vehicle.services.forEach(service => {
      if (rowCount % 2 === 0) {
        doc.setFillColor(16, 16, 16)
        doc.rect(15, y - 4, pageWidth - 30, 8, 'F')
      }

      doc.setTextColor(200, 200, 200)
      doc.setFontSize(8)
      doc.text(vehicleName.substring(0, 28), 20, y + 1)
      doc.text(service.service.substring(0, 25), 75, y + 1)
      doc.text(new Date(service.date).toLocaleDateString('fr-FR'), 130, y + 1)
      doc.setTextColor(255, 255, 255)
      doc.text(`${service.amount_ht.toFixed(2)} MAD`, pageWidth - 20, y + 1, { align: 'right' })

      y += 8
      rowCount++

      if (y > 240) {
        doc.addPage()
        y = 20
      }
    })
  })

  // Totals
  y += 8
  const totalsX = pageWidth - 80

  doc.setFillColor(20, 20, 20)
  doc.rect(totalsX - 5, y - 4, 80, 8, 'F')
  doc.setTextColor(180, 180, 180)
  doc.setFontSize(9)
  doc.text('Total HT:', totalsX, y + 1)
  doc.setTextColor(255, 255, 255)
  doc.text(`${data.totals.ht.toFixed(2)} MAD`, pageWidth - 20, y + 1, { align: 'right' })
  y += 9

  doc.setFillColor(16, 16, 16)
  doc.rect(totalsX - 5, y - 4, 80, 8, 'F')
  doc.setTextColor(180, 180, 180)
  doc.text('TVA (20%):', totalsX, y + 1)
  doc.setTextColor(255, 255, 255)
  doc.text(`${data.totals.tva.toFixed(2)} MAD`, pageWidth - 20, y + 1, { align: 'right' })
  y += 9

  doc.setFillColor(...TEAL)
  doc.rect(totalsX - 5, y - 4, 80, 10, 'F')
  doc.setTextColor(8, 8, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL TTC:', totalsX, y + 2)
  doc.text(`${data.totals.ttc.toFixed(2)} MAD`, pageWidth - 20, y + 2, { align: 'right' })

  // Footer
  y += 20
  doc.setFillColor(20, 20, 20)
  doc.rect(15, y, pageWidth - 30, 18, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Paiement à réception de facture. Virement bancaire ou espèces.', pageWidth / 2, y + 6, { align: 'center' })
  doc.text('MecaLIK — Casablanca, Maroc | contact@mecalik.com | +212 777 348 065', pageWidth / 2, y + 11, { align: 'center' })
  doc.text('mecalik.com', pageWidth / 2, y + 16, { align: 'center' })

  doc.save(`Facture_MecaLIK_${data.companyName.replace(/\s/g, '_')}_${data.month.replace('/', '-')}_${data.year}.pdf`)
}
