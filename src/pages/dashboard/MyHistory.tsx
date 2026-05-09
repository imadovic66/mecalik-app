import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, ArrowRight, Star, Wrench, Droplet, Battery, Disc,
  Search, Sparkles, AlertTriangle, Calendar,
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
}

type ServiceVisual = { icon: React.ElementType; gradient: string; color: string }

const SERVICE_VISUALS: Record<string, ServiceVisual> = {
  'Vidange & Filtres':  { icon: Droplet,       gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', color: '#3B82F6' },
  'Vidange Moteur':     { icon: Droplet,       gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', color: '#3B82F6' },
  'Vidange':            { icon: Droplet,       gradient: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', color: '#3B82F6' },
  'Batterie':           { icon: Battery,       gradient: 'linear-gradient(135deg, #14532D 0%, #166534 100%)', color: '#22C55E' },
  'Remplacement Batterie': { icon: Battery,    gradient: 'linear-gradient(135deg, #14532D 0%, #166534 100%)', color: '#22C55E' },
  'Diagnostic':         { icon: Search,        gradient: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)', color: '#06B6D4' },
  'Diagnostic Simple':  { icon: Search,        gradient: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)', color: '#06B6D4' },
  'Pneus':              { icon: Disc,          gradient: 'linear-gradient(135deg, #422006 0%, #57340a 100%)', color: '#D97706' },
  'Changement de Pneus':{ icon: Disc,          gradient: 'linear-gradient(135deg, #422006 0%, #57340a 100%)', color: '#D97706' },
  'Lavage Auto':        { icon: Sparkles,      gradient: 'linear-gradient(135deg, #312E81 0%, #3730A3 100%)', color: '#818CF8' },
  'Lavage':             { icon: Sparkles,      gradient: 'linear-gradient(135deg, #312E81 0%, #3730A3 100%)', color: '#818CF8' },
  'Urgence 24/7':       { icon: AlertTriangle, gradient: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)', color: '#FF4444' },
  'Urgence':            { icon: AlertTriangle, gradient: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)', color: '#FF4444' },
}

const FALLBACK_VISUAL: ServiceVisual = {
  icon: Wrench,
  gradient: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 100%)',
  color: 'rgba(255,255,255,0.5)',
}

const FILTER_IDS = ['all', 'completed', 'cancelled', 'this_year', 'this_month'] as const

export default function MyHistory() {
  const { user }   = useAuth()
  const { t }      = useTranslation()
  const navigate   = useNavigate()

  const FILTERS = [
    { id: 'all',        label: t('customer.allFilter')       },
    { id: 'completed',  label: t('customer.completedFilter') },
    { id: 'cancelled',  label: t('customer.cancelledFilter') },
    { id: 'this_year',  label: t('customer.thisYear')        },
    { id: 'this_month', label: t('customer.thisMonth')       },
  ]

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    if (!user) return
    fetchBookings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchBookings = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('id, reference, service_name, address, status, amount_ttc, rating, created_at, completed_at')
      .eq('user_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .order('created_at', { ascending: false })
    setBookings(data ?? [])
    setLoading(false)
  }

  // ── Filter ──
  const now = new Date()
  // silence unused warning from removed FILTERS constant
  void FILTER_IDS
  const filtered = bookings.filter(b => {
    const d = new Date(b.created_at)
    if (filter === 'completed')  return b.status === 'completed'
    if (filter === 'cancelled')  return b.status === 'cancelled'
    if (filter === 'this_year')  return d.getFullYear() === now.getFullYear()
    if (filter === 'this_month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    return true
  })

  // ── Stats ──
  const completed  = bookings.filter(b => b.status === 'completed')
  const totalSpent = completed.reduce((sum, b) => sum + (b.amount_ttc ?? 0), 0)

  // ── Group by year ──
  const grouped: Record<string, Booking[]> = {}
  filtered.forEach(b => {
    const yr = String(new Date(b.created_at).getFullYear())
    if (!grouped[yr]) grouped[yr] = []
    grouped[yr].push(b)
  })
  const sortedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  const getVisual = (name: string): ServiceVisual =>
    SERVICE_VISUALS[name] ?? FALLBACK_VISUAL

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
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em',
            }}>
              {t('customer.historyTitle')}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {bookings.length} {bookings.length === 1 ? t('customer.historyTotal') : t('customer.historyTotalPlural')}
            </div>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '20px 18px' }}>

          {/* ── Stats ── */}
          {bookings.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <div style={{
                background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {t('customer.interventions')}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#43BCC9', letterSpacing: '-0.02em' }}>
                  {completed.length}
                </div>
              </div>
              <div style={{
                background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  {t('customer.totalSpent')}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#00DD88', letterSpacing: '-0.02em' }}>
                  {totalSpent}{' '}
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>MAD</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Filter pills ── */}
          {bookings.length > 0 && (
            <div style={{
              display: 'flex', gap: '8px',
              overflowX: 'auto', marginRight: '-18px', paddingRight: '18px',
              marginBottom: '20px', scrollbarWidth: 'none',
            }}>
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: '20px',
                    border: filter === f.id ? '1px solid rgba(67,188,201,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    background: filter === f.id ? 'rgba(67,188,201,0.1)' : 'transparent',
                    color: filter === f.id ? '#43BCC9' : 'rgba(255,255,255,0.55)',
                    fontSize: '12px', fontWeight: filter === f.id ? 600 : 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* ── States ── */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {t('common.loading')}
            </div>
          )}

          {!loading && bookings.length === 0 && (
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
              <div style={{
                fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px',
                fontFamily: 'Space Grotesk, sans-serif',
              }}>
                {t('customer.noHistory')}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', maxWidth: '260px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                Vos interventions terminées apparaîtront ici
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                style={{
                  background: 'white', color: '#080808', border: 'none',
                  padding: '10px 18px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {t('customer.bookService')}
              </button>
            </div>
          )}

          {!loading && bookings.length > 0 && filtered.length === 0 && (
            <div style={{
              padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px',
              border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px',
            }}>
              {t('customer.noHistoryFilter')}
            </div>
          )}

          {/* ── Year-grouped list ── */}
          {!loading && filtered.length > 0 && sortedYears.map(year => (
            <div key={year} style={{ marginBottom: '24px' }}>
              {/* Year separator */}
              <div style={{
                fontSize: '10px', fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: '10px', paddingLeft: '4px',
              }}>
                {year}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[year].map(b => {
                  const visual      = getVisual(b.service_name)
                  const Icon        = visual.icon
                  const isCompleted = b.status === 'completed'

                  return (
                    <div
                      key={b.id}
                      onClick={() => navigate(`/booking/${b.id}`)}
                      style={{
                        background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', padding: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: visual.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute', top: '-15px', right: '-15px',
                          width: '60px', height: '60px',
                          background: `radial-gradient(circle, ${visual.color}33 0%, transparent 70%)`,
                          borderRadius: '50%', pointerEvents: 'none',
                        }} />
                        <Icon size={18} color="white" style={{ position: 'relative' }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <div style={{
                            fontSize: '14px', fontWeight: 600, color: 'white',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {b.service_name}
                          </div>
                          <span style={{
                            fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                            fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                            flexShrink: 0,
                            background: isCompleted ? 'rgba(0,221,136,0.08)' : 'rgba(255,68,68,0.08)',
                            color: isCompleted ? '#00DD88' : '#FF4444',
                          }}>
                            {isCompleted ? 'Terminée' : 'Annulée'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap' }}>
                          <Calendar size={10} />
                          <span>
                            {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {b.amount_ttc != null && (
                            <>
                              <Dot />
                              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{b.amount_ttc} MAD</span>
                            </>
                          )}
                          {b.rating != null && (
                            <>
                              <Dot />
                              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Star size={10} fill="#F0C040" color="#F0C040" />
                                <span style={{ color: '#F0C040' }}>{b.rating}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <ArrowRight size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
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
            <button key={i} onClick={onClick} style={{
              background: 'transparent', border: 'none',
              cursor: onClick ? 'pointer' : 'default',
              display: 'flex', justifyContent: 'center',
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: active ? '6px 14px' : '4px',
                borderRadius: '10px',
                background: active ? 'rgba(67,188,201,0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)' }}>
                  {t(labelKey)}
                </span>
              </div>
            </button>
          ))}
        </div>

        <style>{`::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Dot() {
  return (
    <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
  )
}
