import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { supabase, type Car } from '../../lib/supabase'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import {
  ChevronRight, MapPin, Plus, Phone, Zap, ArrowRight,
  Home, Clock as ClockIcon, Car as CarIcon, User, Wrench, ChevronDown,
} from 'lucide-react'
import AddCarModal from '../../components/ui/AddCarModal'
import GarageAlertsCard from '../../components/garage/GarageAlertsCard'
import NotificationBell from '../../components/ui/NotificationBell'
import { serviceIdFromName } from '../../lib/serviceUtils'
import { isServiceComingSoon } from '../../data/serviceStatus'
import { loadCatalog, fromPrice, fmtMAD } from '../../lib/catalog'
import { WHATSAPP_URL } from '../../lib/constants'
import { useCustTheme } from '../../lib/custTheme'
import { ThemeButton } from '../../components/ui/ThemeToggle'

type ServiceDetail = {
  type: 'product' | 'part' | 'labor' | 'material' | 'vat' | 'discount'
  name: string
  brand?: string
  reference?: string
  quantity?: string
  unit_price?: number
  total_price?: number
  photo_url?: string | null
  notes?: string | null
}

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
  service_details?: ServiceDetail[] | null
  quote_reference?: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; eta: string }> = {
  pending:       { label: 'pending',       color: 'var(--c-warn)', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040', eta: 'Confirmation en cours'  },
  confirmed:     { label: 'confirmed',     color: 'var(--c-link)', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9', eta: 'Technicien assigné'      },
  on_the_way:    { label: 'on_the_way',    color: 'var(--c-warn)', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040', eta: 'Le mécanicien est en route'},
  quote_pending: { label: 'quote_pending', color: 'var(--c-warn)', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040', eta: 'Devis en préparation'    },
  quote_sent:    { label: 'quote_sent',    color: 'var(--c-warn)', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040', eta: 'Devis à valider'         },
  in_progress:   { label: 'in_progress',   color: 'var(--c-link)', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9', eta: 'Intervention en cours'     },
  completed:     { label: 'completed',     color: 'var(--c-success-text)', bg: 'rgba(0,221,136,0.08)',   dot: '#00DD88', eta: ''                        },
  cancelled:     { label: 'cancelled',     color: 'var(--c-danger-text)', bg: 'rgba(255,68,68,0.08)',   dot: '#FF4444', eta: ''                        },
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { mode } = useCustTheme()
  const [prices, setPrices] = useState<Record<string, string>>({})
  useEffect(() => {
    loadCatalog().then(cat => {
      const out: Record<string, string> = {}
      for (const k of ['vidange', 'batterie', 'diagnostic']) { const p = fromPrice(cat, k); if (p) out[k] = `${i18n.language?.startsWith('en') ? 'from' : 'dès'} ${fmtMAD(p)}` }
      setPrices(out)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [bookings, setBookings]         = useState<Booking[]>([])
  const [cars, setCars]                 = useState<Car[]>([])
  const [, setLoading]           = useState(true)
  const [showAddCar, setShowAddCar]     = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchAll()

    // ── Real-time: refresh active booking card when admin updates status ──
    const channel = supabase
      .channel(`customer-bookings-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
      }, (payload) => {
        const record = (payload.new as any) || (payload.old as any)
        if (!record || record.user_id === user.id) {
          fetchAll()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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

  const activeBooking   = bookings.find(b => ['pending', 'confirmed', 'on_the_way', 'quote_pending', 'quote_sent', 'in_progress'].includes(b.status))
  const recentCompleted = bookings.filter(b => b.status === 'completed').slice(0, 3)
  const firstName       = getFirstName(profile?.full_name, user?.email)

  const openBookingWithService = (serviceId: string) => {
    // Coming-soon services (e.g. from a past Pneus/Lavage booking) aren't bookable —
    // fall back to the plain picker instead of presetting an unavailable service.
    const detail = isServiceComingSoon(serviceIdFromName(serviceId)) ? undefined : { service: serviceId }
    window.dispatchEvent(new CustomEvent('openBooking', { detail }))
  }

  const [acceptingQuote, setAcceptingQuote] = useState(false)
  const handleAcceptQuote = async (bookingId: string) => {
    setAcceptingQuote(true)
    await supabase.from('bookings').update({ status: 'in_progress' }).eq('id', bookingId)
    setAcceptingQuote(false)
    fetchAll()
  }

  // silence unused import warning — Wrench is used in Book Again section
  void Wrench

  return (
    <div data-mk-theme={mode} style={{ minHeight: '100vh', background: 'var(--c-bg)', display: 'flex', justifyContent: 'center' }}>

      {/* ── Mobile shell — caps at 480 px ── */}
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--c-bg)', minHeight: '100vh',
        position: 'relative', paddingBottom: '90px',
      }}>

        {/* ═══ TOP BAR — CAFU model: day/night, centred logo, notifications ═══ */}
        <div className="mkc-top">
          <ThemeButton />
          <div className="mkc-logo">Meca<b>LIK</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
          </div>
        </div>

        {/* ═══ SCROLLABLE CONTENT ════════════════════════════════════ */}
        <div style={{ padding: '6px 18px 0' }}>

          {/* Greeting */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' }}>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '24px', fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {firstName ? `${t('customer.greeting')} ${firstName}` : t('customer.greeting')}
            </h1>
            <LanguageSwitcher />
          </div>

          {/* Address + vehicle chips */}
          <div className="mkc-chips">
            <button className="mkc-chip" onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}>
              <MapPin size={18} color="var(--c-link)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}><b>{activeBooking ? activeBooking.address.split(',')[0] : (i18n.language?.startsWith('en') ? 'My address' : 'Mon adresse')}</b><span>Casablanca</span></div>
              <ChevronDown size={15} color="var(--c-faint)" style={{ flexShrink: 0 }} />
            </button>
            <button className="mkc-chip" onClick={() => cars.length ? navigate('/dashboard/voitures') : setShowAddCar(true)}>
              <CarIcon size={18} color="var(--c-link)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}><b>{cars[0] ? `${cars[0].brand} ${cars[0].model}` : (i18n.language?.startsWith('en') ? 'My car' : 'Mon véhicule')}</b><span>{cars[0] ? (cars[0].license_plate || (cars[0].year ? String(cars[0].year) : '')) || '—' : (i18n.language?.startsWith('en') ? 'Add' : 'Ajouter')}</span></div>
              <ChevronDown size={15} color="var(--c-faint)" style={{ flexShrink: 0 }} />
            </button>
          </div>

          {/* ── ACTIVE SERVICE HERO CARD ─────────────────────────── */}
          {activeBooking && (() => {
            const st = STATUS_CONFIG[activeBooking.status] ?? STATUS_CONFIG.pending
            return (
              <div
                onClick={() => navigate(`/booking/${activeBooking.id}`)}
                style={{
                  background: 'var(--c-active-card)',
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
                      animation: (activeBooking.status === 'in_progress' || activeBooking.status === 'on_the_way') ? 'mecaPulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: st.color,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      {t(`status.${activeBooking.status}`, st.label)}
                    </span>
                  </div>

                  <div style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: '22px', fontWeight: 600, color: 'var(--c-text)',
                    marginBottom: '4px', letterSpacing: '-0.015em',
                  }}>
                    {t('services.' + serviceIdFromName(activeBooking.service_name))}
                  </div>

                  {st.eta && (
                    <div style={{ fontSize: '14px', color: 'rgba(var(--c-fg-rgb),0.65)', marginBottom: '14px' }}>
                      {st.eta}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px' }}>
                    <MapPin size={12} color="rgba(var(--c-fg-rgb),0.35)" />
                    <span style={{ fontSize: '13px', color: 'rgba(var(--c-fg-rgb),0.5)' }}>
                      {activeBooking.address}
                    </span>
                  </div>

                  {/* Technician */}
                  {activeBooking.technician_name && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px', borderRadius: '14px',
                      background: 'rgba(var(--c-fg-rgb),0.04)',
                      border: '1px solid rgba(var(--c-fg-rgb),0.06)',
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
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-text)' }}>
                          {activeBooking.technician_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.4)' }}>
                          {t('customer.certifiedTech')}
                        </div>
                      </div>
                      {activeBooking.technician_phone && (
                        <span
                          style={{
                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                            background: '#00DD88', color: '#000000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Phone size={15} />
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Quote review (status: quote_sent) ── */}
                  {activeBooking.status === 'quote_sent' && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: '14px' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '6px', marginBottom: '10px',
                        background: 'rgba(240,192,64,0.12)', border: '1px solid rgba(240,192,64,0.3)',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-warn)' }}>📄 Devis reçu</span>
                      </div>

                      {activeBooking.service_details && activeBooking.service_details.length > 0 && (
                        <div style={{ background: 'rgba(var(--c-fg-rgb),0.03)', border: '1px solid rgba(var(--c-fg-rgb),0.06)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px' }}>
                          {activeBooking.service_details.map((item, idx) => {
                            const qty = parseFloat(item.quantity || '1') || 1
                            const lineTotal = (item.unit_price || 0) * qty
                            const isDiscount = item.type === 'discount'
                            return (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '4px 0', fontSize: '12px' }}>
                                <span style={{ color: 'rgba(var(--c-fg-rgb),0.6)' }}>{item.name} <span style={{ color: 'rgba(var(--c-fg-rgb),0.3)' }}>× {qty}</span></span>
                                <span style={{ color: isDiscount ? 'var(--c-danger-text)' : 'white', fontWeight: 600, flexShrink: 0 }}>
                                  {isDiscount ? '-' : ''}{Math.round(lineTotal)} MAD
                                </span>
                              </div>
                            )
                          })}
                          <div style={{ height: '1px', background: 'rgba(var(--c-fg-rgb),0.08)', margin: '8px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text)' }}>Total TTC</span>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--c-warn)' }}>{activeBooking.amount_ttc} MAD</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptQuote(activeBooking.id)}
                          disabled={acceptingQuote}
                          style={{
                            flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                            background: '#00DD88', color: '#0A0A0A',
                            fontSize: '13px', fontWeight: 700, cursor: acceptingQuote ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          ✅ J'accepte
                        </button>
                        <a
                          href={`https://wa.me/212777348065?text=${encodeURIComponent(`Bonjour, j'ai une question sur mon devis ${activeBooking.reference || ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1, padding: '12px', borderRadius: '10px',
                            background: 'rgba(var(--c-fg-rgb),0.06)', border: '1px solid rgba(var(--c-fg-rgb),0.12)',
                            color: 'var(--c-text)', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                            textAlign: 'center', fontFamily: 'inherit',
                          }}
                        >
                          💬 J'ai une question
                        </a>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    marginTop: '12px', gap: '4px',
                    fontSize: '12px', color: 'rgba(67,188,201,0.6)',
                  }}>
                    {t('customer.viewDetail')} <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── SERVICES — 3D icon grid (CAFU model), catalogue prices ── */}
          <div className="mkc-grid">
            {([
              { id: 'vidange', label: i18n.language?.startsWith('en') ? 'Oil change' : 'Vidange', sub: prices.vidange ?? ' ' },
              { id: 'batterie', label: i18n.language?.startsWith('en') ? 'Battery' : 'Batterie', sub: prices.batterie ?? ' ' },
              { id: 'diagnostic', label: i18n.language?.startsWith('en') ? 'Diagnostic' : 'Diagnostic', sub: prices.diagnostic ?? ' ' },
              { id: 'urgence', label: i18n.language?.startsWith('en') ? 'Emergency' : 'Urgence', sub: i18n.language?.startsWith('en') ? 'Priority' : 'Prioritaire', badge: i18n.language?.startsWith('en') ? 'SOS' : 'Panne' },
              { id: 'pneus', label: i18n.language?.startsWith('en') ? 'Tyres' : 'Pneus', sub: i18n.language?.startsWith('en') ? 'Soon' : 'Bientôt', soon: true },
              { id: 'lavage', label: i18n.language?.startsWith('en') ? 'Car wash' : 'Lavage', sub: i18n.language?.startsWith('en') ? 'Soon' : 'Bientôt', soon: true },
              { id: 'garage', label: i18n.language?.startsWith('en') ? 'My garage' : 'Mon garage', sub: i18n.language?.startsWith('en') ? 'Papers, upkeep' : 'Papiers, entretien', go: () => navigate('/dashboard/voitures') },
              { id: 'flottes', label: i18n.language?.startsWith('en') ? 'Fleets' : 'Flottes', sub: i18n.language?.startsWith('en') ? 'Business' : 'Entreprises', go: () => navigate('/flottes') },
            ] as { id: string; label: string; sub: string; badge?: string; soon?: boolean; go?: () => void }[]).map(x => (
              <button key={x.id} className="mkc-tile" disabled={x.soon} onClick={() => x.go ? x.go() : openBookingWithService(x.id)}>
                <div className="mkc-tile-box">
                  <img src={`/services/${x.id}.png`} alt="" />
                  {x.badge && <span className="mkc-tile-badge">{x.badge}</span>}
                </div>
                <b>{x.label}</b>
                <span style={x.id === 'urgence' ? { color: 'var(--c-danger-text)' } : undefined}>{x.sub}</span>
              </button>
            ))}
          </div>

          {/* ── QUICK CARDS ── */}
          <div className="mkc-quick">
            <button className="mkc-q mkc-q-red" onClick={() => openBookingWithService('urgence')}>
              <Zap size={22} color="#E5484D" fill="#E5484D" className="mkc-q-icon" />
              <b>{i18n.language?.startsWith('en') ? 'Broken down now' : 'Panne maintenant'}</b>
              <span>{i18n.language?.startsWith('en') ? 'A mechanic comes to you' : 'Un mécanicien vient à vous'} ›</span>
            </button>
            <button className="mkc-q mkc-q-dark" onClick={() => navigate('/flottes')}>
              <img src="/services/flottes.png" alt="" width={28} height={28} className="mkc-q-icon" />
              <b>{i18n.language?.startsWith('en') ? 'Business?' : 'Entreprise ?'}</b>
              <span>{i18n.language?.startsWith('en') ? 'Servicing for your fleet' : 'Entretien de votre flotte'} ›</span>
            </button>
          </div>

          <GarageAlertsCard />

          {/* ── MY GARAGE ─────────────────────────────────────────── */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '14px',
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '17px', fontWeight: 600, color: 'var(--c-text)', letterSpacing: '-0.01em',
                }}>
                  {t('customer.garage')}
                </h2>
                <div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.35)', marginTop: '2px' }}>
                  {cars.length > 0 ? `${cars.length} ${cars.length === 1 ? t('customer.vehiclesRegistered') : t('customer.vehiclesRegisteredPlural')}` : t('customer.garageSubtitle')}
                </div>
              </div>
              {cars.length > 0 && (
                <button
                  onClick={() => setShowAddCar(true)}
                  style={{
                    background: 'rgba(67,188,201,0.08)',
                    border: '1px solid rgba(67,188,201,0.15)',
                    color: 'var(--c-link)', padding: '5px 10px',
                    borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <Plus size={11} /> {t('common.add')}
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
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-text)', marginBottom: '2px' }}>
                    {t('customer.addCar')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.4)' }}>
                    {t('customer.addCarSub')}
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
                    background: 'var(--c-surface)',
                    border: '1px solid rgba(var(--c-fg-rgb),0.08)',
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
                    {/* Top — icon + plate */}
                    <div style={{
                      position: 'relative',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'rgba(var(--c-fg-rgb),0.05)',
                        border: '1px solid rgba(var(--c-fg-rgb),0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CarIcon size={15} color="#43BCC9" />
                      </div>
                      {car.license_plate && (
                        <div style={{
                          padding: '5px 10px', borderRadius: '6px',
                          background: 'rgba(var(--c-fg-rgb),0.06)',
                          border: '1px solid rgba(var(--c-fg-rgb),0.08)',
                          fontSize: '11px', fontFamily: 'monospace',
                          color: 'rgba(var(--c-fg-rgb),0.85)',
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
                        color: 'var(--c-text)', marginBottom: '4px',
                        letterSpacing: '-0.015em', lineHeight: 1.1,
                      }}>
                        {car.brand}
                      </div>
                      <div style={{
                        fontSize: '14px', fontWeight: 500,
                        color: 'rgba(var(--c-fg-rgb),0.75)',
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
                      borderTop: '1px solid rgba(var(--c-fg-rgb),0.05)',
                      fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.45)',
                    }}>
                      {car.year && <span>{car.year}</span>}
                      {car.year && car.fuel_type && (
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(var(--c-fg-rgb),0.2)', display: 'inline-block' }} />
                      )}
                      {car.fuel_type && <span>{car.fuel_type}</span>}
                      {car.mileage && (
                        <>
                          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(var(--c-fg-rgb),0.2)', display: 'inline-block' }} />
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
                    border: '1.5px dashed rgba(var(--c-fg-rgb),0.09)',
                    borderRadius: '16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Plus size={20} color="rgba(var(--c-fg-rgb),0.35)" />
                </button>
              </div>
            )}
          </section>

          {/* ── BOOK AGAIN / SERVICE HISTORY ─────────────────────── */}
          {recentCompleted.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '17px', fontWeight: 600, color: 'var(--c-text)',
                letterSpacing: '-0.01em', marginBottom: '14px',
              }}>
                {t('customer.bookAgain')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentCompleted.map(b => {
                  const isExpanded = expandedHistory === b.id
                  const hasDetails = b.service_details && b.service_details.length > 0
                  return (
                    <div key={b.id} style={{
                      background: 'var(--c-surface)',
                      border: `1px solid ${isExpanded ? 'rgba(67,188,201,0.2)' : 'rgba(var(--c-fg-rgb),0.06)'}`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}>
                      {/* Main row */}
                      <div
                        onClick={() => openBookingWithService(b.service_name)}
                        style={{
                          padding: '14px 16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '12px',
                        }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                          background: 'rgba(var(--c-fg-rgb),0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Wrench size={15} color="rgba(var(--c-fg-rgb),0.55)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--c-text)', marginBottom: '2px' }}>
                            {t('services.' + serviceIdFromName(b.service_name))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.4)' }}>
                              {new Date(b.completed_at ?? b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'short' })}
                            </span>
                            {b.amount_ttc && (
                              <>
                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(var(--c-fg-rgb),0.2)', display: 'inline-block' }} />
                                <span style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.4)' }}>{b.amount_ttc} MAD</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--c-link)', fontSize: '12px', fontWeight: 600 }}>
                            {t('customer.bookAgain')} <ArrowRight size={12} />
                          </div>
                          {hasDetails && (
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedHistory(isExpanded ? null : b.id) }}
                              style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '3px',
                                color: 'rgba(var(--c-fg-rgb),0.35)', fontSize: '10px', padding: 0,
                              }}
                            >
                              Détails
                              <ChevronDown size={10} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable service details panel */}
                      {isExpanded && hasDetails && (
                        <div style={{
                          borderTop: '1px solid rgba(var(--c-fg-rgb),0.05)',
                          padding: '12px 16px',
                          background: 'rgba(0,0,0,0.3)',
                        }}>
                          <div style={{
                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                            color: 'rgba(var(--c-fg-rgb),0.3)', textTransform: 'uppercase',
                            marginBottom: '10px',
                          }}>
                            Produits & pièces utilisés
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {b.service_details!.map((item, idx) => {
                              const typeColor = item.type === 'labor' ? '#43BCC9' : item.type === 'part' ? '#A78BFA' : '#F0C040'
                              const initials  = item.brand ? item.brand.slice(0, 2).toUpperCase() : item.name.slice(0, 2).toUpperCase()
                              const price     = item.total_price ?? (item.unit_price && item.quantity ? item.unit_price * parseFloat(item.quantity) : item.unit_price)
                              return (
                                <div key={idx} style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '8px 10px',
                                  background: 'rgba(var(--c-fg-rgb),0.02)',
                                  border: '1px solid rgba(var(--c-fg-rgb),0.04)',
                                  borderRadius: '10px',
                                }}>
                                  {/* Brand/type avatar */}
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    background: `${typeColor}18`,
                                    border: `1px solid ${typeColor}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 700, color: typeColor,
                                    letterSpacing: '0.03em',
                                  }}>
                                    {initials}
                                  </div>
                                  {/* Name + brand */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(var(--c-fg-rgb),0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(var(--c-fg-rgb),0.35)', marginTop: '1px' }}>
                                      {[item.brand, item.quantity ? `×${item.quantity}` : null].filter(Boolean).join(' · ')}
                                    </div>
                                  </div>
                                  {/* Price */}
                                  {price != null && (
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(var(--c-fg-rgb),0.7)', flexShrink: 0 }}>
                                      {price} MAD
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── PHOTO BANNERS (CAFU model) ── */}
          <button className="mkc-banner" onClick={() => openBookingWithService('vidange')}>
            <img src="/photo-casablanca.jpg" alt="" loading="lazy" />
            <div className="mkc-banner-shade">
              <span className="mkc-banner-tag">{i18n.language?.startsWith('en') ? 'Oil change at home' : 'Vidange à domicile'}</span>
              <span className="mkc-banner-title">{i18n.language?.startsWith('en') ? 'Oil + filter, at your place' : 'Huile + filtre, chez vous'} {prices.vidange ?? ''}</span>
            </div>
          </button>
          <button className="mkc-banner" onClick={() => openBookingWithService('diagnostic')}>
            <img src="/photo-intervention.jpg" alt="" loading="lazy" />
            <div className="mkc-banner-shade">
              <span className="mkc-banner-tag">{i18n.language?.startsWith('en') ? 'Pay after the service' : 'Paiement après le service'}</span>
              <span className="mkc-banner-title">{i18n.language?.startsWith('en') ? 'Estimated price before booking, confirmed with you' : 'Prix estimé avant de réserver, confirmé avec vous'}</span>
            </div>
          </button>
          <a className="mkc-banner" href={`${WHATSAPP_URL}?text=${encodeURIComponent('Bonjour MecaLIK, ')}`} target="_blank" rel="noopener noreferrer">
            <img src="/hero-photo.png" alt="" loading="lazy" />
            <div className="mkc-banner-shade">
              <span className="mkc-banner-tag">{i18n.language?.startsWith('en') ? 'MecaLIK mechanics' : 'Mécaniciens MecaLIK'}</span>
              <span className="mkc-banner-title">{i18n.language?.startsWith('en') ? 'A question? Message us on WhatsApp' : 'Une question ? Écrivez-nous sur WhatsApp'}</span>
            </div>
          </a>

        </div>{/* /content */}

        {/* ═══ BOTTOM TAB BAR ════════════════════════════════════════ */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'var(--c-bar)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(var(--c-fg-rgb),0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          zIndex: 50,
        }}>
          {([
            { Icon: Home,      labelKey: 'nav.home',        active: true,  onClick: undefined },
            { Icon: ClockIcon, labelKey: 'customer.history', active: false, onClick: () => navigate('/dashboard/historique') },
            { Icon: CarIcon,   labelKey: 'customer.myCars',  active: false, onClick: () => navigate('/dashboard/voitures') },
            { Icon: User,      labelKey: 'customer.profile', active: false, onClick: () => navigate('/dashboard/profil') },
          ] as const).map(({ Icon, labelKey, active, onClick }, i) => (
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
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(var(--c-fg-rgb),0.35)'} />
                <span style={{ fontSize: '10px', color: active ? 'var(--c-link)' : 'rgba(var(--c-fg-rgb),0.35)', fontWeight: active ? 600 : 400 }}>
                  {t(labelKey)}
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
