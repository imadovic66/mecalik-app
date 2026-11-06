import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/SEO'
import { loadCatalog, fmtMAD, type Catalog, type Tier, type PackagePrice } from '../lib/catalog'
import { WHATSAPP_URL } from '../lib/constants'

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://mecalik.com/' },
    { '@type': 'ListItem', position: 2, name: 'Tarifs', item: 'https://mecalik.com/tarifs' },
  ],
}

// Booking-modal service id for each catalogue service slug
const SERVICES: { slug: string; bookingId: string; fr: string; en: string; duration: string }[] = [
  { slug: 'vidange',    bookingId: 'vidange',    fr: 'Vidange',             en: 'Oil change',  duration: '~60 min' },
  { slug: 'batterie',   bookingId: 'batterie',   fr: 'Batterie',            en: 'Battery',     duration: '~30 min' },
  { slug: 'diagnostic', bookingId: 'diagnostic', fr: 'Diagnostic',          en: 'Diagnostic',  duration: '~45 min' },
  { slug: 'urgence',    bookingId: 'urgence',    fr: 'Urgence & Dépannage', en: 'Emergency',   duration: 'ASAP' },
]

const openBooking = (service?: string) =>
  window.dispatchEvent(new CustomEvent('openBooking', service ? { detail: { service } } : undefined))

