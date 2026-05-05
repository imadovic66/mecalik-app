import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X, Star } from 'lucide-react'

type Props = {
  bookingId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
  onSubmitted: () => void
}

const SERVICE_LABELS: Record<string, string> = {
  lavage: 'Lavage Auto', vidange: 'Vidange & Filtres', batterie: 'Batterie',
  pneus: 'Pneus', diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
}

const RATING_LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent']

export default function RatingModal({ bookingId, serviceName, isOpen, onClose, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    await supabase
      .from('bookings')
      .update({ rating, rating_comment: comment || null })
      .eq('id', bookingId)
    setSubmitted(true)
    setSubmitting(false)
    setTimeout(() => {
      onSubmitted()
      onClose()
    }, 1500)
  }

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
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 className="font-heading font-bold text-lg" style={{ color: 'white' }}>
              Évaluer le service
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {SERVICE_LABELS[serviceName] || serviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {submitted ? (
          <div className="p-12 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(0,221,136,0.1)', border: '2px solid #00DD88' }}
            >
              <Star size={28} style={{ color: '#00DD88' }} fill="#00DD88" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2" style={{ color: 'white' }}>
              Merci pour votre avis
            </h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Votre évaluation nous aide à améliorer notre service.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Stars */}
            <div className="text-center mb-6">
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Comment s'est passée votre intervention ?
              </p>
              <div className="flex items-center justify-center gap-3 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform duration-150 hover:scale-110"
                  >
                    <Star
                      size={40}
                      style={{
                        color: star <= (hovered || rating) ? '#F0C040' : 'rgba(255,255,255,0.15)',
                        fill: star <= (hovered || rating) ? '#F0C040' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    />
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-sm font-medium" style={{ color: '#F0C040' }}>
                  {RATING_LABELS[hovered || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label
                className="block text-xs font-medium uppercase tracking-wide mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Partagez votre expérience..."
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'white',
                }}
                onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-full text-sm font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Plus tard
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 py-3.5 rounded-full text-sm font-bold transition-colors"
                style={{
                  background: rating === 0 ? 'rgba(240,192,64,0.3)' : '#F0C040',
                  color: '#080808',
                  cursor: rating === 0 ? 'not-allowed' : 'pointer',
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
