import { useState, useEffect } from 'react'
import {
  Clock, ShieldCheck, ChevronRight,
  Droplets, Battery, Wrench, Search, AlertTriangle,
  MessageSquare, CheckCircle, MapPin,
  CreditCard, Clock3,
  ArrowRight, Phone, Wallet,
} from 'lucide-react'

const stats: { value: string; label: string }[] = [
  { value: '1,1M+', label: 'Voitures au Maroc' },
  { value: '< 90 min', label: "Délai d'arrivée moyen" },
  { value: '4,9 / 5', label: 'Note client moyenne' },
  { value: '0 MAD', label: 'Frais de déplacement' },
]

type Service = {
  id: string
  icon: React.ReactNode
  duration: string
  title: string
  desc: string
  special?: boolean
}

const services: Service[] = [
  {
    id: 'lavage',
    icon: <Droplets size={22} color="#43BCC9" />,
    duration: '~45 min',
    title: 'Lavage Auto',
    desc: 'Lavage extérieur et intérieur à votre emplacement. Produits professionnels, résultat showroom.',
  },
  {
    id: 'vidange',
    icon: <Droplets size={22} color="#43BCC9" />,
    duration: '~60 min',
    title: 'Vidange & Filtres',
    desc: "Vidange moteur avec filtre à huile d'origine. Vérification des niveaux incluse.",
  },
  {
    id: 'batterie',
    icon: <Battery size={22} color="#43BCC9" />,
    duration: '~30 min',
    title: 'Batterie',
    desc: 'Diagnostic, remplacement et installation de batterie. Toutes marques et gabarits.',
  },
  {
    id: 'pneus',
    icon: <Wrench size={22} color="#43BCC9" />,
    duration: '~45 min',
    title: 'Pneus',
    desc: 'Changement, équilibrage et contrôle de pression. Intervention sur place, sans lever de pont.',
  },
  {
    id: 'diagnostic',
    icon: <Search size={22} color="#43BCC9" />,
    duration: '~30 min',
    title: 'Diagnostic',
    desc: "Lecture des codes erreur, bilan complet de l'état du véhicule. Rapport détaillé fourni.",
  },
  {
    id: 'urgence',
    icon: <AlertTriangle size={22} color="#F0C040" />,
    duration: 'Urgence',
    title: 'Urgence 24/7',
    desc: "Panne, batterie à plat, crevaison — notre technicien intervient en moins de 90 minutes.",
    special: true,
  },
]

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
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-xs uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                Ils nous font confiance
              </div>
              <div className="flex flex-wrap items-center gap-x-10 gap-y-3"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                {['Casablanca Finance City', 'Royal Air Maroc', 'OCP Group', 'BMCE Bank', 'Inwi'].map(name => (
                  <span key={name} className="text-sm font-medium tracking-wide">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span className="text-[10px] uppercase tracking-widest">Découvrir</span>
            <div className="w-px h-8 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '40%',
                background: 'rgba(255,255,255,0.5)',
                animation: 'scrollCue 2s ease-in-out infinite',
              }} />
            </div>
          </div>

        </div>

        <style>{`
          @keyframes scrollCue {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(250%); }
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
      <section id="services" className="bg-[#080808] py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <p className="text-[#43BCC9] text-sm font-semibold uppercase tracking-widest mb-4">
            Nos Services
          </p>
          <h2
            className="font-heading text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ letterSpacing: '-0.02em', lineHeight: '1.05' }}
          >
            Tout ce dont votre voiture a besoin,{' '}
            <span className="text-[#43BCC9]">à votre porte.</span>
          </h2>
          <p className="text-[rgba(255,255,255,0.45)] text-lg mb-12 max-w-2xl">
            Six services essentiels. Un technicien certifié. Zéro déplacement de votre part.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                className={`group bg-[#0F0F0F] border rounded-2xl p-8 hover:bg-[#111111] transition-all duration-300 cursor-pointer ${
                  service.special
                    ? 'border-[rgba(240,192,64,0.2)] hover:border-[rgba(240,192,64,0.4)]'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(67,188,201,0.25)]'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(67,188,201,0.08)] flex items-center justify-center">
                    {service.icon}
                  </div>
                  <span className="text-xs text-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1">
                    {service.duration}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-white mb-3">
                  {service.title}
                </h3>
                <p className="text-[rgba(255,255,255,0.45)] text-sm leading-relaxed mb-6">
                  {service.desc}
                </p>
                <div className="flex items-center gap-2 text-[#43BCC9] text-sm font-medium">
                  Demander un devis
                  <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-[#0A0A0A] py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#43BCC9' }}>
              Comment ça marche
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold mb-4"
              style={{ letterSpacing: '-0.02em', lineHeight: '1.05', color: '#ffffff' }}>
              Trois étapes.{' '}
              <br />
              <span style={{ color: '#43BCC9' }}>Zéro surprise.</span>
            </h2>
            <p className="text-base mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Formulaire rapide, devis précis sur WhatsApp, technicien chez vous.
            </p>

            <div>
              {[
                {
                  num: '01',
                  icon: <MessageSquare size={16} color="rgba(255,255,255,0.4)" />,
                  title: 'Formulaire 60 secondes',
                  desc: "Choisissez le service, décrivez votre voiture, indiquez votre adresse. Moins d'une minute.",
                },
                {
                  num: '02',
                  icon: <CheckCircle size={16} color="rgba(255,255,255,0.4)" />,
                  title: 'Devis exact sur WhatsApp',
                  desc: "Vous recevez un prix précis pour votre voiture spécifique. Aucune surprise à l'arrivée.",
                },
                {
                  num: '03',
                  icon: <MapPin size={16} color="rgba(255,255,255,0.4)" />,
                  title: 'Le technicien vient à vous',
                  desc: 'Confirmez le devis. Notre technicien arrive. Paiement uniquement après le service terminé.',
                },
              ].map((step, i, arr) => (
                <div key={step.num} className={`flex gap-5 items-start ${i < arr.length - 1 ? 'mb-8' : ''}`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.25)' }}>
                    <span className="font-heading font-bold text-sm" style={{ color: '#43BCC9' }}>
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {step.icon}
                      <span className="font-heading font-semibold text-base" style={{ color: '#ffffff' }}>
                        {step.title}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-full transition-colors duration-200 text-sm"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                Demander un devis
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
            <img
              src="/photo-intervention.jpg"
              alt="Technicien MecaLIK en intervention"
              className="w-full h-full object-cover"
              style={{ aspectRatio: '4/3' }}
            />
            <div className="absolute bottom-4 left-4 bg-[rgba(8,8,8,0.85)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3">
              <div className="font-medium text-white text-sm">Intervention sur site</div>
              <div className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">Pneus · Casablanca Maarif</div>
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
      <section className="bg-[#0A0A0A] py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <div className="mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#43BCC9' }}>
              Avis clients
            </p>
            <h2 className="font-heading text-4xl font-bold"
              style={{ letterSpacing: '-0.02em', color: '#ffffff' }}>
              Ce que disent nos clients.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Batterie tombée en plein parking. Le technicien était là en moins d'une heure. Prix exact, paiement après. Service impeccable.",
                initials: 'SA', name: 'Sofia A.', location: 'Casablanca — Maarif',
              },
              {
                quote: 'Vidange faite devant chez moi, sans bouger ma voiture. Technicien sérieux, propre, rapide. Je recommande vraiment.',
                initials: 'KT', name: 'Karim T.', location: 'Casablanca — Ain Diab',
              },
              {
                quote: "Crevaison un dimanche matin. MecaLIK m'a répondu en 10 minutes et réglé le problème en moins de 45 minutes. Exceptionnel.",
                initials: 'MY', name: 'Mohamed Y.', location: 'Casablanca — Hay Hassani',
              },
            ].map((review) => (
              <div key={review.name} className="rounded-2xl p-8"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: '#F0C040' }} />
                  ))}
                </div>
                <p className="text-base leading-relaxed mb-6"
                  style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  &ldquo;{review.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(67,188,201,0.15)', border: '1px solid rgba(67,188,201,0.2)' }}>
                    <span className="font-heading font-bold text-sm" style={{ color: '#43BCC9' }}>
                      {review.initials}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: '#ffffff' }}>{review.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{review.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </main>
  )
}
