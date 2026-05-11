/** Reviews tab — fetches rated bookings directly, KPI bar, filter pills, review cards */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { serviceIdFromName } from '../../../lib/serviceUtils'
import { GOOGLE_REVIEW_URL } from '../../../lib/constants'

type RatedBooking = {
  id: string
  reference: string
  service_name: string | null
  rating: number
  rating_comment: string | null
  technician_name: string | null
  amount_ttc: number | null
  created_at: string
  notes_admin: string | null
}

function getGuestName(notes_admin: string | null): string {
  if (!notes_admin) return 'Anonyme'
  const m = notes_admin.match(/Nom:\s*([^|]+)/)
  return m ? m[1].trim() : 'Anonyme'
}

export default function ReviewsTab() {
  const { t, i18n } = useTranslation()
  const isFr = i18n.language === 'fr'
  const [reviews, setReviews] = useState<RatedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select('id, reference, service_name, rating, rating_comment, technician_name, amount_ttc, created_at, notes_admin')
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
      if (!error && data) setReviews(data as RatedBooking[])
      setLoading(false)
    }
    fetchReviews()
  }, [])

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—'
  const fiveStars    = reviews.filter(r => r.rating === 5).length
  const negativeCount = reviews.filter(r => r.rating <= 2).length

  const filtered = reviews.filter(r => {
    if (filter === 'all') return true
    if (filter === '2')   return r.rating <= 2
    return r.rating === parseInt(filter)
  })

  return (
    <>
      {/* KPI bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        {[
          { label: 'Note moyenne',  value: `${avgRating} / 5`,       color: '#F0C040', note: 'sur 5 étoiles'  },
          { label: 'Total avis',    value: String(reviews.length),    color: 'white',   note: 'soumis'         },
          { label: '5 étoiles',     value: String(fiveStars),         color: '#00DD88', note: reviews.length ? `${Math.round(fiveStars / reviews.length * 100)}%` : '0%' },
          { label: 'Avis négatifs', value: String(negativeCount),     color: '#FF4444', note: '≤ 2 étoiles'   },
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
            {isFr ? 'Partagez ce lien avec vos clients pour obtenir des avis Google' : 'Share this link with customers to get Google reviews'}
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
          {isFr ? 'Voir sur Google' : 'View on Google'}
        </a>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Tous' },
          { key: '5',   label: '5 ★'  },
          { key: '4',   label: '4 ★'  },
          { key: '3',   label: '3 ★'  },
          { key: '2',   label: '≤ 2 ★' },
        ].map(f => (
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
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

                {/* Left — stars + comment */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    {Array.from({ length: 5 }, (_, idx) => (
                      <svg key={idx} width="14" height="14" viewBox="0 0 24 24" fill={idx < review.rating ? '#F0C040' : 'rgba(255,255,255,0.1)'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#F0C040', marginLeft: '2px' }}>{review.rating}/5</span>
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
                </div>

                {/* Right — meta */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    {getGuestName(review.notes_admin)}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>
                    {review.reference || review.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(review.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
