/** Mechanic quote editor — full-screen, mobile-first line-item builder.
 *  Submits a devis for admin approval (status → quote_pending). */

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { normalizeDetailType, type ServiceDetail, type ServiceDetailType } from '../admin/adminShared'
import { getMechanicShare } from '../../lib/pricing'

type EditorBooking = {
  id: string
  reference: string
  service_name: string
  address: string
  notes_admin: string | null
  service_details?: ServiceDetail[] | null
  quote_feedback?: string | null
}

interface Props {
  booking: EditorBooking
  userId: string
  onClose: () => void
  onSubmitted: () => void
}

const TYPE_CONFIG: Record<ServiceDetailType, { emoji: string; label: string; color: string; bg: string }> = {
  material: { emoji: '🔩', label: 'Pièce',        color: '#43BCC9', bg: 'rgba(67,188,201,0.15)' },
  labor:    { emoji: '🔧', label: "Main d'œuvre", color: '#F0C040', bg: 'rgba(240,192,64,0.15)' },
  vat:      { emoji: '💰', label: 'TVA',           color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' },
  discount: { emoji: '🎁', label: 'Remise',        color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
}

function getCustomerName(notes_admin: string | null): string {
  if (!notes_admin) return 'Client'
  const m = notes_admin.match(/Nom:\s*([^|]+)/)
  return m ? m[1].trim() : 'Client'
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '14px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
}

export default function QuoteEditor({ booking, userId, onClose, onSubmitted }: Props) {
  const [lineItems, setLineItems] = useState<ServiceDetail[]>(
    booking.service_details?.length ? booking.service_details : [{ type: 'material', name: '', quantity: '1', unit_price: 0 }]
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const updateItem = (idx: number, field: keyof ServiceDetail, value: string | number) => {
    setLineItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const addItem = () => setLineItems(prev => [...prev, { type: 'material', name: '', quantity: '1', unit_price: 0 }])
  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx))

  const matTotal  = lineItems.filter(i => normalizeDetailType(i.type) === 'material').reduce((s, i) => s + (i.unit_price || 0) * (parseFloat(i.quantity || '1') || 1), 0)
  const laborTotal = lineItems.filter(i => normalizeDetailType(i.type) === 'labor').reduce((s, i) => s + (i.unit_price || 0) * (parseFloat(i.quantity || '1') || 1), 0)
  const discountTotal = lineItems.filter(i => normalizeDetailType(i.type) === 'discount').reduce((s, i) => s + (i.unit_price || 0) * (parseFloat(i.quantity || '1') || 1), 0)
  const hasManualVat = lineItems.some(i => normalizeDetailType(i.type) === 'vat')

  const totalHT  = Math.max(0, matTotal + laborTotal - discountTotal)
  const tva      = totalHT * 0.20
  const totalTTC = totalHT + tva
  const mechanicShare = getMechanicShare(lineItems, totalTTC)

  const canSubmit = lineItems.length > 0 && totalTTC > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    // notes_admin also stores the guest's name (extracted elsewhere via "Nom: X" regex) — append
    // the mechanic's observations rather than overwrite, and leave it untouched when left empty.
    const trimmedNotes = notes.trim()
    const notesUpdate = trimmedNotes
      ? { notes_admin: booking.notes_admin ? `${booking.notes_admin} | Devis: ${trimmedNotes}` : `Devis: ${trimmedNotes}` }
      : {}
    const { error } = await supabase.from('bookings').update({
      service_details: lineItems,
      amount_ttc: totalTTC,
      status: 'quote_pending',
      quote_submitted_at: new Date().toISOString(),
      quote_submitted_by: userId,
      quote_feedback: null,
      ...notesUpdate,
    }).eq('id', booking.id)
    setSubmitting(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => { onSubmitted(); onClose() }, 1400)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: '#0A0A0A',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 700, color: 'white' }}>
            Créer le devis
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace' }}>{booking.reference}</span>
            <span>·</span>
            <span>{getCustomerName(booking.notes_admin)}</span>
            <span>·</span>
            <span>{booking.service_name}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <X size={18} color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {success ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '20px' }}>
          <div style={{ fontSize: '40px' }}>✅</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', textAlign: 'center' }}>
            Devis envoyé — en attente de validation
          </div>
        </div>
      ) : (
        <>
          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '260px' }}>

            {booking.quote_feedback && (
              <div style={{
                marginBottom: '16px', padding: '14px', borderRadius: '12px',
                background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.3)',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F0C040', marginBottom: '4px' }}>
                  Correction demandée
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                  {booking.quote_feedback}
                </div>
              </div>
            )}

            {hasManualVat && (
              <div style={{
                marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4,
              }}>
                ⚠️ La TVA est calculée automatiquement — pas besoin de l'ajouter.
              </div>
            )}

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {lineItems.map((item, idx) => {
                const cat = normalizeDetailType(item.type)
                const lineTotal = (item.unit_price || 0) * (parseFloat(item.quantity || '1') || 1)
                return (
                  <div key={idx} style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
                    {/* Row 1 — description */}
                    <input
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder="Ex: Filtre à huile Bosch"
                      style={{ ...inputStyle, marginBottom: '10px' }}
                    />

                    {/* Row 2 — type selector */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {(Object.entries(TYPE_CONFIG) as [ServiceDetailType, typeof TYPE_CONFIG[ServiceDetailType]][]).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => updateItem(idx, 'type', key)}
                          style={{
                            flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: cat === key ? cfg.bg : 'rgba(255,255,255,0.04)',
                            color: cat === key ? cfg.color : 'rgba(255,255,255,0.35)',
                            fontSize: '11px', fontWeight: 600, textAlign: 'center', lineHeight: 1.3,
                          }}
                        >
                          <div style={{ fontSize: '16px', marginBottom: '2px' }}>{cfg.emoji}</div>
                          {cfg.label}
                        </button>
                      ))}
                    </div>

                    {/* Row 3 — qty / unit price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Quantité</label>
                        <input
                          type="number" inputMode="decimal"
                          value={item.quantity ?? ''}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          placeholder="1"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Prix unitaire MAD</label>
                        <input
                          type="number" inputMode="decimal"
                          value={item.unit_price ?? ''}
                          onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Row 4 — total + delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: cat === 'discount' ? '#FF6B6B' : TYPE_CONFIG[cat].color }}>
                        {cat === 'discount' ? '-' : ''}{Math.round(lineTotal)} MAD
                      </span>
                      <button
                        onClick={() => removeItem(idx)}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,68,68,0.1)', border: 'none', color: '#FF4444', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}
                      >×</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={addItem}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '20px',
                background: 'rgba(67,188,201,0.08)', border: '1px dashed rgba(67,188,201,0.35)',
                color: '#43BCC9', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + Ajouter une ligne
            </button>

            {/* Notes */}
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px' }}>
              Observations pour le client (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Ex: Remplacement recommandé rapidement…"
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* Sticky bottom — totals + submit */}
          <div style={{
            position: 'sticky', bottom: 0, background: '#0A0A0A',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px', boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                <span>Sous-total pièces</span><span>{Math.round(matTotal)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                <span>Main d'œuvre</span><span>{Math.round(laborTotal)} MAD</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <span>Total HT</span><span>{Math.round(totalHT)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                <span>TVA (20%)</span><span>{Math.round(tva)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>TOTAL TTC</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{Math.round(totalTTC)} MAD</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: '2px' }}>
                Votre part (65% de la main d'œuvre) : {Math.round(mechanicShare)} MAD
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: canSubmit ? '#43BCC9' : 'rgba(67,188,201,0.25)',
                color: '#0A0A0A', fontSize: '15px', fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {submitting ? 'Envoi…' : 'Envoyer pour validation'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
