import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import ServicesSection from '../components/home/ServicesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import ReviewsSection from '../components/home/ReviewsSection'
import CtaSection from '../components/home/CtaSection'

export default function Home() {
  const handleBookNow = () => window.dispatchEvent(new CustomEvent('openBooking'))

  return (
    <main>
      <HeroSection onBookNow={handleBookNow} />
      <StatsBar />
      <ServicesSection onBookNow={handleBookNow} />
      <HowItWorksSection onBookNow={handleBookNow} />
      <ReviewsSection />
      <CtaSection onBookNow={handleBookNow} />
    </main>
  )
}
