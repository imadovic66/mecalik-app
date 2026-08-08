/** Reviews tab — KPIs, filter pills, review moderation (respond/hide), and review-link copy for unreviewed completed bookings */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { serviceIdFromName } from '../../../lib/serviceUtils'
import { GOOGLE_REVIEW_URL } from '../../../lib/constants'

type ReviewBooking = {
  id: string
  reference: string | null
  service_name: string | null
  status: string
  rating: number | null
  rating_comment: string | null
  reviewer_name: string | null
  technician_name: string | null
  amount_ttc: number | null
  created_at: string
  completed_at: string | null
  review_token: string | null
  review_submitted_at: string | null
  admin_response: string | null
  is_hidden: boolean | null
  notes_admin: string | null
}

function getGuestName(notes_admin: string | null): string {
  if (!notes_admin) return 'Anonyme'
  const m = notes_admin.match(/Nom:\s*([^|]+)/)
  return m ? m[1].trim() : 'Anonyme'
}

const FILTERS = [
  { key: 'all',      label: 'Tous' },
  { key: '5',        label: '5★' },
  { key: '4',        label: '4★' },
  { key: '3',        label: '3★' },
  { key: '2',        label: '2★' },
  { key: '1',        label: '1★' },
  { key: 'noreply',  label: 'Sans réponse' },
] as const

