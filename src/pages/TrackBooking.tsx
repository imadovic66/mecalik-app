import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, MessageCircle, CheckCircle, Clock, Wrench, Truck, Star, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_STEPS = ['pending', 'confirmed', 'en_route', 'in_progress', 'done']

const STATUS_INFO: Record<string, { label: string; labelFr: string; icon: React.ReactNode; color: string }> = {
  pending:     { label: 'Pending',       labelFr: 'En attente',       icon: <Clock size={16} />,       color: '#F59E0B' },
  confirmed:   { label: 'Confirmed',     labelFr: 'Confirmé',         icon: <CheckCircle size={16} />, color: '#43BCC9' },
  en_route:    { label: 'On the way',    labelFr: 'En route',         icon: <Truck size={16} />,       color: '#8B5CF6' },
  in_progress: { label: 'In progress',   labelFr: 'En cours',         icon: <Wrench size={16} />,      color: '#F97316' },
  done:        { label: 'Completed',     labelFr: 'Terminé',          icon: <Star size={16} />,        color: '#10B981' },
  cancelled:   { label: 'Cancelled',     labelFr: 'Annulé',           icon: <Clock size={16} />,       color: '#EF4444' },
}

type BookingData = {
  id: string
  reference: string
  service_name: string
  address: string
  address_notes: string | null
  status: string
  notes_admin: string | null
  created_at: string
  scheduled_at: string | null
  mechanic_id: string | null
}

function parseGuestName(notes_admin: string | null): string | null {
  if (!notes_admin) return null
  const m = notes_admin.match(/Nom:\s*([^|]+)/)
  return m ? m[1].trim() : null
}

