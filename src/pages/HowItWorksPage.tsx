import { Link } from 'react-router-dom'
import HowItWorksSection from '../components/home/HowItWorksSection'
import HowItWorksAccountSection from '../components/home/HowItWorksAccountSection'

export default function HowItWorksPage() {
  const handleBookNow = () => window.dispatchEvent(new CustomEvent('openBooking'))

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ padding: '64px 40px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none', marginBottom: '24px',
            letterSpacing: '0.04em',
          }}
        >
          ← Accueil
        </Link>
        <p style={{
          fontSize: '12px', fontWeight: 700, color: 'var(--mk-action)',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px',
        }}>
          Comment ça marche
        </p>
        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800,
          color: 'white', margin: 0, lineHeight: 1.1,
        }}>
          Simple. Rapide. Transparent.
        </h1>
      </div>

      {/* Existing 3-step section */}
      <HowItWorksSection onBookNow={handleBookNow} />

      {/* Account benefits section */}
      <HowItWorksAccountSection />

      {/* Final CTA */}
      <div style={{
        textAlign: 'center', padding: '80px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '24px' }}>
          Prêt à essayer ?
        </h2>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleBookNow}
            style={{
              padding: '14px 32px', borderRadius: '10px',
              background: 'var(--mk-action)', color: '#0A0A0A',
              fontSize: '15px', fontWeight: 700,
              border: 'none', cursor: 'pointer',
            }}
          >
            Réserver maintenant →
          </button>
          <Link
            to="/signup"
            style={{
              padding: '14px 32px', borderRadius: '10px',
              background: 'transparent', color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '15px', fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            Créer un compte
          </Link>
        </div>
      </div>

    </div>
  )
}
