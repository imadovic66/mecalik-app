import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, type Car } from '../../lib/supabase'
import {
  MapPin, Car as CarIcon, Plus,
  Phone, Wrench, Droplet, Battery, Disc, Search, AlertTriangle,
  Sparkles, ArrowRight, ChevronRight,
} from 'lucide-react'
import AddCarModal from '../../components/ui/AddCarModal'

type Booking = {
  id: string
  reference: string | null
  service_name: string
  address: string
  status: string
  preferred_date: string | null
  amount_ttc: number | null
  technician_name: string | null
  technician_phone: string | null
  rating: number | null
  created_at: string
  completed_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: 'En attente', color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.04)', dot: 'rgba(255,255,255,0.4)'  },
  confirmed:   { label: 'Confirmée',  color: '#F0C040',               bg: 'rgba(240,192,64,0.06)',  dot: '#F0C040'                  },
  in_progress: { label: 'En cours',   color: '#43BCC9',               bg: 'rgba(67,188,201,0.06)',  dot: '#43BCC9'                  },
  completed:   { label: 'Terminée',   color: '#00DD88',               bg: 'rgba(0,221,136,0.06)',   dot: '#00DD88'                  },
  cancelled:   { label: 'Annulée',    color: '#FF4444',               bg: 'rgba(255,68,68,0.06)',   dot: '#FF4444'                  },
}

const SERVICE_LABELS: Record<string, string> = {
  lavage:     'Lavage Auto',
  vidange:    'Vidange & Filtres',
  batterie:   'Batterie',
  pneus:      'Pneus',
  diagnostic: 'Diagnostic',
  urgence:    'Urgence 24/7',
}

