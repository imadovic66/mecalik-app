import { useState } from 'react'
import { SERVICES, ZONE_LABELS, ZONE_DESCRIPTIONS, getPrice, getTotalRevenuePerIntervention, type Zone } from '../data/pricing'
import { MapPin, Clock, ChevronRight, Phone, Info } from 'lucide-react'

export default function QuoteCalculator() {
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const service = SERVICES.find(s => s.id === selectedService)

  return (
    <div className="min-h-screen" style={{ background: '#080808', paddingTop: '80px' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium"
            style={{ color: '#43BCC9' }}>
            Calculateur de devis
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: '16px',
          }}>
            Estimez votre intervention
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.6 }}>
            Tarifs main d&apos;œuvre uniquement. Pièces facturées au coût réel sans marge.
          </p>
        </div>

        {/* Zone selector */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            1. Votre zone
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(ZONE_LABELS) as Zone[]).map(zone => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className="rounded-2xl p-5 text-left transition-all"
                style={{
                  background: selectedZone === zone ? 'rgba(67,188,201,0.1)' : 'rgba(255,255,255,0.03)',
                  border: selectedZone === zone ? '1px solid rgba(67,188,201,0.4)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} style={{ color: selectedZone === zone ? '#43BCC9' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm font-semibold"
                    style={{ color: selectedZone === zone ? '#43BCC9' : 'rgba(255,255,255,0.7)' }}>
                    {ZONE_LABELS[zone]}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {ZONE_DESCRIPTIONS[zone]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Service selector */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            2. Votre service
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICES.map(s => {
              const price = getPrice(s, selectedZone)
              const isSelected = selectedService === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className="rounded-2xl p-5 text-left transition-all flex items-center justify-between"
                  style={{
                    background: isSelected ? 'rgba(67,188,201,0.08)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? '1px solid rgba(67,188,201,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div>
                    <div className="font-medium text-sm mb-1" style={{ color: 'white' }}>
                      {s.label}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {s.duration}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="font-bold text-sm"
                      style={{ color: s.contactOnly ? '#F0C040' : '#43BCC9' }}>
                      {price}
                    </div>
                    {s.contactOnly && (
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Nous contacter
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Result panel */}
        {service && (
          <div className="rounded-3xl p-8 mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(67,188,201,0.06) 0%, rgba(67,188,201,0.02) 100%)',
              border: '1px solid rgba(67,188,201,0.2)',
            }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-6"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              3. Votre devis estimatif
            </h2>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xl font-bold mb-1" style={{ color: 'white' }}>
                  {service.label}
                </div>
                <div className="flex items-center gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <MapPin size={13} />
                  {ZONE_LABELS[selectedZone]}
                </div>
              </div>
              <div className="text-right">
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#43BCC9',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>
                  {getPrice(service, selectedZone)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Main d&apos;œuvre
                </div>
              </div>
            </div>

            {/* Details */}
            {(() => {
              const partsRevenue = getTotalRevenuePerIntervention(service, selectedZone)
              return (
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Clock size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Durée estimée: <strong style={{ color: 'white' }}>{service.duration}</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Info size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {service.includes}
                    </span>
                  </div>
                  {service.hasPartsRequired && service.typicalPartsCost && service.typicalPartsCost.min > 0 && (
                    <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Info size={15} style={{ color: '#F0C040', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Pièces estimées: <strong style={{ color: 'white' }}>
                          {service.typicalPartsCost.min}–{service.typicalPartsCost.max} MAD
                        </strong>
                        {' '}(facturées au prix fournisseur + 5% de frais de gestion)
                      </span>
                    </div>
                  )}
                  {service.hasPartsRequired && partsRevenue.totalMin !== null && partsRevenue.totalMax !== null && (
                    <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                      style={{ background: 'rgba(67,188,201,0.05)', border: '1px solid rgba(67,188,201,0.12)' }}>
                      <Info size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                          Coût total estimé (MO + pièces):
                        </span>
                        <div className="font-bold mt-0.5" style={{ color: '#43BCC9' }}>
                          {partsRevenue.totalMin}–{partsRevenue.totalMax} MAD
                        </div>
                      </div>
                    </div>
                  )}
                  {!service.contactOnly && (
                    <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                      style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.1)' }}>
                      <Info size={15} style={{ color: '#F0C040', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Les pièces (si nécessaires) sont facturées au coût réel,
                        sans marge MecaLIK.
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                Réserver ce service
                <ChevronRight size={16} />
              </button>
              <a
                href="tel:+212667101341"
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-full font-semibold text-sm"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
              >
                <Phone size={15} />
                Appeler
              </a>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Ces tarifs sont indicatifs. Le devis final vous est confirmé par WhatsApp avant toute intervention.
          Paiement uniquement après service.
        </p>
      </div>
    </div>
  )
}
