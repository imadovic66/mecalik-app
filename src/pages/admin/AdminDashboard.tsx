import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Users,
  LogOut, Clock,
  Search, Eye, X,
  TrendingUp, Wrench, Phone, MapPin,
  Calendar, RefreshCw, MessageSquare, Tag, Star,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { notifyCustomerByWhatsApp, getNotifiableStatuses } from '../../utils/whatsappNotify'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../data/pricing'

type Booking = {
  id: string
  user_id: string
  service_name: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  address: string
  preferred_date: string | null
  amount_ttc: number | null
  notes_admin: string | null
  rating: number | null
  rating_comment: string | null
  created_at: string
  profiles?: { full_name: string | null; phone: string | null }
}

type Customer = {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
}

const STATUS_CONFIG = {
  pending:     { label: 'En attente',  color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.25)'  },
  confirmed:   { label: 'Confirmé',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  in_progress: { label: 'En cours',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  completed:   { label: 'Terminé',     color: '#00DD88', bg: 'rgba(0,221,136,0.1)',   border: 'rgba(0,221,136,0.25)'   },
  cancelled:   { label: 'Annulé',      color: '#FF4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.25)'   },
}

const SERVICE_LABELS: Record<string, string> = {
  lavage: 'Lavage Auto', vidange: 'Vidange & Filtres', batterie: 'Batterie',
  pneus: 'Pneus', diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
}

type Tab = 'overview' | 'bookings' | 'customers' | 'finances'

const STATUS_KEYS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])
  useEffect(() => { if (profile && profile.role !== 'admin') navigate('/dashboard') }, [profile, navigate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: bookingData }, { data: customerData }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false }),
    ])
    setBookings(bookingData ?? [])
    setCustomers(customerData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(true)

    await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId)

    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b)
    )
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus as Booking['status'] } : null)
    }

    if (getNotifiableStatuses().includes(newStatus)) {
      const booking = bookings.find(b => b.id === bookingId)
      if (booking) {
        notifyCustomerByWhatsApp({
          customerName: booking.profiles?.full_name || null,
          customerPhone: booking.profiles?.phone || null,
          serviceLabel: SERVICE_LABELS[booking.service_name] || booking.service_name,
          bookingRef: bookingId.slice(0, 8).toUpperCase(),
          status: newStatus,
        })
      }
    }

    setUpdatingStatus(false)
  }

  const filteredBookings = bookings.filter(b => {
    const matchSearch = !searchQuery ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (SERVICE_LABELS[b.service_name] ?? b.service_name).toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings
      .filter(b => b.status === 'completed' && b.amount_ttc)
      .reduce((sum, b) => sum + (b.amount_ttc ?? 0), 0),
  }

  const now = new Date()
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short' })
    const monthBookings = bookings.filter(b => {
      const bDate = new Date(b.created_at)
      return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear() && b.status === 'completed'
    })
    const revenue = monthBookings.reduce((sum, b) => sum + (b.amount_ttc || 0), 0)
    return { month: monthLabel, revenue }
  })

  const bookingStatusData = [
    { name: 'En attente',  value: bookings.filter(b => b.status === 'pending').length,     color: '#F0C040' },
    { name: 'Confirmé',    value: bookings.filter(b => b.status === 'confirmed').length,   color: '#43BCC9' },
    { name: 'En cours',    value: bookings.filter(b => b.status === 'in_progress').length, color: '#7B6CF6' },
    { name: 'Terminé',     value: bookings.filter(b => b.status === 'completed').length,   color: '#00DD88' },
    { name: 'Annulé',      value: bookings.filter(b => b.status === 'cancelled').length,   color: '#FF4444' },
  ].filter(d => d.value > 0)

  const tabTitles: Record<Tab, string> = {
    overview: 'Vue d\'ensemble',
    bookings: 'Réservations',
    customers: 'Clients',
    finances: 'Finances',
  }

  const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
    { tab: 'overview',  icon: <LayoutDashboard size={18} />, label: 'Vue d\'ensemble' },
    { tab: 'bookings',  icon: <ShoppingBag size={18} />,     label: 'Réservations' },
    { tab: 'customers', icon: <Users size={18} />,           label: 'Clients' },
    { tab: 'finances',  icon: <TrendingUp size={18} />,      label: 'Finances' },
  ]

  const BookingRow = ({ booking }: { booking: Booking }) => (
    <div
      className="rounded-xl p-4 mb-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-center cursor-pointer"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
      onClick={() => setSelectedBooking(booking)}
    >
      <div>
        <div className="font-medium text-sm" style={{ color: '#ffffff' }}>
          {SERVICE_LABELS[booking.service_name] ?? booking.service_name}
        </div>
        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {booking.profiles?.full_name || 'Client'}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {booking.address.length > 30 ? booking.address.slice(0, 30) + '…' : booking.address}
        </span>
      </div>
      <div><StatusPill status={booking.status} /></div>
      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
        <select
          value={booking.status}
          onChange={async (e) => {
            await updateBookingStatus(booking.id, e.target.value)
          }}
          className="rounded-lg px-2 py-1.5 text-xs outline-none cursor-pointer"
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmer</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminer</option>
          <option value="cancelled">Annuler</option>
        </select>
        {booking.profiles?.phone && (
          <a
            href={`tel:${booking.profiles.phone}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.15)' }}
          >
            <Phone size={14} style={{ color: '#00DD88' }} />
          </a>
        )}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67,188,201,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        >
          <Eye size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: '#080808', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="p-6">
          <img src="/logo.jpg" alt="MecaLIK"
            style={{ height: '36px', width: '120px', objectFit: 'cover', borderRadius: '6px' }} />
          <div className="mt-2 px-1">
            <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Administration
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
                  color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: isActive ? '2px solid #43BCC9' : '2px solid transparent',
                  borderTop: '1px solid transparent',
                  borderRight: '1px solid transparent',
                  borderBottom: '1px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  paddingLeft: isActive ? '14px' : '16px',
                }}
              >
                {icon}{label}
              </button>
            )
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs mb-3 px-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {user?.email}
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <LogOut size={18} />Déconnexion
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
              Tableau de bord administrateur
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <RefreshCw size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </button>
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
            >
              Admin
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Réservations totales', value: stats.total,            valueColor: 'white',                       icon: <ShoppingBag size={18} />, iconBg: 'rgba(255,255,255,0.04)', iconColor: 'rgba(255,255,255,0.3)',  cardBorder: 'rgba(255,255,255,0.08)' },
                  { label: 'En attente',            value: stats.pending,          valueColor: '#F0C040',                     icon: <Clock size={18} />,       iconBg: 'rgba(240,192,64,0.07)',  iconColor: 'rgba(240,192,64,0.5)',   cardBorder: 'rgba(240,192,64,0.15)'  },
                  { label: 'En cours',              value: stats.inProgress,       valueColor: stats.inProgress === 0 ? 'rgba(255,255,255,0.25)' : '#43BCC9', icon: <Wrench size={18} />, iconBg: 'rgba(67,188,201,0.06)', iconColor: 'rgba(67,188,201,0.4)', cardBorder: 'rgba(67,188,201,0.12)' },
                  { label: "Chiffre d'affaires",   value: `${stats.revenue} MAD`, valueColor: '#00DD88',                     icon: <TrendingUp size={18} />,  iconBg: 'rgba(0,221,136,0.07)',  iconColor: 'rgba(0,221,136,0.5)',    cardBorder: 'rgba(0,221,136,0.15)'   },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-2xl p-6 flex items-start justify-between"
                    style={{ background: '#0D0D0D', border: `1px solid ${kpi.cardBorder}` }}>
                    <div>
                      <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</div>
                      <div className="font-heading font-bold text-3xl" style={{ color: kpi.valueColor, fontWeight: 800 }}>{kpi.value}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: kpi.iconBg, color: kpi.iconColor }}>
                      {kpi.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Revenue bar chart */}
                <div className="rounded-2xl p-6"
                  style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 className="font-heading font-semibold text-base mb-6" style={{ color: 'white' }}>
                    Revenus (6 derniers mois)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                        formatter={(val: unknown) => [`${val} MAD`, 'Revenus']}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="revenue" name="Revenus" fill="#43BCC9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Booking status donut */}
                <div className="rounded-2xl p-6"
                  style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 className="font-heading font-semibold text-base mb-6" style={{ color: 'white' }}>
                    Répartition des réservations
                  </h3>
                  {bookingStatusData.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Aucune réservation pour le moment
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={bookingStatusData}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={80}
                            paddingAngle={3} dataKey="value"
                          >
                            {bookingStatusData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                            formatter={(val: unknown, name: unknown) => [`${val}`, name as string]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {bookingStatusData.map((entry, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {entry.name} ({entry.value})
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-2xl p-6"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
                    Activité récente
                  </h3>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-sm transition-colors"
                    style={{ color: '#43BCC9' }}
                  >
                    Voir tout →
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#141414' }} />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Aucune réservation pour le moment
                  </div>
                ) : (
                  bookings.slice(0, 5).map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between py-2.5 border-b last:border-0 cursor-pointer"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(67,188,201,0.08)' }}
                        >
                          <Wrench size={14} style={{ color: '#43BCC9' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'white' }}>
                            {SERVICE_LABELS[booking.service_name] || booking.service_name}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {booking.profiles?.full_name || 'Client anonyme'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill status={booking.status} />
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par service, adresse..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', ...STATUS_KEYS].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className="rounded-full px-4 py-2 text-xs font-medium transition-all"
                      style={statusFilter === s
                        ? { background: '#43BCC9', color: '#080808' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      {s === 'all' ? 'Tous' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#141414' }} />
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20">
                  <Search size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune réservation trouvée</div>
                </div>
              ) : (
                filteredBookings.map(b => <BookingRow key={b.id} booking={b} />)
              )}
            </>
          )}

          {/* ── CUSTOMERS ── */}
          {activeTab === 'customers' && (
            <>
              <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {customers.length} client{customers.length !== 1 ? 's' : ''} enregistré{customers.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map(customer => (
                  <div key={customer.id} className="rounded-2xl p-6"
                    style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                        <span className="font-heading font-bold text-sm" style={{ color: '#43BCC9' }}>
                          {getInitials(customer.full_name)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: '#ffffff' }}>
                          {customer.full_name || 'Sans nom'}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {customer.phone || 'Pas de téléphone'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Inscrit {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {bookings.filter(b => b.user_id === customer.id).length} réservation(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── FINANCES ── */}
          {activeTab === 'finances' && (() => {
            const revenueData = PRICING_SERVICES
              .filter(s => !s.contactOnly)
              .map(s => {
                const moPrice = s[selectedZone] as number
                const techCost = Math.round(moPrice * 0.60)
                const mecalikMO = Math.round(moPrice * 0.40)
                const revenue = getTotalRevenuePerIntervention(s, selectedZone)
                const partsAvg = Math.round((revenue.partsMin + revenue.partsMax) / 2)
                return {
                  name: s.labelShort,
                  'Part technicien': techCost,
                  'Marge MO MecaLIK': mecalikMO,
                  'Marge pièces (5%)': partsAvg,
                  'Total MecaLIK': mecalikMO + partsAvg,
                }
              })

            const moServices = PRICING_SERVICES.filter(s => !s.contactOnly && s[selectedZone])
            const avgMO = moServices.length
              ? Math.round(moServices.reduce((sum, s) => sum + (s[selectedZone] as number) * 0.4, 0) / moServices.length)
              : 0
            const partsServices = PRICING_SERVICES.filter(s => s.hasPartsRequired && s.typicalPartsCost && s.typicalPartsCost.min > 0)
            const avgParts = partsServices.length
              ? Math.round(partsServices.reduce((sum, s) => sum + ((s.typicalPartsCost!.min + s.typicalPartsCost!.max) / 2 * 0.05), 0) / partsServices.length)
              : 0

            return (
              <>
                {/* Header + zone selector */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-semibold" style={{ color: 'white' }}>
                    Tableau financier
                  </h2>
                  <div className="flex gap-2">
                    {(['zone1', 'zone2', 'zone3'] as Zone[]).map(z => (
                      <button key={z} onClick={() => setSelectedZone(z)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: selectedZone === z ? '#43BCC9' : 'rgba(255,255,255,0.06)',
                          color: selectedZone === z ? '#080808' : 'rgba(255,255,255,0.5)',
                        }}>
                        {z === 'zone1' ? 'Zone 1' : z === 'zone2' ? 'Zone 2' : 'Zone 3'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Services tarifés', value: String(PRICING_SERVICES.filter(s => !s.contactOnly).length), color: 'white' },
                    { label: 'Votre marge MO moy.', value: `${avgMO} MAD`, color: '#43BCC9' },
                    { label: 'Marge pièces moy.', value: `+${avgParts} MAD`, color: '#F0C040' },
                    { label: 'Seuil rentabilité', value: '82 interventions', color: '#00DD88' },
                  ].map(kpi => (
                    <div key={kpi.label} className="rounded-2xl p-5"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
                      <div className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'Space Grotesk, sans-serif' }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="rounded-2xl p-6 mb-6"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Tarifs et marges estimées par service
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueData} margin={{ top: 5, right: 20, bottom: 60, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                        axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                        axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                        formatter={(val: unknown) => [`${val} MAD`]}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="Part technicien" fill="rgba(255,68,68,0.6)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Marge MO MecaLIK" fill="#43BCC9" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Marge pièces (5%)" fill="#F0C040" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pricing table */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Grille tarifaire complète
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: '#141414' }}>
                          {['Service', 'Zone 1', 'Zone 2', 'Zone 3', 'Durée'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide"
                              style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PRICING_SERVICES.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: 'white' }}>
                              {s.label}
                            </td>
                            <td className="px-4 py-3 text-sm text-center"
                              style={{ color: s.contactOnly ? '#F0C040' : '#43BCC9' }}>
                              {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone1} MAD`}
                            </td>
                            <td className="px-4 py-3 text-sm text-center"
                              style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                              {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone2} MAD`}
                            </td>
                            <td className="px-4 py-3 text-sm text-center"
                              style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                              {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone3} MAD`}
                            </td>
                            <td className="px-4 py-3 text-xs text-center"
                              style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {s.duration}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* ── BOOKING DETAIL MODAL ─────────────────────────────────────── */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative z-10 w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 mx-0 md:mx-4 overflow-y-auto"
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '90vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-lg" style={{ color: '#ffffff' }}>
                Détail réservation
              </h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>

            {/* Info rows */}
            {[
              { icon: <Wrench size={16} style={{ color: '#43BCC9' }} />,   label: 'Service',   value: SERVICE_LABELS[selectedBooking.service_name] ?? selectedBooking.service_name },
              { icon: <Users size={16} style={{ color: '#43BCC9' }} />,    label: 'Client',    value: selectedBooking.profiles?.full_name || 'Inconnu' },
              { icon: <MapPin size={16} style={{ color: '#43BCC9' }} />,   label: 'Adresse',   value: selectedBooking.address },
              { icon: <Calendar size={16} style={{ color: '#43BCC9' }} />, label: 'Date',      value: selectedBooking.preferred_date ? new Date(selectedBooking.preferred_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Dès que possible' },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-3 mb-4">
                <div className="mt-0.5 flex-shrink-0">{row.icon}</div>
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: '#ffffff' }}>{row.value}</div>
                </div>
              </div>
            ))}

            {selectedBooking.profiles?.phone && (
              <div className="flex items-start gap-3 mb-4">
                <Phone size={16} style={{ color: '#43BCC9', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Téléphone</div>
                  <a href={`tel:${selectedBooking.profiles.phone}`}
                    className="text-sm font-medium mt-0.5 block" style={{ color: '#43BCC9' }}>
                    {selectedBooking.profiles.phone}
                  </a>
                </div>
              </div>
            )}

            {selectedBooking.amount_ttc && (
              <div className="flex items-start gap-3 mb-4">
                <Tag size={16} style={{ color: '#43BCC9', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Prix</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: '#ffffff' }}>{selectedBooking.amount_ttc} MAD</div>
                </div>
              </div>
            )}

            {selectedBooking.notes_admin && (
              <div className="flex items-start gap-3 mb-4">
                <MessageSquare size={16} style={{ color: '#43BCC9', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Notes</div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: '#ffffff' }}>{selectedBooking.notes_admin}</div>
                </div>
              </div>
            )}

            {selectedBooking.rating && (
              <div
                className="mt-4 p-4 rounded-xl mb-4"
                style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.15)' }}
              >
                <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Évaluation client
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  {Array.from({ length: selectedBooking.rating }, (_, i) => (
                    <Star key={i} size={14} style={{ color: '#F0C040' }} fill="#F0C040" />
                  ))}
                  <span className="text-sm font-bold ml-1" style={{ color: '#F0C040' }}>
                    {selectedBooking.rating}/5
                  </span>
                </div>
                {selectedBooking.rating_comment && (
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {selectedBooking.rating_comment}
                  </p>
                )}
              </div>
            )}

            {/* Current status */}
            <div className="mb-6">
              <StatusPill status={selectedBooking.status} />
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Modifier le statut
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_KEYS.filter(s => s !== selectedBooking.status).map(status => {
                  const cfg = STATUS_CONFIG[status]
                  return (
                    <button
                      key={status}
                      onClick={() => updateBookingStatus(selectedBooking.id, status)}
                      disabled={updatingStatus}
                      className="py-2.5 px-3 rounded-xl text-xs font-medium transition-all"
                      style={{
                        color: cfg.color,
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        opacity: updatingStatus ? 0.5 : 1,
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              {updatingStatus && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-4 h-4 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Mise à jour...</span>
                </div>
              )}
              <div
                className="mt-4 p-3 rounded-xl"
                style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}
              >
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Confirmer, En cours, Terminé et Annulé envoient automatiquement un WhatsApp au client.
                </p>
              </div>
            </div>

            {selectedBooking.profiles?.phone && (
              <a
                href={`https://wa.me/${selectedBooking.profiles.phone.replace(/\s/g, '').replace(/^0/, '212')}?text=${encodeURIComponent('Bonjour, je vous contacte de la part de MecaLIK concernant votre réservation réf: ' + selectedBooking.id.slice(0, 8).toUpperCase())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}
              >
                <Phone size={16} />
                Contacter le client sur WhatsApp
              </a>
            )}

            <button
              onClick={() => setSelectedBooking(null)}
              className="mt-3 w-full py-3 rounded-full text-sm transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3 z-40"
        style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {navItems.map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex flex-col items-center gap-1 transition-colors"
            style={{ color: activeTab === tab ? '#43BCC9' : 'rgba(255,255,255,0.4)' }}
          >
            {icon}
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
