/** Finances tab — KPI row, monthly revenue chart, revenue by service, transactions, B2B/B2C split, pricing grid */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { SERVICES as PRICING_SERVICES, getTotalRevenuePerIntervention, type Zone } from '../../../data/pricing'
import { type FinanceBooking } from '../adminShared'

interface Props {
  financeBookings: FinanceBooking[]
  financeLoading: boolean
}

export default function FinancesTab({ financeBookings, financeLoading }: Props) {
  const { t, i18n } = useTranslation()
  const [selectedZone, setSelectedZone] = useState<Zone>('zone1')

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()

  const totalRevenue = financeBookings.reduce((s, b) => s + b.amount_ttc, 0)
  const monthRevenue = financeBookings
    .filter(b => { const d = new Date(b.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear })
    .reduce((s, b) => s + b.amount_ttc, 0)
  const avgPerService = financeBookings.length ? Math.round(totalRevenue / financeBookings.length) : 0
  const b2bRevenue = financeBookings.filter(b => b.company_id).reduce((s, b) => s + b.amount_ttc, 0)
  const b2bPct     = totalRevenue > 0 ? Math.round((b2bRevenue / totalRevenue) * 100) : 0

  const monthLabels = i18n.language === 'fr'
    ? ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1)
    const m = d.getMonth(), y = d.getFullYear()
    const revenue = financeBookings
      .filter(b => { const bd = new Date(b.created_at); return bd.getMonth() === m && bd.getFullYear() === y })
      .reduce((s, b) => s + b.amount_ttc, 0)
    return { month: monthLabels[m], revenue }
  })

  const byService = Object.values(
    financeBookings.reduce<Record<string, { service: string; count: number; revenue: number }>>((acc, b) => {
      const key = b.service_name
      if (!acc[key]) acc[key] = { service: key, count: 0, revenue: 0 }
      acc[key].count++
      acc[key].revenue += b.amount_ttc
      return acc
    }, {})
  ).sort((a, b) => b.revenue - a.revenue)

  const recentTx   = financeBookings.slice(0, 10)
  const b2cBookings = financeBookings.filter(b => !b.company_id)
  const b2bBookings = financeBookings.filter(b => b.company_id)
  const b2cRevenue  = b2cBookings.reduce((s, b) => s + b.amount_ttc, 0)

  const priceChartData = PRICING_SERVICES
    .filter(s => !s.contactOnly)
    .map(s => {
      const moPrice = s[selectedZone] as number
      const techCost    = Math.round(moPrice * 0.60)
      const mecalikMO   = Math.round(moPrice * 0.40)
      const revenue     = getTotalRevenuePerIntervention(s, selectedZone)
      const partsAvg    = Math.round((revenue.partsMin + revenue.partsMax) / 2)
      return { name: s.labelShort, 'Part technicien': techCost, 'Marge MO MecaLIK': mecalikMO, 'Marge pièces (5%)': partsAvg }
    })

  const moServices = PRICING_SERVICES.filter(s => !s.contactOnly && s[selectedZone])
  const avgMO = moServices.length ? Math.round(moServices.reduce((sum, s) => sum + (s[selectedZone] as number) * 0.4, 0) / moServices.length) : 0
  const partsServices = PRICING_SERVICES.filter(s => s.hasPartsRequired && s.typicalPartsCost && s.typicalPartsCost.min > 0)
  const avgParts = partsServices.length ? Math.round(partsServices.reduce((sum, s) => sum + ((s.typicalPartsCost!.min + s.typicalPartsCost!.max) / 2 * 0.05), 0) / partsServices.length) : 0

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }

  return (
    <>
      <h2 className="text-lg font-semibold mb-6" style={{ color: 'white' }}>
        {t('admin.finance.title')}
      </h2>

      {financeLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#43BCC9] border-t-transparent animate-spin" />
        </div>
      ) : financeBookings.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('admin.finance.noData')}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: t('admin.finance.totalRevenue'), value: `${totalRevenue.toLocaleString()} MAD` },
              { label: t('admin.finance.thisMonth'),    value: `${monthRevenue.toLocaleString()} MAD` },
              { label: t('admin.finance.avgPerService'),value: `${avgPerService} MAD` },
              { label: t('admin.finance.b2bShare'),     value: `${b2bPct}%` },
            ].map(kpi => (
              <div key={kpi.label} style={cardStyle}>
                <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
                <div className="text-2xl font-bold" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue by month */}
          <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('admin.finance.revenueByMonth')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                  formatter={(val: unknown) => [`${val} MAD`, '']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="revenue" fill="#43BCC9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by service */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('admin.finance.revenueByService')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[t('admin.service'), t('admin.finance.interventions'), t('admin.revenue'), t('admin.finance.avgPrice')].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byService.map(row => (
                    <tr key={row.service} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: 'white' }}>{row.service}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{row.count}</td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#43BCC9' }}>{row.revenue.toLocaleString()} MAD</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(row.revenue / row.count)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions + B2B/B2C */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('admin.finance.recentTransactions')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {[t('admin.date'), t('admin.service'), t('admin.amount'), t('admin.finance.type')].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map(tx => {
                      const isB2B = !!tx.company_id
                      const d = new Date(tx.created_at)
                      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-5 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{dateStr}</td>
                          <td className="px-5 py-3 text-sm" style={{ color: 'white' }}>{tx.service_name}</td>
                          <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#43BCC9' }}>{tx.amount_ttc} MAD</td>
                          <td className="px-5 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={isB2B
                                ? { background: 'rgba(240,192,64,0.1)', color: '#F0C040', border: '1px solid rgba(240,192,64,0.2)' }
                                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                              }>
                              {isB2B ? 'B2B' : 'B2C'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-sm font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {t('admin.finance.b2bVsB2c')}
              </h3>
              <div className="space-y-5">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>B2C</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{b2cRevenue.toLocaleString()} MAD</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{b2cBookings.length} {t('admin.finance.interventions')}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(240,192,64,0.04)', border: '1px solid rgba(240,192,64,0.12)' }}>
                  <div className="text-xs mb-3 font-semibold uppercase tracking-wide" style={{ color: '#F0C040' }}>B2B</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>{b2bRevenue.toLocaleString()} MAD</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{b2bBookings.length} {t('admin.finance.interventions')}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pricing grid */}
      <div className="mt-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Grille tarifaire</h3>
          <div className="flex gap-2">
            {(['zone1', 'zone2', 'zone3'] as Zone[]).map(z => (
              <button key={z} onClick={() => setSelectedZone(z)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: selectedZone === z ? '#43BCC9' : 'rgba(255,255,255,0.06)', color: selectedZone === z ? '#080808' : 'rgba(255,255,255,0.5)' }}>
                {z === 'zone1' ? 'Zone 1' : z === 'zone2' ? 'Zone 2' : 'Zone 3'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Services tarifés',   value: String(PRICING_SERVICES.filter(s => !s.contactOnly).length), color: 'white' },
            { label: 'Marge MO moy.',      value: `${avgMO} MAD`,        color: 'white' },
            { label: 'Marge pièces moy.',  value: `+${avgParts} MAD`,    color: 'white' },
            { label: 'Seuil rentabilité',  value: '82 interventions',    color: 'white' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</div>
              <div className="text-xl font-bold" style={{ color: kpi.color, fontFamily: 'Space Grotesk, sans-serif' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Tarifs et marges estimées par service
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceChartData} margin={{ top: 5, right: 20, bottom: 60, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                formatter={(val: unknown) => [`${val} MAD`]}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="Part technicien"   fill="rgba(255,68,68,0.6)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Marge MO MecaLIK"  fill="#43BCC9"             radius={[3, 3, 0, 0]} />
              <Bar dataKey="Marge pièces (5%)" fill="#F0C040"             radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Grille tarifaire complète</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#141414' }}>
                  {['Service', 'Zone 1', 'Zone 2', 'Zone 3', 'Durée'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_SERVICES.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'white' }}>{s.label}</td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : '#43BCC9' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone1} MAD`}
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone2} MAD`}
                    </td>
                    <td className="px-4 py-3 text-sm text-center" style={{ color: s.contactOnly ? '#F0C040' : 'rgba(255,255,255,0.7)' }}>
                      {s.contactOnly ? (s.contactLabel ?? '—') : `${s.zone3} MAD`}
                    </td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
