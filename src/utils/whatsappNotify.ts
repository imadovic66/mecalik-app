type StatusMessage = {
  customerName: string | null
  customerPhone: string | null
  serviceLabel: string
  bookingRef: string
  status: string
}

const SERVICE_LABELS: Record<string, string> = {
  lavage: 'Lavage Auto', vidange: 'Vidange & Filtres', batterie: 'Batterie',
  pneus: 'Pneus', diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
}

const STATUS_MESSAGES: Record<string, (data: StatusMessage) => string> = {
  confirmed: (d) => `Bonjour ${d.customerName || 'client'} 👋

Votre réservation MecaLIK a été *confirmée* ✅

🔧 Service: ${d.serviceLabel}
🔖 Réf: ${d.bookingRef}

Notre technicien sera chez vous prochainement. Nous vous contactons pour confirmer l'heure exacte.

MecaLIK — Votre voiture, votre lieu.`,

  in_progress: (d) => `Bonjour ${d.customerName || 'client'} 👋

Votre technicien MecaLIK est *en route* 🚗

🔧 Service: ${d.serviceLabel}
🔖 Réf: ${d.bookingRef}

Il arrive dans les prochaines minutes. Merci de vous assurer que votre véhicule est accessible.`,

  completed: (d) => `Bonjour ${d.customerName || 'client'} 👋

Votre service MecaLIK est *terminé* ✅

🔧 Service: ${d.serviceLabel}
🔖 Réf: ${d.bookingRef}

Merci de votre confiance. N'hésitez pas à nous laisser un avis !
👉 mecalik.com/booking/${d.bookingRef}

MecaLIK — Votre voiture, votre lieu.`,

  cancelled: (d) => `Bonjour ${d.customerName || 'client'},

Votre réservation MecaLIK a été *annulée* ❌

🔧 Service: ${d.serviceLabel}
🔖 Réf: ${d.bookingRef}

Pour toute question, contactez-nous directement sur WhatsApp.

MecaLIK`,
}

export function notifyCustomerByWhatsApp(data: StatusMessage): void {
  const messageFn = STATUS_MESSAGES[data.status]
  if (!messageFn || !data.customerPhone) return

  const message = messageFn(data)

  let phone = data.customerPhone.replace(/\s/g, '').replace(/^0/, '212')
  if (!phone.startsWith('+') && !phone.startsWith('212')) {
    phone = '212' + phone
  }
  phone = phone.replace('+', '')

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

export function getNotifiableStatuses(): string[] {
  return Object.keys(STATUS_MESSAGES)
}

export { SERVICE_LABELS }
