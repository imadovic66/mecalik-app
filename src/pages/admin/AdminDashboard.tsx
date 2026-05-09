import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingBag, Users,
  LogOut,
  Search, X,
  TrendingUp, Wrench, Phone, MapPin,
  Calendar, RefreshCw, MessageSquare, Tag, Star,
  Eye, EyeOff, Bell,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { notifyCustomerByWhatsApp, getNotifiableStatuses } from '../../utils/whatsappNotify'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../data/pricing'
import { usePushNotifications } from '../../hooks/usePushNotifications'

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
  technician_name: string | null
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

type Review = {
  id: string
  booking_id: string
  customer_id: string
  service_type: string | null
  rating: number
  comment: string | null
  is_visible: boolean
  created_at: string
  profiles?: { full_name: string | null }
}

const STATUS_CONFIG = {
  pending:     { label: 'En attente',  color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.25)'  },
  confirmed:   { label: 'Confirmé',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  in_progress: { label: 'En cours',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  completed:   { label: 'Terminé',     color: '#00DD88', bg: 'rgba(0,221,136,0.1)',   border: 'rgba(0,221,136,0.25)'   },
  cancelled:   { label: 'Annulé',      color: '#FF4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.25)'   },
}

const STATUS_COLORS: Record<string, string> = {
  pending:     '#F0C040',
  confirmed:   '#43BCC9',
  in_progress: '#43BCC9',
  completed:   '#00DD88',
  cancelled:   '#FF4444',
}

const SERVICE_LABELS: Record<string, string> = {
  lavage: 'Lavage Auto', vidange: 'Vidange & Filtres', batterie: 'Batterie',
  pneus: 'Pneus', diagnostic: 'Diagnostic', urgence: 'Urgence 24/7',
}

type Tab = 'overview' | 'bookings' | 'customers' | 'finances' | 'reviews' | 'notifications'

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
  const [updatingStatus, setUpdatingStatus]         = useState(false)
  const [reviews, setReviews]                       = useState<Review[]>([])
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all')
  const [notifTitle, setNotifTitle]                 = useState('')
  const [notifBody, setNotifBody]                   = useState('')
  const [notifSending, setNotifSending]             = useState(false)
  const [notifResult, setNotifResult]               = useState<string | null>(null)
  const [mechanics, setMechanics]                   = useState<{ id: string; full_name: string | null }[]>([])

  const { permission, subscribed, supported, subscribe, unsubscribe, notify } = usePushNotifications()

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])
  useEffect(() => { if (profile && profile.role !== 'admin') navigate('/dashboard') }, [profile, navigate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: bookingData }, { data: customerData }, { data: reviewData }] = await Promise.all([
      supabaseAdmin
        .from('bookings')
        .select('*, profiles(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('reviews')
        .select('*, profiles!customer_id(full_name)')
        .order('created_at', { ascending: false }),
    ])
    setBookings(bookingData ?? [])
    setCustomers(customerData ?? [])
    setReviews(reviewData ?? [])
    setLoading(false)
  }, [])

  const fetchBookings = useCallback(async () => {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setBookings(data)
  }, [])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  // ── Fetch mechanics list ──
  useEffect(() => {
    supabaseAdmin.from('profiles').select('id, full_name').eq('role', 'mechanic')
      .then(({ data }) => setMechanics(data || []))
  }, [])

  // ── Real-time: auto-refresh bookings on any change ──
  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchBookings])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(true)

    await supabaseAdmin.from('bookings').update({ status: newStatus }).eq('id', bookingId)

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

        // Push notification to customer
        if (booking.user_id) {
          const statusMessages: Record<string, { title: string; body: string }> = {
            confirmed:   { title: 'Réservation confirmée', body: `Votre ${SERVICE_LABELS[booking.service_name] || booking.service_name} est confirmé. Un technicien est assigné.` },
            in_progress: { title: 'Technicien en route',   body: `Votre technicien est en route pour ${SERVICE_LABELS[booking.service_name] || booking.service_name}.` },
            completed:   { title: 'Service terminé',        body: `Votre ${SERVICE_LABELS[booking.service_name] || booking.service_name} est terminé. Donnez votre avis !` },
            cancelled:   { title: 'Réservation annulée',   body: `Votre réservation a été annulée. Contactez-nous pour plus d'informations.` },
          }
          const msg = statusMessages[newStatus]
          if (msg) {
            notify({
              user_id: booking.user_id,
              title: msg.title,
              body: msg.body,
              url: `/booking/${bookingId}`,
            })
          }
        }
      }
    }

    setUpdatingStatus(false)
  }

  const handleSignOut = async () => { await signOut(); navigate('/') }

  const toggleReviewVisibility = async (reviewId: string, isVisible: boolean) => {
    await supabaseAdmin.from('reviews').update({ is_visible: !isVisible }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_visible: !r.is_visible } : r))
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

  const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
    { tab: 'overview',       icon: <LayoutDashboard size={18} />, label: "Vue d'ensemble" },
    { tab: 'bookings',       icon: <ShoppingBag size={18} />,     label: 'Réservations' },
    { tab: 'customers',      icon: <Users size={18} />,           label: 'Clients' },
    { tab: 'finances',       icon: <TrendingUp size={18} />,      label: 'Finances' },
    { tab: 'reviews',        icon: <Star size={18} />,            label: 'Avis' },
    { tab: 'notifications',  icon: <Bell size={18} />,            label: 'Notifications' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col"
        style={{ width: '220px', background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo area */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            Administration
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '8px 12px', flex: 1 }}>
          {([
            { tab: 'overview'       as Tab, label: "Vue d'ensemble", icon: LayoutDashboard },
            { tab: 'bookings'       as Tab, label: 'Réservations',   icon: ShoppingBag },
            { tab: 'customers'      as Tab, label: 'Clients',        icon: Users },
            { tab: 'finances'       as Tab, label: 'Finances',       icon: TrendingUp },
            { tab: 'reviews'        as Tab, label: 'Avis',           icon: Star },
            { tab: 'notifications'  as Tab, label: 'Notifications',  icon: Bell },
          ] as const).map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.tab
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '2px', background: '#43BCC9', borderRadius: '0 2px 2px 0' }} />
                )}
                <Icon size={15} style={{ opacity: isActive ? 1 : 0.5, flexShrink: 0 }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Bottom user area */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '0' }}
          >
            <LogOut size={13} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <div className="lg:ml-[220px] flex-1 min-h-screen" style={{ overflow: 'auto', background: '#080808' }}>

        {/* Top bar */}
        <div style={{
          padding: '16px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#080808',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              {activeTab === 'overview'       && "Vue d'ensemble"}
              {activeTab === 'bookings'       && 'Réservations'}
              {activeTab === 'customers'      && 'Clients'}
              {activeTab === 'finances'       && 'Finances'}
              {activeTab === 'reviews'        && 'Avis clients'}
              {activeTab === 'notifications'  && 'Notifications'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
              MecaLIK — Tableau de bord
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={fetchData} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
            }}>
              <RefreshCw size={12} />
              Actualiser
            </button>
            <div style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.05em',
            }}>
              ADMIN
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 32px' }}>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* Stat bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
              }}>
                {[
                  { label: 'Total',             value: String(stats.total),            color: 'white',   note: 'réservations'  },
                  { label: 'En attente',         value: String(stats.pending),          color: '#F0C040', note: 'à traiter'     },
                  { label: 'En cours',           value: String(stats.inProgress),       color: '#43BCC9', note: 'interventions' },
                  { label: "Chiffre d'affaires", value: `${stats.revenue} MAD`,         color: '#00DD88', note: 'complétées'    },
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 500 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                      {stat.note}
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
                <div className="space-y-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#141414' }} />
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20">
                  <Search size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Aucune réservation trouvée</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1.2fr 1fr 150px 130px 76px 80px', padding: '10px 16px', background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '8px' }}>
                    {['Référence', 'Service', 'Client', 'Technicien', 'Statut', 'Montant', 'Date'].map(h => (
                      <div key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                    ))}
                  </div>
                  {/* Table rows */}
                  {filteredBookings.map((booking, i) => (
                    <div
                      key={booking.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '110px 1.2fr 1fr 150px 130px 76px 80px',
                        padding: '9px 16px',
                        borderBottom: i < filteredBookings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {/* Ref — click opens detail modal */}
                      <div
                        style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', cursor: 'pointer' }}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {booking.id.slice(0, 8).toUpperCase()}
                      </div>
                      {/* Service */}
                      <div style={{ fontSize: '12px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {SERVICE_LABELS[booking.service_name] ?? booking.service_name}
                      </div>
                      {/* Client */}
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {booking.profiles?.full_name || 'Anonyme'}
                      </div>
                      {/* Technicien — inline assignment select */}
                      <select
                        value={booking.technician_name || ''}
                        onClick={e => e.stopPropagation()}
                        onChange={async e => {
                          const name = e.target.value
                          await supabaseAdmin.from('bookings').update({
                            technician_name: name || null,
                            status: booking.status === 'pending' && name ? 'confirmed' : booking.status,
                          }).eq('id', booking.id)
                          fetchBookings()
                        }}
                        style={{
                          background: booking.technician_name ? 'rgba(67,188,201,0.08)' : 'rgba(240,192,64,0.08)',
                          border: booking.technician_name ? '1px solid rgba(67,188,201,0.2)' : '1px solid rgba(240,192,64,0.2)',
                          color: booking.technician_name ? '#43BCC9' : '#F0C040',
                          borderRadius: '6px', padding: '4px 6px', fontSize: '11px',
                          cursor: 'pointer', fontFamily: 'inherit', outline: 'none', width: '100%',
                        }}
                      >
                        <option value="">— Assigner</option>
                        {mechanics.map(m => (
                          <option key={m.id} value={m.full_name || ''}>{m.full_name}</option>
                        ))}
                      </select>
                      {/* Statut — inline status select */}
                      <select
                        value={booking.status}
                        onClick={e => e.stopPropagation()}
                        onChange={async e => {
                          const newStatus = e.target.value
                          const updates: Record<string, string> = { status: newStatus }
                          if (newStatus === 'completed')   updates.completed_at = new Date().toISOString()
                          if (newStatus === 'in_progress') updates.confirmed_at = new Date().toISOString()
                          await supabaseAdmin.from('bookings').update(updates).eq('id', booking.id)
                          fetchBookings()
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: STATUS_COLORS[booking.status] || 'white',
                          borderRadius: '6px', padding: '4px 6px', fontSize: '11px',
                          cursor: 'pointer', fontFamily: 'inherit', outline: 'none', width: '100%',
                        }}
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                      {/* Montant — inline editable input */}
                      <input
                        type="number"
                        defaultValue={booking.amount_ttc ?? ''}
                        placeholder="MAD"
                        onClick={e => e.stopPropagation()}
                        onBlur={async e => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val > 0) {
                            await supabaseAdmin.from('bookings').update({ amount_ttc: val }).eq('id', booking.id)
                            fetchBookings()
                          }
                        }}
                        style={{
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          color: booking.amount_ttc ? '#00DD88' : 'rgba(255,255,255,0.35)',
                          fontSize: '12px', fontWeight: 600, width: '64px',
                          outline: 'none', fontFamily: 'inherit', padding: '2px 0',
                        }}
                      />
                      {/* Date */}
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(booking.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* ── REVIEWS ── */}
          {activeTab === 'reviews' && (() => {
            const totalReviews = reviews.length
            const avgNum = totalReviews > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
              : 0
            const avgStr = avgNum > 0 ? avgNum.toFixed(1) : '—'
            const fiveStars = reviews.filter(r => r.rating === 5).length
            const negative  = reviews.filter(r => r.rating <= 2).length

            const filtered = reviews.filter(r => {
              if (reviewRatingFilter === 'all') return true
              if (reviewRatingFilter === '2') return r.rating <= 2
              return r.rating === parseInt(reviewRatingFilter)
            })

            return (
              <>
                {/* Summary stat bar */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1px', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                  overflow: 'hidden', marginBottom: '24px',
                }}>
                  {[
                    { label: 'Note moyenne', value: `${avgStr} / 5`, color: '#F0C040', note: 'sur 5 étoiles' },
                    { label: 'Total avis',   value: String(totalReviews), color: 'white',    note: 'soumis' },
                    { label: '5 étoiles',    value: String(fiveStars),    color: '#00DD88',  note: totalReviews ? `${Math.round(fiveStars / totalReviews * 100)}%` : '0%' },
                    { label: 'Avis négatifs', value: String(negative),   color: '#FF4444',  note: '≤ 2 étoiles' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>{s.value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{s.note}</div>
                    </div>
                  ))}
                </div>

                {/* Rating filter */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: 'Tous' },
                    { key: '5',   label: '5 ★' },
                    { key: '4',   label: '4 ★' },
                    { key: '3',   label: '3 ★' },
                    { key: '2',   label: '≤ 2 ★' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setReviewRatingFilter(f.key)}
                      style={{
                        padding: '6px 14px', borderRadius: '100px', border: 'none',
                        fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        background: reviewRatingFilter === f.key ? '#43BCC9' : 'rgba(255,255,255,0.06)',
                        color: reviewRatingFilter === f.key ? '#080808' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
                  }}>
                    <Star size={32} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>Aucun avis</div>
                  </div>
                ) : (
                  <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '90px 140px 140px 76px 1fr 80px 44px',
                      padding: '10px 20px',
                      background: '#0D0D0D',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {['Date', 'Client', 'Service', 'Note', 'Commentaire', 'Statut', ''].map(h => (
                        <div key={h} style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                      ))}
                    </div>
                    {/* Rows */}
                    {filtered.map((review, i) => (
                      <div
                        key={review.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 140px 140px 76px 1fr 80px 44px',
                          padding: '12px 20px',
                          alignItems: 'center',
                          borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          opacity: review.is_visible ? 1 : 0.45,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                          {new Date(review.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          {review.profiles?.full_name || 'Anonyme'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          {SERVICE_LABELS[review.service_type ?? ''] ?? review.service_type ?? '—'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {Array.from({ length: review.rating }, (_, idx) => (
                            <svg key={idx} width="11" height="11" viewBox="0 0 24 24" fill="#F0C040">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          {review.comment || '—'}
                        </div>
                        <div>
                          <span style={{
                            fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px',
                            background: review.is_visible ? 'rgba(0,221,136,0.08)' : 'rgba(255,68,68,0.08)',
                            color: review.is_visible ? '#00DD88' : '#FF4444',
                          }}>
                            {review.is_visible ? 'Visible' : 'Masqué'}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => toggleReviewVisibility(review.id, review.is_visible)}
                            title={review.is_visible ? 'Masquer' : 'Afficher'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}
                          >
                            {review.is_visible
                              ? <EyeOff size={14} />
                              : <Eye size={14} />
                            }
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          })()}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (() => {
            const handleSendBroadcast = async () => {
              if (!notifTitle.trim() || !notifBody.trim()) return
              setNotifSending(true)
              setNotifResult(null)
              try {
                const res = await fetch('/api/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'customer', title: notifTitle.trim(), body: notifBody.trim(), url: '/dashboard' }),
                })
                const json = await res.json() as { sent?: number }
                setNotifResult(`Notification envoyée à ${json.sent ?? 0} client(s) abonné(s).`)
                setNotifTitle('')
                setNotifBody('')
              } catch {
                setNotifResult('Erreur lors de l\'envoi.')
              }
              setNotifSending(false)
            }

            return (
              <>
                {/* Admin subscribe card */}
                <div style={{
                  background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '24px', marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    Votre abonnement aux notifications
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Activez les notifications sur ce navigateur pour être alerté des nouvelles réservations.
                  </div>

                  {!supported ? (
                    <div style={{ fontSize: '12px', color: '#F0C040' }}>
                      Notifications push non supportées sur ce navigateur.
                    </div>
                  ) : subscribed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: 500, color: '#00DD88',
                        background: 'rgba(0,221,136,0.08)', borderRadius: '100px', padding: '6px 14px',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00DD88' }} />
                        Actif sur ce navigateur
                      </span>
                      <button
                        onClick={unsubscribe}
                        style={{
                          fontSize: '12px', color: '#FF4444', background: 'rgba(255,68,68,0.08)',
                          border: '1px solid rgba(255,68,68,0.2)', borderRadius: '100px',
                          padding: '6px 14px', cursor: 'pointer',
                        }}
                      >
                        Se désabonner
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={subscribe}
                      disabled={permission === 'denied'}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: permission === 'denied' ? 'rgba(255,255,255,0.06)' : '#43BCC9',
                        color: permission === 'denied' ? 'rgba(255,255,255,0.3)' : '#080808',
                        border: 'none', borderRadius: '100px',
                        padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                        cursor: permission === 'denied' ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Bell size={14} />
                      {permission === 'denied' ? 'Notifications bloquées par le navigateur' : 'Activer les notifications'}
                    </button>
                  )}
                </div>

                {/* Broadcast card */}
                <div style={{
                  background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '24px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                    Envoyer une notification aux clients
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Envoyez une notification push à tous les clients abonnés.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', fontWeight: 500,
                        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '6px',
                      }}>
                        Titre
                      </label>
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={e => setNotifTitle(e.target.value)}
                        placeholder="Ex: Offre spéciale ce week-end"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px', padding: '10px 14px',
                          fontSize: '13px', color: 'white', outline: 'none',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '11px', fontWeight: 500,
                        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', marginBottom: '6px',
                      }}>
                        Message
                      </label>
                      <textarea
                        rows={3}
                        value={notifBody}
                        onChange={e => setNotifBody(e.target.value)}
                        placeholder="Ex: Profitez de -20% sur le lavage auto jusqu'à dimanche."
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px', padding: '10px 14px',
                          fontSize: '13px', color: 'white', outline: 'none',
                          resize: 'vertical',
                        }}
                        onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                        onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleSendBroadcast}
                        disabled={!notifTitle.trim() || !notifBody.trim() || notifSending}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: (!notifTitle.trim() || !notifBody.trim() || notifSending)
                            ? 'rgba(67,188,201,0.2)' : '#43BCC9',
                          color: (!notifTitle.trim() || !notifBody.trim() || notifSending)
                            ? 'rgba(255,255,255,0.3)' : '#080808',
                          border: 'none', borderRadius: '100px',
                          padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                          cursor: (!notifTitle.trim() || !notifBody.trim() || notifSending) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Bell size={14} />
                        {notifSending ? 'Envoi...' : 'Envoyer à tous les clients'}
                      </button>
                      {notifResult && (
                        <span style={{ fontSize: '12px', color: notifResult.startsWith('Erreur') ? '#FF4444' : '#00DD88' }}>
                          {notifResult}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

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
