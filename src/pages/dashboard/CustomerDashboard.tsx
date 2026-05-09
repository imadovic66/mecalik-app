import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase, type Car } from '../../lib/supabase'
import {
  ChevronRight, MapPin, Plus, Phone, Bell,
  Droplet, Battery, Disc, Search, AlertTriangle, Sparkles,
  Home, Clock as ClockIcon, Car as CarIcon, User, Wrench, ArrowRight, ChevronDown,
} from 'lucide-react'
import AddCarModal from '../../components/ui/AddCarModal'

type Booking = {
  id: string
  reference: string | null
  service_name: string
  address: string
  status: string
  amount_ttc: number | null
  technician_name: string | null
  technician_phone: string | null
  created_at: string
  completed_at: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; eta: string }> = {
  pending:     { label: 'En attente', color: '#F0C040', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040', eta: 'Confirmation en cours'  },
  confirmed:   { label: 'Confirmée',  color: '#43BCC9', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9', eta: 'Technicien assigné'      },
  in_progress: { label: 'En route',   color: '#43BCC9', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9', eta: 'Arrive sous 30 min'      },
  completed:   { label: 'Terminée',   color: '#00DD88', bg: 'rgba(0,221,136,0.08)',   dot: '#00DD88', eta: ''                        },
  cancelled:   { label: 'Annulée',    color: '#FF4444', bg: 'rgba(255,68,68,0.08)',   dot: '#FF4444', eta: ''                        },
}

const QUICK_SERVICES: {
  id: string; label: string; icon: React.ElementType
  price: number; gradient: string; dot: string; urgent?: boolean
}[] = [
  { id: 'vidange',    label: 'Vidange',     icon: Droplet,       price: 250, gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', dot: '#3B82F6' },
  { id: 'batterie',   label: 'Batterie',    icon: Battery,       price: 210, gradient: 'linear-gradient(135deg, #14532D 0%, #166534 100%)', dot: '#22C55E' },
  { id: 'diagnostic', label: 'Diagnostic',  icon: Search,        price: 220, gradient: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)', dot: '#06B6D4' },
  { id: 'pneus',      label: 'Pneus',       icon: Disc,          price: 200, gradient: 'linear-gradient(135deg, #422006 0%, #57340a 100%)', dot: '#D97706' },
  { id: 'lavage',     label: 'Lavage',      icon: Sparkles,      price: 150, gradient: 'linear-gradient(135deg, #312E81 0%, #3730A3 100%)', dot: '#818CF8' },
  { id: 'urgence',    label: 'Urgence',     icon: AlertTriangle, price: 239, gradient: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)', dot: '#FF4444', urgent: true },
]

const SERVICE_LABELS: Record<string, string> = {
  lavage: 'Lavage Auto', vidange: 'Vidange & Filtres',
  batterie: 'Batterie',  pneus: 'Pneus',
  diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
}

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName?.trim()) {
    const first = fullName.trim().split(/\s+/)[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  return email?.split('@')[0] ?? ''
}

export default function CustomerDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings]     = useState<Booking[]>([])
  const [cars, setCars]             = useState<Car[]>([])
  const [loading, setLoading]       = useState(true)
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
      supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setBookings(bookingsRes.data ?? [])
    setCars(carsRes.data ?? [])
    setLoading(false)
  }

  const activeBooking   = bookings.find(b => ['pending', 'confirmed', 'in_progress'].includes(b.status))
  const recentCompleted = bookings.filter(b => b.status === 'completed').slice(0, 3)
  const firstName       = getFirstName(profile?.full_name, user?.email)

  const openBookingWithService = (serviceId: string) =>
    window.dispatchEvent(new CustomEvent('openBooking', { detail: { service: serviceId } }))

  // silence unused import warning — Wrench is used in Book Again section
  void Wrench

  return (
    <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', justifyContent: 'center' }}>

      {/* ── Mobile shell — caps at 480 px ── */}
      <div style={{
        width: '100%', maxWidth: '480px',
        background: '#0A0A0A', minHeight: '100vh',
        position: 'relative', paddingBottom: '90px',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ STICKY TOP BAR ════════════════════════════════════════ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
          }}>
            <MapPin size={13} color="#43BCC9" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Adresse
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Casablanca
                <ChevronDown size={11} color="rgba(255,255,255,0.4)" />
              </div>
            </div>
          </button>

          <button style={{
            width: '40px', height: '40px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}>
            <Bell size={16} color="rgba(255,255,255,0.7)" />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: '7px', height: '7px',
              background: '#FF4444', borderRadius: '50%',
              border: '2px solid #0A0A0A',
            }} />
          </button>
        </div>

        {/* ═══ SCROLLABLE CONTENT ════════════════════════════════════ */}
        <div style={{ padding: '20px 18px 0' }}>

          {/* Greeting */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
            </div>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '26px', fontWeight: 600, color: 'white',
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>
              {firstName ? `Salut ${firstName}` : 'Bonjour'}
            </h1>
          </div>

          {/* ── ACTIVE SERVICE HERO CARD ─────────────────────────── */}
          {activeBooking && (() => {
            const st = STATUS_CONFIG[activeBooking.status] ?? STATUS_CONFIG.pending
            return (
              <div
                onClick={() => navigate(`/booking/${activeBooking.id}`)}
                style={{
                  background: 'linear-gradient(135deg, #0E2528 0%, #0F1518 100%)',
                  border: '1px solid rgba(67,188,201,0.3)',
                  borderRadius: '20px', padding: '20px',
                  marginBottom: '24px', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden',
                }}
              >
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
                    background: st.bg, marginBottom: '14px',
                  }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: st.dot, display: 'inline-block',
                      animation: activeBooking.status === 'in_progress' ? 'mecaPulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: st.color,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '22px', fontWeight: 600, color: 'white',
                    marginBottom: '4px', letterSpacing: '-0.015em',
                  }}>
                    {SERVICE_LABELS[activeBooking.service_name] ?? activeBooking.service_name}
                  </div>

                  {st.eta && (
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', marginBottom: '14px' }}>
                      {st.eta}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}>
                    <MapPin size={12} color="rgba(255,255,255,0.35)" />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      {activeBooking.address}
                    </span>
                  </div>

                  {/* Technician */}
                  {activeBooking.technician_name && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', borderRadius: '14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #43BCC9 0%, #2A8B95 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: 'white',
                      }}>
                        {activeBooking.technician_name.split(' ').slice(0, 2).map(s => s[0]).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                          {activeBooking.technician_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          4.9 · Technicien certifié
                        </div>
                      </div>
                      {activeBooking.technician_phone && (
                        <a
                          href={`tel:${activeBooking.technician_phone}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            background: '#00DD88', color: '#000000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={15} />
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    marginTop: '12px', gap: '4px',
                    fontSize: '12px', color: 'rgba(67,188,201,0.6)',
                  }}>
                    Voir le détail <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── MY GARAGE ─────────────────────────────────────────── */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '14px',
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
                }}>
                  Mon garage
                </h2>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                  {cars.length > 0 ? `${cars.length} véhicule${cars.length > 1 ? 's' : ''} enregistré${cars.length > 1 ? 's' : ''}` : 'Ajoutez votre voiture'}
                </div>
              </div>
              {cars.length > 0 && (
                <button
                  onClick={() => setShowAddCar(true)}
                  style={{
                    background: 'rgba(67,188,201,0.08)',
                    border: '1px solid rgba(67,188,201,0.15)',
                    color: '#43BCC9', padding: '5px 10px',
                    borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <Plus size={11} /> Ajouter
                </button>
              )}
            </div>

            {cars.length === 0 ? (
              <button
                onClick={() => setShowAddCar(true)}
                style={{
                  width: '100%', padding: '20px',
                  background: 'linear-gradient(135deg, rgba(67,188,201,0.05) 0%, rgba(67,188,201,0.02) 100%)',
                  border: '1.5px dashed rgba(67,188,201,0.3)',
                  borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: 'rgba(67,188,201,0.12)', border: '1px solid rgba(67,188,201,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CarIcon size={20} color="#43BCC9" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>
                    Ajoutez votre voiture
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    Réservation en un tap
                  </div>
                </div>
                <Plus size={18} color="#43BCC9" />
              </button>
            ) : (
              <div style={{
                display: 'flex', gap: '10px',
                overflowX: 'auto', scrollSnapType: 'x mandatory',
                marginRight: '-18px', paddingRight: '18px',
                scrollbarWidth: 'none',
              }}>
                {cars.map(car => (
                  <div key={car.id} style={{
                    minWidth: '230px', flexShrink: 0, scrollSnapAlign: 'start',
                    background: 'linear-gradient(135deg, #131313 0%, #0E0E0E 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '18px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    {/* Teal corner glow */}
                    <div style={{
                      position: 'absolute', top: '-50px', right: '-50px',
                      width: '160px', height: '160px',
                      background: 'radial-gradient(circle, rgba(67,188,201,0.12) 0%, transparent 70%)',
                      borderRadius: '50%', pointerEvents: 'none',
                    }} />

                    {/* Top — icon + plate */}
                    <div style={{
                      position: 'relative',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'rgba(67,188,201,0.1)',
                        border: '1px solid rgba(67,188,201,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CarIcon size={18} color="#43BCC9" />
                      </div>
                      {car.license_plate && (
                        <div style={{
                          padding: '5px 10px', borderRadius: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '11px', fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.85)',
                          letterSpacing: '0.05em', fontWeight: 600,
                        }}>
                          {car.license_plate}
                        </div>
                      )}
                    </div>

                    {/* Middle — brand + model */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <div style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '20px', fontWeight: 600,
                        color: 'white', marginBottom: '4px',
                        letterSpacing: '-0.015em', lineHeight: 1.1,
                      }}>
                        {car.brand}
                      </div>
                      <div style={{
                        fontSize: '14px', fontWeight: 500,
                        color: 'rgba(255,255,255,0.75)',
                        marginBottom: '8px',
                      }}>
                        {car.model}
                      </div>
                    </div>

                    {/* Bottom — year · fuel · mileage */}
                    <div style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '11px', color: 'rgba(255,255,255,0.45)',
                    }}>
                      {car.year && <span>{car.year}</span>}
                      {car.year && car.fuel_type && (
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                      )}
                      {car.fuel_type && <span>{car.fuel_type}</span>}
                      {car.mileage && (
                        <>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                          <span>{(car.mileage / 1000).toFixed(0)}k km</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {/* Add tile */}
                <button
                  onClick={() => setShowAddCar(true)}
                  style={{
                    minWidth: '80px', flexShrink: 0, scrollSnapAlign: 'start',
                    background: 'transparent',
                    border: '1.5px dashed rgba(255,255,255,0.09)',
                    borderRadius: '16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Plus size={20} color="rgba(255,255,255,0.35)" />
                </button>
              </div>
            )}
          </section>

          {/* ── QUICK SERVICES — coloured gradient 2×3 grid ─────────── */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '17px', fontWeight: 600, color: 'white',
                letterSpacing: '-0.01em',
              }}>
                Services
              </h2>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                Tap pour réserver instantanément
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {QUICK_SERVICES.map(({ id, label, icon: Icon, price, gradient, dot }) => (
                <button
                  key={id}
                  onClick={() => openBookingWithService(id)}
                  style={{
                    background: gradient,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px', padding: '18px',
                    cursor: 'pointer', textAlign: 'left',
                    position: 'relative', overflow: 'hidden',
                    minHeight: '120px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  {/* Radial glow */}
                  <div style={{
                    position: 'absolute', top: '-30px', right: '-30px',
                    width: '120px', height: '120px',
                    background: `radial-gradient(circle, ${dot}40 0%, transparent 70%)`,
                    borderRadius: '50%', pointerEvents: 'none',
                  }} />
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.13)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '14px',
                    }}>
                      <Icon size={17} color="white" />
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '2px', letterSpacing: '-0.01em' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>
                      Dès {price} MAD
                    </div>
                  </div>
                  {/* Arrow chevron */}
                  <div style={{
                    position: 'absolute', bottom: '12px', right: '12px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowRight size={11} color="white" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── BOOK AGAIN ────────────────────────────────────────── */}
          {recentCompleted.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '17px', fontWeight: 600, color: 'white',
                letterSpacing: '-0.01em', marginBottom: '14px',
              }}>
                Réserver à nouveau
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentCompleted.map(b => (
                  <div
                    key={b.id}
                    onClick={() => openBookingWithService(b.service_name)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: '#0F0F0F',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Wrench size={15} color="rgba(255,255,255,0.55)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>
                        {SERVICE_LABELS[b.service_name] ?? b.service_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(b.completed_at ?? b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#43BCC9', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                      Réserver <ArrowRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── MAINTENANCE TIP — only when no active booking + has car ── */}
          {!loading && !activeBooking && cars.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
                border: '1px solid rgba(240,192,64,0.15)',
                borderRadius: '16px', padding: '18px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: '-40px', right: '-40px',
                  width: '160px', height: '160px',
                  background: 'radial-gradient(circle, rgba(240,192,64,0.15) 0%, transparent 70%)',
                  borderRadius: '50%', pointerEvents: 'none',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{
                    fontSize: '10px', color: '#F0C040', letterSpacing: '0.12em',
                    fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px',
                  }}>
                    Astuce maintenance
                  </div>
                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '17px', fontWeight: 600, color: 'white',
                    letterSpacing: '-0.01em', marginBottom: '6px',
                  }}>
                    Vidange tous les 10 000 km
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', lineHeight: 1.5 }}>
                    Pour préserver le moteur de votre {cars[0].brand} {cars[0].model}
                  </div>
                  <button
                    onClick={() => openBookingWithService('vidange')}
                    style={{
                      background: '#F0C040', color: '#000000',
                      border: 'none', padding: '8px 14px',
                      borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    Réserver une vidange <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── FIRST-TIME EMPTY STATE ──────────────────────────────── */}
          {!loading && bookings.length === 0 && cars.length === 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #0E0E0E 0%, #131313 100%)',
              border: '1px solid rgba(67,188,201,0.15)',
              borderRadius: '20px', padding: '28px 22px',
              textAlign: 'center', marginBottom: '28px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#43BCC9', textTransform: 'uppercase', marginBottom: '10px' }}>
                Bienvenue
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '20px', fontWeight: 600, color: 'white',
                letterSpacing: '-0.015em', marginBottom: '8px',
              }}>
                Votre garage mobile vous attend
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 0 }}>
                Mécanicien certifié, devis transparent, paiement après service.
              </p>
            </div>
          )}

        </div>{/* /content */}

        {/* ═══ BOTTOM TAB BAR ════════════════════════════════════════ */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          zIndex: 50,
        }}>
          {([
            { Icon: Home,      label: 'Accueil',      active: true,  onClick: undefined },
            { Icon: ClockIcon, label: 'Historique',   active: false, onClick: () => navigate('/dashboard/historique') },
            { Icon: CarIcon,   label: 'Mes voitures', active: false, onClick: () => navigate('/dashboard/voitures') },
            { Icon: User,      label: 'Profil',       active: false, onClick: () => navigate('/dashboard?tab=profile') },
          ] as const).map(({ Icon, label, active, onClick }, i) => (
            <button
              key={i}
              onClick={onClick}
              style={{
                background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0', padding: '0',
              }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: active ? '5px 14px' : '5px 10px',
                borderRadius: '10px',
                background: active ? 'rgba(67,188,201,0.1)' : 'transparent',
                transition: 'background 0.2s, padding 0.2s',
              }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.35)'} />
                <span style={{ fontSize: '10px', color: active ? '#43BCC9' : 'rgba(255,255,255,0.35)', fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <style>{`
          @keyframes mecaPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.35; transform: scale(0.8); }
          }
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      <AddCarModal
        isOpen={showAddCar}
        onClose={() => setShowAddCar(false)}
        onSuccess={fetchAll}
      />
    </div>
  )
}
