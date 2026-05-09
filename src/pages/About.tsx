import { ChevronRight, Target, Zap, Heart, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()
  return (
    <main>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-6 overflow-hidden"
        style={{ background: '#080808' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67,188,201,0.05) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
            filter: 'blur(100px)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#43BCC9' }}
          >
            Notre histoire
          </p>
          <h1
            className="font-heading font-bold text-5xl lg:text-6xl mb-6 leading-tight"
            style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            Casablanca a 1,1 million de voitures.
            <br />
            <span style={{ color: '#43BCC9' }}>Le garage, c&apos;est fini.</span>
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            MecaLIK est né d&apos;une conviction simple : le service doit venir au client,
            pas l&apos;inverse. Un technicien certifié, un prix transparent, un paiement après le service.
          </p>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <div>
            <h2
              className="font-heading font-bold text-3xl mb-6"
              style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
            >
              Pourquoi MecaLIK ?
            </h2>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Nous avons tous vécu ça. La panne le matin, le taxi pour aller au garage,
              les heures d&apos;attente, le devis qu&apos;on n&apos;avait pas prévu. Dans une ville comme
              Casablanca, perdre une demi-journée pour une vidange n&apos;a aucun sens.
            </p>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              MecaLIK résout ce problème à la racine. Notre technicien certifié se déplace
              jusqu&apos;à votre voiture, où qu&apos;elle soit. Vous recevez un devis exact avant toute
              intervention. Vous payez uniquement après que le travail est terminé.
            </p>
            <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Notre ambition : devenir la référence de la maintenance automobile à domicile
              au Maroc, comme les meilleures plateformes mondiales l&apos;ont fait. Casablanca d&apos;abord. Tout le Maroc ensuite.
            </p>

            <div
              className="mt-8 pl-6"
              style={{ borderLeft: '2px solid #43BCC9' }}
            >
              <p
                className="font-heading font-semibold text-xl leading-relaxed"
                style={{ color: '#ffffff' }}
              >
                &ldquo;Votre voiture, votre lieu. Notre problème.&rdquo;
              </p>
            </div>
          </div>

          {/* Right — stats */}
          <div
            className="rounded-2xl p-8"
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { value: '2 800+', label: 'Clients servis à Casablanca' },
              { value: '< 90 min', label: t('landing.stat2Label') },
              { value: '4,9 / 5', label: t('landing.stat3Label') },
              { value: '100%', label: t('landing.heroBadge2') },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                className="py-5"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div className="font-heading font-bold text-3xl" style={{ color: '#43BCC9' }}>
                  {stat.value}
                </div>
                <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: '#080808' }}>
        <div className="max-w-7xl mx-auto">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4 text-center"
            style={{ color: '#43BCC9' }}
          >
            Nos valeurs
          </p>
          <h2
            className="font-heading font-bold text-4xl text-center mb-16"
            style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            Ce en quoi nous croyons.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Target size={20} color="#43BCC9" />,
                title: 'Transparence',
                desc: 'Prix confirmé avant intervention. Aucune surprise à la facturation.',
              },
              {
                icon: <Zap size={20} color="#43BCC9" />,
                title: 'Rapidité',
                desc: "Intervention en moins de 90 minutes partout à Casablanca.",
              },
              {
                icon: <Heart size={20} color="#43BCC9" />,
                title: 'Confiance',
                desc: "Paiement après service. Toujours. Sans exception.",
              },
              {
                icon: <TrendingUp size={20} color="#43BCC9" />,
                title: 'Ambition',
                desc: "Casablanca aujourd'hui. Tout le Maroc demain.",
              },
            ].map((val) => (
              <div
                key={val.title}
                className="rounded-2xl p-7 transition-all duration-300"
                style={{
                  background: '#0F0F0F',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{
                    background: 'rgba(67,188,201,0.08)',
                    border: '1px solid rgba(67,188,201,0.15)',
                  }}
                >
                  {val.icon}
                </div>
                <h3 className="font-heading font-semibold text-base mb-2" style={{ color: '#ffffff' }}>
                  {val.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center" style={{ background: '#0A0A0A' }}>
        <h2
          className="font-heading font-bold text-4xl mb-4"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          Prêt à essayer ?
        </h2>
        <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Demandez un devis gratuit. {t('landing.step1Feature3')}.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
          className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full transition-colors duration-200"
          style={{ background: '#43BCC9', color: '#080808' }}
        >
          Demander un devis
          <ChevronRight size={18} />
        </button>
      </section>

    </main>
  )
}
