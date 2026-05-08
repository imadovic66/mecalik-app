import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Wrench, ChevronRight, MapPin, Clock, ArrowRight, Bell, X } from 'lucide-react'
import RatingModal from '../../components/ui/RatingModal'
import { usePushNotifications } from '../../hooks/usePushNotifications'

type Booking = {
  id: string
  reference: string | null
  service_name: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  address: string
  preferred_date: string | null
  amount_ttc: number | null
  notes_admin: string | null
  rating: number | null
  rating_comment: string | null
  created_at: string
}

type CarType = {
  id: string
  make: string
  model: string
  year: number
  plate: string | null
}

const STATUS_CONFIG = {
  pending:     { label: 'En attente',  dot: '#F0C040', bg: 'rgba(240,192,64,0.08)'  },
  confirmed:   { label: 'Confirmé',    dot: '#43BCC9', bg: 'rgba(67,188,201,0.08)'  },
  in_progress: { label: 'En cours',    dot: '#43BCC9', bg: 'rgba(67,188,201,0.08)'  },
  completed:   { label: 'Terminé',     dot: '#00DD88', bg: 'rgba(0,221,136,0.08)'   },
  cancelled:   { label: 'Annulé',      dot: '#FF4444', bg: 'rgba(255,68,68,0.08)'   },
}

const SERVICE_LABELS: Record<string, string> = {
  lavage:     'Lavage Auto',
  vidange:    'Vidange & Filtres',
  batterie:   'Batterie',
  pneus:      'Pneus',
  diagnostic: 'Diagnostic',
  urgence:    'Urgence 24/7',
}

type Tab = 'overview' | 'bookings' | 'vehicles' | 'profile'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'overview',  label: "Vue d'ensemble" },
  { tab: 'bookings',  label: 'Réservations'   },
  { tab: 'vehicles',  label: 'Véhicules'       },
  { tab: 'profile',   label: 'Profil'          },
]

