import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Wrench, ChevronRight, MapPin, Clock, ArrowRight, Bell, X, Pencil, Trash2, Check } from 'lucide-react'
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
  brand: string
  model: string
  year: number
  color: string | null
  license_plate: string | null
}

const STATUS_CONFIG = {
  pending:     { label: 'En attente',  dot: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)'  },
  confirmed:   { label: 'Confirmé',    dot: '#43BCC9',                bg: 'rgba(67,188,201,0.08)'   },
  in_progress: { label: 'En cours',    dot: '#F0C040',                bg: 'rgba(240,192,64,0.08)'   },
  completed:   { label: 'Terminé',     dot: '#00DD88',                bg: 'rgba(0,221,136,0.08)'    },
  cancelled:   { label: 'Annulé',      dot: '#FF4444',                bg: 'rgba(255,68,68,0.08)'    },
}

const SERVICE_LABELS: Record<string, string> = {
  lavage:     'Lavage Auto',
  vidange:    'Vidange & Filtres',
  batterie:   'Batterie',
  pneus:      'Pneus',
  diagnostic: 'Diagnostic',
  urgence:    'Urgence 24/7',
}

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName && fullName.trim()) {
    const first = fullName.trim().split(/\s+/)[0]
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  if (email) {
    const prefix = email.split('@')[0]
    return prefix.charAt(0).toUpperCase() + prefix.slice(1)
  }
  return 'là'
}

