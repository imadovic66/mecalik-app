/** Admin manual booking intake — phone/WhatsApp/walk-in customers enter the same
 *  pipeline (assign → mechanic quote → admin approve → devis) as website bookings. */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../hooks/useAuth'
import { WHATSAPP_NUMBER } from '../../../lib/constants'
import type { Booking } from '../adminShared'
import { getCustomerName, getCustomerPhone, type BookingSource } from '../../../lib/bookingUtils'

interface Props {
  mechanics: { id: string; full_name: string | null }[]
  bookings: Booking[]
  onClose: () => void
  onCreated: () => void
  onViewBooking?: (b: Booking) => void
}

const CHANNELS: { key: BookingSource; emoji: string; label: string }[] = [
  { key: 'phone',    emoji: '📞', label: 'Téléphone' },
  { key: 'whatsapp', emoji: '💬', label: 'WhatsApp' },
  { key: 'walkin',   emoji: '🚶', label: 'Sur place' },
  { key: 'platform', emoji: '🌐', label: 'Site web' },
]

// All 6 catalog services — admin can sell Pneus/Lavage manually even though they're
// "coming soon" on the public site.
const ALL_SERVICES: { id: string; label: string }[] = [
  { id: 'vidange',    label: 'Vidange & Filtres' },
  { id: 'batterie',   label: 'Batterie' },
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'urgence',    label: 'Urgence & Dépannage' },
  { id: 'pneus',      label: 'Pneus' },
  { id: 'lavage',     label: 'Lavage Auto' },
]

function generateReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let rand = ''
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `MK-${rand}`
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: '9px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px',
}
const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: '12px', marginTop: '22px',
}