export default function CustomerDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings]                         = useState<Booking[]>([])
  const [cars, setCars]                                 = useState<CarType[]>([])
  const [loading, setLoading]                           = useState(true)
  const [activeTab, setActiveTab]                       = useState<Tab>('overview')
  const [showAddCar, setShowAddCar]                     = useState(false)
  const [newCar, setNewCar]                             = useState({ make: '', model: '', year: '', plate: '' })
  const [addingCar, setAddingCar]                       = useState(false)
  const [showRating, setShowRating]                     = useState(false)
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null)
  const [pushBannerDismissed, setPushBannerDismissed]   = useState(() => localStorage.getItem('push_banner_dismissed') === '1')

  const { permission, subscribed, supported, subscribe } = usePushNotifications()
  const showPushBanner = supported && permission !== 'granted' && !subscribed && !pushBannerDismissed

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'là'

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [{ data: bookingData }, { data: carData }] = await Promise.all([
        supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setBookings(bookingData ?? [])
      setCars(carData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const addCar = async () => {
    if (!user || !newCar.make || !newCar.model || !newCar.year) return
    setAddingCar(true)
    await supabase.from('cars').insert({
      user_id: user.id,
      make:    newCar.make,
      model:   newCar.model,
      year:    parseInt(newCar.year),
      plate:   newCar.plate || null,
    })
    const { data } = await supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setCars(data ?? [])
    setNewCar({ make: '', model: '', year: '', plate: '' })
    setShowAddCar(false)
    setAddingCar(false)
  }

  const activeCount    = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div style={{ minHeight: '100vh', background: '#080808', paddingTop: '64px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{ padding: '40px 0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                Bonjour, {firstName}
              </div>
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                Mon espace
              </h1>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'white', color: '#080808', border: 'none',
                borderRadius: '100px', padding: '10px 20px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Wrench size={14} />
              Réserver
            </button>
          </div>

          {/* Stat strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
            overflow: 'hidden', marginTop: '28px',
          }}>
            {[
              { label: 'Total',     value: bookings.length, color: 'white'    },
              { label: 'En cours',  value: activeCount,     color: '#43BCC9'  },
              { label: 'Terminées', value: completedCount,  color: '#00DD88'  },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0D0D0D', padding: '16px 20px' }}>
                <div style={{
                  fontSize: '22px', fontWeight: 700, color: s.color,
                  fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em',
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PUSH PERMISSION BANNER ──────────────────────────────────── */}
        {showPushBanner && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(67,188,201,0.06)',
            border: '1px solid rgba(67,188,201,0.15)',
            borderRadius: '10px', padding: '12px 16px', marginTop: '16px',
          }}>
            <Bell size={15} style={{ color: '#43BCC9', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                Suivez vos réservations en temps réel
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                Activez les notifications pour être alerté des mises à jour
              </div>
            </div>
            <button
              onClick={async () => { await subscribe() }}
              style={{
                background: '#43BCC9', color: '#080808',
                border: 'none', borderRadius: '100px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Activer
            </button>
            <button
              onClick={() => { setPushBannerDismissed(true); localStorage.setItem('push_banner_dismissed', '1') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── TAB NAV ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(({ tab, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 18px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '1px solid white' : '1px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 0 80px' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {loading ? (
                <div style={{
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden',
                }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '56px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                }}>
                  <Wrench size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                    Aucune réservation
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'white', color: '#080808', border: 'none',
                      borderRadius: '100px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Première réservation <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '12px',
                  }}>
                    Récentes
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                    {bookings.slice(0, 5).map((booking, i) => {
                      const st = STATUS_CONFIG[booking.status]
                      return (
                        <div
                          key={booking.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: '12px', padding: '14px 20px', background: '#0D0D0D',
                            borderBottom: i < Math.min(bookings.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                              {SERVICE_LABELS[booking.service_name] ?? booking.service_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={10} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {booking.address}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              background: st.bg, borderRadius: '100px', padding: '3px 8px',
                              fontSize: '11px', fontWeight: 500, color: st.dot,
                            }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                              {st.label}
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                              {new Date(booking.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {bookings.length > 5 && (
                    <button
                      onClick={() => setActiveTab('bookings')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px',
                        fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      Voir tout ({bookings.length}) <ChevronRight size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <div>
              {loading ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '64px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                }}>
                  <Clock size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Aucune réservation</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  {bookings.map((booking, i) => {
                    const st = STATUS_CONFIG[booking.status]
                    return (
                      <div
                        key={booking.id}
                        style={{
                          background: '#0D0D0D', padding: '16px 20px',
                          borderBottom: i < bookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                            {SERVICE_LABELS[booking.service_name] ?? booking.service_name}
                          </div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: st.bg, borderRadius: '100px', padding: '3px 8px',
                            fontSize: '11px', fontWeight: 500, color: st.dot, flexShrink: 0,
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: st.dot }} />
                            {st.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{booking.address}</span>
                          </div>
                          {booking.preferred_date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                {new Date(booking.preferred_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                          {booking.amount_ttc && (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                              {booking.amount_ttc} MAD
                            </span>
                          )}
                          {booking.reference && (
                            <span style={{
                              fontSize: '10px', fontFamily: 'monospace',
                              color: 'rgba(255,255,255,0.2)',
                              background: 'rgba(255,255,255,0.04)',
                              padding: '2px 6px', borderRadius: '4px',
                            }}>
                              {booking.reference}
                            </span>
                          )}
                        </div>
                        {booking.status === 'completed' && !booking.rating && (
                          <button
                            onClick={() => { setSelectedBookingForRating(booking); setShowRating(true) }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px',
                              fontSize: '11px', color: '#43BCC9', background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0,
                            }}
                          >
                            Laisser un avis <ArrowRight size={10} />
                          </button>
                        )}
                        {booking.status === 'completed' && booking.rating && (
                          <div style={{ display: 'flex', gap: '2px', marginTop: '8px' }}>
                            {Array.from({ length: booking.rating }, (_, idx) => (
                              <span key={idx} style={{ color: '#F0C040', fontSize: '12px' }}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* VEHICLES */}
          {activeTab === 'vehicles' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                }}>
                  Mes véhicules
                </div>
                <button
                  onClick={() => setShowAddCar(!showAddCar)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px',
                    padding: '7px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  + Ajouter
                </button>
              </div>

              {showAddCar && (
                <div style={{
                  background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '20px', marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>
                    Nouveau véhicule
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { key: 'make',  label: 'Marque *',        placeholder: 'Ex: Dacia', type: 'text'   },
                      { key: 'model', label: 'Modèle *',        placeholder: 'Ex: Logan', type: 'text'   },
                      { key: 'year',  label: 'Année *',         placeholder: '2019',      type: 'number' },
                      { key: 'plate', label: 'Immatriculation', placeholder: '123-A-45',  type: 'text'   },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{
                          display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                          marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
                        }}>
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={newCar[field.key as keyof typeof newCar]}
                          onChange={e => setNewCar(prev => ({ ...prev, [field.key]: e.target.value }))}
                          style={{
                            width: '100%', background: '#141414',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                            padding: '10px 14px', fontSize: '13px', color: 'white',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={() => setShowAddCar(false)}
                      style={{
                        padding: '8px 16px', borderRadius: '100px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)', background: 'none',
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addCar}
                      disabled={addingCar}
                      style={{
                        padding: '8px 16px', borderRadius: '100px',
                        background: addingCar ? 'rgba(255,255,255,0.4)' : 'white',
                        color: '#080808', border: 'none',
                        fontSize: '12px', fontWeight: 600,
                        cursor: addingCar ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {addingCar ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {cars.length === 0 && !showAddCar ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                    Aucun véhicule enregistré
                  </div>
                  <button
                    onClick={() => setShowAddCar(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: 'white', color: '#080808', border: 'none',
                      borderRadius: '100px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Ajouter un véhicule <ArrowRight size={13} />
                  </button>
                </div>
              ) : cars.length > 0 ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  {cars.map((car, i) => (
                    <div
                      key={car.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', background: '#0D0D0D',
                        borderBottom: i < cars.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                          {car.make} {car.model}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                          {car.year}{car.plate ? ` · ${car.plate}` : ''}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Nom complet',    value: profile?.full_name || '—' },
                  { label: 'Email',          value: user?.email || '—' },
                  { label: 'Téléphone',      value: profile?.phone || '—' },
                  { label: 'Membre depuis',  value: new Date(user?.created_at || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px', background: '#0D0D0D',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={async () => { await signOut(); navigate('/') }}
                style={{
                  fontSize: '13px', color: '#FF4444', background: 'none',
                  border: '1px solid rgba(255,68,68,0.2)', borderRadius: '100px',
                  padding: '10px 20px', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Se déconnecter
              </button>
            </div>
          )}

        </div>
      </div>

      <RatingModal
        bookingId={selectedBookingForRating?.id || ''}
        serviceName={selectedBookingForRating?.service_name || ''}
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmitted={() => {
          setBookings(prev =>
            prev.map(b => b.id === selectedBookingForRating?.id ? { ...b, rating: 1 } : b)
          )
          setShowRating(false)
        }}
      />
    </div>
  )
}
