import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { GOOGLE_REVIEW_URL, WHATSAPP_NUMBER } from '../lib/constants'
import SEO from '../components/SEO'

type ReviewBooking = {
  id: string
  reference: string | null
  service_name: string | null
  technician_name: string | null
  completed_at: string | null
  rating: number | null
  review_submitted_at: string | null
}

const RATING_LABELS: Record<number, string> = {
  1: 'Très déçu',
  2: 'Décevant',
  3: 'Correct',
  4: 'Très bien',
  5: 'Excellent !',
}

function Star({ filled, size = 48 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'var(--mk-premium)' : 'rgba(255,255,255,0.2)'}
      style={{ transition: 'transform 0.15s ease, fill 0.15s ease', transform: filled ? 'scale(1.06)' : 'scale(1)' }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<ReviewBooking | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    supabase
      .from('bookings')
      .select('id, reference, service_name, technician_name, completed_at, rating, review_submitted_at')
      .eq('review_token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true) } else { setBooking(data as ReviewBooking) }
        setLoading(false)
      })
  }, [token])

  const handleSubmit = async () => {
    if (rating === 0 || !token) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await supabase
      .from('bookings')
      .update({
        rating,
        rating_comment: comment.trim() || null,
        reviewer_name: name.trim() || null,
        review_submitted_at: new Date().toISOString(),
      })
      .eq('review_token', token)

    if (error) {
      setSubmitError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    setJustSubmitted(true)
  }

  const displayedRating = hoverRating || rating

  const shell: React.CSSProperties = {
    minHeight: '100vh', background: 'var(--mk-bg)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'Outfit, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: '480px', background: '#0F0F0F',
    border: '1px solid var(--mk-border-strong)', borderRadius: '20px',
    padding: '32px 28px', textAlign: 'center', boxSizing: 'border-box',
  }

  const Logo = () => (
    <div onClick={() => navigate('/')} style={{ cursor: 'pointer', marginBottom: '28px', display: 'inline-block' }}>
      <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--mk-text-bright)', letterSpacing: '-0.5px' }}>
        Meca<span style={{ color: 'var(--mk-action)' }}>LIK</span>
      </span>
    </div>
  )

  const BackHomeLink = () => (
    <a
      href="/"
      style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', color: 'var(--mk-text-muted)', textDecoration: 'none' }}
    >
      ← Retour à l'accueil
    </a>
  )

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={shell}>
        <SEO title="Votre avis | MecaLIK" description="Notez votre intervention MecaLIK." path={`/avis/${token ?? ''}`} noindex />
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--mk-action)', animation: 'mkSpin 0.8s linear infinite' }} />
        <style>{`@keyframes mkSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── State A — invalid / not found ────────────────────────────────────────
  if (notFound || !booking) {
    return (
      <div style={shell}>
        <SEO title="Lien invalide | MecaLIK" description="Ce lien de notation n'est plus valide." path={`/avis/${token ?? ''}`} noindex />
        <div style={cardStyle}>
          <Logo />
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔗</div>
          <h1 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--mk-text-bright)', margin: '0 0 8px' }}>
            Lien invalide ou expiré
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mk-text-muted)', margin: 0, lineHeight: 1.6 }}>
            Ce lien de notation n'est plus valide.
          </p>
          <BackHomeLink />
        </div>
      </div>
    )
  }

  // ── State B — already reviewed ───────────────────────────────────────────
  if (booking.review_submitted_at && !justSubmitted) {
    return (
      <div style={shell}>
        <SEO title="Avis déjà envoyé | MecaLIK" description="Vous avez déjà noté cette intervention." path={`/avis/${token ?? ''}`} noindex />
        <div style={cardStyle}>
          <Logo />
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--mk-success-dim)', border: '2px solid var(--mk-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--mk-text-bright)', margin: '0 0 16px' }}>
            Merci, vous avez déjà noté cette intervention !
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} filled={i <= (booking.rating ?? 0)} size={28} />
            ))}
          </div>
          <BackHomeLink />
        </div>
      </div>
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (justSubmitted) {
    const waMessage = encodeURIComponent(`Bonjour, je souhaite discuter de mon intervention ${booking.reference ?? ''}`)
    return (
      <div style={shell}>
        <SEO title="Merci pour votre avis | MecaLIK" description="Votre avis a été envoyé." path={`/avis/${token ?? ''}`} noindex />
        <div style={cardStyle}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--mk-success-dim)', border: '2px solid var(--mk-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px',
            animation: 'mkPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mk-text-bright)', margin: '0 0 8px' }}>
            Merci{name ? ` ${name}` : ''} !
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--mk-text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Votre avis compte beaucoup pour nous.
          </p>

          {rating >= 4 ? (
            <div style={{
              padding: '20px', borderRadius: '14px', textAlign: 'left',
              background: 'var(--mk-premium-faint)', border: '1px solid var(--mk-premium-dim)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text-bright)', marginBottom: '6px' }}>
                Vous avez 30 secondes de plus ?
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Un avis Google nous aide énormément à être trouvés par d'autres Casablancais.
              </p>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '13px', borderRadius: '10px',
                  background: 'var(--mk-premium)', color: '#0A0A0A', fontSize: '14px', fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Laisser un avis Google
              </a>
            </div>
          ) : (
            <div style={{
              padding: '20px', borderRadius: '14px', textAlign: 'left',
              background: 'var(--mk-urgent-faint)', border: '1px solid var(--mk-urgent-dim)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-text-bright)', marginBottom: '6px' }}>
                Nous sommes désolés que ça ne se soit pas bien passé.
              </div>
              <p style={{ fontSize: '13px', color: 'var(--mk-text-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                Nous aimerions comprendre et corriger ça.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '13px', borderRadius: '10px',
                  background: 'var(--mk-action)', color: '#0A0A0A', fontSize: '14px', fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Nous contacter sur WhatsApp
              </a>
            </div>
          )}

          <BackHomeLink />
        </div>
        <style>{`@keyframes mkPop { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  // ── State C — ready to review ─────────────────────────────────────────────
  const commentPlaceholder = rating > 0 && rating <= 3
    ? "Qu'est-ce qui n'a pas fonctionné ? Nous voulons nous améliorer."
    : 'Qu\'avez-vous apprécié ? Cela aide d\'autres clients à nous découvrir.'

  return (
    <div style={shell}>
      <SEO title="Notez votre intervention | MecaLIK" description="Partagez votre expérience MecaLIK." path={`/avis/${token ?? ''}`} noindex />
      <div style={{ ...cardStyle, textAlign: 'left' }}>
        <div style={{ textAlign: 'center' }}>
          <Logo />
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--mk-text-bright)', margin: '0 0 12px', textAlign: 'center', lineHeight: 1.3 }}>
          Comment s'est passée votre intervention ?
        </h1>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '14px', color: 'var(--mk-text)' }}>
            {booking.service_name}{booking.completed_at ? ` · ${formatDate(booking.completed_at)}` : ''}
          </div>
          {booking.reference && (
            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--mk-action)', marginTop: '4px' }}>
              Réf. {booking.reference}
            </div>
          )}
          {booking.technician_name && (
            <div style={{ fontSize: '12px', color: 'var(--mk-text-muted)', marginTop: '4px' }}>
              Technicien : {booking.technician_name}
            </div>
          )}
        </div>

        {/* Star rating */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHoverRating(i)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 0 }}
              aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
            >
              <Star filled={i <= displayedRating} />
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', minHeight: '20px', marginBottom: '28px' }}>
          {displayedRating > 0 && (
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mk-premium)' }}>
              {RATING_LABELS[displayedRating]}
            </span>
          )}
        </div>

        {/* Name */}
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mk-text-muted)', display: 'block', marginBottom: '8px' }}>
          Votre prénom (optionnel)
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Hamza"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '10px', marginBottom: '4px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--mk-border-strong)',
            color: 'var(--mk-text-bright)', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--mk-text-faint)', marginBottom: '20px' }}>
          Affiché publiquement avec votre avis
        </div>

        {/* Comment */}
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mk-text-muted)', display: 'block', marginBottom: '8px' }}>
          Un commentaire ? (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={commentPlaceholder}
          rows={4}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: '10px', marginBottom: '24px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--mk-border-strong)',
            color: 'var(--mk-text-bright)', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
            resize: 'none', boxSizing: 'border-box',
          }}
        />

        {submitError && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--mk-urgent-faint)', border: '1px solid var(--mk-urgent-dim)', color: '#FF6B6B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
            background: rating === 0 ? 'rgba(67,188,201,0.3)' : 'var(--mk-action)',
            color: '#0A0A0A', fontSize: '15px', fontWeight: 700,
            cursor: rating === 0 || submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Envoi...' : 'Envoyer mon avis'}
        </button>
      </div>
    </div>
  )
}
