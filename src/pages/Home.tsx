import { useState, useEffect } from 'react'
import {
  Clock, ShieldCheck,
  Wrench, MessageSquare, MapPin,
  CreditCard, Clock3,
  ArrowRight, Phone, Wallet,
  Smartphone, CheckCircle2, ArrowDownRight,
} from 'lucide-react'

const stats: { value: string; label: string }[] = [
  { value: '1,1M+', label: 'Voitures au Maroc' },
  { value: '< 90 min', label: "Délai d'arrivée moyen" },
  { value: '4,9 / 5', label: 'Note client moyenne' },
  { value: '0 MAD', label: 'Frais de déplacement' },
]


const ACTIVITIES = [
  { service: 'Vidange', location: 'Maarif', time: 'il y a 4 min' },
  { service: 'Batterie', location: 'Ain Diab', time: 'il y a 11 min' },
  { service: 'Lavage', location: 'Anfa', time: 'il y a 18 min' },
  { service: 'Diagnostic', location: 'Bourgogne', time: 'il y a 23 min' },
  { service: 'Pneus', location: 'CIL', time: 'il y a 31 min' },
  { service: 'Urgence', location: 'Hay Hassani', time: 'il y a 42 min' },
  { service: 'Vidange', location: 'Sidi Maarouf', time: 'il y a 55 min' },
]

function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ACTIVITIES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const activity = ACTIVITIES[currentIndex]

  return (
    <div className="rounded-2xl p-5"
      style={{
        background: 'rgba(67,188,201,0.04)',
        border: '1px solid rgba(67,188,201,0.12)',
      }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full animate-ping"
            style={{ background: '#43BCC9', opacity: 0.5 }} />
          <span className="relative rounded-full w-2 h-2"
            style={{ background: '#43BCC9' }} />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: '#43BCC9' }}>
          Activité en direct
        </span>
      </div>
      <div key={currentIndex} style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="text-sm font-medium mb-0.5" style={{ color: 'white' }}>
          {activity.service}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {activity.location}, Casablanca
        </div>
        <div className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {activity.time}
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

