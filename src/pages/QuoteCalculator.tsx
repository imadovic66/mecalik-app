import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SERVICES, getZoneLabels, getZoneDescriptions,
  getServiceLabel, getServiceIncludes, getPriceLocale, getPriceNumber,
  type Zone,
} from '../data/pricing'
import { MapPin, Clock, ChevronRight, Info } from 'lucide-react'

export default function QuoteCalculator() {
  const { t, i18n } = useTranslation()
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const service = SERVICES.find(s => s.id === selectedService)
  const zoneLabels = getZoneLabels(i18n.language)
  const zoneDescs  = getZoneDescriptions(i18n.language)

  return (
    <div className="min-h-screen" style={{ background: '#080808', paddingTop: '80px' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.2em] mb-4 font-medium"
            style={{ color: '#43BCC9' }}>
            {t('devis.title')}
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
            {t('devis.subtitle')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 1.6 }}>
            {t('devis.desc')}
          </p>
        </div>

        {/* Zone selector */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('devis.step1Zone')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(zoneLabels) as Zone[]).map(zone => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className="rounded-2xl p-5 text-left transition-all"
                style={{
                  background: selectedZone === zone ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: selectedZone === zone ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: selectedZone === zone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }} />
                    <span className="text-sm"
                      style={{ color: selectedZone === zone ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: selectedZone === zone ? 600 : 400 }}>
                      {zoneLabels[zone]}
                    </span>
                  </div>
                  {selectedZone === zone && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#43BCC9', flexShrink: 0 }} />
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {zoneDescs[zone]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Service selector */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('devis.step2Service')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICES.map(s => {
              const price = getPriceLocale(s, selectedZone, i18n.language)
              const isSelected = selectedService === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className="rounded-2xl p-5 text-left transition-all flex items-center justify-between"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: isSelected ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div>
                    <div className="font-medium text-sm mb-1" style={{ color: 'white' }}>
                      {getServiceLabel(s, i18n.language)}
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {s.duration}
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="font-bold text-sm"
                      style={{ color: s.contactOnly ? '#F0C040' : 'white', fontWeight: s.contactOnly ? 400 : 600 }}>
                      {price}
                    </div>
                    {s.contactOnly && (
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {t('devis.contactUs')}
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
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-6"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('devis.step3Quote')}
            </h2>

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xl font-bold mb-1" style={{ color: 'white' }}>
                  {getServiceLabel(service, i18n.language)}
                </div>
                <div className="flex items-center gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <MapPin size={13} />
                  {zoneLabels[selectedZone]}
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
                  {getPriceLocale(service, selectedZone, i18n.language)}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {t('devis.labour')}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Clock size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('devis.duration')} <strong style={{ color: 'white' }}>{service.duration}</strong>
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Info size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {getServiceIncludes(service, i18n.language)}
                </span>
              </div>
              {service.hasPartsRequired && service.typicalPartsCost && service.typicalPartsCost.min > 0 && (
                <>
                  <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Info size={15} style={{ color: '#F0C040', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {t('devis.partsEstimate')}{' '}
                      <strong style={{ color: 'white' }}>
                        {service.typicalPartsCost.min}–{service.typicalPartsCost.max} MAD
                      </strong>
                      {' '}{t('devis.managementFee')}
                    </span>
                  </div>
                  {getPriceNumber(service, selectedZone) && (
                    <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                      style={{ background: 'rgba(67,188,201,0.05)', border: '1px solid rgba(67,188,201,0.12)' }}>
                      <Info size={15} style={{ color: '#43BCC9', flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {t('devis.totalCost')}
                        </span>
                        <div className="font-bold mt-0.5" style={{ color: '#43BCC9' }}>
                          {Math.round((getPriceNumber(service, selectedZone) as number) + service.typicalPartsCost.min * 1.05)}
                          –
                          {Math.round((getPriceNumber(service, selectedZone) as number) + service.typicalPartsCost.max * 1.05)} MAD
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {t('devis.payAfter')}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {!service.contactOnly && (
                <div className="flex items-start gap-3 text-sm p-3 rounded-xl"
                  style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.1)' }}>
                  <Info size={15} style={{ color: '#F0C040', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {t('devis.partsNote')}
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openBooking'))}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-bold text-sm transition-all"
                style={{ background: '#43BCC9', color: '#080808' }}
              >
                {t('devis.bookBtn')}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {t('devis.disclaimer')}
        </p>
      </div>
    </div>
  )
}
