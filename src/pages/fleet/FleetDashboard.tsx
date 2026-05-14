import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import {
  RefreshCw, Plus, Search, Download, X,
  LayoutDashboard, Car, Wrench, CreditCard, FileText,
  LogOut, ArrowUpRight, MessageCircle, ChevronRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type FleetVehicle = {
  id: string
  company_id: string
  plate: string
  brand: string
  model: string
  year: number | null
  type: string | null
  driver_name: string | null
  driver_phone: string | null
  mileage: number | null
  status: string
  created_at: string
}

type Booking = {
  id: string
  reference: string
  service_name: string
  address: string
  status: string
  amount_ttc: number | null
  technician_name: string | null
  created_at: string
  completed_at: string | null
  fleet_vehicle_id: string | null
}

type Company = {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  plan: string | null
  vehicle_count: number | null
  is_active: boolean
}

type TabId = 'overview' | 'vehicles' | 'interventions' | 'finance' | 'rapports'

const VEHICLE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  operational: { label: 'Opérationnel',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  service_due:  { label: 'Service requis', color: '#F0C040', bg: 'rgba(240,192,64,0.12)' },
  in_service:   { label: 'En intervention',color: '#43BCC9', bg: 'rgba(67,188,201,0.12)' },
  alert:        { label: 'Alerte',         color: '#FF4444', bg: 'rgba(255,68,68,0.12)'  },
  inactive:     { label: 'Inactif',        color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)' },
}

const BOOKING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'pending',     color: '#43BCC9', bg: 'rgba(67,188,201,0.08)' },
  confirmed:   { label: 'confirmed',   color: '#43BCC9', bg: 'rgba(67,188,201,0.08)' },
  on_the_way:  { label: 'on_the_way',  color: '#43BCC9', bg: 'rgba(67,188,201,0.08)' },
  in_progress: { label: 'in_progress', color: '#43BCC9', bg: 'rgba(67,188,201,0.08)' },
  completed:   { label: 'completed',   color: '#00DD88', bg: 'rgba(0,221,136,0.08)'  },
  cancelled:   { label: 'cancelled',   color: '#FF4444', bg: 'rgba(255,68,68,0.08)'  },
}

const NAV: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',      label: "Vue d'ensemble", Icon: LayoutDashboard },
  { id: 'vehicles',      label: 'Véhicules',       Icon: Car             },
  { id: 'interventions', label: 'Interventions',   Icon: Wrench          },
  { id: 'finance',       label: 'Finance',          Icon: CreditCard      },
  { id: 'rapports',      label: 'Rapports',         Icon: FileText        },
]

