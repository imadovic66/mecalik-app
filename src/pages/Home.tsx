import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import ServicesSection from '../components/home/ServicesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import HowItWorksAccountSection from '../components/home/HowItWorksAccountSection'
import ReviewsSection from '../components/home/ReviewsSection'
import CtaSection from '../components/home/CtaSection'

export default function Home() {
  const handleBookNow = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'InitiateCheckout')
    }
    window.dispatchEvent(new CustomEvent('openBooking'))
  }

  return (
    <main>
      <HeroSection onBookNow={handleBookNow} />
      <StatsBar />
      <ServicesSection onBookNow={handleBookNow} />
      <HowItWorksSection onBookNow={handleBookNow} />
      <HowItWorksAccountSection />
      <ReviewsSection />
      <CtaSection onBookNow={handleBookNow} />
    </main>
  )
}
