/** Stats bar — 4-column metrics strip beneath the hero (response time, confirmation, arrival, cost) */

import { useTranslation } from 'react-i18next'

export default function StatsBar() {
  const { t } = useTranslation()

  const stats = [
    { value: t('landing.stat1Value'), label: t('landing.stat1Label') },
    { value: '< 5 min',              label: t('landing.ctaMetric1Label') },
    { value: '< 90 min',             label: t('landing.stat2Label') },
    { value: '0 MAD',                label: t('landing.stat4Label') },
  ]

  return (
    <section className="border-t border-b border-[rgba(255,255,255,0.06)] bg-[#080808] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.value}
              className="text-center px-4 lg:px-8 py-4 lg:py-2"
              style={{
                borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div className="font-heading text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs lg:text-sm text-[rgba(255,255,255,0.4)] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
