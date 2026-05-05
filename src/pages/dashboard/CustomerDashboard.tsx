import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import {
  Car, Clock, CheckCircle, ChevronRight,
  Plus, MapPin, Calendar, LogOut, User,
  Wrench, History,
} from 'lucide-react'

type Booking = {
  id: string
  service: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  address: string
  scheduled_at: string | null
  price: number | null
  notes: string | null
  created_at: string
}

type CarType = {
  id: string
  make: string
  model: string
  year: number
  plate: string | null
}

const statusConfig = {
  pending:     { label: 'En attente',  color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.2)'  },
  confirmed:   { label: 'Confirmé',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.2)'  },
  in_progress: { label: 'En cours',    color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.2)'  },
  completed:   { label: 'Terminé',     color: '#00DD88', bg: 'rgba(0,221,136,0.1)',   border: 'rgba(0,221,136,0.2)'   },
  cancelled:   { label: 'Annulé',      color: '#FF4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.2)'   },
}

const serviceLabels: Record<string, string> = {
  lavage:      'Lavage Auto',
  vidange:     'Vidange & Filtres',
  batterie:    'Batterie',
  pneus:       'Pneus',
  diagnostic:  'Diagnostic',
  urgence:     'Urgence 24/7',
}

type Tab = 'overview' | 'bookings' | 'vehicles' | 'profile'

const navItems: { tab: Tab; icon: React.ReactNode; label: string }[] = [
  { tab: 'overview',  icon: <Wrench size={18} />,  label: "Vue d'ensemble" },
  { tab: 'bookings',  icon: <History size={18} />,  label: 'Mes réservations' },
  { tab: 'vehicles',  icon: <Car size={18} />,      label: 'Mes véhicules' },
  { tab: 'profile',   icon: <User size={18} />,     label: 'Mon profil' },
]

const tabTitles: Record<Tab, string> = {
  overview:  "Vue d'ensemble",
  bookings:  'Mes réservations',
  vehicles:  'Mes véhicules',
  profile:   'Mon profil',
}

