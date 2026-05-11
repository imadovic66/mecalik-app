import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { supabase, type Car } from '../../lib/supabase'
import {
  ArrowLeft, Plus, Car as CarIcon, Edit3, Trash2,
  Star, Wrench, ChevronDown, ChevronUp,
  Home, Clock as ClockIcon, User,
} from 'lucide-react'
import AddCarModal from '../../components/ui/AddCarModal'

type Booking = {
  id: string
  reference: string | null
  service_name: string
  status: string
  amount_ttc: number | null
  created_at: string
  completed_at: string | null
  car_id: string | null
}

export default function MyCars() {
  const { user }   = useAuth()
  const { t }      = useTranslation()
  const navigate   = useNavigate()

  const [cars, setCars]                   = useState<Car[]>([])
  const [bookings, setBookings]           = useState<Booking[]>([])
  const [loading, setLoading]             = useState(true)
  const [expandedCarId, setExpandedCarId] = useState<string | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [editingCar, setEditingCar]       = useState<Car | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    const [carsRes, bookingsRes] = await Promise.all([
      supabase
        .from('cars').select('*').eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at',  { ascending: false }),
      supabase
        .from('bookings')
        .select('id, reference, service_name, status, amount_ttc, created_at, completed_at, car_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setCars(carsRes.data ?? [])
    setBookings(bookingsRes.data ?? [])
    setLoading(false)
  }

  const setPrimary = async (carId: string) => {
    if (!user) return
    await supabase.from('cars').update({ is_primary: false }).eq('user_id', user.id)
    await supabase.from('cars').update({ is_primary: true  }).eq('id', carId)
    fetchAll()
  }

  const deleteCar = async (carId: string) => {
    await supabase.from('cars').delete().eq('id', carId)
    setConfirmDelete(null)
    setExpandedCarId(null)
    fetchAll()
  }

  const openEdit = (car: Car) => { setEditingCar(car); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingCar(null) }

  const getCarBookings = (carId: string) => bookings.filter(b => b.car_id === carId)

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#0A0A0A',
        minHeight: '100vh', position: 'relative', paddingBottom: '90px',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '36px', height: '36px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <ArrowLeft size={15} color="rgba(255,255,255,0.7)" />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
            }}>
              Mes voitures
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {cars.length} véhicule{cars.length !== 1 ? 's' : ''}
            </div>
          </div>

          <button onClick={() => { setEditingCar(null); setShowModal(true) }} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: '#43BCC9', color: '#0A0A0A', border: 'none',
            padding: '8px 14px', borderRadius: '10px',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '20px 18px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {t('common.loading')}
            </div>
          )}

          {/* Empty state */}
          {!loading && cars.length === 0 && (
            <button
              onClick={() => { setEditingCar(null); setShowModal(true) }}
              style={{
                width: '100%', padding: '40px 24px',
                background: 'linear-gradient(135deg, rgba(67,188,201,0.05) 0%, rgba(67,188,201,0.02) 100%)',
                border: '1.5px dashed rgba(67,188,201,0.3)',
                borderRadius: '18px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                marginTop: '40px',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CarIcon size={24} color="#43BCC9" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                  Ajoutez votre première voiture
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', maxWidth: '260px', lineHeight: 1.5 }}>
                  Enregistrez vos véhicules pour des réservations rapides et un suivi complet
                </div>
              </div>
            </button>
          )}

          {/* Cars list */}
          {!loading && cars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cars.map(car => {
                const isExpanded  = expandedCarId === car.id
                const carBookings = getCarBookings(car.id)
                const completedCount = carBookings.filter(b => b.status === 'completed').length

                return (
                  <div key={car.id} style={{
                    background: '#0F0F0F',
                    border: car.is_primary
                      ? '1px solid rgba(67,188,201,0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px', overflow: 'hidden',
                  }}>

                    {/* ── Card header (always visible) ── */}
                    <div
                      onClick={() => setExpandedCarId(isExpanded ? null : car.id)}
                      style={{
                        padding: '16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '14px',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: car.is_primary ? 'rgba(67,188,201,0.12)' : 'rgba(255,255,255,0.04)',
                        border: car.is_primary ? '1px solid rgba(67,188,201,0.25)' : '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CarIcon size={18} color={car.is_primary ? '#43BCC9' : 'rgba(255,255,255,0.6)'} />
                      </div>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>
                            {car.brand} {car.model}
                          </div>
                          {car.is_primary && <Star size={11} fill="#43BCC9" color="#43BCC9" />}
                        </div>
                        <div style={{
                          fontSize: '11px', color: 'rgba(255,255,255,0.45)',
                          display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap',
                        }}>
                          {car.year && <span>{car.year}</span>}
                          {car.year && car.fuel_type && <Dot />}
                          {car.fuel_type && <span>{car.fuel_type}</span>}
                          {car.license_plate && <Dot />}
                          {car.license_plate && (
                            <span style={{ fontFamily: 'monospace' }}>{car.license_plate}</span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      {isExpanded
                        ? <ChevronUp size={18} color="rgba(255,255,255,0.4)" />
                        : <ChevronDown size={18} color="rgba(255,255,255,0.4)" />
                      }
                    </div>

                    {/* ── Expanded panel ── */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '16px' }}>

                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          <StatCell label="Interventions" value={String(completedCount)} />
                          <StatCell
                            label="Kilométrage"
                            value={car.mileage ? `${car.mileage.toLocaleString('fr-FR')} km` : '—'}
                          />
                        </div>

                        {/* Service history */}
                        {carBookings.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <SectionLabel>Historique</SectionLabel>
                            <div style={{
                              background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.04)',
                              borderRadius: '12px', overflow: 'hidden',
                            }}>
                              {carBookings.slice(0, 5).map((b, i) => (
                                <div
                                  key={b.id}
                                  onClick={() => navigate(`/booking/${b.id}`)}
                                  style={{
                                    padding: '12px 14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    borderBottom: i < Math.min(carBookings.length, 5) - 1
                                      ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                  }}
                                >
                                  <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.04)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    <Wrench size={11} color="rgba(255,255,255,0.5)" />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', color: 'white', fontWeight: 500, marginBottom: '1px' }}>
                                      {b.service_name}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                      {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                  </div>
                                  <StatusBadge status={b.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!car.is_primary && (
                            <button onClick={() => setPrimary(car.id)} style={actionBtn('teal')}>
                              <Star size={13} /> Définir principal
                            </button>
                          )}
                          <button onClick={() => openEdit(car)} style={actionBtn('default')}>
                            <Edit3 size={13} /> Modifier
                          </button>
                          <button onClick={() => setConfirmDelete(car.id)} style={actionBtn('danger')}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══ DELETE CONFIRMATION ═══ */}
        {confirmDelete && (
          <div
            onClick={() => setConfirmDelete(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: '320px',
                background: '#111111', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '22px',
              }}
            >
              <div style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '17px', fontWeight: 600, color: 'white',
                marginBottom: '6px', letterSpacing: '-0.01em',
              }}>
                Supprimer ce véhicule ?
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', lineHeight: 1.5 }}>
                Cette action est irréversible. L'historique des interventions sera conservé.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    padding: '11px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)', color: 'white',
                    borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteCar(confirmDelete)}
                  style={{
                    padding: '11px', background: '#FF4444', border: 'none',
                    color: 'white', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BOTTOM TAB BAR ═══ */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', zIndex: 50,
        }}>
          {([
            { Icon: Home,      labelKey: 'nav.home',        active: false, onClick: () => navigate('/dashboard') },
            { Icon: ClockIcon, labelKey: 'customer.history', active: false, onClick: () => navigate('/dashboard/historique') },
            { Icon: CarIcon,   labelKey: 'customer.myCars',  active: true,  onClick: undefined },
            { Icon: User,      labelKey: 'customer.profile', active: false, onClick: () => navigate('/dashboard/profil') },
          ] as const).map(({ Icon, labelKey, active, onClick }, i) => (
            <button
              key={i} onClick={onClick}
              style={{
                background: 'transparent', border: 'none',
                cursor: onClick ? 'pointer' : 'default',
                display: 'flex', justifyContent: 'center',
              }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: active ? '6px 14px' : '4px',
                borderRadius: '10px',
                background: active ? 'rgba(67,188,201,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                <span style={{
                  fontSize: '10px', fontWeight: active ? 600 : 400,
                  color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)',
                }}>
                  {t(labelKey)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AddCarModal
        isOpen={showModal}
        onClose={closeModal}
        onSuccess={fetchAll}
        editingCar={editingCar}
      />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Dot() {
  return (
    <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: '10px', padding: '10px 12px',
    }}>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: 'white', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const map: Record<string, { color: string; bg: string }> = {
    completed:   { color: '#00DD88', bg: 'rgba(0,221,136,0.08)'   },
    in_progress: { color: '#43BCC9', bg: 'rgba(67,188,201,0.08)'  },
    on_the_way:  { color: '#F0C040', bg: 'rgba(240,192,64,0.08)'  },
    confirmed:   { color: '#43BCC9', bg: 'rgba(67,188,201,0.08)'  },
    pending:     { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)' },
    cancelled:   { color: '#FF4444', bg: 'rgba(255,68,68,0.08)'   },
  }
  const cfg = map[status] ?? map.pending
  return (
    <span style={{
      fontSize: '9px', padding: '3px 7px', borderRadius: '4px',
      fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color,
    }}>
      {t(`status.${status}`)}
    </span>
  )
}

function actionBtn(variant: 'teal' | 'default' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
  }
  if (variant === 'teal')    return { ...base, flex: 1, background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.18)', color: '#43BCC9' }
  if (variant === 'danger')  return { ...base, width: '40px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', color: '#FF4444' }
  return { ...base, flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }
}
