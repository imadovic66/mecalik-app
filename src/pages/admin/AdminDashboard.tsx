/** Admin dashboard — sidebar nav, top bar, booking detail modal, and tab routing */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import { serviceIdFromName } from '../../lib/serviceUtils'
import {
  LayoutDashboard, ShoppingBag, Users, TrendingUp,
  LogOut, RefreshCw, X,
  Wrench, Phone, MapPin, Calendar, MessageSquare, Tag, Star,
  Bell,
} from 'lucide-react'
import { notifyCustomerByWhatsApp, getNotifiableStatuses } from '../../utils/whatsappNotify'
import { usePushNotifications } from '../../hooks/usePushNotifications'

import {
  type Tab, type Booking, type Customer, type FinanceBooking,
  STATUS_CONFIG, STATUS_KEYS, StatusPill,
} from './adminShared'
import OverviewTab       from './tabs/OverviewTab'
import ReservationsTab   from './tabs/ReservationsTab'
import ClientsTab        from './tabs/ClientsTab'
import FinancesTab       from './tabs/FinancesTab'
import ReviewsTab        from './tabs/ReviewsTab'
import NotificationsTab  from './tabs/NotificationsTab'

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]             = useState<Tab>('overview')
  const [bookings, setBookings]               = useState<Booking[]>([])
  const [customers, setCustomers]             = useState<Customer[]>([])
  const [loading, setLoading]                 = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [updatingStatus, setUpdatingStatus]   = useState(false)
  const [mechanics, setMechanics]             = useState<{ id: string; full_name: string | null }[]>([])
  const [financeBookings, setFinanceBookings] = useState<FinanceBooking[]>([])
  const [financeLoading, setFinanceLoading]   = useState(false)
  const [offlineCount, setOfflineCount]       = useState(0)
  const [offlineRevenue, setOfflineRevenue]   = useState(0)
  const [offlineByMonth, setOfflineByMonth]   = useState<{ month: string; amount: number }[]>([])
  const [offlineActivities, setOfflineActivities] = useState<{ id: string; service_name: string; client_name: string; amount_ttc: number; created_at: string }[]>([])
  const [newBookingToast, setNewBookingToast] = useState<{ reference: string | null; service: string | null } | null>(null)

  const { permission, subscribed, supported, subscribe, unsubscribe, notify } = usePushNotifications()

  useEffect(() => { if (!user) navigate('/login') }, [user, navigate])
  useEffect(() => { if (profile && profile.role !== 'admin') navigate('/dashboard') }, [profile, navigate])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: bookingData }, { data: customerData }, { data: offlineData, error: offlineError }] = await Promise.all([
      supabase.from('bookings').select('*, service_details, profiles!bookings_user_id_fkey(full_name, phone)').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      supabase.from('offline_interventions').select('*').order('date', { ascending: false }),
    ])
    if (offlineError) console.error('[offline_interventions] fetch error:', offlineError)
    const offline = offlineData ?? []
    setOfflineCount(offline.length)
    setOfflineRevenue(offline.reduce((s, e) => s + (Number(e.amount_ttc) || 0), 0))
    const byMonth: { month: string; amount: number }[] = []
    offline.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const existing = byMonth.find(m => m.month === key)
      if (existing) existing.amount += Number(e.amount_ttc) || 0
      else byMonth.push({ month: key, amount: Number(e.amount_ttc) || 0 })
    })
    setOfflineByMonth(byMonth)
    setOfflineActivities(offline.map(e => ({
      id: e.id,
      service_name: e.service_name || '',
      client_name: e.client_name || 'Client',
      amount_ttc: Number(e.amount_ttc) || 0,
      created_at: (e.date || '') + 'T12:00:00.000Z',
    })))
    setBookings(bookingData ?? [])
    setCustomers(customerData ?? [])
    setLoading(false)
  }, [])

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase.from('bookings').select('*, service_details, profiles!bookings_user_id_fkey(full_name, phone)').order('created_at', { ascending: false }).limit(100)
    if (data) setBookings(data)
  }, [])

  useEffect(() => { if (user) fetchData() }, [user, fetchData])

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('role', 'mechanic')
      .then(({ data }) => setMechanics(data || []))
  }, [])

  useEffect(() => {
    if (activeTab !== 'finances') return
    setFinanceLoading(true)
    supabase.from('bookings').select('id, amount_ttc, service_name, created_at, company_id, service_details')
      .eq('status', 'completed').gt('amount_ttc', 0).order('created_at', { ascending: false })
      .then(({ data }) => {
        setFinanceBookings((data as FinanceBooking[]) ?? [])
        setFinanceLoading(false)
      })
  }, [activeTab])

  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => { console.log('🔴 REALTIME:', payload.eventType, payload);
        fetchBookings()
        if (payload.eventType === 'INSERT') {
          setNewBookingToast({ reference: payload.new?.reference ?? null, service: payload.new?.service_name ?? null })
          setTimeout(() => setNewBookingToast(null), 5000)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchBookings])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(true)
    await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b))
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus as Booking['status'] } : null)
    }

    if (getNotifiableStatuses().includes(newStatus)) {
      const booking = bookings.find(b => b.id === bookingId)
      if (booking) {
        notifyCustomerByWhatsApp({
          customerName:  booking.profiles?.full_name || null,
          customerPhone: booking.profiles?.phone || null,
          serviceLabel:  t('services.' + serviceIdFromName(booking.service_name)),
          bookingRef:    bookingId.slice(0, 8).toUpperCase(),
          status:        newStatus,
        })

        if (booking.user_id) {
          const statusMessages: Record<string, { title: string; body: string }> = {
            confirmed:   { title: 'Réservation confirmée',  body: `Votre ${t('services.' + serviceIdFromName(booking.service_name))} est confirmé. Un technicien est assigné.` },
            on_the_way:  { title: 'Mécanicien en route',    body: `Votre technicien est en route pour votre ${t('services.' + serviceIdFromName(booking.service_name))}.` },
            in_progress: { title: 'Intervention démarrée', body: `Le technicien est arrivé. Votre ${t('services.' + serviceIdFromName(booking.service_name))} a commencé.` },
            completed:   { title: 'Service terminé',        body: `Votre ${t('services.' + serviceIdFromName(booking.service_name))} est terminé. Donnez votre avis !` },
            cancelled:   { title: 'Réservation annulée',   body: `Votre réservation a été annulée. Contactez-nous pour plus d'informations.` },
          }
          const msg = statusMessages[newStatus]
          if (msg) notify({ user_id: booking.user_id, title: msg.title, body: msg.body, url: `/booking/${bookingId}` })
        }
      }
    }
    setUpdatingStatus(false)
  }

  const handleSignOut = async () => { await signOut(); navigate('/') }

  if (!user) return null
  if (profile && profile.role !== 'admin') { navigate('/'); return null }

  // ── Derived data for Overview tab ──
  const stats = {
    total:      bookings.length + offlineCount,
    pending:    bookings.filter(b => b.status === 'pending').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed:  bookings.filter(b => b.status === 'completed').length,
    revenue:    bookings.filter(b => b.status === 'completed' && b.amount_ttc).reduce((sum, b) => sum + (b.amount_ttc ?? 0), 0) + offlineRevenue,
  }

  const now = new Date()
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthLabel = d.toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { month: 'short' })
    const platformRevenue = bookings
      .filter(b => { const bDate = new Date(b.created_at); return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear() && b.status === 'completed' })
      .reduce((sum, b) => sum + (b.amount_ttc || 0), 0)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const offlineMonthRevenue = offlineByMonth.find(m => m.month === key)?.amount ?? 0
    return { month: monthLabel, revenue: platformRevenue + offlineMonthRevenue }
  })

  const bookingStatusData = [
    { name: t('status.pending'),     value: bookings.filter(b => b.status === 'pending').length,     color: '#F0C040' },
    { name: t('status.confirmed'),   value: bookings.filter(b => b.status === 'confirmed').length,   color: '#43BCC9' },
    { name: t('status.in_progress'), value: bookings.filter(b => b.status === 'in_progress').length, color: '#7B6CF6' },
    { name: t('status.completed'),   value: bookings.filter(b => b.status === 'completed').length,   color: '#00DD88' },
    { name: t('status.cancelled'),   value: bookings.filter(b => b.status === 'cancelled').length,   color: '#FF4444' },
  ].filter(d => d.value > 0)

  const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
    { tab: 'overview',      icon: <LayoutDashboard size={18} />, label: t('admin.overview')      },
    { tab: 'bookings',      icon: <ShoppingBag size={18} />,     label: t('admin.reservations')  },
    { tab: 'customers',     icon: <Users size={18} />,           label: t('admin.clients')       },
    { tab: 'finances',      icon: <TrendingUp size={18} />,      label: t('admin.finances')      },
    { tab: 'reviews',       icon: <Star size={18} />,            label: t('admin.reviews')       },
    { tab: 'notifications', icon: <Bell size={18} />,            label: t('admin.notifications') },
  ]

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full z-40 flex-col"
        style={{ width: '220px', background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
            {t('admin.sidebarTitle')}
          </div>
        </div>

        <nav style={{ padding: '8px 12px', flex: 1 }}>
          {([
            { tab: 'overview'      as Tab, labelKey: 'admin.overview',      icon: LayoutDashboard },
            { tab: 'bookings'      as Tab, labelKey: 'admin.reservations',  icon: ShoppingBag     },
            { tab: 'customers'     as Tab, labelKey: 'admin.clients',       icon: Users           },
            { tab: 'finances'      as Tab, labelKey: 'admin.finances',      icon: TrendingUp      },
            { tab: 'reviews'       as Tab, labelKey: 'admin.reviews',       icon: Star            },
            { tab: 'notifications' as Tab, labelKey: 'admin.notifications', icon: Bell            },
          ] as const).map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.tab
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  marginBottom: '2px',
                  background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                  fontSize: '13px', fontWeight: isActive ? 500 : 400,
                  textAlign: 'left', transition: 'all 0.15s', position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '2px', background: '#43BCC9', borderRadius: '0 2px 2px 0' }} />
                )}
                <Icon size={15} style={{ opacity: isActive ? 1 : 0.5, flexShrink: 0 }} />
                {t(item.labelKey)}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '12px', padding: '0' }}
          >
            <LogOut size={13} />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <div className="lg:ml-[220px] flex-1 min-h-screen" style={{ overflow: 'auto', background: '#080808' }}>

        {/* Top bar */}
        <div style={{
          padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#080808', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              {navItems.find(n => n.tab === activeTab)?.label}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
              MecaLIK — {t('admin.dashboard')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LanguageSwitcher />
            <button onClick={fetchData} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            }}>
              <RefreshCw size={12} />
              {t('common.refresh')}
            </button>
            <div style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
            }}>
              ADMIN
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: '28px 32px' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              bookings={bookings}
              loading={loading}
              stats={stats}
              revenueData={revenueData}
              bookingStatusData={bookingStatusData}
              offlineActivities={offlineActivities}
              onViewAll={() => setActiveTab('bookings')}
              onSelectBooking={setSelectedBooking}
            />
          )}
          {activeTab === 'bookings' && (
            <ReservationsTab
              bookings={bookings}
              loading={loading}
              mechanics={mechanics}
              onSelectBooking={setSelectedBooking}
              onRefresh={fetchBookings}
            />
          )}
          {activeTab === 'customers' && (
            <ClientsTab customers={customers} bookings={bookings} />
          )}
          {activeTab === 'finances' && (
            <FinancesTab financeBookings={financeBookings} financeLoading={financeLoading} />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              permission={permission}
              subscribed={subscribed}
              supported={supported}
              subscribe={subscribe}
              unsubscribe={unsubscribe}
            />
          )}
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
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-lg" style={{ color: '#ffffff' }}>
                Détail réservation
              </h2>
              <button onClick={() => setSelectedBooking(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>

            {[
              { icon: <Wrench size={16} style={{ color: '#43BCC9' }} />,   label: 'Service', value: t('services.' + serviceIdFromName(selectedBooking.service_name)) },
              { icon: <Users size={16} style={{ color: '#43BCC9' }} />,    label: 'Client',  value: selectedBooking.profiles?.full_name || 'Inconnu' },
              { icon: <MapPin size={16} style={{ color: '#43BCC9' }} />,   label: 'Adresse', value: selectedBooking.address },
              { icon: <Calendar size={16} style={{ color: '#43BCC9' }} />, label: 'Date',    value: selectedBooking.preferred_date ? new Date(selectedBooking.preferred_date).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Dès que possible' },
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
                  <span className="text-sm font-medium mt-0.5 block" style={{ color: '#43BCC9' }}>
                    {selectedBooking.profiles.phone}
                  </span>
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
              <div className="mt-4 p-4 rounded-xl mb-4" style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.15)' }}>
                <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Évaluation client</div>
                <div className="flex items-center gap-1.5 mb-1">
                  {Array.from({ length: selectedBooking.rating }, (_, i) => (
                    <Star key={i} size={14} style={{ color: '#F0C040' }} fill="#F0C040" />
                  ))}
                  <span className="text-sm font-bold ml-1" style={{ color: '#F0C040' }}>{selectedBooking.rating}/5</span>
                </div>
                {selectedBooking.rating_comment && (
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedBooking.rating_comment}</p>
                )}
              </div>
            )}

            <div className="mb-6">
              <StatusPill status={selectedBooking.status} />
            </div>

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
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, opacity: updatingStatus ? 0.5 : 1, cursor: updatingStatus ? 'not-allowed' : 'pointer' }}
                    >
                      {t(`status.${status}`)}
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
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Confirmer, En cours, Terminé et Annulé envoient automatiquement un WhatsApp au client.
                </p>
              </div>
            </div>

            {selectedBooking.profiles?.phone && (
              <a
                href={`https://wa.me/${selectedBooking.profiles.phone.replace(/\s/g, '').replace(/^0/, '212')}?text=${encodeURIComponent('Bonjour, je vous contacte de la part de MecaLIK concernant votre réservation réf: ' + selectedBooking.id.slice(0, 8).toUpperCase())}`}
                target="_blank" rel="noopener noreferrer"
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

      {/* ── NEW BOOKING TOAST ─────────────────────────────────────────── */}
      {newBookingToast && (
        <div
          style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            background: '#43BCC9', color: '#0A0A0A',
            padding: '14px 20px', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(67,188,201,0.4)',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          🔔 Nouvelle demande{newBookingToast.reference ? ` — ${newBookingToast.reference}` : ''}{newBookingToast.service ? ` — ${newBookingToast.service}` : ''}
          <button
            onClick={() => setNewBookingToast(null)}
            style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px 6px', color: '#0A0A0A', fontWeight: 700, fontSize: '12px' }}
          >
            ✕
          </button>
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