export default function FleetDashboard() {
  const { user, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [tab, setTab]                   = useState<TabId>('overview')
  const [vehicles, setVehicles]         = useState<FleetVehicle[]>([])
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [company, setCompany]           = useState<Company | null>(null)
  const [loading, setLoading]           = useState(true)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingFilter, setBookingFilter] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null)

  void loading

  useEffect(() => {
    if (user) fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ── Real-time: refresh when any booking for this company changes ──
  useEffect(() => {
    if (!company?.id) return
    const channel = supabase
      .channel(`fleet-${company.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
      }, (payload) => {
        if ((payload.new as { company_id?: string }).company_id === company.id) {
          fetchAll()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    const { data: prof } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()

    if (prof?.company_id) {
      const [co, veh, bk] = await Promise.all([
        supabase.from('companies').select('*').eq('id', prof.company_id).single(),
        supabase.from('fleet_vehicles').select('*').eq('company_id', prof.company_id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').eq('company_id', prof.company_id).order('created_at', { ascending: false }),
      ])
      setCompany(co.data)
      setVehicles(veh.data || [])
      setBookings(bk.data || [])
    }
    setLoading(false)
  }

  // ── Stats ──
  const operational = vehicles.filter(v => v.status === 'operational').length
  const serviceDue  = vehicles.filter(v => v.status === 'service_due').length
  const alerts      = vehicles.filter(v => v.status === 'alert').length
  const inService   = vehicles.filter(v => v.status === 'in_service').length

  const now = new Date()
  const thisMonth = bookings.filter(b => {
    const d = new Date(b.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthSpend = thisMonth.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)
  const totalSpend = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)

  // ── Filtered lists ──
  const filteredVehicles = vehicles.filter(v => {
    const q = `${v.brand} ${v.model} ${v.plate} ${v.driver_name || ''}`.toLowerCase()
    return (vehicleSearch === '' || q.includes(vehicleSearch.toLowerCase())) &&
      (vehicleFilter === 'all' || v.status === vehicleFilter)
  })

  const filteredBookings = bookings.filter(b => {
    const q = `${b.reference || ''} ${b.service_name} ${b.address}`.toLowerCase()
    return (bookingSearch === '' || q.includes(bookingSearch.toLowerCase())) &&
      (bookingFilter === 'all' || b.status === bookingFilter)
  })

  // ── Chart data ──
  const spendByService: Record<string, number> = {}
  bookings.filter(b => b.status === 'completed' && b.amount_ttc).forEach(b => {
    const key = b.service_name.split(' ')[0]
    spendByService[key] = (spendByService[key] || 0) + (b.amount_ttc || 0)
  })
  const chartData = Object.entries(spendByService).map(([name, total]) => ({ name, total }))

  // ── CSV export ──
  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return
    const keys = Object.keys(data[0])
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#080808', fontFamily: 'Outfit, system-ui, sans-serif', fontSize: '13px',
    }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#050505', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
      }}>

        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
            Meca<span style={{ color: '#43BCC9' }}>LIK</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
            Fleet Portal
          </div>
        </div>

        {/* Company */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '7px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company?.name || 'Ma flotte'}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(67,188,201,0.12)', border: '1px solid rgba(67,188,201,0.25)',
              fontSize: '10px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {company?.plan?.toUpperCase() || 'FLOTTE'}
            </span>
            {company?.is_active && (
              <span style={{
                padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: '10px', fontWeight: 700, color: '#22C55E',
              }}>
                {t('fleet.active')}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px', flex: 1 }}>
          {NAV.map(({ id, Icon }) => {
            const label = t(`fleet.tabs.${id === 'rapports' ? 'reports' : id}`)
            const active = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 12px', borderRadius: '7px', border: 'none',
                marginBottom: '2px', cursor: 'pointer', textAlign: 'left',
                background: active ? 'rgba(67,188,201,0.08)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
                fontSize: '12px', fontWeight: active ? 600 : 400,
                position: 'relative', transition: 'all 0.12s',
                borderLeft: active ? '2px solid #43BCC9' : '2px solid transparent',
              }}>
                <Icon size={13} style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={async () => { await signOut(); navigate('/') }} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.25)', fontSize: '11px', padding: 0,
          }}>
            <LogOut size={11} /> {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Sticky top bar */}
        <div style={{
          padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 20, height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {t(`fleet.tabs.${tab === 'rapports' ? 'reports' : tab}`)}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {company?.name || 'MecaLIK Fleet'} · {vehicles.length} {t('fleet.vehiclesCount')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <LanguageSwitcher />
            <button onClick={fetchAll} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px',
            }}>
              <RefreshCw size={13} /> {t('common.refresh')}
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))} style={{
              background: '#43BCC9', color: '#0A0A0A', border: 'none',
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Plus size={14} /> {t('fleet.actions.requestIntervention')}
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: '28px', flex: 1 }}>

          {/* ══ VUE D'ENSEMBLE ══ */}
          {tab === 'overview' && (
            <div>
              {/* KPI cards with left-border accent */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: t('fleet.stats.total'),       value: vehicles.length, color: 'white',   border: 'rgba(255,255,255,0.2)', sub: t('fleet.stats.vehicles')    },
                  { label: t('fleet.stats.operational'), value: operational,     color: '#43BCC9', border: '#43BCC9',               sub: t('fleet.stats.inOperation')  },
                  { label: t('fleet.stats.serviceDue'),  value: serviceDue,      color: '#F0C040', border: '#F0C040',               sub: t('fleet.stats.toPlan')       },
                  { label: t('fleet.stats.inService'),   value: inService,       color: '#43BCC9', border: '#43BCC9',               sub: t('fleet.stats.currently')    },
                  { label: t('fleet.stats.alerts'),      value: alerts,          color: '#FF4444', border: '#FF4444',               sub: t('fleet.stats.urgent')       },
                ].map((s, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '20px 24px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: `3px solid ${s.border}`,
                    borderRadius: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Maintenance alerts */}
              {(() => {
                const sixMonthsAgo = new Date()
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
                const alertVehicles = vehicles.filter(v => {
                  const vBk = bookings.filter(b => b.fleet_vehicle_id === v.id && b.status === 'completed')
                  if (vBk.length === 0) return true
                  return new Date(vBk[0].created_at) < sixMonthsAgo
                })
                if (alertVehicles.length === 0) return null
                const isFr = i18n.language !== 'en'
                return (
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                        {isFr ? 'Maintenance à planifier' : 'Maintenance due'}
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', background: 'rgba(240,192,64,0.15)', color: '#F0C040', fontSize: '11px', fontWeight: 700 }}>
                        {alertVehicles.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {alertVehicles.map(v => {
                        const last = bookings.filter(b => b.fleet_vehicle_id === v.id && b.status === 'completed')[0]
                        return (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.15)' }}>
                            <div style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{v.brand} {v.model}</div>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                {v.plate} · {last
                                  ? (isFr ? `Dernier service : ${new Date(last.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}` : `Last service: ${new Date(last.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`)
                                  : (isFr ? 'Jamais entretenu' : 'Never serviced')}
                              </div>
                            </div>
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                              style={{ padding: '8px 16px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                              {isFr ? 'Planifier' : 'Schedule'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Two-column: quick actions + recent interventions */}
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px' }}>

                {/* Quick actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    {t('fleet.actions.quickActions')}
                  </div>

                  {[
                    { label: t('fleet.actions.newIntervention'), sub: t('fleet.actions.bookService'),                   color: '#43BCC9',              bg: 'rgba(67,188,201,0.06)',   border: 'rgba(67,188,201,0.2)',  Icon: Plus,          onClick: () => window.dispatchEvent(new CustomEvent('openBooking')) },
                    { label: t('fleet.actions.viewVehicles'),    sub: `${vehicles.length} ${t('fleet.actions.vehiclesRegistered')}`,  color: 'white',               bg: 'rgba(255,255,255,0.03)',  border: 'rgba(255,255,255,0.07)', Icon: Car,           onClick: () => setTab('vehicles') },
                    { label: t('fleet.actions.monthReport'),     sub: `${monthSpend} ${t('fleet.actions.spent')}`,                    color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', Icon: FileText,      onClick: () => setTab('rapports') },
                    { label: t('fleet.actions.contact'),         sub: t('fleet.actions.whatsapp'),                    color: '#00DD88',              bg: 'rgba(0,221,136,0.05)',    border: 'rgba(0,221,136,0.15)',  Icon: MessageCircle, onClick: () => window.open('https://wa.me/212777348065', '_blank') },
                  ].map((a, i) => (
                    <button key={i} onClick={a.onClick} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '8px', cursor: 'pointer',
                      background: a.bg, border: `1px solid ${a.border}`, textAlign: 'left',
                    }}>
                      <a.Icon size={14} color={a.color} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: a.color, marginBottom: '1px' }}>{a.label}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{a.sub}</div>
                      </div>
                      <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                    </button>
                  ))}

                  {/* Company contact */}
                  {(company?.contact_phone || company?.contact_name) && (
                    <div style={{ marginTop: '8px', padding: '12px 14px', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                        {t('fleet.contact.company')}
                      </div>
                      {company?.contact_name  && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '3px' }}>{company.contact_name}</div>}
                      {company?.contact_phone && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{company.contact_phone}</div>}
                    </div>
                  )}
                </div>

                {/* Recent interventions */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {t('fleet.recentInterventions')}
                    </div>
                    <button onClick={() => setTab('interventions')} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#43BCC9', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px',
                    }}>
                      {t('fleet.viewAll')} <ArrowUpRight size={11} />
                    </button>
                  </div>
                  <BookingsTable bookings={bookings.slice(0, 8)} onRowClick={id => navigate(`/booking/${id}`)} compact />
                </div>
              </div>
            </div>
          )}

          {/* ══ VÉHICULES ══ */}
          {tab === 'vehicles' && (
            <div>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '7px 12px' }}>
                  <Search size={13} color="rgba(255,255,255,0.3)" />
                  <input
                    value={vehicleSearch}
                    onChange={e => setVehicleSearch(e.target.value)}
                    placeholder={t('fleet.vehicles.search')}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '12px', flex: 1, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {(['all', 'operational', 'service_due', 'in_service', 'alert'] as const).map(f => (
                    <button key={f} onClick={() => setVehicleFilter(f)} style={{
                      padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                      background: vehicleFilter === f ? 'rgba(67,188,201,0.12)' : 'rgba(255,255,255,0.04)',
                      color: vehicleFilter === f ? '#43BCC9' : 'rgba(255,255,255,0.45)',
                    }}>
                      {f === 'all' ? t('fleet.vehicles.filters.all') : t(`fleet.vehicles.filters.${f === 'service_due' ? 'serviceDue' : f === 'in_service' ? 'inService' : f}`)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportCSV(filteredVehicles as unknown as Record<string, unknown>[], 'mecalik-flotte.csv')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer' }}>
                  <Download size={11} /> {t('fleet.vehicles.exportCsv')}
                </button>
              </div>

              {filteredVehicles.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    {vehicleSearch || vehicleFilter !== 'all' ? t('fleet.vehicles.noResults') : t('fleet.vehicles.noVehicles')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{t('fleet.vehicles.contactToRegister')}</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {filteredVehicles.map(v => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      bookings={bookings.filter(b => b.fleet_vehicle_id === v.id)}
                      onBook={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                      onHistory={() => setSelectedVehicle(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ INTERVENTIONS ══ */}
          {tab === 'interventions' && (
            <div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '7px 12px' }}>
                  <Search size={13} color="rgba(255,255,255,0.3)" />
                  <input
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    placeholder={t('fleet.interventions.search')}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '12px', flex: 1, fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {(['all', 'pending', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setBookingFilter(f)} style={{
                      padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 500,
                      background: bookingFilter === f ? 'rgba(67,188,201,0.12)' : 'rgba(255,255,255,0.04)',
                      color: bookingFilter === f ? '#43BCC9' : 'rgba(255,255,255,0.45)',
                    }}>
                      {f === 'all' ? t('common.all') : t(`status.${f}`)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => exportCSV(filteredBookings as unknown as Record<string, unknown>[], 'mecalik-interventions.csv')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer' }}>
                  <Download size={11} /> {t('fleet.interventions.exportCsv')}
                </button>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                {filteredBookings.length} {filteredBookings.length !== 1 ? t('fleet.interventions.totalPlural') : t('fleet.interventions.total')}
                {bookingFilter !== 'all' || bookingSearch ? ` · ${t('fleet.interventions.filtered')} ${bookings.length}` : ` ${t('fleet.interventions.inTotal')}`}
              </div>

              {filteredBookings.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  {t('fleet.interventions.noInterventions')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredBookings.map(b => {
                    const dotColor = b.status === 'completed' ? '#22C55E' : b.status === 'cancelled' ? '#FF4444' : '#43BCC9'
                    const badgeBg  = b.status === 'completed' ? 'rgba(34,197,94,0.1)' : b.status === 'cancelled' ? 'rgba(255,68,68,0.1)' : 'rgba(67,188,201,0.1)'
                    return (
                      <div
                        key={b.id}
                        onClick={() => navigate(`/booking/${b.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: dotColor }} />
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', width: '90px', flexShrink: 0 }}>
                          {b.reference || b.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.service_name}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', width: '80px', textAlign: 'right', flexShrink: 0 }}>
                          {new Date(b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#43BCC9', width: '90px', textAlign: 'right', flexShrink: 0 }}>
                          {b.amount_ttc ? `${b.amount_ttc} MAD` : '—'}
                        </span>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: badgeBg, color: dotColor, width: '90px', textAlign: 'center', flexShrink: 0 }}>
                          {t(`status.${b.status}`)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ FINANCE ══ */}
          {tab === 'finance' && (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: t('fleet.finance.thisMonth'),     value: `${monthSpend} MAD`,  color: '#43BCC9', border: '#43BCC9',               sub: `${thisMonth.filter(b => b.status === 'completed').length} ${t('fleet.finance.interventionsCompleted')}` },
                  { label: t('fleet.finance.total'),          value: `${totalSpend} MAD`,  color: 'white',   border: 'rgba(255,255,255,0.2)', sub: t('fleet.finance.sinceStart') },
                  { label: t('fleet.finance.avgPerVehicle'), value: vehicles.length > 0 ? `${Math.round(totalSpend / vehicles.length)} MAD` : '0 MAD', color: 'white', border: 'rgba(255,255,255,0.2)', sub: t('fleet.finance.overPeriod') },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '20px 24px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `3px solid ${s.border}`, borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Cost per vehicle breakdown */}
              {vehicles.length > 0 && (() => {
                const vSpend = vehicles.map(v => ({
                  v,
                  total: bookings.filter(b => b.fleet_vehicle_id === v.id && b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0),
                  count: bookings.filter(b => b.fleet_vehicle_id === v.id).length,
                })).sort((a, b) => b.total - a.total)
                const maxSpend = vSpend[0]?.total || 1
                return (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                      Dépenses par véhicule
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {vSpend.map(({ v, total, count }, i) => (
                        <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>#{i + 1}</div>
                          <div style={{ width: '150px', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.brand} {v.model}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{v.plate}</div>
                          </div>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${maxSpend > 0 ? (total / maxSpend) * 100 : 0}%`, background: '#43BCC9', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ width: '110px', textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: total > 0 ? '#43BCC9' : 'rgba(255,255,255,0.2)' }}>{total > 0 ? `${total} MAD` : '—'}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{count} intervention{count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('fleet.finance.paymentHistory')}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const completed = bookings.filter(b => b.status === 'completed' && b.amount_ttc)
                      const win = window.open('', '_blank')
                      if (!win) return
                      const rows = completed.map(b => `<tr><td>${b.reference || b.id.slice(0, 8).toUpperCase()}</td><td>${b.service_name}</td><td>${new Date(b.created_at).toLocaleDateString('fr-FR')}</td><td style="text-align:right;font-weight:600">${b.amount_ttc} MAD</td></tr>`).join('')
                      win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>MecaLIK — Factures</title><style>body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:800px;margin:0 auto}h1{color:#43BCC9;margin-bottom:4px;font-size:22px}p{color:#888;font-size:13px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:28px}th{background:#f5f5f5;padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:600}td{padding:11px 14px;border-bottom:1px solid #eee;font-size:13px}.total{font-size:16px;font-weight:700;text-align:right;padding:18px 0;border-top:2px solid #111}@media print{button{display:none}}</style></head><body><h1>MecaLIK</h1><p>Récapitulatif des interventions · ${company?.name || ''}</p><p style="font-size:11px;color:#aaa">Généré le ${new Date().toLocaleDateString('fr-FR')}</p><table><thead><tr><th>Référence</th><th>Service</th><th>Date</th><th style="text-align:right">Montant</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total : ${totalSpend} MAD</div></body></html>`)
                      win.document.close()
                      setTimeout(() => win.print(), 400)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.18)', color: '#00DD88', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    🖨️ Imprimer
                  </button>
                  <button
                    onClick={() => exportCSV(bookings.filter(b => b.status === 'completed') as unknown as Record<string, unknown>[], 'mecalik-factures.csv')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.18)', color: '#43BCC9', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    <Download size={11} /> {t('fleet.finance.export')}
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px 100px', padding: '9px 18px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {[t('fleet.interventions.reference'), t('fleet.interventions.service'), t('fleet.interventions.date'), t('fleet.interventions.amount'), t('fleet.interventions.status')].map(h => (
                    <div key={h} style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</div>
                  ))}
                </div>

                {bookings.filter(b => b.amount_ttc).length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', background: '#0A0A0A' }}>
                    {t('fleet.finance.noInvoices')}
                  </div>
                ) : bookings.filter(b => b.amount_ttc).slice(0, 30).map((b, i, arr) => {
                  const s = BOOKING_STATUS[b.status] || BOOKING_STATUS.completed
                  return (
                    <div key={b.id} onClick={() => navigate(`/booking/${b.id}`)}
                      style={{
                        display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px 100px',
                        padding: '12px 18px', alignItems: 'center', cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{b.reference || b.id.substring(0, 8).toUpperCase()}</div>
                      <div style={{ fontSize: '12px', color: 'white' }}>{b.service_name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#00DD88' }}>{b.amount_ttc} MAD</div>
                      <span style={{ padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, background: s.bg, color: s.color }}>{t(`status.${b.status}`)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ RAPPORTS ══ */}
          {tab === 'rapports' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => exportCSV(vehicles.map(v => ({
                    Plaque:        v.plate,
                    Véhicule:      `${v.brand} ${v.model}`,
                    Conducteur:    v.driver_name || '',
                    Kilométrage:   v.mileage || '',
                    Statut:        VEHICLE_STATUS[v.status]?.label || v.status,
                    Interventions: bookings.filter(b => b.fleet_vehicle_id === v.id).length,
                    TotalMAD:      bookings.filter(b => b.fleet_vehicle_id === v.id && b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0),
                  })), 'mecalik-rapport-flotte.csv')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.2)', color: '#43BCC9', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <Download size={12} /> {t('fleet.reports.fleetReport')}
                </button>
                <button
                  onClick={() => exportCSV(bookings.map(b => ({
                    Reference:  b.reference,
                    Service:    b.service_name,
                    Adresse:    b.address,
                    Statut:     b.status,
                    MontantMAD: b.amount_ttc || 0,
                    Date:       new Date(b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR'),
                  })), 'mecalik-rapport-interventions.csv')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                  <Download size={12} /> {t('fleet.reports.interventionsReport')}
                </button>
              </div>

              {/* Spend chart */}
              {chartData.length > 0 && (
                <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '18px 22px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '14px', letterSpacing: '-0.01em' }}>
                    {t('fleet.reports.spendByService')}
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: 'white' }}
                        formatter={(val: unknown) => [`${val} MAD`]}
                      />
                      <Bar dataKey="total" fill="#43BCC9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Per-vehicle consumption table */}
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                {t('fleet.reports.consumptionByVehicle')}
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 80px 110px 140px', padding: '9px 18px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {[t('fleet.vehicles.vehicle'), t('fleet.vehicles.plate'), t('fleet.reports.interventionsCol'), t('fleet.reports.totalMad'), t('fleet.reports.lastService')].map(h => (
                    <div key={h} style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</div>
                  ))}
                </div>
                {vehicles.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', background: '#0A0A0A' }}>{t('fleet.reports.noVehicles')}</div>
                ) : vehicles.map((v, i) => {
                  const vBk    = bookings.filter(b => b.fleet_vehicle_id === v.id)
                  const vTotal = vBk.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)
                  const last   = vBk[0]
                  return (
                    <div key={v.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 110px 80px 110px 140px',
                        padding: '12px 18px', alignItems: 'center',
                        borderBottom: i < vehicles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>{v.brand} {v.model}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '3px', display: 'inline-block' }}>{v.plate}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{vBk.length}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: vTotal > 0 ? '#43BCC9' : 'rgba(255,255,255,0.3)' }}>{vTotal > 0 ? `${vTotal} MAD` : '—'}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        {last ? new Date(last.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ VEHICLE HISTORY MODAL ═══ */}
      {selectedVehicle && (() => {
        const vBk = bookings.filter(b => b.fleet_vehicle_id === selectedVehicle.id)
        const vTotal = vBk.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)
        const last = vBk[0]
        return (
          <div
            onClick={() => setSelectedVehicle(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>{selectedVehicle.plate}</div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                {[
                  { label: 'Total dépensé', value: vTotal > 0 ? `${vTotal} MAD` : '0 MAD', color: '#00DD88' },
                  { label: 'Interventions', value: String(vBk.length), color: 'white' },
                  { label: 'Dernier service', value: last ? new Date(last.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', color: 'rgba(255,255,255,0.6)' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0D0D0D', padding: '14px 18px' }}>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Scrollable list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {vBk.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Aucune intervention</div>
                ) : vBk.map((b, i) => {
                  const s = BOOKING_STATUS[b.status] || { label: b.status, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)' }
                  return (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderBottom: i < vBk.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>{b.service_name}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                          {b.reference || b.id.slice(0, 8).toUpperCase()} · {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {b.amount_ttc != null && <div style={{ fontSize: '12px', fontWeight: 600, color: '#00DD88', marginBottom: '2px' }}>{b.amount_ttc} MAD</div>}
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, background: s.bg, color: s.color }}>{b.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── BookingsTable ─────────────────────────────────────────────────────────────

function BookingsTable({
  bookings, onRowClick, compact = false,
}: {
  bookings: Booking[]
  onRowClick: (id: string) => void
  compact?: boolean
}) {
  const { t, i18n } = useTranslation()

  if (bookings.length === 0) {
    return (
      <div style={{ padding: compact ? '24px' : '36px', textAlign: 'center', background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
        {t('fleet.interventions.noInterventions')}
      </div>
    )
  }

  const cols = compact ? '100px 1fr 100px 80px' : '120px 1.2fr 1.5fr 110px 80px 100px'

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '9px 18px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {(compact
          ? [t('fleet.interventions.reference'), t('fleet.interventions.service'), t('fleet.interventions.status'), t('fleet.interventions.date')]
          : [t('fleet.interventions.reference'), t('fleet.interventions.service'), t('fleet.interventions.address'), t('fleet.interventions.technician'), t('fleet.interventions.amount'), t('fleet.interventions.status')]
        ).map(h => (
          <div key={h} style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</div>
        ))}
      </div>

      {bookings.map((b, i) => {
        const s = BOOKING_STATUS[b.status] || { label: b.status, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)' }
        return (
          <div key={b.id} onClick={() => onRowClick(b.id)}
            style={{
              display: 'grid', gridTemplateColumns: cols,
              padding: compact ? '10px 18px' : '12px 18px', alignItems: 'center',
              borderBottom: i < bookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              {b.reference || b.id.substring(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: compact ? '12px' : '13px', color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
              {b.service_name}
            </div>
            {!compact && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {b.address}
              </div>
            )}
            {!compact && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                {b.technician_name || '—'}
              </div>
            )}
            {!compact && (
              <div style={{ fontSize: '12px', fontWeight: b.amount_ttc ? 600 : 400, color: b.amount_ttc ? '#00DD88' : 'rgba(255,255,255,0.3)' }}>
                {b.amount_ttc ? `${b.amount_ttc} MAD` : '—'}
              </div>
            )}
            <span style={{ padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, background: s.bg, color: s.color }}>
              {t(`status.${b.status}`)}
            </span>
            {compact && (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                {new Date(b.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── VehicleCard ───────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle: v, bookings: vBk, onBook, onHistory,
}: {
  vehicle: FleetVehicle
  bookings: Booking[]
  onBook: () => void
  onHistory: () => void
}) {
  const lastService = vBk.find(b => b.status === 'completed')
  const mileageColor = !v.mileage ? '#43BCC9' : v.mileage < 100000 ? '#43BCC9' : v.mileage < 150000 ? '#F0C040' : '#FF4444'
  const cardBorder = v.status === 'alert' ? 'rgba(255,68,68,0.25)' : v.status === 'service_due' ? 'rgba(240,192,64,0.2)' : 'rgba(255,255,255,0.07)'
  const statusStyle = (
    v.status === 'operational' ? { background: 'rgba(34,197,94,0.1)', color: '#22C55E' } :
    v.status === 'service_due' ? { background: 'rgba(240,192,64,0.1)', color: '#F0C040' } :
    v.status === 'alert'       ? { background: 'rgba(255,68,68,0.1)',  color: '#FF4444' } :
    v.status === 'in_service'  ? { background: 'rgba(67,188,201,0.1)', color: '#43BCC9' } :
                                 { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
  )
  const statusLabel = VEHICLE_STATUS[v.status]?.label || v.status
  const driverInitials = v.driver_name
    ? v.driver_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${cardBorder}`,
      borderRadius: '14px', padding: '22px',
      display: 'flex', flexDirection: 'column', gap: '16px',
      position: 'relative',
    }}>

      {/* Row 1: Name + year inline + status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'white', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.01em' }}>
            {v.brand} {v.model}
          </span>
          {v.year && (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' }}>
              {v.year}
            </span>
          )}
        </div>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em', flexShrink: 0, ...statusStyle }}>
          {statusLabel}
        </span>
      </div>

      {/* Row 2: Plate badge */}
      <div style={{ display: 'inline-flex', width: 'fit-content' }}>
        <span style={{ padding: '5px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 700, color: 'white', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          {v.plate}
        </span>
      </div>

      {/* Row 3: Mileage bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Kilométrage
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: mileageColor }}>
            {v.mileage ? v.mileage.toLocaleString('fr-FR') + ' km' : '—'}
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(((v.mileage || 0) / 200000) * 100, 100)}%`, background: mileageColor, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Row 4: Driver */}
      {v.driver_name ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: '#43BCC9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#0A0A0A' }}>
            {driverInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v.driver_name}
            </div>
            {v.driver_phone && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{v.driver_phone}</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', opacity: 0.4 }}>?</span>
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Aucun conducteur assigné</span>
        </div>
      )}

      {/* Row 5: Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          {
            label: 'Dernier service',
            value: lastService ? new Date(lastService.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Jamais',
            valueColor: lastService ? 'white' : 'rgba(255,68,68,0.8)',
          },
          {
            label: 'Interventions',
            value: String(vBk.length),
            valueColor: vBk.length > 0 ? '#43BCC9' : 'rgba(255,255,255,0.3)',
          },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: stat.valueColor }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 6: Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          onClick={onHistory}
          style={{ padding: '10px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
          Historique
        </button>
        <button
          onClick={onBook}
          style={{ padding: '10px', borderRadius: '8px', background: '#43BCC9', border: 'none', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
          Réserver
        </button>
      </div>
    </div>
  )
}
