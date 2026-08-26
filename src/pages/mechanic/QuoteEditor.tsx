/** Mechanic quote editor — full-screen, mobile-first line-item builder.
 *  Submits a devis for admin approval (status → quote_pending). */

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { normalizeDetailType, type ServiceDetail, type ServiceDetailType } from '../admin/adminShared'
import { computeQuoteTotals, getCustomerName, getCustomerPhone } from '../../lib/bookingUtils'

type EditorBooking = {
  id: string
  reference: string
  service_name: string
  address: string
  notes_admin: string | null
  service_details?: ServiceDetail[] | null
  quote_feedback?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  profiles?: { full_name?: string | null; phone?: string | null } | null
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

// 'vat' is deliberately NOT selectable: prices are entered TTC, so TVA is a
// reverse-calculated component of the total, never a line the mechanic adds.
// It stays in TYPE_CONFIG only to render legacy lines from pre-cutover quotes.
const SELECTABLE_TYPES: ServiceDetailType[] = ['material', 'labor', 'discount']

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

  // All money figures come from the shared helper — no local arithmetic here.
  const totals = computeQuoteTotals(lineItems)
  const { materialsTTC, labourTTC, discountTTC, totalTTC, totalHT, totalTVA, mechanicShare } = totals

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
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace' }}>{booking.reference}</span>
            <span>·</span>
            <span>{getCustomerName(booking)}</span>
            <span>·</span>
            <span>{booking.service_name}</span>
            {getCustomerPhone(booking) && (
              <>
                <span>·</span>
                <a href={`tel:${getCustomerPhone(booking)}`} style={{ color: 'var(--mk-action)', textDecoration: 'none' }}>
                  📞 {getCustomerPhone(booking)}
                </a>
              </>
            )}
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

            <div style={{
              marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.2)',
              fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.45,
            }}>
              💡 Saisissez les prix <strong style={{ color: 'white' }}>TTC</strong> — le prix que le client paie.
              La TVA est calculée automatiquement.
            </div>

            {/* Line items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {lineItems.map((item, idx) => {
                const cat = normalizeDetailType(item.type)
                const lineTotal = (item.unit_price || 0) * (parseFloat(item.quantity || '1') || 1)
                const isLegacyVat = cat === 'vat'
                return (
                  <div key={idx} style={{
                    background: '#0F0F0F',
                    border: isLegacyVat ? '1px solid rgba(240,192,64,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '14px',
                    opacity: isLegacyVat ? 0.75 : 1,
                  }}>
                    {isLegacyVat && (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#F0C040', marginBottom: '10px' }}>
                        ⚠️ Ligne TVA héritée — à supprimer
                      </div>
                    )}

                    {/* Row 1 — description */}
                    <input
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder="Ex: Filtre à huile Bosch"
                      readOnly={isLegacyVat}
                      style={{ ...inputStyle, marginBottom: '10px', opacity: isLegacyVat ? 0.6 : 1 }}
                    />

                    {/* Row 2 — type selector (legacy TVA lines are read-only, not re-typeable) */}
                    {!isLegacyVat && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        {SELECTABLE_TYPES.map(key => {
                          const cfg = TYPE_CONFIG[key]
                          return (
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
                          )
                        })}
                      </div>
                    )}

                    {/* Row 3 — qty / unit price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Quantité</label>
                        <input
                          type="number" inputMode="decimal"
                          value={item.quantity ?? ''}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          placeholder="1"
                          readOnly={isLegacyVat}
                          style={{ ...inputStyle, opacity: isLegacyVat ? 0.6 : 1 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>
                          Prix unitaire TTC (MAD)
                        </label>
                        <input
                          type="number" inputMode="decimal"
                          value={item.unit_price ?? ''}
                          onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          readOnly={isLegacyVat}
                          style={{ ...inputStyle, opacity: isLegacyVat ? 0.6 : 1 }}
                        />
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', lineHeight: 1.3 }}>
                          Le prix que le client paie, TVA incluse
                        </div>
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
                <span>Sous-total pièces (TTC)</span><span>{Math.round(materialsTTC)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                <span>Main d'œuvre (TTC)</span><span>{Math.round(labourTTC)} MAD</span>
              </div>
              {discountTTC > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#FF6B6B' }}>
                  <span>Remise</span><span>−{Math.round(discountTTC)} MAD</span>
                </div>
              )}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

              {/* TTC is the hero — HT and TVA are shown as components of it, not additions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>TOTAL TTC</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#43BCC9', fontFamily: 'Space Grotesk, sans-serif' }}>{Math.round(totalTTC)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                <span>dont HT</span><span>{Math.round(totalHT)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                <span>dont TVA (20%)</span><span>{Math.round(totalTVA)} MAD</span>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: '6px' }}>
                Votre part (65% de la main d'œuvre HT) : {Math.round(mechanicShare)} MAD
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
