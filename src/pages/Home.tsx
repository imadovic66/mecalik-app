import { useState, useEffect } from 'react'
import {
  Clock, ShieldCheck, ChevronRight, Star,
  Droplets, Battery, Wrench, Search, AlertTriangle,
  MessageSquare, CheckCircle, MapPin,
  CreditCard, Clock3,
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#080808] min-h-screen flex items-center overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute pointer-events-none z-0"
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67,188,201,0.07) 0%, transparent 70%)',
            top: '-100px',
            left: '-200px',
            filter: 'blur(120px)',
          }}
        />

        <div
          className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-24 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div>
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 border border-[rgba(67,188,201,0.3)] rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-[#43BCC9] animate-pulse" />
                <span className="text-[#43BCC9] text-sm font-medium">
                  Casablanca — Disponible maintenant
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-heading font-bold text-5xl lg:text-6xl xl:text-7xl leading-[1.05]"
                style={{ letterSpacing: '-0.02em' }}
              >
                <span className="text-white block">Votre voiture,</span>
                <span className="text-white block">votre lieu.</span>
                <span className="text-[#43BCC9] block">Notre problème.</span>
              </h1>

              {/* Subtext */}
              <p className="mt-6 mb-10 max-w-lg text-[rgba(255,255,255,0.55)] text-lg leading-relaxed">
                Un technicien certifié se déplace jusqu&apos;à votre voiture, où qu&apos;elle
                soit à Casablanca. Prix confirmé avant intervention. Paiement uniquement
                après le service.
              </p>

              {/* CTA buttons */}
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                  className="flex items-center gap-2 bg-[#43BCC9] text-[#080808] font-semibold px-8 py-4 rounded-full hover:bg-[#2FA8B5] transition-colors duration-200"
                >
                  Demander un devis
                  <ChevronRight size={18} />
                </button>
                <button className="border border-[rgba(255,255,255,0.15)] text-white font-medium px-8 py-4 rounded-full hover:border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200">
                  Voir nos services
                </button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <Star size={16} color="#43BCC9" />
                  <span className="text-sm text-[rgba(255,255,255,0.55)]">
                    4.9 / 5 — 2 800+ clients
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} color="#43BCC9" />
                  <span className="text-sm text-[rgba(255,255,255,0.55)]">
                    Arrivée en moins de 90 min
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} color="#43BCC9" />
                  <span className="text-sm text-[rgba(255,255,255,0.55)]">
                    Paiement après service
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#0F0F0F]">
              {/* Hero photo */}
              <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src="/hero-photo.png"
                  alt="Technicien MecaLIK en intervention à Casablanca"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info strip */}
              <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0F0F0F] flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Technicien en route</div>
                  <div className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">
                    Casablanca — Maarif
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#43BCC9] animate-pulse" />
                  <span className="text-xs text-[#43BCC9] font-medium">En direct</span>
                </div>
              </div>
            </div>

          </div>
        </div>
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
                  borderRight:
                    i < stats.length - 1
                      ? '1px solid rgba(255,255,255,0.06)'
                      : 'none',
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

          {/* Header */}
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

          {/* Grid */}
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
                {/* Top row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(67,188,201,0.08)] flex items-center justify-center">
                    {service.icon}
                  </div>
                  <span className="text-xs text-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1">
                    {service.duration}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-heading text-xl font-semibold text-white mb-3">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-[rgba(255,255,255,0.45)] text-sm leading-relaxed mb-6">
                  {service.desc}
                </p>

                {/* CTA row */}
                <div className="flex items-center gap-2 text-[#43BCC9] text-sm font-medium">
                  Demander un devis
                  <ChevronRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-[#0A0A0A] py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* LEFT — Steps */}
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#43BCC9' }}
            >
              Comment ça marche
            </p>
            <h2
              className="font-heading text-4xl lg:text-5xl font-bold mb-4"
              style={{ letterSpacing: '-0.02em', lineHeight: '1.05', color: '#ffffff' }}
            >
              Trois étapes.{' '}
              <br />
              <span style={{ color: '#43BCC9' }}>Zéro surprise.</span>
            </h2>
            <p className="text-base mb-12" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Formulaire rapide, devis précis sur WhatsApp, technicien chez vous.
            </p>

            {/* Steps */}
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
                <div
                  key={step.num}
                  className={`flex gap-5 items-start ${i < arr.length - 1 ? 'mb-8' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(67,188,201,0.1)',
                      border: '1px solid rgba(67,188,201,0.25)',
                    }}
                  >
                    <span
                      className="font-heading font-bold text-sm"
                      style={{ color: '#43BCC9' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {step.icon}
                      <span
                        className="font-heading font-semibold text-base"
                        style={{ color: '#ffffff' }}
                      >
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

            {/* CTA */}
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

          {/* RIGHT — Photo */}
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
            <img
              src="/photo-casablanca.jpg"
              alt="MecaLIK Casablanca"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,8,0.7)] to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-heading font-bold text-white text-xl">Casablanca</div>
              <div className="text-[rgba(255,255,255,0.6)] text-sm mt-1">Notre zone d&apos;intervention</div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <img
              src="/photo-van.jpg"
              alt="MecaLIK Van"
              className="w-full h-full object-cover"
            />
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
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#43BCC9' }}
            >
              Pourquoi MecaLIK
            </p>
            <h2
              className="font-heading text-4xl lg:text-5xl font-bold"
              style={{ letterSpacing: '-0.02em', lineHeight: '1.05', color: '#ffffff' }}
            >
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
              <div
                key={pillar.title}
                className="rounded-2xl p-8 transition-all duration-300"
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: 'rgba(67,188,201,0.08)',
                    border: '1px solid rgba(67,188,201,0.15)',
                  }}
                >
                  {pillar.icon}
                </div>
                <h3
                  className="font-heading font-semibold text-lg mb-3"
                  style={{ color: '#ffffff' }}
                >
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
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#43BCC9' }}
            >
              Avis clients
            </p>
            <h2
              className="font-heading text-4xl font-bold"
              style={{ letterSpacing: '-0.02em', color: '#ffffff' }}
            >
              Ce que disent nos clients.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Batterie tombée en plein parking. Le technicien était là en moins d'une heure. Prix exact, paiement après. Service impeccable.",
                initials: 'SA',
                name: 'Sofia A.',
                location: 'Casablanca — Maarif',
              },
              {
                quote: 'Vidange faite devant chez moi, sans bouger ma voiture. Technicien sérieux, propre, rapide. Je recommande vraiment.',
                initials: 'KT',
                name: 'Karim T.',
                location: 'Casablanca — Ain Diab',
              },
              {
                quote: "Crevaison un dimanche matin. MecaLIK m'a répondu en 10 minutes et réglé le problème en moins de 45 minutes. Exceptionnel.",
                initials: 'MY',
                name: 'Mohamed Y.',
                location: 'Casablanca — Hay Hassani',
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-2xl p-8"
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm" style={{ background: '#F0C040' }} />
                  ))}
                </div>
                <p
                  className="text-base leading-relaxed mb-6"
                  style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}
                >
                  &ldquo;{review.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(67,188,201,0.15)',
                      border: '1px solid rgba(67,188,201,0.2)',
                    }}
                  >
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