export default function NewBookingModal({ mechanics, bookings, onClose, onCreated, onViewBooking }: Props) {
  const { user } = useAuth()

  const [channel, setChannel] = useState<BookingSource>('phone')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [vehicleLabel, setVehicleLabel] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [slotType, setSlotType] = useState<'scheduled' | 'urgent'>('scheduled')
  const [preferredDate, setPreferredDate] = useState('')
  const [address, setAddress] = useState('')
  const [addressNotes, setAddressNotes] = useState('')
  const [mechanicId, setMechanicId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ reference: string; serviceLabel: string } | null>(null)
  const [autoFilled, setAutoFilled] = useState(false)

  // Known-client lookup — searches the already-loaded bookings list for a phone match
  const phoneMatches = useMemo(() => {
    const digits = customerPhone.replace(/\D/g, '')
    if (digits.length < 6) return []
    return bookings
      .filter(b => getCustomerPhone(b)?.replace(/\D/g, '') === digits)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [customerPhone, bookings])

  useEffect(() => {
    if (phoneMatches.length === 0 || autoFilled) return
    const mostRecent = phoneMatches[0]
    if (!customerName) setCustomerName(getCustomerName(mostRecent))
    if (!address) setAddress(mostRecent.address || '')
    setAutoFilled(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneMatches])

  useEffect(() => {
    if (slotType === 'urgent' && !preferredDate) {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      setPreferredDate(now.toISOString().slice(0, 16))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotType])

  const selectedMechanic = mechanics.find(m => m.id === mechanicId) || null
  const selectedService = ALL_SERVICES.find(s => s.id === serviceId) || null

  const canSubmit = !submitting && !!customerName.trim() && !!customerPhone.trim() && !!serviceId && !!address.trim()

  const handleSubmit = async () => {
    if (!canSubmit || !user) return
    setSubmitting(true)
    setError('')
    try {
      const reference = generateReference()
      const { error: insertError } = await supabase.from('bookings').insert({
        reference,
        customer_name:  customerName.trim(),
        customer_phone: customerPhone.trim(),
        vehicle_label:  vehicleLabel.trim() || null,
        service_name:   selectedService?.label ?? serviceId,
        address:        address.trim(),
        address_notes:  addressNotes.trim() || null,
        slot_type:      slotType,
        preferred_date: preferredDate ? new Date(preferredDate).toISOString() : null,
        technician_name: selectedMechanic?.full_name ?? null,
        status:         selectedMechanic ? 'confirmed' : 'pending',
        source:         channel,
        created_by:     user.id,
        user_id:        null,
      })
      if (insertError) throw insertError
      setCreated({ reference, serviceLabel: selectedService?.label ?? serviceId })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmationMessage = created ? (() => {
    const mechanicLine = selectedMechanic
      ? `Notre technicien ${selectedMechanic.full_name} vous contacte sous peu.`
      : 'Nous vous confirmons un créneau très vite.'
    return `Bonjour ${customerName}, votre demande MecaLIK est enregistrée.\n` +
      `Réf : ${created.reference}\n` +
      `Service : ${created.serviceLabel}\n` +
      `Adresse : ${address}\n` +
      `${mechanicLine}\n` +
      `Vous recevrez un devis détaillé avant toute intervention.`
  })() : ''

  const digits = customerPhone.replace(/\D/g, '')
  const waHref = `https://wa.me/${digits || WHATSAPP_NUMBER}?text=${encodeURIComponent(confirmationMessage)}`

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '520px', maxWidth: '100%', margin: '20px 0' }}
      >
        {created ? (
          // ── Success panel ─────────────────────────────────────────────
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Réservation créée</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontFamily: 'monospace' }}>
              {created.reference}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '13px', borderRadius: '10px', background: '#00DD88', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
              >
                📲 Confirmer au client sur WhatsApp
              </a>
              <button
                onClick={onClose}
                style={{ padding: '10px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          // ── Form ──────────────────────────────────────────────────────
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white', margin: 0 }}>+ Nouvelle réservation</h3>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            {/* Canal d'entrée */}
            <div style={sectionTitleStyle}>Canal d'entrée</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CHANNELS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setChannel(c.key)}
                  style={{
                    flex: '1 1 auto', padding: '10px 8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                    background: channel === c.key ? 'rgba(67,188,201,0.15)' : 'rgba(255,255,255,0.04)',
                    color: channel === c.key ? '#43BCC9' : 'rgba(255,255,255,0.45)',
                    fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {/* Client */}
            <div style={sectionTitleStyle}>Client</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nom du client *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Hamza Rahali" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input
                  type="tel" inputMode="numeric"
                  value={customerPhone}
                  onChange={e => { setCustomerPhone(e.target.value); setAutoFilled(false) }}
                  placeholder="06 XX XX XX XX"
                  style={inputStyle}
                />
                {phoneMatches.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#43BCC9' }}>
                    <span>
                      Client connu — {phoneMatches.length} intervention{phoneMatches.length > 1 ? 's' : ''} précédente{phoneMatches.length > 1 ? 's' : ''}
                    </span>
                    {onViewBooking && (
                      <button
                        onClick={() => onViewBooking(phoneMatches[0])}
                        style={{ background: 'none', border: 'none', color: '#43BCC9', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', padding: 0 }}
                      >
                        Voir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Véhicule */}
            <div style={sectionTitleStyle}>Véhicule</div>
            <input value={vehicleLabel} onChange={e => setVehicleLabel(e.target.value)} placeholder="Ex: Dacia Logan 2018 Diesel" style={inputStyle} />

            {/* Intervention */}
            <div style={sectionTitleStyle}>Intervention</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Service *</label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Choisir un service —</option>
                  {ALL_SERVICES.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#121212' }}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Urgence</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([
                    { key: 'scheduled' as const, emoji: '🕒', label: 'Programmé' },
                    { key: 'urgent' as const, emoji: '⚡', label: 'Urgent' },
                  ]).map(o => (
                    <button
                      key={o.key}
                      onClick={() => setSlotType(o.key)}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                        background: slotType === o.key ? (o.key === 'urgent' ? 'rgba(255,68,68,0.15)' : 'rgba(67,188,201,0.15)') : 'rgba(255,255,255,0.04)',
                        color: slotType === o.key ? (o.key === 'urgent' ? 'var(--mk-urgent)' : '#43BCC9') : 'rgba(255,255,255,0.45)',
                        fontSize: '12px', fontWeight: 600,
                      }}
                    >
                      {o.emoji} {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Date souhaitée</label>
                <input type="datetime-local" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>

              <div>
                <label style={labelStyle}>Adresse *</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Adresse d'intervention" style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <div>
                <label style={labelStyle}>Précisions</label>
                <textarea value={addressNotes} onChange={e => setAddressNotes(e.target.value)} rows={2} placeholder="Étage, code d'accès, repère…" style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>

            {/* Assignation */}
            <div style={sectionTitleStyle}>Assignation</div>
            <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— Non assigné (statut : en attente) —</option>
              {mechanics.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#121212' }}>{m.full_name}</option>
              ))}
            </select>

            {error && (
              <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#FF6B6B', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', marginTop: '22px', padding: '14px', borderRadius: '11px', border: 'none',
                background: canSubmit ? '#43BCC9' : 'rgba(67,188,201,0.25)',
                color: '#0A0A0A', fontSize: '14px', fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'Outfit, sans-serif',
              }}
            >
              {submitting ? 'Création…' : 'Créer la réservation'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
