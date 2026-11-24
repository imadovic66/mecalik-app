/** Reviews section — real customer reviews from the public_reviews view */

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PublicReview } from '../../lib/types'

interface Props {
  /** Called once the reviews have loaded, so the parent can build AggregateRating JSON-LD without a duplicate fetch */
  onLoaded?: (reviews: PublicReview[]) => void
}

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= rating ? 'var(--mk-premium)' : 'rgba(255,255,255,0.15)'}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ReviewsSection({ onLoaded }: Props) {
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('public_reviews')
      .select('*')
      .order('review_submitted_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        const list = (data as PublicReview[] | null) ?? []
        setReviews(list)
        setLoaded(true)
        onLoaded?.(list)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loaded || reviews.length === 0) return null

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const totalCount = reviews.length

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden" style={{ background: '#080808' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(67,188,201,0.3), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium" style={{ color: 'var(--mk-action)' }}>
              AVIS CLIENTS
            </div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: '1.05',
              letterSpacing: '-0.025em', color: 'white', fontWeight: 700,
            }}>
              Ce que disent nos clients.
            </h2>
          </div>

          {/* Aggregate */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {avgRating.toFixed(1)}
            </div>
            <div>
              <Stars rating={Math.round(avgRating)} size={16} />
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {totalCount} avis
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-5 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
          {reviews.map(r => (
            <div
              key={r.id}
              className="rounded-2xl p-7 flex-shrink-0"
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', width: '280px', minWidth: '280px' }}
            >
              <Stars rating={r.rating} />

              {r.rating_comment ? (
                <blockquote className="text-sm leading-relaxed mb-6 mt-4" style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  &ldquo;{r.rating_comment}&rdquo;
                </blockquote>
              ) : (
                <div className="text-sm mb-6 mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {r.service_name}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'white' }}>
                    {r.reviewer_name || 'Client MecaLIK'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {r.service_name}
                  </div>
                </div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {formatDate(r.review_submitted_at)}
                </div>
              </div>

              {r.admin_response && (
                <div className="mt-4 pl-3" style={{ borderLeft: '2px solid var(--mk-action-dim)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--mk-action)' }}>
                    Réponse de MecaLIK
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {r.admin_response}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