export default function CustomerDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [cars, setCars] = useState<CarType[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAddCar, setShowAddCar] = useState(false)
  const [newCar, setNewCar] = useState({ make: '', model: '', year: '', plate: '' })
  const [addingCar, setAddingCar] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [{ data: bookingData }, { data: carData }] = await Promise.all([
        supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setBookings(bookingData ?? [])
      setCars(carData ?? [])
      setLoadingBookings(false)
    }
    fetchData()
  }, [user])

  const addCar = async () => {
    if (!user || !newCar.make || !newCar.model || !newCar.year) return
    setAddingCar(true)
    await supabase.from('cars').insert({
      user_id: user.id,
      make: newCar.make,
      model: newCar.model,
      year: parseInt(newCar.year),
      plate: newCar.plate || null,
    })
    const { data } = await supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setCars(data ?? [])
    setNewCar({ make: '', model: '', year: '', plate: '' })
    setShowAddCar(false)
    setAddingCar(false)
  }

  const activeCount = bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  const BookingCard = ({ booking, detailed = false }: { booking: Booking; detailed?: boolean }) => {
    const st = statusConfig[booking.status]
    return (
      <div
        className="rounded-xl p-5 mb-3"
        style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm" style={{ color: '#ffffff' }}>
              {serviceLabels[booking.service] || booking.service}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <MapPin size={11} />
              <span className="truncate">{booking.address}</span>
            </div>
            {detailed && booking.scheduled_at && (
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Calendar size={11} />
                <span>{new Date(booking.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            )}
            {detailed && booking.price && (
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Prix : {booking.price} MAD
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
            >
              {st.label}
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {new Date(booking.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const EmptyBookings = () => (
    <div
      className="rounded-2xl p-12 text-center"
      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Wrench size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Aucune réservation pour le moment</div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
        className="mt-4 px-6 py-3 rounded-full font-semibold text-sm"
        style={{ background: '#43BCC9', color: '#080808' }}
      >
        Faire une réservation
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo + user */}
        <div className="p-6">
          <img
            src="/logo.jpg"
            alt="MecaLIK"
            style={{ height: '36px', width: '120px', objectFit: 'cover', borderRadius: '6px' }}
          />
          <div className="mt-6 px-2">
            <div className="text-sm font-medium" style={{ color: '#ffffff' }}>
              {profile?.full_name || 'Mon compte'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map(({ tab, icon, label }) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: isActive ? '#43BCC9' : 'rgba(255,255,255,0.5)',
                  background: isActive ? 'rgba(67,188,201,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(67,188,201,0.15)' : '1px solid transparent',
                }}
              >
                {icon}
                {label}
              </button>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={async () => { await signOut(); navigate('/') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}
        >
          <div>
            <h1 className="font-heading font-bold text-xl" style={{ color: '#ffffff' }}>
              {tabTitles[activeTab]}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {"Bonjour" + (profile?.full_name ? ', ' + profile.full_name.split(' ')[0] : '') + " 👋"}
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm"
            style={{ background: '#43BCC9', color: '#080808' }}
          >
            <Plus size={16} />
            Nouvelle réservation
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    value: bookings.length,
                    label: 'Réservations totales',
                    color: '#ffffff',
                    icon: <History size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />,
                  },
                  {
                    value: activeCount,
                    label: 'En cours',
                    color: '#43BCC9',
                    icon: <Clock size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />,
                  },
                  {
                    value: completedCount,
                    label: 'Terminées',
                    color: '#00DD88',
                    icon: <CheckCircle size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />,
                  },
                ].map(kpi => (
                  <div
                    key={kpi.label}
                    className="rounded-2xl p-6"
                    style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-heading font-bold text-3xl" style={{ color: kpi.color }}>
                        {kpi.value}
                      </div>
                      {kpi.icon}
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent bookings */}
              <h2 className="font-heading font-semibold text-lg mb-4" style={{ color: '#ffffff' }}>
                Réservations récentes
              </h2>
              {loadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#141414' }} />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <EmptyBookings />
              ) : (
                bookings.slice(0, 3).map(b => <BookingCard key={b.id} booking={b} />)
              )}

              {bookings.length > 3 && (
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="mt-2 flex items-center gap-1 text-sm font-medium"
                  style={{ color: '#43BCC9' }}
                >
                  Voir toutes les réservations <ChevronRight size={14} />
                </button>
              )}
            </>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === 'bookings' && (
            <>
              {loadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#141414' }} />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <EmptyBookings />
              ) : (
                bookings.map(b => <BookingCard key={b.id} booking={b} detailed />)
              )}
            </>
          )}

          {/* ── VEHICLES ── */}
          {activeTab === 'vehicles' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-lg" style={{ color: '#ffffff' }}>
                  Mes véhicules
                </h2>
                <button
                  onClick={() => setShowAddCar(!showAddCar)}
                  className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm"
                  style={{ background: '#43BCC9', color: '#080808' }}
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>

              {/* Add car form */}
              {showAddCar && (
                <div
                  className="rounded-2xl p-6 mb-6"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(67,188,201,0.2)' }}
                >
                  <h3 className="font-heading font-semibold mb-4" style={{ color: '#ffffff' }}>
                    Ajouter un véhicule
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'make',  label: 'Marque *',         type: 'text',   placeholder: 'Ex: Dacia' },
                      { key: 'model', label: 'Modèle *',         type: 'text',   placeholder: 'Ex: Logan' },
                      { key: 'year',  label: 'Année *',          type: 'number', placeholder: '2019' },
                      { key: 'plate', label: 'Immatriculation',  type: 'text',   placeholder: '123-A-45' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                               style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={newCar[field.key as keyof typeof newCar]}
                          onChange={e => setNewCar(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                          style={{
                            background: '#141414',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#ffffff',
                          }}
                          onFocus={e => (e.target.style.borderColor = '#43BCC9')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShowAddCar(false)}
                      className="px-5 py-2.5 rounded-full text-sm"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={addCar}
                      disabled={addingCar}
                      className="px-5 py-2.5 rounded-full font-semibold text-sm"
                      style={{
                        background: addingCar ? 'rgba(67,188,201,0.5)' : '#43BCC9',
                        color: '#080808',
                        cursor: addingCar ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {addingCar ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Cars grid */}
              {cars.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Car size={40} style={{ color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Ajoutez votre premier véhicule
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars.map(car => (
                    <div
                      key={car.id}
                      className="rounded-2xl p-6 flex items-start gap-4"
                      style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(67,188,201,0.08)',
                          border: '1px solid rgba(67,188,201,0.15)',
                        }}
                      >
                        <Car size={22} style={{ color: '#43BCC9' }} />
                      </div>
                      <div>
                        <div className="font-heading font-semibold" style={{ color: '#ffffff' }}>
                          {car.make} {car.model}
                        </div>
                        <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {car.year}
                        </div>
                        {car.plate && (
                          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {car.plate}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PROFILE ── */}
          {activeTab === 'profile' && (
            <div
              className="rounded-2xl p-8 max-w-lg"
              style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                { label: 'Nom complet',    value: profile?.full_name || '—' },
                { label: 'Email',          value: user?.email || '—' },
                { label: 'Téléphone',      value: profile?.phone || '—' },
                {
                  label: 'Membre depuis',
                  value: new Date(user?.created_at || '').toLocaleDateString('fr-FR', {
                    month: 'long', year: 'numeric',
                  }),
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                >
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                  <span className="text-sm font-medium" style={{ color: '#ffffff' }}>{row.value}</span>
                </div>
              ))}
              <button
                onClick={async () => { await signOut(); navigate('/') }}
                className="mt-6 px-6 py-3 rounded-full text-sm transition-colors"
                style={{ border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Se déconnecter
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3 z-40"
        style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {navItems.map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
