/** Reservations tab — search input, status filter pills, and bookings table with inline editing */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { type Booking, STATUS_COLORS, STATUS_KEYS, getGuestLabel } from '../adminShared'
import { serviceIdFromName } from '../../../lib/serviceUtils'

interface Props {
  bookings: Booking[]
  loading: boolean
  mechanics: { id: string; full_name: string | null }[]
  onSelectBooking: (b: Booking) => void
  onRefresh: () => void
}

export default function ReservationsTab({ bookings, loading, mechanics, onSelectBooking, onRefresh }: Props) {
  const { t, i18n } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredBookings = bookings.filter(b => {
    const matchSearch = !searchQuery ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t('services.' + serviceIdFromName(b.service_name)).toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('admin.search')}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
            onFocus={e => (e.target.style.borderColor = '#43BCC9')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUS_KEYS].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-full px-4 py-2 text-xs font-medium transition-all"
              style={statusFilter === s
                ? { background: '#43BCC9', color: '#080808' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {s === 'all' ? t('common.all') : t(`status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#141414' }} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20">
          <Search size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('admin.noReservations')}</div>
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1.2fr 1fr 150px 130px 76px 80px', padding: '10px 16px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '8px' }}>
            {[t('admin.reference'), t('admin.service'), t('admin.client'), t('admin.technician'), t('common.status'), t('admin.amount'), t('admin.date')].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {filteredBookings.map((booking, i) => (
            <div
              key={booking.id}
              style={{
                display: 'grid', gridTemplateColumns: '110px 1.2fr 1fr 150px 130px 76px 80px',
                padding: '9px 16px', borderBottom: i < filteredBookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center', gap: '8px',
              }}
            >
              <div
                style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', cursor: 'pointer' }}
                onClick={() => onSelectBooking(booking)}
              >
                {booking.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t('services.' + serviceIdFromName(booking.service_name))}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {!booking.user_id && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                    Guest
                  </span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getGuestLabel(booking)}
                </span>
              </div>
              {/* Technician inline select */}
              <select
                value={booking.technician_name || ''}
                onClick={e => e.stopPropagation()}
                onChange={async e => {
                  const name = e.target.value
                  await supabase.from('bookings').update({
                    technician_name: name || null,
                    status: booking.status === 'pending' && name ? 'confirmed' : booking.status,
                  }).eq('id', booking.id)
                  onRefresh()
                }}
                style={{
                  background: booking.technician_name ? 'rgba(67,188,201,0.08)' : 'rgba(240,192,64,0.08)',
                  border: booking.technician_name ? '1px solid rgba(67,188,201,0.2)' : '1px solid rgba(240,192,64,0.2)',
                  color: booking.technician_name ? '#43BCC9' : '#F0C040',
                  borderRadius: '6px', padding: '4px 6px', fontSize: '11px',
                  cursor: 'pointer', fontFamily: 'inherit', outline: 'none', width: '100%',
                }}
              >
                <option value="">{t('admin.assign')}</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.full_name || ''}>{m.full_name}</option>
                ))}
              </select>
              {/* Status inline select */}
              <select
                value={booking.status}
                onClick={e => e.stopPropagation()}
                onChange={async e => {
                  const newStatus = e.target.value
                  const updates: Record<string, string> = { status: newStatus }
                  if (newStatus === 'completed')   updates.completed_at = new Date().toISOString()
                  if (newStatus === 'in_progress') updates.confirmed_at = new Date().toISOString()
                  await supabase.from('bookings').update(updates).eq('id', booking.id)
                  onRefresh()
                }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: STATUS_COLORS[booking.status] || 'white',
                  borderRadius: '6px', padding: '4px 6px', fontSize: '11px',
                  cursor: 'pointer', fontFamily: 'inherit', outline: 'none', width: '100%',
                }}
              >
                <option value="pending">{t('status.pending')}</option>
                <option value="confirmed">{t('status.confirmed')}</option>
                <option value="on_the_way">{t('status.on_the_way')}</option>
                <option value="in_progress">{t('status.in_progress')}</option>
                <option value="completed">{t('status.completed')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
              {/* Amount inline input */}
              <input
                type="number"
                defaultValue={booking.amount_ttc ?? ''}
                placeholder="MAD"
                onClick={e => e.stopPropagation()}
                onBlur={async e => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val > 0) {
                    await supabase.from('bookings').update({ amount_ttc: val }).eq('id', booking.id)
                    onRefresh()
                  }
                }}
                style={{
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  color: booking.amount_ttc ? '#00DD88' : 'rgba(255,255,255,0.35)',
                  fontSize: '12px', fontWeight: 600, width: '64px',
                  outline: 'none', fontFamily: 'inherit', padding: '2px 0',
                }}
              />
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                {new Date(booking.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
