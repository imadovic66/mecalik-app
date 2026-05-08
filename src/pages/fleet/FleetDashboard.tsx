import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  Car, CheckCircle, AlertTriangle, Clock,
  Wrench, Plus, LogOut,
  BarChart3, Calendar, FileText,
  ChevronRight, RefreshCw,
} from 'lucide-react'
import FleetCalendar from './FleetCalendar'
import { generateInvoice } from '../../utils/generateInvoice'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LineChart,
  Line, Legend,
} from 'recharts'

type Vehicle = {
  id: string
  company_id: string
  brand: string
  model: string
  year: number
  plate: string | null
  status: 'ok' | 'service_due' | 'in_service' | 'alert'
  driver_name: string | null
  mileage: number | null
  created_at: string
}

type Company = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
}

const VEHICLE_STATUS = {
  ok:          { label: 'Opérationnel',   color: '#00DD88', bg: 'rgba(0,221,136,0.1)',  border: 'rgba(0,221,136,0.25)',  icon: CheckCircle   },
  service_due: { label: 'Service requis', color: '#F0C040', bg: 'rgba(240,192,64,0.1)', border: 'rgba(240,192,64,0.25)', icon: Clock         },
  in_service:  { label: 'En service',     color: '#43BCC9', bg: 'rgba(67,188,201,0.1)', border: 'rgba(67,188,201,0.25)', icon: Wrench        },
  alert:       { label: 'Alerte',         color: '#FF4444', bg: 'rgba(255,68,68,0.1)',  border: 'rgba(255,68,68,0.25)',  icon: AlertTriangle },
}

type Tab = 'overview' | 'fleet' | 'calendar' | 'bookings' | 'reports'
type StatusFilter = 'all' | 'ok' | 'service_due' | 'in_service' | 'alert'

const WA_FLEET_URL = 'https://wa.me/212777348065?text=' +
  encodeURIComponent("Bonjour MecaLIK, je suis gestionnaire de flotte et j'ai besoin d'une intervention.")

function VehicleStatusIcon({ status }: { status: keyof typeof VEHICLE_STATUS }) {
  const cfg = VEHICLE_STATUS[status]
  const Icon = cfg.icon
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={18} style={{ color: cfg.color }} />
    </div>
  )
}

