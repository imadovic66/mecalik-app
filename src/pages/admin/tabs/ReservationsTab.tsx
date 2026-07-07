/** Reservations tab — search input, status filter pills, bookings table with inline editing + service details editor */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { type Booking, type ServiceDetail, type ServiceDetailType, normalizeDetailType, STATUS_COLORS, STATUS_KEYS, getGuestLabel } from '../adminShared'
import { serviceIdFromName } from '../../../lib/serviceUtils'
import { usePushNotifications } from '../../../hooks/usePushNotifications'

interface Props {
  bookings: Booking[]
  loading: boolean
  mechanics: { id: string; full_name: string | null }[]
  onSelectBooking: (b: Booking) => void
  onRefresh: () => void
}

// ── Service templates for quick auto-fill ──────────────────────────────────
const SERVICE_TEMPLATES: Record<string, ServiceDetail[]> = {
  vidange: [
    { type: 'material', name: 'Huile Moteur', brand: 'Total', quantity: '5L', unit_price: 180 },
    { type: 'material', name: 'Filtre à huile', brand: '', quantity: '1', unit_price: 45 },
    { type: 'material', name: 'Joint de vidange', brand: '', quantity: '1', unit_price: 8 },
    { type: 'labor',    name: "Main d'œuvre", brand: 'MecaLIK', quantity: '1', unit_price: 150 },
  ],
  batterie: [
    { type: 'material', name: 'Batterie', brand: '', quantity: '1', unit_price: 350 },
    { type: 'labor',    name: "Main d'œuvre pose", brand: 'MecaLIK', quantity: '1', unit_price: 80 },
  ],
  pneus: [
    { type: 'material', name: 'Pneu', brand: '', quantity: '1', unit_price: 350 },
    { type: 'labor',    name: 'Montage + équilibrage', brand: 'MecaLIK', quantity: '1', unit_price: 50 },
  ],
}

