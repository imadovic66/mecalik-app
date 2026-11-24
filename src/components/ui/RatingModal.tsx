import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { serviceIdFromName } from '../../lib/serviceUtils'

type Props = {
  bookingId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
  onSubmitted: () => void
}

const RATING_LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent']
const MAX_CHARS = 500

export default function RatingModal({ bookingId, serviceName, isOpen, onClose, onSubmitted }: Props) {
  const { t } = useTranslation()
  const [rating, setRating]       = useState(0)
  const [hovered, setHovered]     = useState(0)
  const [comment, setComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]  = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    // Write to reviews table
    await supabase.from('reviews').insert({
      booking_id:   bookingId,
      customer_id:  user.id,
      service_type: serviceName,
      rating,
      comment: comment.trim() || null,
    })

    // Also update bookings for display in customer dashboard
    await supabase
      .from('bookings')
      .update({ rating, rating_comment: comment.trim() || null })
      .eq('id', bookingId)

    setSubmitted(true)
    setSubmitting(false)
    setTimeout(() => {
      onSubmitted()
      onClose()
    }, 1600)
  }

  const active = hovered || rating

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full md:max-w-md mx-0 md:mx-4 rounded-t-2xl md:rounded-2xl"
        style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 700, color: 'white', lineHeight: 1.3,
            }}>
              Comment s&apos;est passée votre intervention ?
            </h2>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('services.' + serviceIdFromName(serviceName))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-4 mt-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(67,188,201,0.1)', border: '2px solid var(--mk-action)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--mk-action)" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px',
            }}>
              Merci pour votre avis !
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Votre évaluation nous aide à améliorer notre service.
            </p>
          </div>
        ) : (
          <div className="p-6">

            {/* Stars */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
                  >
                    <svg
                      width="38" height="38" viewBox="0 0 24 24"
                      fill={star <= active ? 'var(--mk-action)' : 'transparent'}
                      stroke={star <= active ? 'var(--mk-action)' : 'rgba(255,255,255,0.18)'}
                      strokeWidth="1.5"
                      style={{ transition: 'all 0.12s' }}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
              {active > 0 && (
                <p className="text-sm font-semibold" style={{ color: 'var(--mk-action)' }}>
                  {RATING_LABELS[active]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label
                className="block text-xs font-medium uppercase tracking-wide mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Votre avis (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, MAX_CHARS))}
                rows={3}
                placeholder="Décrivez votre expérience..."
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--mk-action)')}
                onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <div className="text-right mt-1">
                <span className="text-xs" style={{
                  color: comment.length >= MAX_CHARS ? 'var(--mk-urgent)' : 'rgba(255,255,255,0.25)',
                }}>
                  {comment.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full text-sm font-medium"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                Plus tard
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 py-3.5 rounded-full text-sm font-bold"
                style={{
                  background: rating === 0 ? 'rgba(67,188,201,0.2)' : 'var(--mk-action)',
                  color: rating === 0 ? 'rgba(255,255,255,0.35)' : '#080808',
                  cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'background 0.15s',
                }}
              >
                {submitting ? 'Envoi...' : 'Envoyer mon avis'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
