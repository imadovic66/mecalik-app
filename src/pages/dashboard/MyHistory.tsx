import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { serviceIdFromName } from '../../lib/serviceUtils'
import {
  ArrowLeft, ArrowRight, Star, Wrench, Droplet, Battery, Disc,
  Search, Sparkles, AlertTriangle, Calendar, Plus,
  Home, Clock as ClockIcon, Car as CarIcon, User,
} from 'lucide-react'

type Booking = {
  id: string
  reference: string | null
  service_name: string
  address: string
  status: string
  amount_ttc: number | null
  rating: number | null
  created_at: string
  completed_at: string | null
  car_id: string | null
}

type ServiceEntry = {
  id: string
  car_id: string
  service_name: string
  service_date: string
  mileage: number | null
  provider: string | null
  cost: number | null
  notes: string | null
  source: 'mecalik' | 'external'
}

type Car = { id: string; brand: string; model: string; license_plate: string | null; is_primary: boolean }

type UnifiedItem =
  | { type: 'mecalik';  id: string; date: string; year: string; raw: Booking }
  | { type: 'external'; id: string; date: string; year: string; raw: ServiceEntry }

type ServiceVisual = { icon: React.ElementType; gradient: string; color: string }

const SERVICE_VISUALS: Record<string, ServiceVisual> = {
  vidange:    { icon: Droplet,       gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', color: '#3B82F6' },
  batterie:   { icon: Battery,       gradient: 'linear-gradient(135deg, #14532D 0%, #166534 100%)', color: '#22C55E' },
  diagnostic: { icon: Search,        gradient: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)', color: '#06B6D4' },
  pneus:      { icon: Disc,          gradient: 'linear-gradient(135deg, #422006 0%, #57340a 100%)', color: '#D97706' },
  lavage:     { icon: Sparkles,      gradient: 'linear-gradient(135deg, #312E81 0%, #3730A3 100%)', color: '#818CF8' },
  urgence:    { icon: AlertTriangle, gradient: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)', color: '#FF4444' },
}
const FALLBACK_VISUAL: ServiceVisual = {
  icon: Wrench,
  gradient: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 100%)',
  color: 'rgba(255,255,255,0.5)',
}
const getVisual = (name: string) => SERVICE_VISUALS[serviceIdFromName(name)] ?? FALLBACK_VISUAL

const FILTER_OPTIONS = [
  { id: 'all',      label: 'Tout' },
  { id: 'mecalik',  label: 'MecaLIK' },
  { id: 'external', label: 'Externe' },
  { id: 'year',     label: 'Cette année' },
  { id: 'month',    label: 'Ce mois' },
] as const
type FilterId = typeof FILTER_OPTIONS[number]['id']