export default function TrackBooking() {
  const { reference: urlRef } = useParams<{ reference?: string }>()
  const { i18n } = useTranslation()
  const isFr = i18n.language === 'fr'

  const [inputRef, setInputRef] = useState(urlRef ?? '')
  const [loading, setLoading]   = useState(false)
  const [booking, setBooking]   = useState<BookingData | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const lookup = async (ref: string) => {
    const clean = ref.trim().toUpperCase()
    if (!clean) return
    setLoading(true)
    setError(null)
    setSearched(true)

    const { data, error: dbErr } = await supabase
      .from('bookings')
      .select('id, reference, service_name, address, address_notes, status, notes_admin, created_at, scheduled_at, mechanic_id')
      .eq('reference', clean)
      .maybeSingle()

    setLoading(false)
    if (dbErr) {
      console.error('TrackBooking error:', dbErr)
      setError(isFr ? 'Erreur lors de la recherche.' : 'Lookup error.')
      return
    }
    if (!data)  { setError(isFr ? 'Aucune réservation trouvée pour cette référence.' : 'No booking found for this reference.'); return }
    setBooking(data as unknown as BookingData)
  }

  // Auto-lookup when reference comes from URL
  useEffect(() => {
    if (urlRef) lookup(urlRef)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlRef])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookup(inputRef)
  }

  const waMessage = booking
    ? encodeURIComponent(`Bonjour MecaLIK,\n\nJe souhaite des nouvelles de ma réservation.\nRéférence: ${booking.reference}\n\nMerci !`)
    : ''

  const stepIndex = booking ? STATUS_STEPS.indexOf(booking.status) : -1
  const isCancelled = booking?.status === 'cancelled'

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingBottom: '60px' }}>

      {/* Top gradient */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(67,188,201,0.06) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px 0', position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/">
            <img src="/logo.jpg" alt="MecaLIK"
              style={{ height: '40px', width: '128px', objectFit: 'cover',
                       objectPosition: 'center', borderRadius: '8px', margin: '0 auto' }} />
          </Link>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '24px', fontWeight: 700,
            color: '#ffffff', marginTop: '20px', marginBottom: '6px',
          }}>
            {isFr ? 'Suivre ma réservation' : 'Track my booking'}
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {isFr
              ? 'Entrez votre référence reçue par WhatsApp'
              : 'Enter the reference you received via WhatsApp'}
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex', gap: '8px',
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '6px 6px 6px 16px',
            alignItems: 'center',
          }}>
            <Search size={16} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={inputRef}
              onChange={e => setInputRef(e.target.value.toUpperCase())}
              placeholder="MK-XXXXX"
              style={{
                flex: 1,
                background: 'transparent', border: 'none',
                color: '#ffffff', fontSize: '15px',
                fontFamily: 'Space Grotesk, monospace',
                letterSpacing: '0.06em',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputRef.trim() || loading}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: inputRef.trim() ? '#43BCC9' : 'rgba(255,255,255,0.06)',
                color: inputRef.trim() ? '#080808' : 'rgba(255,255,255,0.3)',
                fontSize: '13px', fontWeight: 700,
                cursor: inputRef.trim() ? 'pointer' : 'not-allowed',
                flexShrink: 0, fontFamily: 'inherit',
              }}
            >
              {loading ? '...' : (isFr ? 'Chercher' : 'Search')}
            </button>
          </div>
        </form>

        {/* Error state */}
        {error && (
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'rgba(255,68,68,0.06)',
            border: '1px solid rgba(255,68,68,0.18)',
            color: '#FF6B6B', fontSize: '14px', textAlign: 'center',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Booking card */}
        {booking && (
          <div style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}>
            {/* Status header */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: isCancelled
                ? 'rgba(239,68,68,0.04)'
                : 'rgba(67,188,201,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: STATUS_INFO[booking.status]?.color ?? '#ffffff' }}>
                    {STATUS_INFO[booking.status]?.icon}
                  </span>
                  <span style={{
                    fontSize: '15px', fontWeight: 700,
                    color: STATUS_INFO[booking.status]?.color ?? '#ffffff',
                  }}>
                    {isFr
                      ? STATUS_INFO[booking.status]?.labelFr ?? booking.status
                      : STATUS_INFO[booking.status]?.label ?? booking.status}
                  </span>
                </div>
                <span style={{
                  fontSize: '12px', fontFamily: 'Space Grotesk, monospace',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.04em',
                }}>
                  {booking.reference}
                </span>
              </div>

              {/* Progress bar — only show for non-cancelled */}
              {!isCancelled && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {STATUS_STEPS.map((s, i) => (
                    <div
                      key={s}
                      style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i <= stepIndex
                          ? (STATUS_INFO[booking.status]?.color ?? '#43BCC9')
                          : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Service */}
              <Row
                label={isFr ? 'Service' : 'Service'}
                value={booking.service_name}
              />

              {/* Address */}
              <Row
                label={isFr ? 'Adresse' : 'Address'}
                value={booking.address + (booking.address_notes ? ` — ${booking.address_notes}` : '')}
              />

              {/* Scheduled */}
              {booking.scheduled_at && (
                <Row
                  label={isFr ? 'Rendez-vous' : 'Scheduled'}
                  value={new Date(booking.scheduled_at).toLocaleString(isFr ? 'fr-MA' : 'en-US', {
                    weekday: 'long', day: 'numeric', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                  })}
                />
              )}

              {/* Date created */}
              <Row
                label={isFr ? 'Réservé le' : 'Booked on'}
                value={new Date(booking.created_at).toLocaleDateString(isFr ? 'fr-MA' : 'en-US', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              />

              {/* Guest name if any */}
              {!booking.profiles?.full_name && parseGuestName(booking.notes_admin) && (
                <Row
                  label={isFr ? 'Nom' : 'Name'}
                  value={parseGuestName(booking.notes_admin)!}
                />
              )}

            </div>

            {/* WhatsApp CTA */}
            <div style={{ padding: '0 20px 20px' }}>
              <a
                href={`https://wa.me/212777348065?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '13px',
                  borderRadius: '12px',
                  background: 'rgba(37,211,102,0.1)',
                  border: '1px solid rgba(37,211,102,0.25)',
                  color: '#25D366',
                  fontSize: '14px', fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <MessageCircle size={16} />
                {isFr ? 'Contacter MecaLIK via WhatsApp' : 'Contact MecaLIK on WhatsApp'}
              </a>
            </div>
          </div>
        )}

        {/* Create account nudge — shown after a successful lookup */}
        {booking && (
          <div style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(67,188,201,0.1)',
              border: '1px solid rgba(67,188,201,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <UserPlus size={16} color="#43BCC9" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>
                {isFr ? 'Créez un compte gratuit' : 'Create a free account'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {isFr
                  ? 'Historique, rappels et suivi automatique'
                  : 'History, reminders and auto-tracking'}
              </div>
            </div>
            <Link
              to="/signup"
              style={{
                padding: '8px 14px', borderRadius: '10px',
                background: '#43BCC9', color: '#080808',
                fontSize: '12px', fontWeight: 700,
                textDecoration: 'none', flexShrink: 0,
              }}
            >
              {isFr ? "S'inscrire" : 'Sign up'}
            </Link>
          </div>
        )}

        {/* Empty state — before any search */}
        {!searched && !booking && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              {isFr
                ? 'La référence se trouve dans votre message WhatsApp de confirmation.'
                : 'Your reference is in the WhatsApp confirmation message you received.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 600,
        color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{value}</div>
    </div>
  )
}
