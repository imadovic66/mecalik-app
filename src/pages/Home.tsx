import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import ServicesSection from '../components/home/ServicesSection'
import ReviewsSection from '../components/home/ReviewsSection'
import CtaSection from '../components/home/CtaSection'
import SEO from '../components/SEO'

export default function Home() {
  const handleBookNow = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'InitiateCheckout')
    }
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  return (
    <main>
      <SEO
        title="Mécanicien à Domicile Casablanca | MecaLIK — Votre voiture, votre lieu"
        description="Mécanicien certifié qui vient à vous à Casablanca. Vidange, batterie, pneus, diagnostic. Devis en 5 min, intervention en 90 min, paiement après service."
        path="/"
      />
      <HeroSection onBookNow={handleBookNow} />
      <StatsBar />
      <ServicesSection onBookNow={handleBookNow} />

      {/* Slim "Comment ça marche" teaser */}
      <div style={{
        textAlign: 'center', padding: '64px 40px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: '12px', color: 'var(--mk-action)',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px',
        }}>
          Comment ça marche
        </p>
        <h2 style={{
          fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800,
          color: 'white', marginBottom: '12px',
        }}>
          Trois étapes. Pas une de plus.
        </h2>
        <p style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.45)',
          maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.6,
        }}>
          De la demande à l'intervention terminée — tout se passe en moins de 90 minutes.
        </p>
        <a href="/comment-ca-marche" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          Voir le processus complet →
        </a>
      </div>

      <ReviewsSection />
      <CtaSection onBookNow={handleBookNow} />
    </main>
  )
}