export default function MyHistory() {
  const { user }    = useAuth()
  const { t, i18n } = useTranslation()
  const navigate    = useNavigate()

  const [bookings,  setBookings]  = useState<Booking[]>([])
  const [services,  setServices]  = useState<ServiceEntry[]>([])
  const [cars,      setCars]      = useState<Car[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FilterId>('all')
  const [showModal, setShowModal] = useState(false)
  const [newEntry,  setNewEntry]  = useState({
    car_id: '', service_name: '',
    service_date: new Date().toISOString().substring(0, 10),
    mileage: '', provider: '', cost: '', notes: '',
  })

  useEffect(() => {
    if (!user) return
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    const [{ data: bData }, { data: sData }, { data: cData }] = await Promise.all([
      supabase.from('bookings')
        .select('id, reference, service_name, address, status, amount_ttc, rating, created_at, completed_at, car_id')
        .eq('user_id', user.id).in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false }),
      supabase.from('service_history')
        .select('*').eq('user_id', user.id)
        .order('service_date', { ascending: false }),
      supabase.from('cars').select('*').eq('user_id', user.id)
        .order('is_primary', { ascending: false }),
    ])
    setBookings(bData ?? [])
    setServices(sData ?? [])
    setCars(cData ?? [])
    if (cData && cData.length > 0) setNewEntry(p => ({ ...p, car_id: cData[0].id }))
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!user || !newEntry.car_id || !newEntry.service_name || !newEntry.service_date) return
    const { data, error } = await supabase.from('service_history').insert({
      car_id: newEntry.car_id, user_id: user.id,
      service_name: newEntry.service_name, service_date: newEntry.service_date,
      mileage: newEntry.mileage ? parseInt(newEntry.mileage) : null,
      provider: newEntry.provider || null,
      cost: newEntry.cost ? parseFloat(newEntry.cost) : null,
      notes: newEntry.notes || null, source: 'external',
    }).select().single()
    if (error) { alert('Erreur: ' + error.message); return }
    setServices(prev => [data as ServiceEntry, ...prev])
    setNewEntry({ car_id: cars[0]?.id || '', service_name: '', service_date: new Date().toISOString().substring(0, 10), mileage: '', provider: '', cost: '', notes: '' })
    setShowModal(false)
  }

  const getCarLabel = (carId: string | null) => {
    if (!carId) return null
    const car = cars.find(c => c.id === carId)
    return car ? `${car.brand} ${car.model}${car.license_plate ? ` (${car.license_plate})` : ''}` : null
  }

  // ── Build unified timeline ──
  const now = new Date()
  const platformItems: UnifiedItem[] = bookings.map(b => ({
    type: 'mecalik', id: b.id, date: b.created_at,
    year: String(new Date(b.created_at).getFullYear()), raw: b,
  }))
  const externalItems: UnifiedItem[] = services.map(s => ({
    type: 'external', id: s.id, date: s.service_date,
    year: String(new Date(s.service_date).getFullYear()), raw: s,
  }))

  const allItems = [...platformItems, ...externalItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filtered = allItems.filter(item => {
    const d = new Date(item.date)
    if (filter === 'mecalik')  return item.type === 'mecalik'
    if (filter === 'external') return item.type === 'external'
    if (filter === 'year')     return d.getFullYear() === now.getFullYear()
    if (filter === 'month')    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    return true
  })

  // Group by year
  const grouped: Record<string, UnifiedItem[]> = {}
  filtered.forEach(item => {
    if (!grouped[item.year]) grouped[item.year] = []
    grouped[item.year].push(item)
  })
  const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  // Stats (MecaLIK completed only for $ spent)
  const completedMecalik = bookings.filter(b => b.status === 'completed')
  const totalSpent = completedMecalik.reduce((s, b) => s + (b.amount_ttc ?? 0), 0)
  const totalEntries = allItems.length

  const isEmpty = !loading && allItems.length === 0

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Outfit, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
    letterSpacing: '0.06em', display: 'block', marginBottom: '5px',
  }

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
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
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
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              {t('customer.historyTitle')}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {totalEntries} service{totalEntries !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={cars.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: cars.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(67,188,201,0.1)',
              border: '1px solid rgba(67,188,201,0.25)',
              color: cars.length === 0 ? 'rgba(255,255,255,0.3)' : '#43BCC9',
              padding: '7px 12px', borderRadius: '9px',
              fontSize: '12px', fontWeight: 600, cursor: cars.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '20px 18px' }}>

          {/* ── Stats ── */}
          {totalEntries > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {t('customer.interventions')}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#43BCC9', letterSpacing: '-0.02em' }}>
                  {totalEntries}
                </div>
              </div>
              <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {t('customer.totalSpent')}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#00DD88', letterSpacing: '-0.02em' }}>
                  {totalSpent} <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>MAD</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Filter pills ── */}
          {totalEntries > 0 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginRight: '-18px', paddingRight: '18px', marginBottom: '20px', scrollbarWidth: 'none' }}>
              {FILTER_OPTIONS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
                    border: filter === f.id ? '1px solid rgba(67,188,201,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    background: filter === f.id ? 'rgba(67,188,201,0.1)' : 'transparent',
                    color: filter === f.id ? '#43BCC9' : 'rgba(255,255,255,0.55)',
                    fontSize: '12px', fontWeight: filter === f.id ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {t('common.loading')}
            </div>
          )}

          {/* ── Empty state ── */}
          {isEmpty && (
            <div style={{
              marginTop: '40px', padding: '40px 24px',
              background: 'linear-gradient(135deg, rgba(67,188,201,0.05) 0%, rgba(67,188,201,0.02) 100%)',
              border: '1.5px dashed rgba(67,188,201,0.25)',
              borderRadius: '18px', textAlign: 'center',
            }}>
              <div style={{
                width: '52px', height: '52px', margin: '0 auto 14px',
                borderRadius: '14px', background: 'rgba(67,188,201,0.1)',
                border: '1px solid rgba(67,188,201,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ClockIcon size={22} color="#43BCC9" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px', fontFamily: 'Space Grotesk, sans-serif' }}>
                {t('customer.noHistory')}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', maxWidth: '260px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Aucun historique. Ajoutez un service passé ou réservez une prestation.
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={cars.length === 0}
                  style={{
                    padding: '9px 16px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >+ Ajouter un service</button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '9px 16px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    background: 'white', color: '#080808', border: 'none',
                  }}
                >{t('customer.bookService')}</button>
              </div>
            </div>
          )}

          {/* ── No filter match ── */}
          {!loading && allItems.length > 0 && filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px' }}>
              {t('customer.noHistoryFilter')}
            </div>
          )}

          {/* ── Year-grouped timeline ── */}
          {!loading && filtered.length > 0 && sortedYears.map(year => (
            <div key={year} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', paddingLeft: '4px' }}>
                {year}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[year].map(item => {
                  if (item.type === 'mecalik') {
                    const b = item.raw
                    const visual = getVisual(b.service_name)
                    const Icon = visual.icon
                    const isCompleted = b.status === 'completed'
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/booking/${b.id}`)}
                        style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                      >
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: visual.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', background: `radial-gradient(circle, ${visual.color}33 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
                          <Icon size={18} color="white" style={{ position: 'relative' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('services.' + serviceIdFromName(b.service_name))}
                            </div>
                            <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0, background: 'rgba(67,188,201,0.12)', color: '#43BCC9' }}>MECALIK</span>
                            <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0, background: isCompleted ? 'rgba(0,221,136,0.08)' : 'rgba(255,68,68,0.08)', color: isCompleted ? '#00DD88' : '#FF4444' }}>
                              {t(`status.${b.status}`)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
                            <Calendar size={10} />
                            <span>{new Date(b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {b.amount_ttc != null && (<><Dot /><span style={{ color: 'rgba(255,255,255,0.6)' }}>{b.amount_ttc} MAD</span></>)}
                            {b.rating != null && (<><Dot /><span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Star size={10} fill="#F0C040" color="#F0C040" /><span style={{ color: '#F0C040' }}>{b.rating}</span></span></>)}
                          </div>
                        </div>
                        <ArrowRight size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                      </div>
                    )
                  }

                  // external
                  const s = item.raw
                  const carLabel = getCarLabel(s.car_id)
                  return (
                    <div key={item.id} style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wrench size={18} color="rgba(255,255,255,0.5)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.service_name}</div>
                          <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>EXTERNE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
                          <Calendar size={10} />
                          <span>{new Date(s.service_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          {s.mileage && (<><Dot /><span>{s.mileage.toLocaleString('fr-FR')} km</span></>)}
                          {s.provider && (<><Dot /><span>{s.provider}</span></>)}
                          {carLabel && (<><Dot /><span>🚗 {carLabel}</span></>)}
                          {s.cost != null && (<><Dot /><span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.cost} MAD</span></>)}
                        </div>
                        {s.notes && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', fontStyle: 'italic' }}>"{s.notes}"</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

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
            { Icon: Home,      labelKey: 'nav.home',        active: false, onClick: () => navigate('/dashboard')          },
            { Icon: ClockIcon, labelKey: 'customer.history', active: true,  onClick: undefined                             },
            { Icon: CarIcon,   labelKey: 'customer.myCars',  active: false, onClick: () => navigate('/dashboard/voitures') },
            { Icon: User,      labelKey: 'customer.profile', active: false, onClick: () => navigate('/dashboard/profil')   },
          ] as const).map(({ Icon, labelKey, active, onClick }, i) => (
            <button key={i} onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: onClick ? 'pointer' : 'default', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: active ? '6px 14px' : '4px', borderRadius: '10px', background: active ? 'rgba(67,188,201,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)' }}>{t(labelKey)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ═══ ADD MODAL ═══ */}
        {showModal && (
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#111114', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>🔧 Ajouter un service</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Véhicule *</label>
                  <select value={newEntry.car_id} onChange={e => setNewEntry(p => ({ ...p, car_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {cars.map(car => (
                      <option key={car.id} value={car.id} style={{ background: '#111114' }}>
                        {car.brand} {car.model}{car.license_plate ? ` (${car.license_plate})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {([
                  { label: 'Service effectué *', field: 'service_name', type: 'text',   placeholder: 'Ex: Vidange, Frein, Pneus...' },
                  { label: 'Date *',             field: 'service_date', type: 'date',   placeholder: '' },
                  { label: 'Kilométrage',        field: 'mileage',      type: 'number', placeholder: 'Ex: 85000' },
                  { label: 'Prestataire',        field: 'provider',     type: 'text',   placeholder: 'Ex: Garage XYZ, Soi-même...' },
                  { label: 'Coût (MAD)',         field: 'cost',         type: 'number', placeholder: 'Ex: 250' },
                  { label: 'Notes',              field: 'notes',        type: 'text',   placeholder: 'Détails optionnels...' },
                ] as { label: string; field: string; type: string; placeholder: string }[]).map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input type={type} value={(newEntry as Record<string, string>)[field]} placeholder={placeholder} onChange={e => setNewEntry(p => ({ ...p, [field]: e.target.value }))} style={inputStyle} />
                  </div>
                ))}
                <button
                  onClick={handleAdd}
                  disabled={!newEntry.car_id || !newEntry.service_name || !newEntry.service_date}
                  style={{ marginTop: '6px', padding: '12px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                >
                  Ajouter à l'historique
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </div>
  )
}

function Dot() {
  return <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
}
