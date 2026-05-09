import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  MapPin, MessageCircle, Navigation,
  CheckCircle, Wrench, Star,
  History, Wallet, User, Calendar,
} from 'lucide-react'

type Booking = {
  id: string
  reference: string
  service_name: string
  service_icon: string | null
  address: string
  address_notes: string | null
  status: string
  preferred_date: string | null
  amount_ttc: number | null
  technician_name: string | null
  technician_phone: string | null
  rating: number | null
  rating_comment: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  user_id: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: 'En attente', color: '#F0C040', bg: 'rgba(240,192,64,0.08)',  dot: '#F0C040' },
  confirmed:   { label: 'Confirmée',  color: '#43BCC9', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9' },
  in_progress: { label: 'En cours',   color: '#43BCC9', bg: 'rgba(67,188,201,0.08)',  dot: '#43BCC9' },
  completed:   { label: 'Terminée',   color: '#00DD88', bg: 'rgba(0,221,136,0.08)',   dot: '#00DD88' },
  cancelled:   { label: 'Annulée',    color: '#FF4444', bg: 'rgba(255,68,68,0.08)',   dot: '#FF4444' },
}

const NEXT_STATUS: Record<string, { label: string; next: string; color: string }> = {
  confirmed:   { label: 'Démarrer le trajet',  next: 'in_progress', color: '#43BCC9' },
  in_progress: { label: 'Terminer le service', next: 'completed',   color: '#00DD88' },
}

type TabId = 'jobs' | 'history' | 'gains' | 'profil'

