import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  RefreshCw, Plus, Wrench,
  LayoutDashboard, Car, Calendar, FileText,
  LogOut, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

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
  created_at: string
  fleet_vehicle_id: string | null
}

type Company = {
  id: string
  name: string
  contact_name: string | null
  plan: string | null
  vehicle_count: number | null
}

type TabId = 'overview' | 'fleet' | 'planning' | 'interventions' | 'rapports'

const VEHICLE_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  operational: { label: 'Opérationnel',  color: '#00DD88', bg: 'rgba(0,221,136,0.08)'   },
  service_due:  { label: 'Service requis', color: '#F0C040', bg: 'rgba(240,192,64,0.08)'  },
  in_service:   { label: 'En service',    color: '#43BCC9', bg: 'rgba(67,188,201,0.08)'  },
  alert:        { label: 'Alerte',        color: '#FF4444', bg: 'rgba(255,68,68,0.08)'   },
}

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'En attente', color: '#F0C040' },
  confirmed:   { label: 'Confirmée',  color: '#43BCC9' },
  in_progress: { label: 'En cours',   color: '#43BCC9' },
  completed:   { label: 'Terminée',   color: '#00DD88' },
  cancelled:   { label: 'Annulée',    color: '#FF4444' },
}

export default function FleetDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]           = useState<TabId>('overview')
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [company, setCompany]   = useState<Company | null>(null)
  const [loading, setLoading]   = useState(true)

  void loading

  useEffect(() => {
    if (!user) return
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileData?.company_id) {
        const [companyRes, vehiclesRes, bookingsRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', profileData.company_id).single(),
          supabase.from('fleet_vehicles').select('*').eq('company_id', profileData.company_id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').eq('company_id', profileData.company_id).order('created_at', { ascending: false }).limit(100),
        ])
        setCompany(companyRes.data)
        setVehicles(vehiclesRes.data || [])
        setBookings(bookingsRes.data || [])
      }
    } catch (_) {}
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // ── Stats ──
  const operational = vehicles.filter(v => v.status === 'operational').length
  const serviceDue  = vehicles.filter(v => v.status === 'service_due').length
  const inService   = vehicles.filter(v => v.status === 'in_service').length
  const alerts      = vehicles.filter(v => v.status === 'alert').length
  const totalSpent  = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)

  // ── Chart data ──
  const serviceTypeCounts: Record<string, number> = {}
  bookings.forEach(b => {
    const key = b.service_name.split(' ')[0]
    serviceTypeCounts[key] = (serviceTypeCounts[key] || 0) + 1
  })
  const barData = Object.entries(serviceTypeCounts)
    .map(([name, count]) => ({ name, count }))
    .slice(0, 6)

  const pieData = [
    { name: 'Opérationnel',  value: operational, color: '#00DD88' },
    { name: 'Service requis', value: serviceDue,  color: '#F0C040' },
    { name: 'En service',    value: inService,   color: '#43BCC9' },
    { name: 'Alerte',        value: alerts,      color: '#FF4444' },
  ].filter(d => d.value > 0)

  // Ensure pie has at least one segment
  const pieDataSafe = pieData.length > 0 ? pieData : [{ name: 'Aucun', value: 1, color: 'rgba(255,255,255,0.1)' }]

  const NAV_ITEMS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'overview',      label: "Vue d'ensemble", Icon: LayoutDashboard },
    { id: 'fleet',         label: 'Ma flotte',       Icon: Car             },
    { id: 'planning',      label: 'Planning',         Icon: Calendar        },
    { id: 'interventions', label: 'Interventions',    Icon: Wrench          },
    { id: 'rapports',      label: 'Rapports',         Icon: FileText        },
  ]

  const now = new Date()
  const thisMonthBookings    = bookings.filter(b => new Date(b.created_at).getMonth() === now.getMonth() && new Date(b.created_at).getFullYear() === now.getFullYear())
  const thisMonthSpent       = thisMonthBookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.amount_ttc || 0), 0)
  const avgCostPerVehicle    = vehicles.length > 0 ? Math.round(totalSpent / vehicles.length) : 0

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#080808',
      fontFamily: 'Outfit, system-ui, sans-serif',
    }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#050505',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            fontSize: '15px', fontWeight: 700, color: 'white',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', marginBottom: '2px',
          }}>
            Meca<span style={{ color: '#43BCC9' }}>LIK</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Fleet Management
          </div>
        </div>

        {/* Company badge */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: 'white',
            marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {company?.name || 'Ma flotte'}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(240,192,64,0.1)', border: '1px solid rgba(240,192,64,0.2)',
            fontSize: '9px', fontWeight: 700, color: '#F0C040', letterSpacing: '0.08em',
          }}>
            {company?.plan?.toUpperCase() || 'FLOTTE'}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px', flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = tab === id
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '8px', border: 'none',
                marginBottom: '2px', cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: '13px', fontWeight: isActive ? 500 : 400,
                textAlign: 'left', position: 'relative', transition: 'all 0.15s',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: '2px', background: '#F0C040', borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <Icon size={14} style={{ opacity: isActive ? 1 : 0.5, flexShrink: 0 }} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            fontSize: '11px', color: 'rgba(255,255,255,0.25)',
            marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </div>
          <button onClick={handleSignOut} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: 0,
          }}>
            <LogOut size={12} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, overflow: 'auto', background: '#080808' }}>

        {/* Top bar */}
        <div style={{
          padding: '14px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#080808',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              {NAV_ITEMS.find(n => n.id === tab)?.label}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
              MecaLIK Fleet · {company?.name || 'Tableau de bord'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={fetchAll} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '6px 12px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            }}>
              <RefreshCw size={12} /> Actualiser
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
              style={{
                background: '#F0C040', color: '#080808',
                border: 'none', padding: '7px 16px', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <Plus size={14} /> Demander une intervention
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: '28px 32px' }}>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div>
              {/* Stat row */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '1px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px', overflow: 'hidden', marginBottom: '28px',
              }}>
                {[
                  { label: 'Véhicules',      value: vehicles.length, color: 'white',    sub: 'total'        },
                  { label: 'Opérationnels',  value: operational,     color: '#00DD88',  sub: 'en service'   },
                  { label: 'Service requis', value: serviceDue,      color: '#F0C040',  sub: 'à planifier'  },
                  { label: 'En intervention',value: inService,       color: '#43BCC9',  sub: 'actuellement' },
                  { label: 'Alertes',        value: alerts,          color: '#FF4444',  sub: 'urgent'       },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0D0D0D', padding: '18px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4px' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '28px' }}>
                {/* Bar chart */}
                <div style={{
                  background: '#0D0D0D',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: '2px solid rgba(67,188,201,0.25)',
                  borderRadius: '12px', padding: '20px 24px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                    Interventions par type
                  </div>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: 'white' }}
                          formatter={(val: number) => [`${val} interventions`]}
                        />
                        <Bar dataKey="count" fill="#43BCC9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
                      Aucune donnée
                    </div>
                  )}
                </div>

                {/* Pie chart */}
                <div style={{
                  background: '#0D0D0D',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: '2px solid rgba(240,192,64,0.25)',
                  borderRadius: '12px', padding: '20px 24px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                    État de la flotte
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <PieChart width={120} height={120}>
                      <Pie data={pieDataSafe} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                        {pieDataSafe.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{d.value}</span>
                        </div>
                      ))}
                      {pieData.length === 0 && (
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Ajoutez des véhicules</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent interventions */}
              <TableLabel>Interventions récentes</TableLabel>
              <BookingsTable bookings={bookings.slice(0, 8)} onRowClick={id => navigate(`/booking/${id}`)} />
            </div>
          )}

          {/* ══ FLEET ══ */}
          {tab === 'fleet' && (
            <div>
              <TableLabel>{vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''} enregistré{vehicles.length !== 1 ? 's' : ''}</TableLabel>

              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 110px 1fr 140px 130px 90px',
                  padding: '10px 20px', background: '#0D0D0D',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {['Véhicule', 'Plaque', 'Type', 'Kilométrage', 'Statut', 'Action'].map(h => (
                    <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {h}
                    </div>
                  ))}
                </div>

                {vehicles.length === 0 ? (
                  <div style={{ padding: '52px', textAlign: 'center', background: '#0A0A0A' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Aucun véhicule enregistré</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>Contactez MecaLIK pour enregistrer votre flotte</div>
                  </div>
                ) : vehicles.map((v, i) => {
                  const statusCfg = VEHICLE_STATUS[v.status] || VEHICLE_STATUS.operational
                  return (
                    <div
                      key={v.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 110px 1fr 140px 130px 90px',
                        padding: '14px 20px', alignItems: 'center',
                        borderBottom: i < vehicles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: 'transparent', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{v.brand} {v.model}</div>
                        {v.driver_name && (
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>{v.driver_name}</div>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.75)',
                        background: 'rgba(255,255,255,0.05)', padding: '3px 7px', borderRadius: '4px',
                        display: 'inline-block', letterSpacing: '0.05em',
                      }}>
                        {v.plate}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{v.type || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                        {v.mileage ? v.mileage.toLocaleString('fr-FR') + ' km' : '—'}
                      </div>
                      <div>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px',
                          fontSize: '11px', fontWeight: 500,
                          background: statusCfg.bg, color: statusCfg.color,
                        }}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                        style={{
                          padding: '5px 10px',
                          background: 'rgba(240,192,64,0.08)',
                          border: '1px solid rgba(240,192,64,0.18)',
                          color: '#F0C040', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Réserver
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ PLANNING ══ */}
          {tab === 'planning' && (
            <div style={{
              background: '#0D0D0D',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '60px',
              textAlign: 'center',
            }}>
              <Calendar size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                Planification des interventions
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                Fonctionnalité disponible prochainement
              </div>
            </div>
          )}

          {/* ══ INTERVENTIONS ══ */}
          {tab === 'interventions' && (
            <div>
              <TableLabel>{bookings.length} intervention{bookings.length !== 1 ? 's' : ''} au total</TableLabel>
              <BookingsTable bookings={bookings} onRowClick={id => navigate(`/booking/${id}`)} />
            </div>
          )}

          {/* ══ RAPPORTS ══ */}
          {tab === 'rapports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                {[
                  { label: 'Interventions ce mois', value: String(thisMonthBookings.length), color: '#43BCC9' },
                  { label: 'Dépenses ce mois',      value: `${thisMonthSpent} MAD`,           color: '#00DD88' },
                  { label: 'Coût moyen / véhicule', value: `${avgCostPerVehicle} MAD`,        color: '#F0C040' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table + export */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <TableLabel>Toutes les interventions</TableLabel>
                  <button
                    onClick={() => {
                      const csv = [
                        'Reference,Service,Adresse,Statut,Montant,Date',
                        ...bookings.map(b =>
                          `${b.reference || b.id},${b.service_name},"${b.address}",${b.status},${b.amount_ttc || 0},${b.created_at}`
                        ),
                      ].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url  = URL.createObjectURL(blob)
                      const a    = document.createElement('a')
                      a.href = url; a.download = 'mecalik-fleet-report.csv'; a.click()
                      URL.revokeObjectURL(url)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.18)',
                      color: '#F0C040', padding: '6px 12px', borderRadius: '8px',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Download size={12} /> Exporter CSV
                  </button>
                </div>
                <BookingsTable bookings={bookings} onRowClick={id => navigate(`/booking/${id}`)} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TableLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '12px',
    }}>
      {children}
    </div>
  )
}

function BookingsTable({
  bookings, onRowClick,
}: {
  bookings: Booking[]
  onRowClick: (id: string) => void
}) {
  if (bookings.length === 0) {
    return (
      <div style={{
        padding: '48px', textAlign: 'center',
        background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', color: 'rgba(255,255,255,0.3)', fontSize: '13px',
      }}>
        Aucune intervention
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 1.5fr 110px 90px 90px',
        padding: '10px 20px', background: '#0D0D0D',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {['Référence', 'Service', 'Adresse', 'Statut', 'Montant', 'Date'].map(h => (
          <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {h}
          </div>
        ))}
      </div>

      {bookings.map((b, i) => {
        const s = BOOKING_STATUS[b.status] || { label: b.status, color: 'rgba(255,255,255,0.5)' }
        return (
          <div
            key={b.id}
            onClick={() => onRowClick(b.id)}
            style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 1.5fr 110px 90px 90px',
              padding: '13px 20px', alignItems: 'center',
              borderBottom: i < bookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {b.reference || b.id.substring(0, 8).toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{b.service_name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {b.address}
            </div>
            <div>
              <span style={{
                padding: '3px 7px', borderRadius: '4px',
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.03em',
                background: s.color + '18', color: s.color,
              }}>
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
              {b.amount_ttc ? b.amount_ttc + ' MAD' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
              {new Date(b.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