const QUICK_SERVICES = [
  { id: 'vidange',    label: 'Vidange',     Icon: Droplet,       price: 250, duration: '~60 min', urgent: false },
  { id: 'batterie',   label: 'Batterie',    Icon: Battery,       price: 210, duration: '~30 min', urgent: false },
  { id: 'diagnostic', label: 'Diagnostic',  Icon: Search,        price: 220, duration: '~30 min', urgent: false },
  { id: 'pneus',      label: 'Pneus',       Icon: Disc,          price: 200, duration: '~45 min', urgent: false },
  { id: 'lavage',     label: 'Lavage',      Icon: Sparkles,      price: 150, duration: '~45 min', urgent: false },
  { id: 'urgence',    label: 'Urgence 24/7',Icon: AlertTriangle, price: 239, duration: 'ASAP',    urgent: true  },
]

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName?.trim()) {
    const first = fullName.trim().split(/\s+/)[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  if (email) return email.split('@')[0]
  return ''
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings]   = useState<Booking[]>([])
  const [cars, setCars]           = useState<Car[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAddCar, setShowAddCar] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    const [bookingsRes, carsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('cars')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setBookings(bookingsRes.data ?? [])
    setCars(carsRes.data ?? [])
    setLoading(false)
  }

  const openBookingWithService = (serviceId: string) => {
    window.dispatchEvent(new CustomEvent('openBooking', { detail: { service: serviceId } }))
  }

  const activeBooking    = bookings.find(b => ['pending', 'confirmed', 'in_progress'].includes(b.status))
  const recentCompleted  = bookings.filter(b => b.status === 'completed').slice(0, 3)
  const firstName        = getFirstName(profile?.full_name, user?.email)
  const todayLabel       = new Date().toLocaleDateString('fr-FR', { weekday: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '64px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ── TOP BAR ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'capitalize' }}>
              {todayLabel}
            </div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '22px', fontWeight: 600, color: 'white', letterSpacing: '-0.015em',
            }}>
              {firstName ? `Salut ${firstName}` : 'Bonjour'}
            </div>
          </div>
          <button
            onClick={() => openBookingWithService('urgence')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)', fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Wrench size={12} color="rgba(255,255,255,0.5)" />
            Réserver
          </button>
        </div>

        {/* ── ACTIVE SERVICE BANNER ───────────────────────────────────── */}
        {activeBooking && (() => {
          const st = STATUS_CONFIG[activeBooking.status] ?? STATUS_CONFIG.pending
          return (
            <div
              onClick={() => navigate(`/booking/${activeBooking.id}`)}
              style={{
                background: 'linear-gradient(135deg, #0E1F22 0%, #0F1518 100%)',
                border: '1px solid rgba(67,188,201,0.25)',
                borderRadius: '20px', padding: '20px',
                marginBottom: '32px', cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* ambient glow */}
              <div style={{
                position: 'absolute', top: '-60px', right: '-60px',
                width: '220px', height: '220px',
                background: 'radial-gradient(circle, rgba(67,188,201,0.1) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative' }}>
                {/* status pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', borderRadius: '6px',
                  background: st.bg, marginBottom: '12px',
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: st.dot,
                    display: 'inline-block',
                    animation: activeBooking.status === 'in_progress' ? 'mecaPulse 2s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: st.color, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {st.label}
                  </span>
                </div>

                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '20px', fontWeight: 600, color: 'white',
                  letterSpacing: '-0.01em', marginBottom: '8px',
                }}>
                  {SERVICE_LABELS[activeBooking.service_name] ?? activeBooking.service_name}
                </div>

                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '14px',
                  fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                  marginBottom: activeBooking.technician_name ? '16px' : '4px',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} />
                    {activeBooking.address}
                  </span>
                  {activeBooking.reference && (
                    <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>
                      {activeBooking.reference}
                    </span>
                  )}
                </div>

                {/* Technician row */}
                {activeBooking.technician_name && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'rgba(67,188,201,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, color: '#43BCC9',
                      border: '1px solid rgba(67,188,201,0.25)', flexShrink: 0,
                    }}>
                      {activeBooking.technician_name.split(' ').slice(0, 2).map(s => s[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                        {activeBooking.technician_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        Technicien certifié
                      </div>
                    </div>
                    {activeBooking.technician_phone && (
                      <a
                        href={`tel:${activeBooking.technician_phone}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#00DD88', color: '#080808',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none', flexShrink: 0,
                        }}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  marginTop: '12px', gap: '4px',
                  fontSize: '12px', color: 'rgba(67,188,201,0.7)',
                }}>
                  Voir le détail <ChevronRight size={13} />
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── MY GARAGE ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
            }}>
              Mon garage
            </h2>
            {cars.length > 0 && (
              <button
                onClick={() => setShowAddCar(true)}
                style={{
                  background: 'transparent', border: 'none', color: '#43BCC9',
                  fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
                }}
              >
                <Plus size={13} /> Ajouter
              </button>
            )}
          </div>

          {cars.length === 0 ? (
            /* Empty garage CTA */
            <button
              onClick={() => setShowAddCar(true)}
              style={{
                width: '100%', padding: '22px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CarIcon size={20} color="#43BCC9" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>
                  Ajoutez votre première voiture
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  Pour des réservations en un seul tap
                </div>
              </div>
              <Plus size={18} color="rgba(255,255,255,0.3)" />
            </button>
          ) : (
            /* Horizontal carousel */
            <div style={{
              display: 'flex', gap: '12px',
              overflowX: 'auto', paddingBottom: '6px',
              scrollSnapType: 'x mandatory',
              msOverflowStyle: 'none', scrollbarWidth: 'none',
            }}>
              {cars.map(car => (
                <div key={car.id} style={{
                  minWidth: '240px', flexShrink: 0, scrollSnapAlign: 'start',
                  background: 'linear-gradient(145deg, #111111 0%, #0D0D0D 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '18px', cursor: 'default',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '14px',
                  }}>
                    <CarIcon size={18} color="rgba(255,255,255,0.55)" />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                    {car.brand} {car.model}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                    {car.year ?? '—'}{car.fuel_type ? ` · ${car.fuel_type}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {car.license_plate && (
                      <span style={{
                        padding: '4px 9px', borderRadius: '5px',
                        background: 'rgba(255,255,255,0.06)',
                        fontSize: '11px', fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em',
                      }}>
                        {car.license_plate}
                      </span>
                    )}
                    {car.mileage != null && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        {car.mileage.toLocaleString('fr-FR')} km
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Add another car tile */}
              <button
                onClick={() => setShowAddCar(true)}
                style={{
                  minWidth: '90px', flexShrink: 0, scrollSnapAlign: 'start',
                  background: 'transparent',
                  border: '1px dashed rgba(255,255,255,0.09)',
                  borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={20} color="rgba(255,255,255,0.3)" />
              </button>
            </div>
          )}
        </section>

        {/* ── QUICK SERVICES — 3×2 grid ─────────────────────────────── */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '17px', fontWeight: 600, color: 'white',
            letterSpacing: '-0.01em', marginBottom: '16px',
          }}>
            Que voulez-vous faire ?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {QUICK_SERVICES.map(({ id, label, Icon, price, urgent }) => (
              <button
                key={id}
                onClick={() => openBookingWithService(id)}
                style={{
                  background: urgent
                    ? 'linear-gradient(135deg, rgba(255,68,68,0.06) 0%, rgba(255,68,68,0.02) 100%)'
                    : '#0D0D0D',
                  border: urgent
                    ? '1px solid rgba(255,68,68,0.18)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px', padding: '16px 12px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = urgent
                    ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.18)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = urgent
                    ? 'rgba(255,68,68,0.18)' : 'rgba(255,255,255,0.06)'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: urgent ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                  border: urgent ? '1px solid rgba(255,68,68,0.15)' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px',
                }}>
                  <Icon size={16} color={urgent ? '#FF4444' : 'rgba(255,255,255,0.65)'} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'white', marginBottom: '3px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '11px', color: urgent ? '#FF4444' : 'rgba(255,255,255,0.35)' }}>
                  Dès {price} MAD
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── BOOK AGAIN ─────────────────────────────────────────────── */}
        {recentCompleted.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 600, color: 'white',
              letterSpacing: '-0.01em', marginBottom: '16px',
            }}>
              Réserver à nouveau
            </h2>
            <div style={{
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', overflow: 'hidden',
            }}>
              {recentCompleted.map((b, i) => (
                <div
                  key={b.id}
                  onClick={() => openBookingWithService(b.service_name)}
                  style={{
                    padding: '14px 18px', cursor: 'pointer',
                    display: 'grid', gridTemplateColumns: '1fr auto',
                    gap: '12px', alignItems: 'center',
                    borderBottom: i < recentCompleted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: '#0B0B0B', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0F0F0F')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0B0B0B')}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'white', marginBottom: '3px' }}>
                      {SERVICE_LABELS[b.service_name] ?? b.service_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(b.completed_at ?? b.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    color: '#43BCC9', fontSize: '12px', fontWeight: 600,
                  }}>
                    Réserver <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── WELCOME — first-time empty state ──────────────────────── */}
        {!loading && bookings.length === 0 && cars.length === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #0E0E0E 0%, #131313 100%)',
            border: '1px solid rgba(67,188,201,0.15)',
            borderRadius: '20px', padding: '32px 28px',
            textAlign: 'center', marginBottom: '40px',
          }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
              color: '#43BCC9', textTransform: 'uppercase', marginBottom: '12px',
            }}>
              Bienvenue
            </div>
            <h3 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '21px', fontWeight: 600, color: 'white',
              letterSpacing: '-0.015em', marginBottom: '8px',
            }}>
              Votre garage mobile vous attend
            </h3>
            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.45)',
              maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6,
            }}>
              Mécanicien certifié, devis transparent, paiement après service.
              Choisissez un service ci-dessus pour commencer.
            </p>
          </div>
        )}

      </div>

      {/* Pulse keyframe for active status dot */}
      <style>{`
        @keyframes mecaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      <AddCarModal
        isOpen={showAddCar}
        onClose={() => setShowAddCar(false)}
        onSuccess={fetchAll}
      />
    </div>
  )
}