export default function Tarifs() {
  const { i18n } = useTranslation()
  const isFr = i18n.language !== 'en'
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [failed, setFailed]   = useState(false)
  const [tier, setTier]       = useState<Tier>('S')

  useEffect(() => { loadCatalog().then(setCatalog).catch(() => setFailed(true)) }, [])

  const byService = useMemo(() => {
    const out: Record<string, PackagePrice[]> = {}
    if (!catalog) return out
    for (const s of SERVICES) {
      out[s.slug] = catalog.packages
        .filter(p => p.service_slug === s.slug && (!p.tier || p.tier === tier))
        .sort((a, b) => a.sort_order - b.sort_order || a.total_ttc - b.total_ttc)
    }
    return out
  }, [catalog, tier])

  const steps = isFr
    ? ['Choisissez le service et votre voiture.', 'Le prix exact s\'affiche avant de réserver.', 'Un technicien vous est attribué et vient chez vous.', 'Vous payez après l\'intervention.']
    : ['Choose the service and your car.', 'The exact price shows before you book.', 'A technician is assigned and comes to you.', 'You pay after the service.']
  const guarantees = isFr
    ? ['Prix fixe affiché avant réservation', 'Pièces au prix catalogue, détail visible', 'Rien de plus sans votre accord', 'Paiement après le service']
    : ['Fixed price shown before booking', 'Parts at catalogue price, details visible', 'Nothing extra without your approval', 'Pay after the service']

  return (
    <main style={{ background: '#0A0A0A', color: 'white', fontFamily: 'Outfit, sans-serif', minHeight: '100vh', paddingTop: '80px' }}>
      <SEO
        title="Tarifs fixes — Mécanicien à domicile Casablanca | MecaLIK"
        description="Prix fixes affichés avant de réserver : vidange dès 805 MAD, batterie posée dès 870 MAD, diagnostic 250 MAD. Pièces au prix catalogue, paiement après le service."
        path="/tarifs"
        jsonLd={BREADCRUMB_SCHEMA}
      />

      {/* Hero */}
      <section style={{ padding: '72px 5% 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={pill}>{isFr ? 'Tarifs' : 'Pricing'}</div>
        <h1 style={{ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 800, marginBottom: '18px', lineHeight: 1.1 }}>
          {isFr ? 'Prix fixes. Affichés avant de réserver.' : 'Fixed prices. Shown before you book.'}
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '640px', lineHeight: 1.7 }}>
          {isFr
            ? 'Chaque prix = les pièces au prix catalogue + la main-d\'œuvre MecaLIK. Déplacement inclus. Choisissez la taille de votre voiture pour voir votre prix.'
            : 'Every price = parts at catalogue price + MecaLIK labour. Travel included. Pick your car size to see your price.'}
        </p>
      </section>

      {/* Size selector */}
      <section style={{ padding: '0 5% 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>{isFr ? 'Ma voiture est :' : 'My car is:'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {(catalog?.tiers ?? []).map(tr => {
            const sel = tr.code === tier
            return (
              <button key={tr.code} onClick={() => setTier(tr.code)} style={{
                textAlign: 'left', padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit',
                background: sel ? 'rgba(67,188,201,0.1)' : 'rgba(255,255,255,0.03)',
                border: sel ? '1.5px solid rgba(67,188,201,0.5)' : '1px solid rgba(255,255,255,0.08)', color: 'white',
              }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: sel ? 'var(--mk-action)' : 'white' }}>{tr.label_fr}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', lineHeight: 1.4 }}>{tr.examples}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Price cards */}
      <section style={{ padding: '16px 5% 48px', maxWidth: '1200px', margin: '0 auto' }}>
        {failed && (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', color: '#FFB347' }}>
            {isFr ? 'Les prix n\'ont pas pu être chargés. Réessayez dans un instant.' : 'Prices could not load. Please try again shortly.'}
          </div>
        )}
        {!catalog && !failed && <div style={{ color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'Chargement des prix…' : 'Loading prices…'}</div>}
        {catalog && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
            {SERVICES.map(s => {
              const list = byService[s.slug] ?? []
              return (
                <div key={s.slug} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{isFr ? s.fr : s.en}</h2>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.duration}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {list.map(p => (
                      <div key={p.package_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name_fr}</div>
                          {p.description_fr && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', lineHeight: 1.4 }}>{p.description_fr}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {p.price_mode === 'from' && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{isFr ? 'dès' : 'from'}</div>}
                          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--mk-action)' }}>{fmtMAD(p.total_ttc)}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>TTC</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => openBooking(s.bookingId)} style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--mk-action)', color: '#0A0A0A', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isFr ? 'Réserver' : 'Book'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '18px', lineHeight: 1.6 }}>
          {isFr
            ? 'Urgence : le prix couvre le déplacement et le premier diagnostic. Si une pièce est nécessaire, elle vous est proposée au prix catalogue et vous validez avant toute intervention. Pneus et lavage : bientôt disponibles.'
            : 'Emergency: the price covers travel and the first diagnosis. If a part is needed, it is offered at catalogue price and you approve before any work. Tyres and car wash: coming soon.'}
        </p>
      </section>

      {/* How it works */}
      <section style={{ padding: '24px 5% 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '28px' }}>{isFr ? 'Comment ça marche' : 'How it works'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: '20px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ width: '34px', height: '34px', background: 'var(--mk-action)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '14px', color: '#0A0A0A' }}>{i + 1}</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guarantee */}
      <section style={{ padding: '24px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(67,188,201,0.06)', border: '1px solid rgba(67,188,201,0.2)', borderRadius: '20px', padding: '36px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--mk-action)' }}>{isFr ? 'Notre garantie prix' : 'Our price guarantee'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))', gap: '14px' }}>
            {guarantees.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--mk-action)', fontSize: '20px' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B */}
      <section style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)', borderRadius: '20px', padding: '36px', display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '10px', color: 'var(--mk-premium)' }}>{isFr ? 'Vous gérez une flotte ?' : 'Running a fleet?'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
              {isFr ? 'Tarifs dédiés, facturation mensuelle centralisée et un interlocuteur unique dès 3 véhicules.' : 'Dedicated pricing, one monthly invoice and a single contact from 3 vehicles.'}
            </p>
          </div>
          <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(isFr ? 'Bonjour, je souhaite une offre flotte MecaLIK.' : 'Hello, I would like a MecaLIK fleet offer.')}`} style={{ background: 'var(--mk-premium)', color: '#0A0A0A', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {isFr ? 'Demander une offre' : 'Request an offer'}
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 5% 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '14px' }}>{isFr ? 'Voyez votre prix en 30 secondes' : 'See your price in 30 seconds'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '28px', fontSize: '17px' }}>{isFr ? 'Sans engagement. Paiement après le service.' : 'No commitment. Pay after the service.'}</p>
        <button onClick={() => openBooking()} style={{ background: 'var(--mk-action)', color: '#0A0A0A', padding: '16px 36px', borderRadius: '14px', fontWeight: 800, border: 'none', fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {isFr ? 'Réserver maintenant' : 'Book now'}
        </button>
      </section>
    </main>
  )
}

const pill: React.CSSProperties = {
  display: 'inline-block', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.3)', borderRadius: '100px',
  padding: '6px 16px', marginBottom: '22px', fontSize: '12px', color: 'var(--mk-action)', letterSpacing: '0.1em', textTransform: 'uppercase',
}
