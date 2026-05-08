import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Car, MapPin, Calendar, MessageSquare, Clock, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import RatingModal from '../../components/ui/RatingModal'

type Booking = {
  id: string
  service_name: string
  address: string
  preferred_date: string | null
  notes_admin: string | null
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  rating: number | null
  rating_comment: string | null
  created_at: string
}

const STEPS = [
  { key: 'pending', label: 'Demande reçue', desc: 'Votre demande a été enregistrée' },
  { key: 'confirmed', label: 'Confirmé', desc: 'Un technicien est assigné' },
  { key: 'in_progress', label: 'En cours', desc: 'Le technicien est en route' },
  { key: 'completed', label: 'Terminé', desc: 'Service réalisé avec succès' },
]

const STATUS_ORDER = ['pending', 'confirmed', 'in_progress', 'completed']

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setBooking(data as Booking)
      }
      setLoading(false)
    }

    fetchBooking()

    const channel = supabase
      .channel('booking-' + id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
        (payload) => {
          setBooking((prev) => prev ? { ...prev, ...(payload.new as Booking) } : prev)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#43BCC9', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: '#080808' }}>
        <p className="text-lg font-semibold" style={{ color: '#ffffff' }}>Réservation introuvable</p>
        <Link to="/" className="text-sm font-medium" style={{ color: '#43BCC9' }}>← Retour au site</Link>
      </div>
    )
  }

  const currentStepIndex = STATUS_ORDER.indexOf(booking.status)

  const waMsg = encodeURIComponent(
    `Bonjour MecaLIK, je souhaite des informations sur ma réservation #${id?.slice(0, 8).toUpperCase()}`
  )
  const waUrl = `https://wa.me/212777348065?text=${waMsg}`

  const dateLabel = booking.preferred_date
    ? new Date(booking.preferred_date).toLocaleDateString('fr-FR', { dateStyle: 'medium' })
    : "Dès que possible"

  const SERVICE_LABELS: Record<string, string> = {
    lavage: 'Lavage Auto', vidange: 'Vidange & Filtres', batterie: 'Batterie',
    pneus: 'Pneus', diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
  }

  const detailRows = [
    { icon: <Car size={15} />, label: 'Service', value: SERVICE_LABELS[booking.service_name] ?? booking.service_name },
    { icon: <MapPin size={15} />, label: 'Lieu', value: booking.address },
    { icon: <Calendar size={15} />, label: 'Date', value: dateLabel },
    ...(booking.notes_admin ? [{ icon: <MessageSquare size={15} />, label: 'Note', value: booking.notes_admin }] : []),
  ]

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#080808' }}>
      <div className="max-w-lg mx-auto space-y-6">

        {/* Success header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <CheckCircle size={56} color="#00DD88" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading font-bold text-2xl" style={{ color: '#ffffff' }}>
            Demande envoyée !
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Référence : <span className="font-mono font-semibold" style={{ color: '#43BCC9' }}>
              #{id?.slice(0, 8).toUpperCase()}
            </span>
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Notre équipe vous contacte par WhatsApp sous 5 minutes.
          </p>
        </div>

        {/* Timeline */}
        <div
          className="rounded-2xl p-6 space-y-1"
          style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Suivi de votre demande
          </p>
          {STEPS.map((step, i) => {
            const done = i < currentStepIndex
            const current = i === currentStepIndex
            const upcoming = i > currentStepIndex

            return (
              <div key={step.key} className="flex gap-4 items-start">
                {/* Dot + connector */}
                <div className="flex flex-col items-center pt-0.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: done
                        ? '#00DD88'
                        : current
                        ? '#43BCC9'
                        : 'rgba(255,255,255,0.12)',
                      boxShadow: current ? '0 0 0 4px rgba(67,188,201,0.15)' : 'none',
                      animation: current ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                    }}
                  />
                  {i < STEPS.length - 1 && (
                    <div
                      className="w-px flex-1 mt-1"
                      style={{
                        minHeight: '28px',
                        background: done
                          ? 'rgba(0,221,136,0.3)'
                          : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="pb-5">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: done ? '#00DD88' : current ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {step.label}
                    {current && (
                      <span className="ml-2 text-xs font-normal" style={{ color: '#43BCC9' }}>
                        — En cours
                      </span>
                    )}
                  </p>
                  {!upcoming && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Booking details */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Détails de la réservation
          </p>
          <div className="space-y-3">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <span style={{ color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{row.icon}</span>
                <div className="flex-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                    {row.label}
                  </span>
                  <span className="text-sm text-right" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {row.value}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3">
              <span style={{ color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}><Clock size={15} /></span>
              <div className="flex-1 flex items-baseline justify-between gap-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                  Créé le
                </span>
                <span className="text-sm text-right" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {new Date(booking.created_at).toLocaleDateString('fr-MA', {
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-full text-sm"
            style={{ background: '#25D366', color: '#ffffff' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.85L0 24l6.335-1.502A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.168-1.47l-.37-.22-3.76.891.934-3.662-.241-.376A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            Contacter sur WhatsApp
          </a>

          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center py-3.5 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Voir mon espace client
          </Link>

          <p className="text-center">
            <Link to="/" className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              ← Retour au site
            </Link>
          </p>
        </div>

        {booking.status === 'completed' && !booking.rating && (
          <div
            className="p-5 rounded-2xl text-center"
            style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.15)' }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: '#F0C040' }}>
              Votre service est terminé. Comment s'est-il passé ?
            </p>
            <button
              onClick={() => setShowRating(true)}
              className="px-8 py-3 rounded-full text-sm font-bold transition-colors"
              style={{ background: '#F0C040', color: '#080808' }}
            >
              Laisser un avis
            </button>
          </div>
        )}

        {booking.rating && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(0,221,136,0.05)', border: '1px solid rgba(0,221,136,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: booking.rating }, (_, i) => (
                <Star key={i} size={16} style={{ color: '#F0C040' }} fill="#F0C040" />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {booking.rating_comment || 'Avis soumis'}
            </p>
          </div>
        )}

      </div>

      <RatingModal
        bookingId={booking.id}
        serviceName={booking.service_name}
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmitted={() => {
          setBooking(prev => prev ? { ...prev, rating: 1 } : prev)
          setShowRating(false)
        }}
      />
    </div>
  )
}
