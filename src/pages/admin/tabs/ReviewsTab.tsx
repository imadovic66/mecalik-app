/** Reviews tab — summary stat bar, rating filter, and reviews table with visibility toggle */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { type Review } from '../adminShared'
import { serviceIdFromName } from '../../../lib/serviceUtils'

interface Props {
  reviews: Review[]
  onToggleVisibility: (id: string, isVisible: boolean) => void
}

export default function ReviewsTab({ reviews, onToggleVisibility }: Props) {
  const { t, i18n } = useTranslation()
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all')

  const totalReviews = reviews.length
  const avgNum = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0
  const avgStr = avgNum > 0 ? avgNum.toFixed(1) : '—'
  const fiveStars = reviews.filter(r => r.rating === 5).length
  const negative  = reviews.filter(r => r.rating <= 2).length

  const filtered = reviews.filter(r => {
    if (reviewRatingFilter === 'all') return true
    if (reviewRatingFilter === '2')   return r.rating <= 2
    return r.rating === parseInt(reviewRatingFilter)
  })

  return (
    <>
      {/* Summary stat bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        {[
          { label: t('landing.stat3Label'), value: `${avgStr} / 5`, color: '#F0C040', note: t('landing.reviewsRating') },
          { label: 'Total avis',    value: String(totalReviews), color: 'white',   note: 'soumis' },
          { label: '5 étoiles',     value: String(fiveStars),    color: '#00DD88', note: totalReviews ? `${Math.round(fiveStars / totalReviews * 100)}%` : '0%' },
          { label: 'Avis négatifs', value: String(negative),     color: '#FF4444', note: '≤ 2 étoiles' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Rating filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Tous' },
          { key: '5',   label: '5 ★'  },
          { key: '4',   label: '4 ★'  },
          { key: '3',   label: '3 ★'  },
          { key: '2',   label: '≤ 2 ★' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setReviewRatingFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: '100px', border: 'none',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: reviewRatingFilter === f.key ? '#43BCC9' : 'rgba(255,255,255,0.06)',
              color: reviewRatingFilter === f.key ? '#080808' : 'rgba(255,255,255,0.5)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
          <Star size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Aucun avis</div>
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 140px 140px 76px 1fr 80px 44px', padding: '10px 20px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Date', 'Client', 'Service', 'Note', 'Commentaire', 'Statut', ''].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>
          {filtered.map((review, i) => (
            <div
              key={review.id}
              style={{
                display: 'grid', gridTemplateColumns: '90px 140px 140px 76px 1fr 80px 44px',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                opacity: review.is_visible ? 1 : 0.45, transition: 'opacity 0.2s',
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                {new Date(review.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {review.profiles?.full_name || 'Anonyme'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {review.service_type ? t('services.' + serviceIdFromName(review.service_type)) : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {Array.from({ length: review.rating }, (_, idx) => (
                  <svg key={idx} width="11" height="11" viewBox="0 0 24 24" fill="#F0C040">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {review.comment || '—'}
              </div>
              <div>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px',
                  background: review.is_visible ? 'rgba(0,221,136,0.08)' : 'rgba(255,68,68,0.08)',
                  color: review.is_visible ? '#00DD88' : '#FF4444',
                }}>
                  {review.is_visible ? 'Visible' : 'Masqué'}
                </span>
              </div>
              <div>
                <button
                  onClick={() => onToggleVisibility(review.id, review.is_visible)}
                  title={review.is_visible ? 'Masquer' : 'Afficher'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}
                >
                  {review.is_visible
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
