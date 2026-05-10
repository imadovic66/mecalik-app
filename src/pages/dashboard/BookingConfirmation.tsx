import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star,
  Check, Clock, Wrench, Sparkles, AlertCircle, Calendar,
} from 'lucide-react'
import RatingModal from '../../components/ui/RatingModal'

type Booking = {
  id: string
  reference: string | null
  user_id: string | null
  service_name: string
  address: string
  address_notes: string | null
  status: string
  preferred_date: string | null
  amount_ttc: number | null
  technician_name: string | null
  technician_phone: string | null
  rating: number | null
  rating_comment: string | null
  notes_admin: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
}

const STATUS_STEPS_BASE = [
  { key: 'pending',     labelKey: 'booking.requestReceived',   icon: Check    },
  { key: 'confirmed',   labelKey: 'booking.requestConfirmed',  icon: Calendar },
  { key: 'in_progress', labelKey: 'booking.technicianEnRoute', icon: Wrench   },
  { key: 'completed',   labelKey: 'booking.serviceCompleted',  icon: Sparkles },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, in_progress: 2, completed: 3, cancelled: -1,
}

export default function BookingConfirmation() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { t }      = useTranslation()
  const STATUS_STEPS = STATUS_STEPS_BASE.map(s => ({ ...s, label: t(s.labelKey) }))
  const [booking, setBooking]     = useState<Booking | null>(null)
  const [loading, setLoading]     = useState(true)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchBooking()

    const channel = supabase
      .channel(`booking-confirm-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
      }, payload => {
        const record = (payload.new as any) || (payload.old as any)
        if (!record || record.id === id) {
          fetchBooking()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchBooking = async () => {
    if (!id) return
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*').eq('id', id).single()
    setBooking(data)
    setLoading(false)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{t('common.loading')}</div>
      </div>
    )
  }

  // ── Not found ──
  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '320px' }}>
          <AlertCircle size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '14px' }} />
          <div style={{ color: 'white', fontSize: '15px', marginBottom: '6px', fontWeight: 500 }}>
            {t('booking.notFound')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '20px' }}>
            {t('booking.notFoundSub')}
          </div>
          <button onClick={() => navigate('/')} style={{
            background: 'white', color: '#080808', border: 'none',
            padding: '10px 18px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  const currentStep = STATUS_INDEX[booking.status] ?? 0
  const isCancelled = booking.status === 'cancelled'
  const isCompleted = booking.status === 'completed'
  const refLabel    = booking.reference || booking.id.substring(0, 8).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#0A0A0A',
        minHeight: '100vh', position: 'relative',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '36px', height: '36px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
              {t('booking.title').toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500, fontFamily: 'monospace' }}>
              {refLabel}
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '24px 18px 48px' }}>

          {/* ── HERO STATUS CARD ── */}
          {isCancelled ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,68,68,0.06) 0%, rgba(255,68,68,0.02) 100%)',
              border: '1px solid rgba(255,68,68,0.2)', borderRadius: '20px',
              padding: '24px', marginBottom: '24px', textAlign: 'center',
            }}>
              <div style={{
                width: '56px', height: '56px', margin: '0 auto 14px', borderRadius: '50%',
                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={24} color="#FF4444" />
              </div>
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px',
                fontWeight: 600, color: 'white', marginBottom: '6px', letterSpacing: '-0.015em',
              }}>
                {t('booking.cancelledTitle')}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {t('booking.cancelledSub')}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #0E2528 0%, #0F1518 100%)',
              border: '1px solid rgba(67,188,201,0.25)', borderRadius: '20px',
              padding: '22px', marginBottom: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{
                position: 'absolute', top: '-80px', right: '-80px',
                width: '240px', height: '240px',
                background: 'radial-gradient(circle, rgba(67,188,201,0.15) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                {/* Status pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 11px', borderRadius: '7px',
                  background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.18)',
                  marginBottom: '14px',
                }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%', background: '#43BCC9',
                    animation: !isCompleted ? 'bcPulse 2s infinite' : 'none',
                    display: 'inline-block',
                  }} />
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: '#43BCC9',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {STATUS_STEPS[currentStep]?.label || t('status.in_progress')}
                  </span>
                </div>

                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px',
                  fontWeight: 600, color: 'white', marginBottom: '4px',
                  letterSpacing: '-0.015em', lineHeight: 1.15,
                }}>
                  {booking.service_name}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '6px',
                }}>
                  <MapPin size={12} />
                  <span>{booking.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PROGRESS TIMELINE ── */}
          {!isCancelled && (
            <div style={{ marginBottom: '24px' }}>
              <SectionLabel>{t('booking.confirmTitle')}</SectionLabel>
              <div style={{
                background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '18px 18px 8px',
              }}>
                {STATUS_STEPS.map((step, i) => {
                  const Icon      = step.icon
                  const isPast    = i < currentStep
                  const isCurrent = i === currentStep
                  const isFuture  = i > currentStep
                  const isLast    = i === STATUS_STEPS.length - 1

                  return (
                    <div key={step.key} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      marginBottom: isLast ? 0 : '4px', position: 'relative',
                    }}>
                      {/* Connector */}
                      {!isLast && (
                        <div style={{
                          position: 'absolute', left: '15px', top: '32px',
                          width: '2px', height: 'calc(100% - 18px)',
                          background: isPast ? '#43BCC9' : 'rgba(255,255,255,0.06)',
                          borderRadius: '1px',
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: isPast || isCurrent ? '#43BCC9' : 'rgba(255,255,255,0.04)',
                        border: isCurrent ? '2px solid rgba(67,188,201,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(67,188,201,0.15)' : 'none',
                        animation: isCurrent ? 'bcPulse 2s infinite' : 'none',
                      }}>
                        {isPast
                          ? <Check size={14} color="#080808" />
                          : <Icon size={13} color={isCurrent ? '#080808' : 'rgba(255,255,255,0.35)'} />
                        }
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, paddingTop: '4px', paddingBottom: isLast ? 0 : '20px' }}>
                        <div style={{
                          fontSize: '14px', fontWeight: isCurrent ? 600 : 500,
                          color: isFuture ? 'rgba(255,255,255,0.35)' : 'white',
                          marginBottom: '2px',
                        }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                          {step.key === 'pending' && booking.created_at &&
                            new Date(booking.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {step.key === 'confirmed' && (
                            booking.confirmed_at
                              ? new Date(booking.confirmed_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : isFuture ? t('booking.waiting') : ''
                          )}
                          {step.key === 'in_progress' && (isCurrent ? t('booking.arriving') : isPast ? t('booking.done') : t('booking.waiting'))}
                          {step.key === 'completed' && booking.completed_at &&
                            new Date(booking.completed_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {step.key === 'completed' && !booking.completed_at && isFuture && t('booking.waiting')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── TECHNICIAN CARD ── */}
          {booking.technician_name && !isCancelled && (
            <div style={{ marginBottom: '24px' }}>
              <SectionLabel>{t('booking.yourTechnician')}</SectionLabel>
              <div style={{
                background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '16px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #43BCC9 0%, #2A8B95 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: 700, color: 'white',
                }}>
                  {booking.technician_name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>
                    {booking.technician_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                    {t('booking.certifiedTech')} · 4.9
                  </div>
                </div>
                {/* Actions */}
                {booking.technician_phone && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a href={`tel:${booking.technician_phone}`} style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textDecoration: 'none',
                    }}>
                      <Phone size={15} color="rgba(255,255,255,0.7)" />
                    </a>
                    <a
                      href={`https://wa.me/${booking.technician_phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: '#00DD88',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <MessageCircle size={15} color="#0A0A0A" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DETAILS CARD ── */}
          <div style={{ marginBottom: '24px' }}>
            <SectionLabel>{t('booking.bookingDetails')}</SectionLabel>
            <div style={{
              background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <DetailRow label={t('booking.reference')}   value={refLabel} mono />
              <DetailRow label={t('booking.service')}     value={booking.service_name} />
              <DetailRow label={t('booking.address')}     value={booking.address} />
              {booking.address_notes && <DetailRow label={t('booking.addressNotes')} value={booking.address_notes} />}
              <DetailRow
                label={t('booking.requestedOn')}
                value={new Date(booking.created_at).toLocaleString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              />
              {booking.amount_ttc != null && (
                <DetailRow label={t('common.amount')} value={`${booking.amount_ttc} MAD`} highlight />
              )}
            </div>
          </div>

          {/* ── RATING DISPLAY (already rated) ── */}
          {isCompleted && booking.rating && (
            <div style={{ marginBottom: '24px' }}>
              <SectionLabel>{t('booking.rateService')}</SectionLabel>
              <div style={{
                background: '#0F0F0F', border: '1px solid rgba(240,192,64,0.15)',
                borderRadius: '16px', padding: '16px',
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: booking.rating_comment ? '10px' : 0 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star
                      key={n} size={18}
                      fill={n <= booking.rating! ? '#F0C040' : 'transparent'}
                      color={n <= booking.rating! ? '#F0C040' : 'rgba(255,255,255,0.2)'}
                    />
                  ))}
                </div>
                {booking.rating_comment && (
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    "{booking.rating_comment}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RATE CTA (completed, not yet rated) ── */}
          {isCompleted && !booking.rating && (
            <button
              onClick={() => setShowRating(true)}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, rgba(240,192,64,0.1) 0%, rgba(240,192,64,0.05) 100%)',
                border: '1px solid rgba(240,192,64,0.25)', borderRadius: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Star size={18} color="#F0C040" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>
                    Évaluez votre intervention
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                    Aidez-nous à améliorer le service
                  </div>
                </div>
              </div>
              <Clock size={15} color="rgba(255,255,255,0.4)" style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}

          {/* ── SUPPORT LINK ── */}
          <a
            href="https://wa.me/212777348065"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px',
              background: 'rgba(0,221,136,0.06)', border: '1px solid rgba(0,221,136,0.18)',
              borderRadius: '14px', color: '#00DD88',
              fontSize: '13px', fontWeight: 500, textDecoration: 'none',
            }}
          >
            <MessageCircle size={15} />
            Contacter le support sur WhatsApp
          </a>
        </div>

        <style>{`
          @keyframes bcPulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.45; }
          }
        `}</style>
      </div>

      <RatingModal
        bookingId={booking.id}
        serviceName={booking.service_name}
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmitted={() => {
          fetchBooking()
          setShowRating(false)
        }}
      />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '12px',
    }}>
      {children}
    </div>
  )
}

function DetailRow({ label, value, mono, highlight }: {
  label: string; value: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: '14px',
    }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px',
        color: highlight ? '#43BCC9' : 'white',
        fontFamily: mono ? 'monospace' : 'inherit',
        fontWeight: highlight || mono ? 600 : 400,
        textAlign: 'right', wordBreak: 'break-word',
      }}>
        {value}
      </div>
    </div>
  )
}