export default function ReviewsTab() {
  const { t, i18n } = useTranslation()
  const [bookings, setBookings] = useState<ReviewBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')

  const [replyTarget, setReplyTarget] = useState<ReviewBooking | null>(null)
  const [replyText, setReplyText] = useState('')
  const [savingReply, setSavingReply] = useState(false)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchBookings = useCallback(() => {
    setLoading(true)
    supabase
      .from('bookings')
      .select('id, reference, service_name, status, rating, rating_comment, reviewer_name, technician_name, amount_ttc, created_at, completed_at, review_token, review_submitted_at, admin_response, is_hidden, notes_admin')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setBookings(data as ReviewBooking[])
        setLoading(false)
      })
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const completed        = bookings.filter(b => b.status === 'completed')
  const reviews           = bookings.filter(b => b.rating != null)
  const unreviewed        = completed.filter(b => !b.review_submitted_at && b.review_token)

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—'
  const responseRate = completed.length
    ? Math.round(completed.filter(b => b.review_submitted_at).length / completed.length * 100)
    : 0

  const filtered = reviews.filter(r => {
    if (filter === 'all')     return true
    if (filter === 'noreply') return !r.admin_response
    return r.rating === parseInt(filter, 10)
  })

  const handleToggleHidden = async (review: ReviewBooking) => {
    const hiding = !review.is_hidden
    if (hiding && !window.confirm('Masquer cet avis ? Il ne sera plus visible publiquement sur le site.')) return
    const { error } = await supabase.from('bookings').update({ is_hidden: hiding }).eq('id', review.id)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === review.id ? { ...b, is_hidden: hiding } : b))
    }
  }

  const openReplyModal = (review: ReviewBooking) => {
    setReplyTarget(review)
    setReplyText(review.admin_response ?? '')
  }

  const saveReply = async () => {
    if (!replyTarget) return
    setSavingReply(true)
    const { error } = await supabase
      .from('bookings')
      .update({ admin_response: replyText.trim() || null })
      .eq('id', replyTarget.id)
    setSavingReply(false)
    if (!error) {
      setBookings(prev => prev.map(b => b.id === replyTarget.id ? { ...b, admin_response: replyText.trim() || null } : b))
      setReplyTarget(null)
    }
  }

  const copyReviewLink = (booking: ReviewBooking) => {
    if (!booking.review_token) return
    const url = `https://mecalik.com/avis/${booking.review_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(booking.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <>
      {/* KPI bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        {[
          { label: 'Note moyenne',   value: `${avgRating} / 5`, color: '#F0C040', note: `${reviews.length} avis` },
          { label: 'Total avis',     value: String(reviews.length), color: 'white', note: 'soumis' },
          { label: 'Taux de réponse', value: `${responseRate}%`, color: '#43BCC9', note: `${completed.length} interventions terminées` },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Google Reviews banner */}
      <div style={{
        padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
        background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
            📍 Google Reviews
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Partagez ce lien avec vos clients pour obtenir des avis Google
          </div>
        </div>
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px', borderRadius: '8px', background: '#4285F4',
            color: 'white', fontSize: '12px', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Voir sur Google
        </a>
      </div>

      {/* Unreviewed completed bookings — copy review link */}
      {unreviewed.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '10px' }}>
            📨 Interventions terminées sans avis ({unreviewed.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unreviewed.map(b => (
              <div
                key={b.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                  background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
                  padding: '12px 16px', flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>
                    {getGuestName(b.notes_admin)}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {b.service_name ? t('services.' + serviceIdFromName(b.service_name)) : '—'}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                    {b.reference || b.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => copyReviewLink(b)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(67,188,201,0.3)',
                    background: copiedId === b.id ? 'rgba(0,221,136,0.12)' : 'rgba(67,188,201,0.08)',
                    color: copiedId === b.id ? '#00DD88' : '#43BCC9',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {copiedId === b.id ? '✓ Copié !' : 'Copier le lien d\'avis'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: '100px', border: 'none',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: filter === f.key ? '#43BCC9' : 'rgba(255,255,255,0.06)',
              color:      filter === f.key ? '#080808' : 'rgba(255,255,255,0.5)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: '#141414' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
          <Star size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Aucun avis</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(review => (
            <div
              key={review.id}
              style={{
                background: '#0F0F0F',
                border: review.is_hidden ? '1px solid rgba(255,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '20px 24px',
                opacity: review.is_hidden ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

                {/* Left — stars + comment */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {Array.from({ length: 5 }, (_, idx) => (
                      <svg key={idx} width="14" height="14" viewBox="0 0 24 24" fill={idx < (review.rating ?? 0) ? '#F0C040' : 'rgba(255,255,255,0.1)'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#F0C040', marginLeft: '2px' }}>{review.rating}/5</span>
                    {review.is_hidden && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '6px' }}>
                        Masqué
                      </span>
                    )}
                  </div>

                  {review.rating_comment ? (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: '12px', fontStyle: 'italic' }}>
                      &ldquo;{review.rating_comment}&rdquo;
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>Pas de commentaire</p>
                  )}

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      {review.service_name ? t('services.' + serviceIdFromName(review.service_name)) : '—'}
                    </span>
                    {review.technician_name && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        Tech: {review.technician_name}
                      </span>
                    )}
                    {review.amount_ttc && (
                      <span style={{ fontSize: '11px', color: '#43BCC9' }}>{review.amount_ttc} MAD</span>
                    )}
                  </div>

                  {review.admin_response && (
                    <div style={{ marginTop: '12px', paddingLeft: '12px', borderLeft: '2px solid rgba(67,188,201,0.3)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#43BCC9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
                        Réponse de MecaLIK
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                        {review.admin_response}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      onClick={() => openReplyModal(review)}
                      style={{
                        padding: '6px 12px', borderRadius: '7px', border: '1px solid rgba(67,188,201,0.3)',
                        background: 'rgba(67,188,201,0.08)', color: '#43BCC9',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {review.admin_response ? 'Modifier la réponse' : 'Répondre'}
                    </button>
                    <button
                      onClick={() => handleToggleHidden(review)}
                      style={{
                        padding: '6px 12px', borderRadius: '7px',
                        border: review.is_hidden ? '1px solid rgba(0,221,136,0.3)' : '1px solid rgba(255,68,68,0.25)',
                        background: review.is_hidden ? 'rgba(0,221,136,0.08)' : 'rgba(255,68,68,0.06)',
                        color: review.is_hidden ? '#00DD88' : '#FF6B6B',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {review.is_hidden ? 'Réafficher' : 'Masquer'}
                    </button>
                  </div>
                </div>

                {/* Right — meta */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    {review.reviewer_name || getGuestName(review.notes_admin)}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>
                    {review.reference || review.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(review.review_submitted_at ?? review.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {replyTarget && (
        <div
          onClick={() => setReplyTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px', width: '440px', maxWidth: '100%' }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Répondre à l'avis</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 18px' }}>
              {replyTarget.reviewer_name || getGuestName(replyTarget.notes_admin)} — {replyTarget.rating}/5
            </p>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={4}
              placeholder="Merci pour votre retour..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px', marginBottom: '18px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none',
                resize: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setReplyTarget(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
              >
                Annuler
              </button>
              <button
                onClick={saveReply}
                disabled={savingReply}
                style={{ padding: '9px 18px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: savingReply ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif' }}
              >
                {savingReply ? 'Envoi...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