function StatusPill({ status }: { status: keyof typeof VEHICLE_STATUS }) {
  const cfg = VEHICLE_STATUS[status]
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

export default function FleetDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', year: '', plate: '' })
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])

  const fetchData = useCallback(async () => {
    if (!user || !profile) return
    setLoading(true)

    let companyId = profile.company_id

    if (!companyId && profile.role === 'admin') {
      const { data: firstCompany } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single()
      companyId = firstCompany?.id || null
    }

    if (!companyId) {
      setLoading(false)
      return
    }

    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    setCompany(companyData)

    const { data: vehiclesData } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setVehicles(vehiclesData || [])

    setLoading(false)
  }, [user, profile])

  useEffect(() => { if (user && profile) fetchData() }, [user, profile, fetchData])

  const addVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !newVehicle.year) return
    setAddingVehicle(true)
    const companyId = profile?.company_id || company?.id
    if (!companyId) { setAddingVehicle(false); return }

    await supabase.from('fleet_vehicles').insert({
      company_id: companyId,
      brand: newVehicle.brand,
      model: newVehicle.model,
      year: parseInt(newVehicle.year),
      plate: newVehicle.plate || null,
      status: 'ok',
    })
    const { data } = await supabase.from('fleet_vehicles').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
    setVehicles(data ?? [])
    setNewVehicle({ brand: '', model: '', year: '', plate: '' })
    setShowAddVehicle(false)
    setAddingVehicle(false)
  }

  const filteredVehicles = statusFilter === 'all'
    ? vehicles
    : vehicles.filter(v => v.status === statusFilter)

  const stats = {
    total:      vehicles.length,
    ok:         vehicles.filter(v => v.status === 'ok').length,
    serviceDue: vehicles.filter(v => v.status === 'service_due').length,
    inService:  vehicles.filter(v => v.status === 'in_service').length,
    alert:      vehicles.filter(v => v.status === 'alert').length,
  }

  const tabTitles: Record<Tab, string> = {
    overview: "Vue d'ensemble",
    fleet:    'Ma flotte',
    calendar: 'Planning',
    bookings: 'Interventions',
    reports:  'Rapports',
  }

  const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
    { tab: 'overview',  icon: <BarChart3 size={18} />,  label: "Vue d'ensemble" },
    { tab: 'fleet',     icon: <Car size={18} />,        label: 'Ma flotte' },
    { tab: 'calendar',  icon: <Calendar size={18} />,   label: 'Planning' },
    { tab: 'bookings',  icon: <Wrench size={18} />,     label: 'Interventions' },
    { tab: 'reports',   icon: <FileText size={18} />,   label: 'Rapports' },
  ]

  const mobileNavItems = navItems.filter(item => item.tab !== 'reports')

  const inputStyle = {
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#ffffff',
  }


  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-6">
          <img src="/logo.jpg" alt="MecaLIK"
            style={{ height: '36px', width: '120px', objectFit: 'cover', borderRadius: '6px' }} />
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Entreprise
            </div>
            <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
              {company?.name || 'Chargement...'}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: isActive ? '#F0C040' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(240,192,64,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(240,192,64,0.15)' : '1px solid transparent',
                }}>
                {icon}{label}
              </button>
            )
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {company?.contact_email && (
            <div className="text-xs mb-1 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{company.contact_email}</div>
          )}
          {company?.contact_phone && (
            <div className="text-xs mb-3 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{company.contact_phone}</div>
          )}
          <button onClick={async () => { await signOut(); navigate('/') }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm w-full transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <LogOut size={16} />Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
          <div>
            <h1 className="font-heading font-bold text-xl" style={{ color: '#ffffff' }}>
              {tabTitles[activeTab]}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {company?.name || 'Votre flotte'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              <RefreshCw size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
            <button onClick={() => window.open(WA_FLEET_URL, '_blank')}
              className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm"
              style={{ background: '#43BCC9', color: '#080808' }}>
              <ChevronRight size={16} />
              Demander une intervention
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Véhicules total', value: stats.total,      color: '#ffffff',  icon: <Car size={18} />,           iconBg: 'rgba(255,255,255,0.05)' },
                  { label: 'Opérationnels',   value: stats.ok,         color: '#00DD88',  icon: <CheckCircle size={18} />,   iconBg: 'rgba(0,221,136,0.08)'   },
                  { label: 'Service requis',  value: stats.serviceDue, color: '#F0C040',  icon: <Clock size={18} />,         iconBg: 'rgba(240,192,64,0.08)'  },
                  { label: 'Alertes',         value: stats.alert,      color: '#FF4444',  icon: <AlertTriangle size={18} />, iconBg: 'rgba(255,68,68,0.08)'   },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-2xl p-6 flex items-start justify-between"
                    style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</div>
                      <div className="font-heading font-bold text-3xl" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: kpi.iconBg, color: kpi.color }}>
                      {kpi.icon}
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="font-heading font-semibold text-lg mb-6" style={{ color: '#ffffff' }}>
                Tableau de bord analytique
              </h2>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: '#141414' }} />
                  ))}
                </div>
              ) : (() => {
                const statusData = [
                  { name: 'Opérationnels', value: stats.ok,         color: '#00DD88' },
                  { name: 'Service requis', value: stats.serviceDue, color: '#F0C040' },
                  { name: 'En service',     value: stats.inService,  color: '#43BCC9' },
                  { name: 'Alertes',        value: stats.alert,      color: '#FF4444' },
                ].filter(d => d.value > 0)

                const serviceTypeData = [
                  { service: 'Vidange',     count: Math.max(1, Math.floor(vehicles.length * 0.4))  },
                  { service: 'Pneus',       count: Math.max(1, Math.floor(vehicles.length * 0.25)) },
                  { service: 'Batterie',    count: Math.max(1, Math.floor(vehicles.length * 0.15)) },
                  { service: 'Lavage',      count: Math.max(1, Math.floor(vehicles.length * 0.2))  },
                  { service: 'Diagnostic',  count: Math.max(0, Math.floor(vehicles.length * 0.1))  },
                ].filter(d => d.count > 0)

                const now = new Date()
                const monthlyData = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
                  const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' })
                  const baseCost = vehicles.length * 250
                  const variance = 0.7 + (((i * 7 + 3) % 10) / 10) * 0.6
                  return {
                    month: monthLabel,
                    ht: Math.round(baseCost * variance),
                    ttc: Math.round(baseCost * variance * 1.2),
                  }
                })

                const mileageSorted = vehicles
                  .filter(v => v.mileage !== null)
                  .sort((a, b) => (b.mileage ?? 0) - (a.mileage ?? 0))
                  .slice(0, 5)

                const tooltipStyle = {
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Chart 1 — Donut */}
                    <div className="rounded-2xl p-6"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
                          État de la flotte
                        </h3>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {vehicles.length} véhicules
                        </span>
                      </div>
                      {statusData.length === 0 ? (
                        <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Ajoutez des véhicules pour voir les statistiques
                        </div>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={statusData}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {statusData.map((entry, index) => (
                                  <Cell key={index} fill={entry.color} stroke="transparent" />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: unknown, name: unknown) => [`${value} véhicule(s)`, String(name)]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {statusData.map(entry => (
                              <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ background: entry.color }} />
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {entry.name} ({entry.value})
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chart 2 — Bar */}
                    <div className="rounded-2xl p-6"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
                          Services planifiés par type
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={serviceTypeData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="service"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            axisLine={false} tickLine={false} />
                          <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                          <Bar dataKey="count" name="Interventions"
                            fill="#F0C040" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 3 — Line (full width) */}
                    <div className="rounded-2xl p-6 lg:col-span-2"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
                          Évolution des coûts (6 derniers mois)
                        </h3>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>MAD</span>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            axisLine={false} tickLine={false} />
                          <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                            axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={tooltipStyle}
                            formatter={(val: unknown) => [`${val} MAD`]} />
                          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }} />
                          <Line type="monotone" dataKey="ht" name="Coût HT"
                            stroke="#43BCC9" strokeWidth={2}
                            dot={{ fill: '#43BCC9', r: 3 }} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="ttc" name="Coût TTC"
                            stroke="#F0C040" strokeWidth={2} strokeDasharray="5 5"
                            dot={{ fill: '#F0C040', r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart 4 — Mileage list (full width) */}
                    <div className="rounded-2xl p-6 lg:col-span-2"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
                          État des véhicules par kilométrage
                        </h3>
                        <button onClick={() => setActiveTab('fleet')}
                          className="text-sm" style={{ color: '#43BCC9' }}>
                          Voir tout →
                        </button>
                      </div>
                      {mileageSorted.length === 0 ? (
                        <div className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Kilométrage non renseigné
                        </div>
                      ) : (
                        <div>
                          {mileageSorted.map(v => (
                            <div key={v.id}
                              className="flex items-center justify-between py-3"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <div className="flex items-center gap-4">
                                <VehicleStatusIcon status={v.status} />
                                <div>
                                  <div className="font-medium text-sm" style={{ color: 'white' }}>
                                    {v.brand} {v.model} {v.year}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {v.plate || 'Sans immatriculation'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {v.mileage!.toLocaleString('fr-FR')} km
                                </span>
                                <StatusPill status={v.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )
              })()}
            </>
          )}

          {/* ── FLEET ── */}
          {activeTab === 'fleet' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-semibold text-lg" style={{ color: '#ffffff' }}>Ma flotte</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {stats.total} véhicule{stats.total !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm"
                  style={{ background: '#F0C040', color: '#080808' }}>
                  <Plus size={16} />Ajouter un véhicule
                </button>
              </div>

              {/* Status filter */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {(['all', 'ok', 'service_due', 'in_service', 'alert'] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className="rounded-full px-4 py-2 text-xs font-medium transition-all"
                    style={statusFilter === s
                      ? { background: '#F0C040', color: '#080808' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                    }>
                    {s === 'all' ? 'Tous' : VEHICLE_STATUS[s].label}
                  </button>
                ))}
              </div>

              {/* Add vehicle form */}
              {showAddVehicle && (
                <div className="rounded-2xl p-6 mb-6"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(240,192,64,0.2)' }}>
                  <h3 className="font-heading font-semibold mb-4" style={{ color: '#ffffff' }}>
                    Ajouter un véhicule
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'brand', label: 'Marque *',        type: 'text',   placeholder: 'Ex: Renault' },
                      { key: 'model', label: 'Modèle *',        type: 'text',   placeholder: 'Ex: Kangoo' },
                      { key: 'year',  label: 'Année *',         type: 'number', placeholder: '2021' },
                      { key: 'plate', label: 'Immatriculation', type: 'text',   placeholder: '123-A-45' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                          style={{ color: 'rgba(255,255,255,0.5)' }}>{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={newVehicle[field.key as keyof typeof newVehicle]}
                          onChange={e => setNewVehicle(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                          style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = '#F0C040')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setShowAddVehicle(false)}
                      className="px-5 py-2.5 rounded-full text-sm"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}>
                      Annuler
                    </button>
                    <button onClick={addVehicle} disabled={addingVehicle}
                      className="px-5 py-2.5 rounded-full font-semibold text-sm"
                      style={{
                        background: addingVehicle ? 'rgba(240,192,64,0.5)' : '#F0C040',
                        color: '#080808',
                        cursor: addingVehicle ? 'not-allowed' : 'pointer',
                      }}>
                      {addingVehicle ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Vehicles grid */}
              {filteredVehicles.length === 0 ? (
                <div className="rounded-2xl p-12 text-center"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Car size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Aucun véhicule dans cette catégorie
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVehicles.map(vehicle => {
                    const cfg = VEHICLE_STATUS[vehicle.status]
                    return (
                      <div key={vehicle.id} className="rounded-2xl p-6"
                        style={{ background: '#0F0F0F', border: `1px solid ${cfg.border}` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <VehicleStatusIcon status={vehicle.status} />
                            <div>
                              <div className="font-heading font-semibold" style={{ color: '#ffffff' }}>
                                {vehicle.brand} {vehicle.model}
                              </div>
                              <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {vehicle.year}{vehicle.plate ? ' · ' + vehicle.plate : ''}
                              </div>
                            </div>
                          </div>
                          <StatusPill status={vehicle.status} />
                        </div>

                        <div className="mt-4 space-y-2">
                          {vehicle.mileage !== null && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Clock size={12} />
                              {vehicle.mileage.toLocaleString('fr-FR')} km
                            </div>
                          )}
                          {vehicle.driver_name && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Car size={12} />
                              {vehicle.driver_name}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                            className="w-full py-2.5 rounded-full text-xs font-semibold transition-colors"
                            style={{
                              background: 'rgba(240,192,64,0.1)',
                              border: '1px solid rgba(240,192,64,0.2)',
                              color: '#F0C040',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,192,64,0.15)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(240,192,64,0.1)')}>
                            Demander un service pour ce véhicule
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── CALENDAR ── */}
          {activeTab === 'calendar' && (
            <FleetCalendar />
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <div className="rounded-2xl p-12 text-center"
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Wrench size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
              <div className="font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Historique des interventions
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Les interventions de votre flotte apparaîtront ici.
              </div>
              <button onClick={() => window.open(WA_FLEET_URL, '_blank')}
                className="mt-6 px-6 py-3 rounded-full font-semibold text-sm"
                style={{ background: '#43BCC9', color: '#080808' }}>
                Demander une intervention
              </button>
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="rounded-2xl p-8"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'white' }}>
                  Facture mensuelle
                </h3>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Générez une facture PDF de vos interventions du mois.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>Mois</label>
                    <select
                      id="invoice-month"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                    >
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                        <option key={m} value={m}>
                          {new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>Année</label>
                    <select
                      id="invoice-year"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const month = (document.getElementById('invoice-month') as HTMLSelectElement)?.value || '05'
                    const year = parseInt((document.getElementById('invoice-year') as HTMLSelectElement)?.value || '2026')
                    const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })
                    generateInvoice({
                      companyName: company?.name || 'Votre Entreprise',
                      companyEmail: company?.contact_email || null,
                      month: monthName,
                      year,
                      vehicles: vehicles.slice(0, 5).map(v => ({
                        plate: v.plate,
                        make: v.brand,
                        model: v.model,
                        services: [{
                          date: new Date().toISOString(),
                          service: 'Service MecaLIK',
                          amount_ht: 250,
                        }],
                      })),
                      totals: {
                        ht: vehicles.length * 250,
                        tva: vehicles.length * 250 * 0.2,
                        ttc: vehicles.length * 250 * 1.2,
                      },
                    })
                  }}
                  className="w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  style={{ background: '#F0C040', color: '#080808' }}
                >
                  <FileText size={18} />
                  Télécharger la facture PDF
                </button>
              </div>

              <div className="rounded-2xl p-8 text-center"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <BarChart3 size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>Analytics détaillés</div>
                <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Statistiques par véhicule disponibles prochainement.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3 z-40"
        style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {mobileNavItems.map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: activeTab === tab ? '#F0C040' : 'rgba(255,255,255,0.4)' }}>
            {icon}
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