export default function MechanicDashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]               = useState<TabId>('jobs')
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [loading, setLoading]       = useState(true)
  const [isOnline, setIsOnline]     = useState(true)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ── Auth guard (imperative) ──
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    // profile loads shortly after user — wait for it
    if (!profile) return
    if (profile.role !== 'mechanic' && profile.role !== 'admin') {
      if (profile.role === 'fleet_manager') navigate('/fleet-dashboard')
      else navigate('/dashboard')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, profile])

  // ── Data fetch + realtime ──
  useEffect(() => {
    if (!user || !profile) return
    fetchBookings()

    const channel = supabase
      .channel('mechanic-bookings')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `technician_name=eq.${profile.full_name || ''}`,
      }, () => fetchBookings())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile])

  const fetchBookings = async () => {
    if (!user || !profile) return
    setLoading(true)
    const name = profile.full_name || user.email || ''
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('technician_name', name)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId)
    const updates: Record<string, string> = { status: newStatus }
    if (newStatus === 'in_progress') updates.confirmed_at  = new Date().toISOString()
    if (newStatus === 'completed')   updates.completed_at  = new Date().toISOString()
    await supabase.from('bookings').update(updates).eq('id', bookingId)
    await fetchBookings()
    setUpdatingId(null)
  }

  const activeJobs    = bookings.filter(b => ['confirmed', 'in_progress', 'pending'].includes(b.status))
  const historyJobs   = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))
  const completedJobs = bookings.filter(b => b.status === 'completed')

  const totalEarnings = completedJobs.reduce((s, b) => s + ((b.amount_ttc || 0) * 0.6), 0)
  const now = new Date()
  const thisMonthCompleted = completedJobs.filter(b => {
    const d = new Date(b.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthEarnings = thisMonthCompleted.reduce((s, b) => s + ((b.amount_ttc || 0) * 0.6), 0)

  const firstName = profile?.full_name?.split(' ')[0] || 'Technicien'
  const ratedJobs = completedJobs.filter(b => b.rating)
  const avgRating = ratedJobs.length > 0
    ? (ratedJobs.reduce((s, b) => s + (b.rating || 0), 0) / ratedJobs.length).toFixed(1)
    : null

  // ── Synchronous render guard — blocks UI until auth is confirmed ──
  const spinnerScreen = (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes mechSpin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #43BCC9', borderTopColor: 'transparent', animation: 'mechSpin 0.8s linear infinite' }} />
    </div>
  )

  if (authLoading) return spinnerScreen                               // still loading
  if (!user)       return spinnerScreen                               // will redirect → /login
  if (!profile)    return spinnerScreen                               // profile fetch in flight
  if (profile.role !== 'mechanic' && profile.role !== 'admin')
    return spinnerScreen                                              // will redirect away

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#0A0A0A',
        minHeight: '100vh', position: 'relative', paddingBottom: '90px',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ STICKY TOP BAR ═══ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              {firstName}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              Technicien · MecaLIK
            </div>
          </div>

          {/* Online/Offline toggle */}
          <button onClick={() => setIsOnline(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '20px', border: 'none',
            background: isOnline ? 'rgba(0,221,136,0.12)' : 'rgba(255,255,255,0.06)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isOnline ? '#00DD88' : 'rgba(255,255,255,0.3)',
              animation: isOnline ? 'mechPulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: isOnline ? '#00DD88' : 'rgba(255,255,255,0.4)' }}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '20px 18px' }}>

          {/* ── MES JOBS ── */}
          {tab === 'jobs' && (
            <div>
              {/* Stats strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                {[
                  { label: "Aujourd'hui", value: activeJobs.length.toString(),  sub: 'jobs actifs', color: '#43BCC9' },
                  { label: 'Ce mois',     value: String(completedJobs.filter(b => new Date(b.created_at).getMonth() === now.getMonth()).length), sub: 'terminés', color: '#00DD88' },
                  { label: 'Note moy.',   value: avgRating || '—',              sub: 'sur 5',       color: '#F0C040' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '2px' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Jobs list */}
              {loading ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '40px' }}>
                  Chargement...
                </div>
              ) : activeJobs.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(67,188,201,0.03)', border: '1.5px dashed rgba(67,188,201,0.2)', borderRadius: '16px' }}>
                  <Wrench size={28} color="rgba(67,188,201,0.4)" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '4px' }}>Aucun job assigné</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {isOnline ? "En attente d'une nouvelle intervention" : 'Passez en ligne pour recevoir des jobs'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeJobs.map(job => {
                    const status     = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
                    const nextAction = NEXT_STATUS[job.status]
                    const isExpanded = expandedJob === job.id
                    const isUpdating = updatingId === job.id

                    return (
                      <div key={job.id} style={{
                        background: '#0F0F0F',
                        border: job.status === 'in_progress'
                          ? '1px solid rgba(67,188,201,0.3)'
                          : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', overflow: 'hidden', transition: 'all 0.2s',
                      }}>
                        {/* In-progress top accent */}
                        {job.status === 'in_progress' && (
                          <div style={{ height: '2px', background: 'linear-gradient(90deg, #43BCC9 0%, rgba(67,188,201,0.2) 100%)' }} />
                        )}

                        {/* Job header */}
                        <div onClick={() => setExpandedJob(isExpanded ? null : job.id)} style={{ padding: '16px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {/* Status pill */}
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '5px', background: status.bg, marginBottom: '10px' }}>
                                <span style={{
                                  width: '5px', height: '5px', borderRadius: '50%', background: status.dot,
                                  animation: job.status === 'in_progress' ? 'mechPulse 2s infinite' : 'none',
                                }} />
                                <span style={{ fontSize: '9px', fontWeight: 600, color: status.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                  {status.label}
                                </span>
                              </div>

                              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 600, color: 'white', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                                {job.service_name}
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={11} /> {job.address}
                                </span>
                                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                  {job.reference}
                                </span>
                              </div>
                            </div>

                            {/* Earnings */}
                            {job.amount_ttc && (
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#00DD88', fontFamily: 'Space Grotesk, sans-serif' }}>
                                  {Math.round(job.amount_ttc * 0.6)} MAD
                                </div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>votre part</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expanded panel */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px' }}>

                            {job.address_notes && (
                              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Précisions</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{job.address_notes}</div>
                              </div>
                            )}

                            {job.preferred_date && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                                <Calendar size={12} />
                                {new Date(job.preferred_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                              </div>
                            )}

                            {/* Action links */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address + ', Casablanca')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  padding: '10px', borderRadius: '10px',
                                  background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.2)',
                                  color: '#43BCC9', fontSize: '12px', fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                <Navigation size={13} /> Itinéraire
                              </a>
                              <a
                                href="https://wa.me/212777348065"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  padding: '10px 14px', borderRadius: '10px',
                                  background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.2)',
                                  color: '#00DD88', fontSize: '12px', fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                <MessageCircle size={13} /> Support
                              </a>
                            </div>

                            {/* Main CTA */}
                            {nextAction && (
                              <button
                                onClick={() => updateStatus(job.id, nextAction.next)}
                                disabled={isUpdating}
                                style={{
                                  width: '100%', marginTop: '10px', padding: '13px',
                                  background: isUpdating ? 'rgba(255,255,255,0.05)' : nextAction.color,
                                  color: isUpdating ? 'rgba(255,255,255,0.3)' : '#080808',
                                  border: 'none', borderRadius: '12px',
                                  fontSize: '14px', fontWeight: 700,
                                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                  fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.01em',
                                }}
                              >
                                {isUpdating ? 'Mise à jour...' : (
                                  <>
                                    {nextAction.next === 'in_progress' && <Navigation size={16} />}
                                    {nextAction.next === 'completed'   && <CheckCircle size={16} />}
                                    {nextAction.label}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORIQUE ── */}
          {tab === 'history' && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                {historyJobs.length} intervention{historyJobs.length !== 1 ? 's' : ''} passée{historyJobs.length !== 1 ? 's' : ''}
              </div>

              {historyJobs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Aucune intervention passée
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {historyJobs.map(job => {
                    const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.completed
                    const earned = job.amount_ttc ? Math.round(job.amount_ttc * 0.6) : null
                    return (
                      <div key={job.id} style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>{job.service_name}</div>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600, background: status.bg, color: status.color, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                              {status.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>{new Date(job.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{job.reference}</span>
                            {job.rating && (
                              <>
                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                <span style={{ color: '#F0C040', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <Star size={10} fill="#F0C040" color="#F0C040" /> {job.rating}/5
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {earned && (
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#00DD88', fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0 }}>
                            +{earned} MAD
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── GAINS ── */}
          {tab === 'gains' && (
            <div>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                {[
                  { label: 'Ce mois',     value: `${Math.round(thisMonthEarnings)} MAD`, sub: `${thisMonthCompleted.length} job${thisMonthCompleted.length !== 1 ? 's' : ''} terminé${thisMonthCompleted.length !== 1 ? 's' : ''}`, color: '#F0C040' },
                  { label: 'Total cumulé', value: `${Math.round(totalEarnings)} MAD`,    sub: `${completedJobs.length} job${completedJobs.length !== 1 ? 's' : ''} au total`, color: '#00DD88' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Commission info */}
              <div style={{ padding: '14px 16px', background: 'rgba(67,188,201,0.05)', border: '1px solid rgba(67,188,201,0.15)', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#43BCC9', marginBottom: '4px' }}>Structure de rémunération</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Vous recevez <strong style={{ color: 'white' }}>60%</strong> du montant de chaque intervention terminée.
                  MecaLIK retient <strong style={{ color: 'white' }}>40%</strong> de commission plateforme.
                </div>
              </div>

              {/* Per-job breakdown */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Détail par intervention
              </div>

              {completedJobs.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                  Aucune intervention terminée
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                  {completedJobs.map((job, i) => (
                    <div key={job.id} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < completedJobs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', color: 'white', fontWeight: 500, marginBottom: '2px' }}>{job.service_name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(job.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#00DD88', fontFamily: 'Space Grotesk, sans-serif' }}>
                          +{Math.round((job.amount_ttc || 0) * 0.6)} MAD
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                          sur {job.amount_ttc} MAD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROFIL ── */}
          {tab === 'profil' && (
            <div>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #43BCC9 0%, #2A8B95 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 700, color: 'white',
                  fontFamily: 'Space Grotesk, sans-serif', marginBottom: '12px',
                  boxShadow: '0 0 0 4px rgba(67,188,201,0.15)',
                }}>
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>
                  {profile?.full_name || firstName}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Technicien certifié · MecaLIK</div>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#F0C040', fontWeight: 600 }}>
                    <Star size={14} fill="#F0C040" color="#F0C040" /> {avgRating} / 5
                  </div>
                )}
              </div>

              {/* Stats bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                {[
                  { label: 'Jobs total',  value: completedJobs.length.toString(), sub: '',    color: '#43BCC9' },
                  { label: 'Gains totaux', value: String(Math.round(totalEarnings)), sub: ' MAD', color: '#00DD88' },
                  { label: 'Note',        value: avgRating || '—',               sub: '',    color: '#F0C040' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#0D0D0D', padding: '14px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
                      {s.value}<span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info rows */}
              <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
                {[
                  { label: 'Email',     value: user?.email || '—'       },
                  { label: 'Téléphone', value: profile?.phone || '—'    },
                  { label: 'Rôle',      value: 'Technicien MecaLIK'     },
                ].map((row, i, arr) => (
                  <div key={i} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</div>
                    <div style={{ fontSize: '13px', color: 'white', textAlign: 'right' }}>{row.value}</div>
                  </div>
                ))}
              </div>

              <a href="https://wa.me/212777348065" target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px', background: 'rgba(0,221,136,0.05)',
                border: '1px solid rgba(0,221,136,0.15)', borderRadius: '12px',
                color: '#00DD88', fontSize: '13px', fontWeight: 500,
                textDecoration: 'none', marginBottom: '16px',
              }}>
                <MessageCircle size={15} />
                Contacter l'équipe MecaLIK
              </a>

              <button onClick={async () => { await signOut(); navigate('/') }} style={{
                width: '100%', padding: '13px',
                background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)',
                borderRadius: '12px', color: '#FF4444',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        {/* ═══ BOTTOM TAB BAR ═══ */}
        <div style={{
          position: 'fixed', bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', zIndex: 50,
        }}>
          {([
            { id: 'jobs'    as TabId, Icon: Wrench,  label: 'Mes jobs'   },
            { id: 'history' as TabId, Icon: History,  label: 'Historique' },
            { id: 'gains'   as TabId, Icon: Wallet,   label: 'Gains'      },
            { id: 'profil'  as TabId, Icon: User,     label: 'Profil'     },
          ] as const).map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  padding: active ? '6px 14px' : '4px', borderRadius: '10px',
                  background: active ? 'rgba(67,188,201,0.1)' : 'transparent', transition: 'all 0.2s',
                }}>
                  <t.Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                  <span style={{ fontSize: '10px', color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400 }}>
                    {t.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <style>{`
          @keyframes mechPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          ::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </div>
  )
}