type Tab = 'overview' | 'bookings' | 'vehicles' | 'profile'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'overview',  label: "Vue d'ensemble" },
  { tab: 'bookings',  label: 'Réservations'   },
  { tab: 'vehicles',  label: 'Véhicules'       },
  { tab: 'profile',   label: 'Profil'          },
]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: '#141414',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function CustomerDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  // ── data ────────────────────────────────────────────────────────────────
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [cars, setCars]             = useState<CarType[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<Tab>('overview')

  // ── rating ──────────────────────────────────────────────────────────────
  const [showRating, setShowRating]                               = useState(false)
  const [selectedBookingForRating, setSelectedBookingForRating]   = useState<Booking | null>(null)

  // ── push ────────────────────────────────────────────────────────────────
  const [pushBannerDismissed, setPushBannerDismissed] = useState(
    () => localStorage.getItem('push_banner_dismissed') === '1'
  )
  const { permission, subscribed, supported, subscribe } = usePushNotifications()
  const showPushBanner = supported && permission !== 'granted' && !subscribed && !pushBannerDismissed

  // ── vehicles ─────────────────────────────────────────────────────────────
  const [showAddCar, setShowAddCar]       = useState(false)
  const [newCar, setNewCar]               = useState({ brand: '', model: '', year: '', color: '', license_plate: '' })
  const [addingCar, setAddingCar]         = useState(false)
  const [editingCar, setEditingCar]       = useState<CarType | null>(null)
  const [confirmDeleteCarId, setConfirmDeleteCarId] = useState<string | null>(null)
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null)
  const [carError, setCarError]           = useState<string | null>(null)
  const [carSuccess, setCarSuccess]       = useState<string | null>(null)

  // ── profile edit ─────────────────────────────────────────────────────────
  const [profileName, setProfileName]     = useState('')
  const [profilePhone, setProfilePhone]   = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // sync editable fields when profile loads
  useEffect(() => {
    setProfileName(profile?.full_name ?? '')
    setProfilePhone(profile?.phone ?? '')
  }, [profile])

  // ── auth redirect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  // ── fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [{ data: bookingData }, { data: carData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('cars')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      setBookings(bookingData ?? [])
      setCars(carData ?? [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  // ── vehicles helpers ──────────────────────────────────────────────────────
  const refreshCars = async () => {
    if (!user) return
    const { data } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCars(data ?? [])
  }

  const addCar = async () => {
    if (!user || !newCar.brand || !newCar.model || !newCar.year) return
    setAddingCar(true)
    setCarError(null)
    const { error } = await supabase.from('cars').insert({
      user_id:       user.id,
      brand:         newCar.brand.trim(),
      model:         newCar.model.trim(),
      year:          parseInt(newCar.year),
      color:         newCar.color.trim() || null,
      license_plate: newCar.license_plate.trim() || null,
    })
    if (error) { setCarError(error.message); setAddingCar(false); return }
    await refreshCars()
    setNewCar({ brand: '', model: '', year: '', color: '', license_plate: '' })
    setShowAddCar(false)
    setAddingCar(false)
    setCarSuccess('Véhicule ajouté avec succès')
    setTimeout(() => setCarSuccess(null), 3000)
  }

  const updateCar = async () => {
    if (!user || !editingCar) return
    setAddingCar(true)
    setCarError(null)
    const { error } = await supabase
      .from('cars')
      .update({
        brand:         editingCar.brand.trim(),
        model:         editingCar.model.trim(),
        year:          editingCar.year,
        color:         editingCar.color?.trim() || null,
        license_plate: editingCar.license_plate?.trim() || null,
      })
      .eq('id', editingCar.id)
      .eq('user_id', user.id)
    if (error) { setCarError(error.message); setAddingCar(false); return }
    setCars(prev => prev.map(c => c.id === editingCar.id ? editingCar : c))
    setEditingCar(null)
    setAddingCar(false)
    setCarSuccess('Véhicule modifié avec succès')
    setTimeout(() => setCarSuccess(null), 3000)
  }

  const deleteCar = async (carId: string) => {
    setDeletingCarId(carId)
    setConfirmDeleteCarId(null)
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)
      .eq('user_id', user!.id)
    if (error) {
      setCarError(error.message)
    } else {
      setCars(prev => prev.filter(c => c.id !== carId))
    }
    setDeletingCarId(null)
  }

  // ── profile save ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileName.trim() || null, phone: profilePhone.trim() || null })
      .eq('id', user.id)
    if (!error) {
      await refreshProfile()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
    setSavingProfile(false)
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const firstName      = getFirstName(profile?.full_name, user?.email)
  const activeCount    = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const hasBookings    = bookings.length > 0

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
                fontSize: '24px', fontWeight: 700, color: 'white',
                letterSpacing: '-0.02em', margin: 0,
              }}>
                Mon espace
              </h1>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
              className="btn-teal-solid"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                borderRadius: '100px', padding: '10px 20px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Wrench size={14} />
              Réserver
            </button>
          </div>

          {/* Stat strip — hidden when no bookings yet */}
          {hasBookings && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px',
              overflow: 'hidden', marginTop: '28px',
            }}>
              {[
                { label: 'Total',     value: bookings.length, color: 'white'   },
                { label: 'En cours',  value: activeCount,     color: '#43BCC9' },
                { label: 'Terminées', value: completedCount,  color: '#00DD88' },
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
          )}
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
                background: '#43BCC9', color: '#080808', border: 'none',
                borderRadius: '100px', padding: '6px 14px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
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
                padding: '14px 18px', fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '1px solid white' : '1px solid transparent',
                marginBottom: '-1px', cursor: 'pointer', transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────────── */}
        <div style={{ padding: '28px 0 80px' }}>

          {/* ══ OVERVIEW ═══════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              {loading ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '56px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.04)' }} />
                  ))}
                </div>
              ) : !hasBookings ? (
                /* ── ONBOARDING welcome card ── */
                <div style={{
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px',
                  background: '#0D0D0D', padding: '40px 32px', textAlign: 'center',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: 'rgba(67,188,201,0.12)', border: '1px solid rgba(67,188,201,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <Wrench size={22} style={{ color: '#43BCC9' }} />
                  </div>
                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '20px', fontWeight: 700, color: 'white',
                    letterSpacing: '-0.02em', marginBottom: '8px',
                  }}>
                    Bienvenue chez MecaLIK
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', maxWidth: '340px', margin: '0 auto 32px' }}>
                    Votre garage mobile, disponible partout au Maroc. Réservez votre premier service en 2 minutes.
                  </div>

                  {/* 3-step cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
                    {[
                      { step: '1', title: 'Choisissez', sub: 'Le service dont vous avez besoin' },
                      { step: '2', title: 'Adresse',    sub: 'Où vous souhaitez être pris en charge' },
                      { step: '3', title: 'On arrive',  sub: 'Un mécanicien se déplace chez vous' },
                    ].map(item => (
                      <div key={item.step} style={{
                        background: '#141414', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px', padding: '16px 12px',
                      }}>
                        <div style={{
                          fontSize: '11px', fontWeight: 700, color: '#43BCC9',
                          marginBottom: '6px', letterSpacing: '0.05em',
                        }}>
                          {item.step}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.4' }}>
                          {item.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: '#43BCC9', color: '#080808', border: 'none',
                      borderRadius: '100px', padding: '12px 28px',
                      fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Réserver maintenant <ArrowRight size={14} />
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
                        <div key={booking.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: '12px', padding: '14px 20px', background: '#0D0D0D',
                          borderBottom: i < Math.min(bookings.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
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

          {/* ══ BOOKINGS ════════════════════════════════════════════════ */}
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
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                    Aucune réservation pour le moment
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#43BCC9', color: '#080808', border: 'none',
                      borderRadius: '100px', padding: '10px 20px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Première réservation <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  {bookings.map((booking, i) => {
                    const st = STATUS_CONFIG[booking.status]
                    return (
                      <div key={booking.id} style={{
                        background: '#0D0D0D', padding: '16px 20px',
                        borderBottom: i < bookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wrench size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                              {SERVICE_LABELS[booking.service_name] ?? booking.service_name}
                            </span>
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
                          {booking.amount_ttc ? (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                              {booking.amount_ttc} MAD
                            </span>
                          ) : null}
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
                              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px',
                              fontSize: '11px', color: '#43BCC9', background: 'none', border: 'none',
                              cursor: 'pointer', padding: 0,
                            }}
                          >
                            Noter ce service <ArrowRight size={10} />
                          </button>
                        )}
                        {booking.status === 'completed' && booking.rating && (
                          <div style={{ display: 'flex', gap: '2px', marginTop: '10px' }}>
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

          {/* ══ VEHICLES ════════════════════════════════════════════════ */}
          {activeTab === 'vehicles' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                }}>
                  Mes véhicules
                </div>
                <button
                  onClick={() => { setShowAddCar(v => !v); setEditingCar(null); setCarError(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#43BCC9', color: '#080808',
                    border: 'none', borderRadius: '100px',
                    padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Ajouter
                </button>
              </div>

              {/* Feedback banners */}
              {carSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
                  background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.2)',
                  fontSize: '12px', color: '#00DD88',
                }}>
                  <Check size={13} />
                  {carSuccess}
                </div>
              )}
              {carError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
                  background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
                  fontSize: '12px', color: '#FF4444',
                }}>
                  {carError}
                </div>
              )}

              {/* Add form */}
              {showAddCar && (
                <div style={{
                  background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '20px', marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>
                    Nouveau véhicule
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {([
                      { key: 'brand',         label: 'Marque *',        placeholder: 'Ex: Dacia',   type: 'text'   },
                      { key: 'model',         label: 'Modèle *',        placeholder: 'Ex: Logan',   type: 'text'   },
                      { key: 'year',          label: 'Année *',         placeholder: '2019',         type: 'number' },
                      { key: 'color',         label: 'Couleur',         placeholder: 'Ex: Blanc',   type: 'text'   },
                      { key: 'license_plate', label: 'Immatriculation', placeholder: '123-A-45',    type: 'text'   },
                    ] as { key: keyof typeof newCar; label: string; placeholder: string; type: string }[]).map(field => (
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
                          value={newCar[field.key]}
                          onChange={e => setNewCar(prev => ({ ...prev, [field.key]: e.target.value }))}
                          style={INPUT_STYLE}
                          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.25)')}
                          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={() => { setShowAddCar(false); setCarError(null) }}
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
                      disabled={addingCar || !newCar.brand || !newCar.model || !newCar.year}
                      style={{
                        padding: '8px 16px', borderRadius: '100px',
                        background: (addingCar || !newCar.brand || !newCar.model || !newCar.year)
                          ? 'rgba(255,255,255,0.15)' : 'white',
                        color: '#080808', border: 'none',
                        fontSize: '12px', fontWeight: 600,
                        cursor: (addingCar || !newCar.brand || !newCar.model || !newCar.year) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {addingCar ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Edit form */}
              {editingCar && (
                <div style={{
                  background: '#0D0D0D', border: '1px solid rgba(67,188,201,0.2)',
                  borderRadius: '10px', padding: '20px', marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>
                    Modifier le véhicule
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {([
                      { key: 'brand',         label: 'Marque *',        placeholder: 'Ex: Dacia',  type: 'text'   },
                      { key: 'model',         label: 'Modèle *',        placeholder: 'Ex: Logan',  type: 'text'   },
                      { key: 'year',          label: 'Année *',         placeholder: '2019',        type: 'number' },
                      { key: 'color',         label: 'Couleur',         placeholder: 'Ex: Blanc',  type: 'text'   },
                      { key: 'license_plate', label: 'Immatriculation', placeholder: '123-A-45',   type: 'text'   },
                    ] as { key: keyof CarType; label: string; placeholder: string; type: string }[]).map(field => (
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
                          value={String(editingCar[field.key] ?? '')}
                          onChange={e => setEditingCar(prev => prev
                            ? { ...prev, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }
                            : prev
                          )}
                          style={INPUT_STYLE}
                          onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                          onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={() => { setEditingCar(null); setCarError(null) }}
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
                      onClick={updateCar}
                      disabled={addingCar}
                      style={{
                        padding: '8px 16px', borderRadius: '100px',
                        background: addingCar ? 'rgba(67,188,201,0.3)' : '#43BCC9',
                        color: '#080808', border: 'none',
                        fontSize: '12px', fontWeight: 600,
                        cursor: addingCar ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {addingCar ? 'Enregistrement...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {cars.length === 0 && !showAddCar && !editingCar ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                    Aucun véhicule enregistré
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginBottom: '20px' }}>
                    Ajoutez votre véhicule pour des réservations plus rapides
                  </div>
                  <button
                    onClick={() => setShowAddCar(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#43BCC9', color: '#080808', border: 'none',
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
                    <div key={car.id}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 20px', background: '#0D0D0D',
                        borderBottom: (i < cars.length - 1 && confirmDeleteCarId !== car.id)
                          ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        opacity: deletingCarId === car.id ? 0.4 : 1,
                        transition: 'opacity 0.15s',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>
                            {car.brand} {car.model}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                            {car.year}
                            {car.color ? ` · ${car.color}` : ''}
                            {car.license_plate ? ` · ${car.license_plate}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <button
                            onClick={() => { setEditingCar(car); setShowAddCar(false); setCarError(null); setConfirmDeleteCarId(null) }}
                            title="Modifier"
                            style={{
                              width: '30px', height: '30px', borderRadius: '6px',
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'rgba(255,255,255,0.3)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCarId(confirmDeleteCarId === car.id ? null : car.id)}
                            disabled={deletingCarId === car.id}
                            title="Supprimer"
                            style={{
                              width: '30px', height: '30px', borderRadius: '6px',
                              background: 'none', border: 'none',
                              cursor: deletingCarId === car.id ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: confirmDeleteCarId === car.id ? '#FF4444' : 'rgba(255,68,68,0.4)',
                            }}
                            onMouseEnter={e => { if (deletingCarId !== car.id) e.currentTarget.style.color = '#FF4444' }}
                            onMouseLeave={e => { e.currentTarget.style.color = confirmDeleteCarId === car.id ? '#FF4444' : 'rgba(255,68,68,0.4)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {/* Inline delete confirmation */}
                      {confirmDeleteCarId === car.id && (
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 20px', background: 'rgba(255,68,68,0.05)',
                          borderTop: '1px solid rgba(255,68,68,0.1)',
                          borderBottom: i < cars.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Supprimer ce véhicule ?
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setConfirmDeleteCarId(null)}
                              style={{
                                fontSize: '12px', color: 'rgba(255,255,255,0.4)',
                                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                              }}
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => deleteCar(car.id)}
                              style={{
                                fontSize: '12px', fontWeight: 600, color: '#FF4444',
                                background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
                                borderRadius: '6px', cursor: 'pointer', padding: '4px 12px',
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* ══ PROFILE ═════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div>
              {/* Editable fields */}
              <div style={{
                background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '20px', marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '16px',
                }}>
                  Informations personnelles
                </div>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                      marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="Votre nom complet"
                      style={INPUT_STYLE}
                      onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                      marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      style={INPUT_STYLE}
                      onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                      onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                    />
                  </div>
                </div>

                {/* Success feedback */}
                {profileSuccess && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '12px', fontSize: '12px', color: '#00DD88',
                  }}>
                    <Check size={13} />
                    Modifications enregistrées
                  </div>
                )}

                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    marginTop: '16px', padding: '10px 20px', borderRadius: '100px',
                    background: savingProfile ? 'rgba(67,188,201,0.3)' : '#43BCC9',
                    color: '#080808', border: 'none',
                    fontSize: '13px', fontWeight: 600,
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>

              {/* Read-only fields */}
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Email',         value: user?.email || '—' },
                  { label: 'Membre depuis', value: new Date(user?.created_at || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) },
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
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{row.value}</span>
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