const CATEGORY_CONFIG: Record<ServiceDetailType, { label: string; emoji: string; color: string; bg: string }> = {
  material: { label: 'Matériau',   emoji: '🔩', color: '#43BCC9', bg: 'rgba(67,188,201,0.15)' },
  labor:    { label: "Main d'œuvre", emoji: '🔧', color: '#F0C040', bg: 'rgba(240,192,64,0.15)' },
  vat:      { label: 'TVA',         emoji: '💰', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' },
  discount: { label: 'Remise',      emoji: '🎁', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
}

function getTemplate(serviceName: string): ServiceDetail[] {
  const key = (serviceName || '').toLowerCase()
  if (key.includes('vidange')) return SERVICE_TEMPLATES.vidange.map(i => ({ ...i }))
  if (key.includes('batterie')) return SERVICE_TEMPLATES.batterie.map(i => ({ ...i }))
  if (key.includes('pneu')) return SERVICE_TEMPLATES.pneus.map(i => ({ ...i }))
  return [{ type: 'material', name: '', brand: '', quantity: '1', unit_price: 0 }]
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: '6px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '12px',
  fontFamily: 'Outfit, sans-serif', outline: 'none', width: '100%',
}

export default function ReservationsTab({ bookings, loading, mechanics, onSelectBooking, onRefresh }: Props) {
  const { t, i18n } = useTranslation()
  const { notify } = usePushNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [localDetails, setLocalDetails] = useState<Record<string, ServiceDetail[]>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const sendPushToMechanic = (mechanicName: string, booking: Booking) => {
    const mechanic = mechanics.find(m => m.full_name === mechanicName)
    if (!mechanic?.id) return
    notify({
      user_id: mechanic.id,
      title: '🔧 Nouvelle mission assignée',
      body: `${booking.service_name} — ${booking.address}`,
      url: '/mechanic',
    })
  }

  const filteredBookings = bookings.filter(b => {
    const matchSearch = !searchQuery ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t('services.' + serviceIdFromName(b.service_name)).toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── Service detail helpers ────────────────────────────────────────────────
  const getDetails = (bookingId: string, existing: ServiceDetail[] | null | undefined): ServiceDetail[] =>
    localDetails[bookingId] ?? existing ?? []

  const expandBooking = (bookingId: string, booking: Booking) => {
    if (expandedBooking === bookingId) { setExpandedBooking(null); return }
    setExpandedBooking(bookingId)
    // Auto-populate from template when no existing details
    if (localDetails[bookingId] === undefined && !booking.service_details?.length) {
      setLocalDetails(prev => ({ ...prev, [bookingId]: getTemplate(booking.service_name) }))
    }
  }

  const addServiceDetail = (bookingId: string, booking: Booking) => {
    const current = getDetails(bookingId, booking.service_details)
    setLocalDetails(prev => ({
      ...prev,
      [bookingId]: [...current, { type: 'material' as ServiceDetailType, name: '', brand: '', quantity: '1', unit_price: 0 }],
    }))
  }

  const updateServiceDetail = (bookingId: string, booking: Booking, idx: number, field: string, value: string | number) => {
    const current = [...getDetails(bookingId, booking.service_details)]
    current[idx] = { ...current[idx], [field]: value }
    setLocalDetails(prev => ({ ...prev, [bookingId]: current }))
  }

  const removeServiceDetail = (bookingId: string, booking: Booking, idx: number) => {
    const current = getDetails(bookingId, booking.service_details)
    setLocalDetails(prev => ({ ...prev, [bookingId]: current.filter((_, i) => i !== idx) }))
  }

  const saveServiceDetails = async (bookingId: string) => {
    const details = localDetails[bookingId]
    if (!details) return
    setSaving(bookingId)
    await supabase.from('bookings').update({ service_details: details }).eq('id', bookingId)
    setSaving(null)
    setLocalDetails(prev => { const next = { ...prev }; delete next[bookingId]; return next })
    onRefresh()
  }

  const COLS = '110px 1.2fr 1fr 150px 130px 76px 80px 72px'

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
          <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '10px 16px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '8px' }}>
            {[t('admin.reference'), t('admin.service'), t('admin.client'), t('admin.technician'), t('common.status'), t('admin.amount'), t('admin.date'), 'Détails'].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filteredBookings.map((booking, i) => {
            const isExpanded = expandedBooking === booking.id
            const details = getDetails(booking.id, booking.service_details)
            const isSaving = saving === booking.id

            return (
              <div key={booking.id} style={{ borderBottom: i < filteredBookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                {/* Main row */}
                <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '9px 16px', alignItems: 'center', gap: '8px' }}>
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
                      if (name) sendPushToMechanic(name, booking)
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
                  {/* Details toggle button */}
                  <button
                    onClick={() => expandBooking(booking.id, booking)}
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      background: isExpanded ? 'rgba(67,188,201,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isExpanded ? '#43BCC9' : 'rgba(255,255,255,0.5)',
                      fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: '3px',
                    }}
                  >
                    🔧 {isExpanded ? '▲' : '▼'}
                  </button>
                </div>

                {/* ── Service Details Panel ── */}
                {isExpanded && (() => {
                  const matTotal  = details.filter(d => normalizeDetailType(d.type) === 'material').reduce((s, d) => s + (d.unit_price || 0) * (parseFloat(d.quantity || '1') || 1), 0)
                  const labTotal  = details.filter(d => normalizeDetailType(d.type) === 'labor').reduce((s, d) => s + (d.unit_price || 0) * (parseFloat(d.quantity || '1') || 1), 0)
                  const vatTotal  = details.filter(d => normalizeDetailType(d.type) === 'vat').reduce((s, d) => s + (d.unit_price || 0) * (parseFloat(d.quantity || '1') || 1), 0)
                  const discTotal = details.filter(d => normalizeDetailType(d.type) === 'discount').reduce((s, d) => s + (d.unit_price || 0) * (parseFloat(d.quantity || '1') || 1), 0)
                  const calcTotal = matTotal + labTotal + vatTotal - discTotal
                  return (
                    <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                        🔧 Lignes de service
                        {booking.service_details?.length ? (
                          <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>(sauvegardé)</span>
                        ) : null}
                      </div>

                      {/* Column headers */}
                      {details.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 70px 70px 90px 32px', gap: '8px', marginBottom: '6px', padding: '0 2px' }}>
                          {['Catégorie', 'Nom / Description', 'Marque', 'Qté', 'P.U. (MAD)', 'Total', ''].map(h => (
                            <div key={h} style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                          ))}
                        </div>
                      )}

                      {/* Detail rows */}
                      {details.map((item, idx) => {
                        const cat = normalizeDetailType(item.type)
                        const cfg = CATEGORY_CONFIG[cat]
                        const lineTotal = (item.unit_price || 0) * (parseFloat(item.quantity || '1') || 1)
                        return (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 70px 70px 90px 32px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            {/* Segmented category control */}
                            <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '7px', padding: '3px' }}>
                              {(Object.entries(CATEGORY_CONFIG) as [ServiceDetailType, typeof CATEGORY_CONFIG[ServiceDetailType]][]).map(([key, c]) => (
                                <button
                                  key={key}
                                  title={c.label}
                                  onClick={() => updateServiceDetail(booking.id, booking, idx, 'type', key)}
                                  style={{
                                    flex: 1, padding: '4px 2px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                    background: cat === key ? c.bg : 'transparent',
                                    color: cat === key ? c.color : 'rgba(255,255,255,0.25)',
                                    fontSize: '13px', lineHeight: 1, transition: 'all 0.15s',
                                  }}
                                >
                                  {c.emoji}
                                </button>
                              ))}
                            </div>
                            {/* Category badge + name input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '2px 6px', borderRadius: '4px', background: cfg.bg, marginBottom: '2px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: cfg.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{cfg.label}</span>
                              </div>
                              <input
                                value={item.name}
                                placeholder={cat === 'labor' ? "Main d'œuvre, diagnostic…" : cat === 'vat' ? 'TVA 20%' : cat === 'discount' ? 'Remise client' : 'Huile Total 5W40 / Filtre…'}
                                onChange={e => updateServiceDetail(booking.id, booking, idx, 'name', e.target.value)}
                                style={inputStyle}
                              />
                            </div>
                            <input
                              value={item.brand || ''}
                              placeholder={cat === 'labor' ? 'MecaLIK' : 'Total, Bosch…'}
                              onChange={e => updateServiceDetail(booking.id, booking, idx, 'brand', e.target.value)}
                              style={inputStyle}
                            />
                            <input
                              value={item.quantity || ''}
                              placeholder="1"
                              onChange={e => updateServiceDetail(booking.id, booking, idx, 'quantity', e.target.value)}
                              style={inputStyle}
                            />
                            <input
                              value={item.unit_price ?? ''}
                              placeholder="0"
                              type="number"
                              onChange={e => updateServiceDetail(booking.id, booking, idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              style={inputStyle}
                            />
                            <span style={{ fontSize: '13px', color: cat === 'discount' ? '#FF6B6B' : cfg.color, fontWeight: 700, textAlign: 'right', paddingRight: '4px' }}>
                              {cat === 'discount' ? '-' : ''}{Math.round(lineTotal)} MAD
                            </span>
                            <button
                              onClick={() => removeServiceDetail(booking.id, booking, idx)}
                              style={{ background: 'none', border: 'none', color: '#FF4444', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}
                            >×</button>
                          </div>
                        )
                      })}

                      {/* Live breakdown */}
                      {details.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Récapitulatif</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {matTotal > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>🔩 Matériaux</span>
                                <span style={{ fontSize: '12px', color: '#43BCC9', fontWeight: 600 }}>{Math.round(matTotal)} MAD</span>
                              </div>
                            )}
                            {labTotal > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>🔧 Main d'œuvre</span>
                                <span style={{ fontSize: '12px', color: '#F0C040', fontWeight: 600 }}>{Math.round(labTotal)} MAD</span>
                              </div>
                            )}
                            {vatTotal > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>💰 TVA</span>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{Math.round(vatTotal)} MAD</span>
                              </div>
                            )}
                            {discTotal > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>🎁 Remise</span>
                                <span style={{ fontSize: '12px', color: '#FF6B6B', fontWeight: 600 }}>-{Math.round(discTotal)} MAD</span>
                              </div>
                            )}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>TOTAL TTC calculé</span>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#43BCC9' }}>{Math.round(calcTotal)} MAD</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => addServiceDetail(booking.id, booking)}
                          style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.3)', color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                        >
                          + Ajouter une ligne
                        </button>
                        <button
                          onClick={() => saveServiceDetails(booking.id)}
                          disabled={isSaving}
                          style={{ padding: '7px 16px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '12px', fontWeight: 700, cursor: isSaving ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: isSaving ? 0.7 : 1 }}
                        >
                          {isSaving ? 'Sauvegarde…' : '💾 Sauvegarder'}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
