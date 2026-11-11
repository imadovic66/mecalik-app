/** Homepage — CAFU model with MecaLIK colours: hero with rotating word, stacked service cards,
 *  Découvrir cards, reviews, app section, FAQ and the Flottes banner. */
import { useEffect, useState } from 'react'
import HomeHero from '../components/home/HomeHero'
import ServiceStack from '../components/home/ServiceStack'
import { DiscoverSection, AppSection, HomeFAQ, FleetBanner } from '../components/home/HomeSections'
import ReviewsSection from '../components/home/ReviewsSection'
import SEO from '../components/SEO'
import { loadCatalog, fromPrice, fmtMAD } from '../lib/catalog'
import type { ServiceKey } from '../components/home/homeCopy'
import type { PublicReview } from '../lib/types'

export default function Home() {
  const [reviewStats, setReviewStats] = useState<{ avg: number; count: number } | null>(null)
  const [prices, setPrices] = useState<Partial<Record<ServiceKey, string>>>({})

  useEffect(() => {
    loadCatalog().then(cat => {
      const out: Partial<Record<ServiceKey, string>> = {}
      for (const k of ['vidange', 'batterie', 'diagnostic'] as const) {
        const p = fromPrice(cat, k)
        if (p) out[k] = fmtMAD(p)
      }
      setPrices(out)
    }).catch(() => { /* prices stay hidden; cards still work */ })
  }, [])

  const handleReviewsLoaded = (reviews: PublicReview[]) => {
    if (reviews.length === 0) return
    setReviewStats({ avg: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length, count: reviews.length })
  }

  const aggregateRatingJsonLd = reviewStats ? {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: { '@type': 'LocalBusiness', '@id': 'https://mecalik.com/#business' },
    ratingValue: reviewStats.avg,
    reviewCount: reviewStats.count,
    bestRating: 5,
    worstRating: 1,
  } : undefined

  return (
    <main style={{ background: '#080808' }}>
      <SEO
        title="Mécanicien à Domicile Casablanca | MecaLIK — Votre voiture, votre lieu"
        description="Un mécanicien vient à vous à Casablanca : vidange, batterie, diagnostic, urgence. Prix affiché avant de réserver, paiement après le service."
        path="/"
        jsonLd={aggregateRatingJsonLd}
      />
      <HomeHero diagFrom={prices.diagnostic ?? null} />
      <ServiceStack prices={prices} />
      <DiscoverSection />
      <ReviewsSection onLoaded={handleReviewsLoaded} />
      <AppSection />
      <HomeFAQ />
      <FleetBanner />
    </main>
  )
}