export default function Home() {
  const [techCount, setTechCount] = useState(7)

  useEffect(() => {
    const interval = setInterval(() => {
      setTechCount(prev => {
        const variation = Math.random() > 0.5 ? 1 : -1
        const next = prev + variation
        return Math.max(5, Math.min(11, next))
      })
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '100vh', background: '#080808' }}
      >
        {/* AMBIENT BACKGROUND LAYERS */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute',
            width: '900px', height: '900px',
            borderRadius: '50%',
            top: '-300px', right: '-200px',
            background: 'radial-gradient(circle, rgba(67,188,201,0.10) 0%, rgba(67,188,201,0) 60%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            width: '700px', height: '700px',
            borderRadius: '50%',
            bottom: '-200px', left: '-150px',
            background: 'radial-gradient(circle, rgba(232,102,61,0.06) 0%, rgba(232,102,61,0) 60%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }} />
        </div>

        {/* MAIN CONTENT */}
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-12 lg:pt-40 lg:pb-20">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* LEFT — Editorial copy block */}
            <div className="lg:col-span-7 lg:pr-4">

              {/* Live availability eyebrow */}
              <div
                className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(0,221,136,0.06)',
                  border: '1px solid rgba(0,221,136,0.18)',
                }}
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: '#00DD88', opacity: 0.6 }} />
                  <span className="relative rounded-full w-2 h-2"
                    style={{ background: '#00DD88' }} />
                </span>
                <span className="text-xs font-medium tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {techCount} techniciens disponibles à Casablanca
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(48px, 7vw, 88px)',
                lineHeight: '0.98',
                letterSpacing: '-0.03em',
                color: 'white',
                fontWeight: 600,
                marginBottom: '24px',
              }}>
                <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)', display: 'block' }}>
                  Votre voiture,
                </span>
                <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)', display: 'block' }}>
                  votre lieu.
                </span>
                <span style={{
                  fontWeight: 700,
                  display: 'block',
                  background: 'linear-gradient(90deg, #43BCC9 0%, #5FD1DD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Notre problème.
                </span>
              </h1>

              {/* Subhead */}
              <p className="max-w-xl text-base lg:text-lg leading-relaxed mb-10"
                style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>
                Un mécanicien certifié se déplace là où vous êtes — domicile, bureau, parking.
                Devis transparent envoyé en moins de 5 minutes. Paiement après service.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                  className="group flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm transition-all"
                  style={{
                    background: '#43BCC9',
                    color: '#080808',
                    boxShadow: '0 8px 32px rgba(67,188,201,0.25)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,188,201,0.35)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,188,201,0.25)'
                  }}
                >
                  Demander un devis gratuit
                  <ArrowRight size={16} className="group-hover:translate-x-0.5" style={{ transition: 'transform 0.2s' }} />
                </button>

                <a
                  href="tel:+212667101341"
                  className="flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <Phone size={15} />
                  06 67 10 13 41
                </a>
              </div>

              {/* Trust micro-row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { icon: <Clock size={13} />,       label: 'Sous 90 minutes' },
                  { icon: <Wallet size={13} />,      label: 'Paiement après service' },
                  { icon: <ShieldCheck size={13} />, label: 'Techniciens certifiés' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs"
                    style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span style={{ color: '#43BCC9' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Photo card with floating elements */}
            <div className="lg:col-span-5 relative">

              {/* Main photo card */}
              <div
                className="relative rounded-3xl overflow-hidden"
                style={{
                  aspectRatio: '4/5',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <img
                  src="/hero-photo.png"
                  alt="Technicien MecaLIK en intervention"
                  className="w-full h-full object-cover"
                  style={{ filter: 'contrast(1.05) saturate(1.05)' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)',
                }} />

                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin size={12} style={{ color: '#43BCC9' }} />
                      <span className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'rgba(255,255,255,0.6)' }}>
                        En intervention
                      </span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'white' }}>
                      Maarif, Casablanca
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,221,136,0.15)', border: '1px solid rgba(0,221,136,0.3)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: '#00DD88' }} />
                    <span className="text-[10px] font-semibold" style={{ color: '#00DD88' }}>
                      EN DIRECT
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating rating card */}
              <div
                className="absolute -top-4 -right-4 px-5 py-4 rounded-2xl hidden md:block"
                style={{
                  background: 'rgba(15,15,15,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F0C040">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm font-bold" style={{ color: 'white' }}>4.9</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  2 800+ avis clients
                </div>
              </div>

              {/* Floating next-available card */}
              <div
                className="absolute -bottom-5 -left-4 px-5 py-3 rounded-2xl hidden md:block"
                style={{
                  background: 'rgba(15,15,15,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Prochain créneau
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: '#43BCC9' }} />
                  <span className="text-sm font-bold" style={{ color: 'white' }}>
                    Aujourd'hui · 14h30
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM STRIP — proof bar */}
          <div className="mt-20 lg:mt-28 pt-8 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-xs uppercase tracking-widest flex-shrink-0"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                Ils nous font confiance
              </div>
              <div className="hidden lg:block w-px h-4 mx-4"
                style={{ background: 'rgba(255,255,255,0.12)' }} />
              {/* Mobile marquee */}
              <div className="lg:hidden overflow-hidden flex-1">
                <div style={{
                  display: 'flex', gap: '40px', width: 'max-content',
                  animation: 'marquee 20s linear infinite',
                }}>
                  {['Casablanca Finance City', 'Royal Air Maroc', 'OCP Group', 'BMCE Bank', 'Inwi',
                    'Casablanca Finance City', 'Royal Air Maroc', 'OCP Group', 'BMCE Bank', 'Inwi'].map((name, i) => (
                    <span key={i} className="text-sm font-medium tracking-wide whitespace-nowrap"
                      style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
              {/* Desktop static */}
              <div className="hidden lg:flex flex-wrap items-center gap-x-10 gap-y-3">
                {['Casablanca Finance City', 'Royal Air Maroc', 'OCP Group', 'BMCE Bank', 'Inwi'].map(name => (
                  <span key={name} className="text-sm font-medium tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-t border-b border-[rgba(255,255,255,0.06)] bg-[#080808] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.value}
                className="text-center px-8 py-2"
                style={{
                  borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div className="font-heading text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section id="services" className="relative py-24 lg:py-32" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto px-6">

          {/* Header — same split pattern as How It Works */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
            <div className="lg:col-span-5">
              <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium"
                style={{ color: '#43BCC9' }}>
                Nos services
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(32px, 4vw, 52px)',
                lineHeight: '1.05',
                letterSpacing: '-0.025em',
                color: 'white',
                fontWeight: 700,
              }}>
                Tout ce dont votre<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
                  voiture a besoin.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
              <p className="text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                Six services essentiels. Un technicien certifié se déplace
                jusqu&apos;à votre voiture, où qu&apos;elle soit à Casablanca.
              </p>
            </div>
          </div>

          {/* ASYMMETRIC SERVICE GRID */}
          {/* Row 1: large (5) + medium (4) + small accent (3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

            {/* SERVICE 1 — LARGE: Lavage Auto */}
            <div
              className="lg:col-span-5 group relative rounded-3xl p-8 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                minHeight: '280px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(67,188,201,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
              }} />
              <div className="relative">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="1.5">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.15)' }}>
                    ~45 min
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '26px', fontWeight: 600, color: 'white',
                  marginBottom: '12px', letterSpacing: '-0.015em',
                }}>
                  Lavage Auto
                </h3>
                <p className="text-sm leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '280px' }}>
                  Lavage extérieur et intérieur complet à votre emplacement.
                  Produits professionnels, résultat showroom.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#43BCC9' }}>
                  Demander un devis
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* SERVICE 2 — MEDIUM: Vidange */}
            <div
              className="lg:col-span-4 group relative rounded-3xl p-7 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="1.5">
                    <ellipse cx="12" cy="12" rx="10" ry="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.15)' }}>
                  ~60 min
                </span>
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '22px', fontWeight: 600, color: 'white',
                marginBottom: '10px', letterSpacing: '-0.015em',
              }}>
                Vidange &amp; Filtres
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Vidange moteur avec filtre d&apos;origine. Vérification des niveaux incluse.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#43BCC9' }}>
                Demander un devis
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* SERVICE 3 — SMALL accent: Batterie */}
            <div
              className="lg:col-span-3 group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(67,188,201,0.06) 0%, rgba(67,188,201,0.02) 100%)',
                border: '1px solid rgba(67,188,201,0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.35)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(67,188,201,0.15)', border: '1px solid rgba(67,188,201,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '20px', fontWeight: 600, color: 'white',
                marginBottom: '8px', letterSpacing: '-0.015em',
              }}>
                Batterie
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Diagnostic, remplacement et installation. Toutes marques.
              </p>
              <div className="text-xs font-medium" style={{ color: '#43BCC9' }}>~30 min</div>
            </div>
          </div>

          {/* Row 2: small (3) + medium (4) + large accent (5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* SERVICE 4 — Pneus */}
            <div
              className="lg:col-span-3 group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '20px', fontWeight: 600, color: 'white',
                marginBottom: '8px', letterSpacing: '-0.015em',
              }}>
                Pneus
              </h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Changement, équilibrage et contrôle de pression sur place.
              </p>
              <div className="text-xs font-medium" style={{ color: '#43BCC9' }}>~45 min</div>
            </div>

            {/* SERVICE 5 — Diagnostic */}
            <div
              className="lg:col-span-4 group relative rounded-3xl p-7 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(67,188,201,0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.15)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#43BCC9" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.15)' }}>
                  ~30 min
                </span>
              </div>
              <h3 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '22px', fontWeight: 600, color: 'white',
                marginBottom: '10px', letterSpacing: '-0.015em',
              }}>
                Diagnostic
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Lecture des codes erreur, bilan complet de l&apos;état du véhicule. Rapport détaillé fourni.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#43BCC9' }}>
                Demander un devis
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* SERVICE 6 — URGENCE: red accent card */}
            <div
              className="lg:col-span-5 group relative rounded-3xl p-8 overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255,68,68,0.06) 0%, rgba(255,68,68,0.02) 100%)',
                border: '1px solid rgba(255,68,68,0.18)',
                minHeight: '240px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.border = '1px solid rgba(255,68,68,0.4)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.border = '1px solid rgba(255,68,68,0.18)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
            >
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '250px', height: '250px',
                background: 'radial-gradient(circle, rgba(255,68,68,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                transform: 'translate(20%, 30%)',
              }} />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="relative flex w-2.5 h-2.5">
                      <span className="absolute inset-0 rounded-full animate-ping"
                        style={{ background: '#FF4444', opacity: 0.5 }} />
                      <span className="relative rounded-full w-2.5 h-2.5"
                        style={{ background: '#FF4444' }} />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#FF4444' }}>
                      Disponible 24h/7j
                    </span>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)' }}>
                    ASAP
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '26px', fontWeight: 700, color: 'white',
                  marginBottom: '12px', letterSpacing: '-0.015em',
                }}>
                  Urgence 24/7
                </h3>
                <p className="text-sm leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '280px' }}>
                  Panne, batterie à plat, crevaison — notre technicien
                  intervient en moins de 90 minutes, jour et nuit.
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#FF4444' }}>
                  Appeler maintenant
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="relative py-24 lg:py-40" style={{ background: '#080808' }}>

        {/* Large background number */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute',
            top: '15%', left: '-2%',
            fontSize: 'clamp(280px, 30vw, 480px)',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.015)',
            lineHeight: 0.8,
            fontFamily: 'Space Grotesk, sans-serif',
            letterSpacing: '-0.05em',
            userSelect: 'none',
          }}>
            03
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6">

          {/* Section header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 lg:mb-32">
            <div className="lg:col-span-5">
              <div className="text-xs uppercase tracking-[0.2em] mb-5 font-medium"
                style={{ color: '#43BCC9' }}>
                Comment ça marche
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(36px, 4.5vw, 56px)',
                lineHeight: '1.02',
                letterSpacing: '-0.025em',
                color: 'white',
                fontWeight: 700,
              }}>
                Trois étapes.<br />
                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
                  Pas une de plus.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-6">
              <p className="text-base lg:text-lg leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                De la demande à l'intervention terminée, tout se passe en moins de 90 minutes.
                Pas de paperasse, pas de devis surprise, pas de déplacement de votre côté.
                Vous restez où vous êtes — on s'occupe du reste.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                <ArrowDownRight size={16} style={{ color: '#43BCC9' }} />
                Faites défiler pour voir le processus
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-32 lg:space-y-44">

            {/* ── STEP 01 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="flex items-center gap-4 mb-8">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>01</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    30 secondes
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(28px, 3.2vw, 40px)',
                  lineHeight: '1.1',
                  color: 'white',
                  fontWeight: 600,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em',
                }}>
                  Décrivez votre besoin
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Ouvrez WhatsApp ou utilisez notre formulaire en ligne. Indiquez votre service,
                  votre voiture, votre adresse. Pas de compte à créer.
                </p>
                <div className="space-y-3">
                  {[
                    'WhatsApp ou formulaire en ligne',
                    'Aucun compte requis',
                    'Réponse en moins de 5 minutes',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', padding: '32px' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.2)' }}>
                      <Smartphone size={18} style={{ color: '#43BCC9' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>Nouvelle demande</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>via WhatsApp</div>
                    </div>
                  </div>
                  {[
                    { label: 'Service', value: 'Vidange & Filtres' },
                    { label: 'Voiture', value: 'Dacia Logan 2019' },
                    { label: 'Adresse', value: 'Maarif, Casablanca' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</span>
                      <span className="text-sm font-medium" style={{ color: 'white' }}>{row.value}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                    className="w-full mt-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: '#43BCC9', color: '#080808' }}>
                    Envoyer la demande
                  </button>
                </div>
              </div>
            </div>

            {/* ── STEP 02 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5 order-1">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', padding: '32px' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,221,136,0.1)', border: '1px solid rgba(0,221,136,0.2)' }}>
                      <MessageSquare size={18} style={{ color: '#00DD88' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>Votre devis</div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00DD88' }} />
                        <span className="text-xs" style={{ color: '#00DD88' }}>Envoyé il y a 3 min</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Détail du devis</div>
                    {[
                      { label: 'Main d\'œuvre', value: '180 MAD' },
                      { label: 'Huile moteur 5L', value: '220 MAD' },
                      { label: 'Filtre à huile', value: '45 MAD' },
                      { label: 'Déplacement', value: '0 MAD' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-1.5">
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                        <span className="text-sm font-medium" style={{ color: row.value === '0 MAD' ? '#00DD88' : 'white' }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="text-sm font-bold" style={{ color: 'white' }}>Total TTC</span>
                      <span className="text-base font-bold" style={{ color: '#43BCC9' }}>445 MAD</span>
                    </div>
                  </div>
                  <div className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Prix garanti — aucun frais supplémentaire
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 order-2">
                <div className="flex items-center gap-4 mb-8">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>02</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    &lt; 5 minutes
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(28px, 3.2vw, 40px)',
                  lineHeight: '1.1',
                  color: 'white',
                  fontWeight: 600,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em',
                }}>
                  Recevez votre devis exact
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Notre équipe analyse votre demande et vous envoie un prix précis,
                  adapté à votre véhicule. Pas de fourchette, pas d'approximation.
                  Le prix affiché est le prix final.
                </p>
                <div className="space-y-3">
                  {[
                    'Prix spécifique à votre modèle',
                    'Détail ligne par ligne',
                    'Zéro frais de déplacement',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── STEP 03 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="flex items-center gap-4 mb-8">
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 700, color: '#43BCC9', letterSpacing: '0.1em' }}>03</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(67,188,201,0.2)' }} />
                  <div className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                    style={{ background: 'rgba(67,188,201,0.08)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                    &lt; 90 min
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(28px, 3.2vw, 40px)',
                  lineHeight: '1.1',
                  color: 'white',
                  fontWeight: 600,
                  marginBottom: '20px',
                  letterSpacing: '-0.02em',
                }}>
                  Le technicien vient à vous
                </h3>
                <p className="text-base lg:text-lg leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Confirmez le devis. Notre technicien certifié se déplace jusqu'à votre véhicule.
                  Vous suivez l'avancement en temps réel. Paiement uniquement après que le service
                  est terminé et validé.
                </p>
                <div className="space-y-3 mb-10">
                  {[
                    'Suivi en temps réel sur WhatsApp',
                    'Paiement après service uniquement',
                    'Rapport d\'intervention fourni',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={14} style={{ color: '#43BCC9', flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                  className="flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm transition-all"
                  style={{ background: '#43BCC9', color: '#080808', boxShadow: '0 8px 32px rgba(67,188,201,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(67,188,201,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(67,188,201,0.2)')}
                >
                  Démarrer maintenant
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="lg:col-span-5 lg:col-start-8 order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img
                    src="/photo-intervention.jpg"
                    alt="Technicien MecaLIK en intervention"
                    className="w-full object-cover"
                    style={{ aspectRatio: '4/3' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 55%)',
                  }} />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wrench size={11} style={{ color: '#43BCC9' }} />
                        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          Technicien certifié
                        </span>
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'white' }}>En intervention</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{ background: 'rgba(0,221,136,0.15)', border: '1px solid rgba(0,221,136,0.3)' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00DD88' }} />
                      <span className="text-[10px] font-bold" style={{ color: '#00DD88' }}>TERMINÉ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PHOTO STRIP ──────────────────────────────────────────────── */}
      <section className="py-0 overflow-hidden">
        <div className="grid grid-cols-2 h-72 lg:h-96">

          <div className="relative overflow-hidden">
            <img src="/photo-casablanca.jpg" alt="MecaLIK Casablanca" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-heading font-bold text-white text-xl">Casablanca</div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm mt-1">Notre zone d&apos;intervention</div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <img src="/photo-van.jpg" alt="MecaLIK Van" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-heading font-bold text-white text-xl">Notre flotte</div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm mt-1">Équipée &amp; certifiée</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── WHY MECALIK ──────────────────────────────────────────────── */}
      <section className="bg-[#080808] py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#43BCC9' }}>
              Pourquoi MecaLIK
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold"
              style={{ letterSpacing: '-0.02em', lineHeight: '1.05', color: '#ffffff' }}>
              La mécanique à domicile,
              <span style={{ color: '#43BCC9' }}> sans compromis.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              {
                icon: <CreditCard size={22} color="#43BCC9" />,
                title: 'Paiement après service',
                desc: "Vous ne payez qu'une fois le travail terminé et validé. Aucun acompte, aucune surprise.",
              },
              {
                icon: <Clock3 size={22} color="#43BCC9" />,
                title: 'Devis en moins de 5 min',
                desc: "Envoyez votre demande, recevez un prix exact sur WhatsApp. Pas de flou, pas d'approximation.",
              },
              {
                icon: <ShieldCheck size={22} color="#43BCC9" />,
                title: 'Technicien certifié',
                desc: 'Notre technicien est qualifié et expérimenté. Chaque intervention est couverte et tracée.',
              },
              {
                icon: <MapPin size={22} color="#43BCC9" />,
                title: 'Zéro déplacement',
                desc: "Domicile, bureau, parking, bord de route — on vient là où votre voiture est garée.",
              },
            ].map((pillar) => (
              <div key={pillar.title} className="rounded-2xl p-8 transition-all duration-300"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.15)' }}>
                  {pillar.icon}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-3" style={{ color: '#ffffff' }}>
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <section className="relative py-24 lg:py-32 overflow-hidden"
        style={{ background: '#080808' }}>

        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(67,188,201,0.3), transparent)' }} />

        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium"
                style={{ color: '#43BCC9' }}>
                Avis clients
              </div>
              <h2 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(32px, 4vw, 52px)',
                lineHeight: '1.05',
                letterSpacing: '-0.025em',
                color: 'white',
                fontWeight: 700,
              }}>
                Ce que disent nos clients.
              </h2>
            </div>
            <div className="flex items-center gap-4 lg:pb-2">
              <div className="text-right">
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '48px',
                  fontWeight: 800,
                  color: 'white',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}>4.9</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  sur 5
                </div>
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#F0C040">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  2 847 avis vérifiés
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials grid — asymmetric */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">

            {/* LARGE featured testimonial */}
            <div className="lg:col-span-5 rounded-3xl p-8"
              style={{
                background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <div className="flex gap-1 mb-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F0C040">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-lg lg:text-xl leading-relaxed mb-8"
                style={{ color: 'rgba(255,255,255,0.88)', fontStyle: 'italic' }}>
                &ldquo;Ma batterie a lâché dans le parking de Morocco Mall. En 40 minutes,
                le technicien était là. Professionnel, rapide, et le prix annoncé
                sur WhatsApp était exactement ce que j&apos;ai payé. Je ne vais plus
                jamais chercher un garage.&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9', border: '1px solid rgba(67,188,201,0.2)' }}>
                  SA
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'white' }}>
                    Salma Amrani
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Casablanca · il y a 3 jours · Batterie
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,221,136,0.08)', border: '1px solid rgba(0,221,136,0.2)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00DD88" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-[10px] font-semibold" style={{ color: '#00DD88' }}>
                    Vérifié
                  </span>
                </div>
              </div>
            </div>

            {/* Right column — 2 stacked */}
            <div className="lg:col-span-4 flex flex-col gap-4">

              <div className="rounded-3xl p-7 flex-1"
                style={{
                  background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F0C040">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-6"
                  style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  &ldquo;Vidange faite dans mon bureau à Maarif. J&apos;ai continué à travailler
                  pendant ce temps. Le rapport envoyé par WhatsApp était très détaillé.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9' }}>
                    KO
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'white' }}>Karim Ouazzani</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Maarif · il y a 1 semaine · Vidange
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl p-7 flex-1"
                style={{
                  background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F0C040">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-6"
                  style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  &ldquo;J&apos;ai contacté MecaLIK à 23h après une crevaison. Le technicien
                  est arrivé en 35 minutes. Service exceptionnel.&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(67,188,201,0.15)', color: '#43BCC9' }}>
                    NB
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'white' }}>Nadia Benali</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Ain Diab · il y a 2 jours · Urgence 24/7
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Far right — 1 tall + live activity ticker */}
            <div className="lg:col-span-3 flex flex-col gap-4">

              <div className="rounded-3xl p-6 flex-1"
                style={{
                  background: 'linear-gradient(135deg, #0F0F0F 0%, #141414 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F0C040">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed mb-5"
                  style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  &ldquo;Pour notre flotte de 12 véhicules, MecaLIK a complètement changé
                  notre gestion. Plus besoin d&apos;immobiliser les véhicules.&rdquo;
                </blockquote>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgba(240,192,64,0.15)', color: '#F0C040' }}>
                    YM
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'white' }}>Youssef Mejdoub</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Gestionnaire flotte · Flottes B2B
                    </div>
                  </div>
                </div>
              </div>

              <LiveActivityTicker />
            </div>
          </div>

        </div>
      </section>

    </main>
  )
}
