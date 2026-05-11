import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SUPABASE_URL = 'https://nggvlwiisvvjczpyccfj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZ3Zsd2lpc3Z2amN6cHljY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA3ODksImV4cCI6MjA5MDYyNjc4OX0.qjYAD4YVjEMANIVXfvfbj5O6VvkXqagwZIo_6sbrQ6Y'

const STATUS_STEPS = ['pending', 'confirmed', 'on_the_way', 'in_progress', 'completed']

const SERVICE_PRICES: Record<string, string> = {
  'lavage auto':          'À partir de 150 MAD',
  'car wash':             'From 150 MAD',
  'vidange':              'À partir de 250 MAD',
  'vidange & filtres':    'À partir de 250 MAD',
  'oil change & filters': 'From 250 MAD',
  'batterie':             'À partir de 210 MAD',
  'battery':              'From 210 MAD',
  'pneus':                'À partir de 200 MAD',
  'tyres':                'From 200 MAD',
  'diagnostic':           'À partir de 220 MAD',
  'diagnostic simple':    'À partir de 220 MAD',
  'urgence':              'À partir de 239 MAD',
  'urgence 24/7':         'À partir de 239 MAD',
  'emergency 24/7':       'From 239 MAD',
}

export default function TrackBooking() {
  const { reference: urlRef } = useParams<{ reference?: string }>()
  const { i18n } = useTranslation()
  const isFr = i18n.language === 'fr'
  const [ref, setRef] = useState(urlRef?.toUpperCase() || '')
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRating, setSelectedRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [showAccountPopup, setShowAccountPopup] = useState(false)
  const navigate = useNavigate()

  const getPrice = (b: any): string => {
    if (b.status === 'pending') return isFr ? 'En cours de confirmation' : 'Pending confirmation'
    if (b.amount_ttc) return `${b.amount_ttc} MAD`
    const key = (b.service_name || '').toLowerCase().trim()
    return SERVICE_PRICES[key] || (isFr ? 'Prix à confirmer' : 'Price to confirm')
  }

  useEffect(() => {
    if (urlRef && urlRef.length > 3) {
      setRef(urlRef.toUpperCase())
      fetchBooking(urlRef.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRef])

  const isGuestBooking = booking?.notes_admin?.includes('Guest booking')

  useEffect(() => {
    if (booking?.status === 'completed' && isGuestBooking && !booking.rating) {
      const t = setTimeout(() => setShowAccountPopup(true), 2000)
      return () => clearTimeout(t)
    }
  }, [booking?.status, booking?.rating, isGuestBooking])

  const fetchBooking = async (refToSearch: string) => {
    setLoading(true)
    setError('')
    setBooking(null)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?reference=eq.${encodeURIComponent(refToSearch.trim())}&select=reference,service_name,status,address,technician_name,technician_phone,created_at,notes_admin,amount_ttc,rating,rating_comment`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(JSON.stringify(data))
      if (!data || data.length === 0) {
        setError(isFr ? 'Aucune réservation trouvée avec cette référence.' : 'No booking found with this reference.')
        return
      }
      setBooking(data[0])
    } catch (err: any) {
      console.error('TrackBooking error:', err)
      setError(isFr ? 'Erreur de connexion. Réessayez.' : 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ref.trim()) fetchBooking(ref.trim())
  }

  const handleSubmitRating = async () => {
    if (!selectedRating || !booking) return
    setSubmittingRating(true)
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?reference=eq.${booking.reference}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rating: selectedRating, rating_comment: ratingComment || null }),
        }
      )
      await new Promise(r => setTimeout(r, 500))
      await fetchBooking(booking.reference)
    } catch (e) {
      console.error('Rating error:', e)
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const map: Record<string, any> = {
      pending:     { icon: '⏳', color: '#F0C040', label: isFr ? 'En attente' : 'Pending',                desc: isFr ? 'Votre demande a été reçue. Confirmation dans 5 minutes.' : 'Request received. Confirmation within 5 minutes.' },
      confirmed:   { icon: '✅', color: '#43BCC9', label: isFr ? 'Confirmée' : 'Confirmed',               desc: isFr ? 'Votre intervention est confirmée. Technicien assigné.' : 'Service confirmed. Technician assigned.' },
      on_the_way:  { icon: '🚗', color: '#F0C040', label: isFr ? 'Mécanicien en route' : 'Mechanic on the way', desc: isFr ? 'Le technicien est en route vers votre adresse.' : 'The technician is on the way to your address.' },
      in_progress: { icon: '🔧', color: '#43BCC9', label: isFr ? 'En cours' : 'In progress',             desc: isFr ? 'Le technicien est sur place.' : 'Technician is on site.' },
      completed:   { icon: '🎉', color: '#22C55E', label: isFr ? 'Terminée' : 'Completed',               desc: isFr ? 'Intervention terminée. Merci !' : 'Service completed. Thank you!' },
      cancelled:   { icon: '❌', color: '#FF4444', label: isFr ? 'Annulée' : 'Cancelled',                desc: isFr ? 'Cette intervention a été annulée.' : 'This booking has been cancelled.' },
    }
    return map[status] || map['pending']
  }

  const statusInfo = booking ? getStatusInfo(booking.status) : null
  const currentStep = STATUS_STEPS.indexOf(booking?.status)

  const guestName = booking?.notes_admin?.match(/Nom:\s*([^|]+)/)?.[1]?.trim()

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: 'Outfit, sans-serif' }}>

      {/* Logo */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', marginBottom: '24px', display: 'inline-block' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
            Meca<span style={{ color: '#43BCC9' }}>LIK</span>
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
          {isFr ? 'Suivi de réservation' : 'Track my booking'}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {isFr ? 'Entrez votre référence pour suivre votre intervention' : 'Enter your reference to track your service'}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '440px', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <input
          value={ref}
          onChange={e => setRef(e.target.value.toUpperCase())}
          placeholder="MK-XXXXX"
          style={{ flex: 1, padding: '14px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '16px', fontFamily: 'Outfit, sans-serif', outline: 'none', letterSpacing: '0.05em' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '14px 24px', borderRadius: '10px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
          {loading ? '...' : (isFr ? 'Suivre' : 'Track')}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ width: '100%', maxWidth: '440px', padding: '14px 16px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', color: '#FF6B6B', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Booking card */}
      {booking && statusInfo && (
        <div style={{ width: '100%', maxWidth: '440px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>

          {/* Status header */}
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: `${statusInfo.color}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px' }}>{statusInfo.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  {booking.reference}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: statusInfo.color }}>
                  {statusInfo.label}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
              {statusInfo.desc}
            </p>
          </div>

          {/* Progress bar */}
          {booking.status !== 'cancelled' && (
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: i <= currentStep ? '#43BCC9' : 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: '2px', background: i < currentStep ? '#43BCC9' : 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                {(isFr ? ['Reçue', 'Confirmée', 'En route', 'En cours', 'Terminée'] : ['Received', 'Confirmed', 'On the way', 'In progress', 'Done']).map((label, i) => (
                  <span key={i} style={{ fontSize: '10px', color: i <= currentStep ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {guestName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Client' : 'Customer'}</span>
                <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{guestName}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Service</span>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{booking.service_name || (isFr ? 'À confirmer' : 'TBC')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Prix' : 'Price'}</span>
              <span style={{ fontSize: '13px', color: booking.status === 'pending' ? 'rgba(255,255,255,0.4)' : '#43BCC9', fontWeight: 600 }}>{getPrice(booking)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Adresse' : 'Address'}</span>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: 600, textAlign: 'right', maxWidth: '220px' }}>{booking.address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Date' : 'Date'}</span>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>
                {new Date(booking.created_at).toLocaleDateString(isFr ? 'fr-MA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {booking.technician_name && (
              <div style={{ marginTop: '4px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.15)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#43BCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', flexShrink: 0 }}>
                  {booking.technician_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{booking.technician_name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Technicien certifié' : 'Certified technician'}</div>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div style={{ padding: '0 24px 24px' }}>
            <a
              href={`https://wa.me/212777348065?text=${encodeURIComponent(isFr ? `Bonjour, infos sur ma réservation ${booking.reference}` : `Hello, info about my booking ${booking.reference}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', borderRadius: '10px', background: '#25D366', color: 'white', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
            >
              💬 {isFr ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp'}
            </a>
          </div>
        </div>
      )}

      {/* Completed recap + rating */}
      {booking?.status === 'completed' && (
        <div style={{ width: '100%', maxWidth: '440px', marginTop: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>

          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
              🎉 {isFr ? 'Intervention terminée' : 'Service completed'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {isFr ? 'Merci de votre confiance !' : 'Thank you for choosing MecaLIK!'}
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Service</span>
              <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{booking.service_name}</span>
            </div>
            {booking.amount_ttc && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Montant payé' : 'Amount paid'}</span>
                <span style={{ fontSize: '13px', color: '#43BCC9', fontWeight: 700 }}>{booking.amount_ttc} MAD</span>
              </div>
            )}
            {booking.technician_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Technicien</span>
                <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{booking.technician_name}</span>
              </div>
            )}
          </div>

          {!booking.rating ? (
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                {isFr ? 'Évaluez votre expérience' : 'Rate your experience'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                {isFr ? 'Votre avis nous aide à améliorer notre service' : 'Your feedback helps us improve'}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    style={{
                      fontSize: '32px', background: 'none', border: 'none', cursor: 'pointer',
                      opacity: star <= selectedRating ? 1 : 0.3,
                      transition: 'opacity 0.15s, transform 0.15s',
                      transform: star <= selectedRating ? 'scale(1.1)' : 'scale(1)',
                      padding: '4px',
                    }}
                  >⭐</button>
                ))}
              </div>
              {selectedRating > 0 && (
                <textarea
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                  placeholder={isFr ? 'Un commentaire ? (optionnel)' : 'Any comments? (optional)'}
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', marginBottom: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
              )}
              {selectedRating > 0 && (
                <button
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  style={{ width: '100%', padding: '13px', borderRadius: '10px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  {submittingRating ? '...' : (isFr ? 'Envoyer mon avis' : 'Submit review')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{'⭐'.repeat(booking.rating)}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {isFr ? 'Merci pour votre avis !' : 'Thank you for your review!'}
              </div>
              {booking.rating_comment && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontStyle: 'italic' }}>
                  "{booking.rating_comment}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Account nudge */}
      {booking && (
        <p style={{ marginTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          {isFr ? 'Suivre toutes vos interventions ?' : 'Track all your services?'}{' '}
          <a href="/signup" style={{ color: '#43BCC9', textDecoration: 'none' }}>{isFr ? 'Créer un compte' : 'Create an account'}</a>
        </p>
      )}

      {/* Account creation popup for completed guest bookings */}
      {showAccountPopup && (
        <div
          onClick={() => setShowAccountPopup(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: '#141414', borderRadius: '20px 20px 0 0', padding: '32px 24px 40px', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />
            <div style={{ fontSize: '24px', marginBottom: '12px', textAlign: 'center' }}>🎉</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', textAlign: 'center', margin: '0 0 8px' }}>
              {isFr ? 'Merci pour votre confiance !' : 'Thank you for using MecaLIK!'}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
              {isFr
                ? 'Créez un compte gratuit pour suivre toutes vos interventions, accéder à votre historique et recevoir des offres exclusives.'
                : 'Create a free account to track all your services, access your history, and get exclusive offers.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {(isFr
                ? ['📋 Historique de toutes vos interventions', '🔔 Notifications de statut en temps réel', '💰 Offres et réductions exclusives']
                : ['📋 Full history of all your services', '🔔 Real-time status notifications', '💰 Exclusive offers and discounts']
              ).map((benefit, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{benefit}</div>
              ))}
            </div>
            <a
              href="/signup"
              style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', background: '#43BCC9', color: '#0A0A0A', fontSize: '15px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' }}
            >
              {isFr ? 'Créer mon compte gratuit' : 'Create my free account'}
            </a>
            <button
              onClick={() => setShowAccountPopup(false)}
              style={{ display: 'block', width: '100%', marginTop: '12px', padding: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
            >
              {isFr ? 'Plus tard' : 'Maybe later'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
