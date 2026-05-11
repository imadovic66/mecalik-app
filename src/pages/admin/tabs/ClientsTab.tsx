/** Clients tab — customer cards grid with booking count */

import { useTranslation } from 'react-i18next'
import { type Customer, type Booking, getInitials } from '../adminShared'

interface Props {
  customers: Customer[]
  bookings: Booking[]
}

export default function ClientsTab({ customers, bookings }: Props) {
  const { i18n } = useTranslation()

  return (
    <>
      <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {customers.length} client{customers.length !== 1 ? 's' : ''} enregistré{customers.length !== 1 ? 's' : ''}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(customer => (
          <div key={customer.id} className="rounded-2xl p-6" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                <span className="font-heading font-bold text-sm" style={{ color: '#43BCC9' }}>
                  {getInitials(customer.full_name)}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: '#ffffff' }}>
                  {customer.full_name || 'Sans nom'}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {customer.phone || 'Pas de téléphone'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Inscrit {new Date(customer.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR')}
              </div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {bookings.filter(b => b.user_id === customer.id).length} réservation(s)
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
