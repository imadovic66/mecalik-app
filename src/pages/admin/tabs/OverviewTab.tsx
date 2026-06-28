/** Overview tab — KPI strip, revenue bar chart, booking distribution donut, recent activity list */

import { useTranslation } from 'react-i18next'
import { Wrench } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { type Booking, getGuestLabel, StatusPill } from '../adminShared'
import { serviceIdFromName } from '../../../lib/serviceUtils'

interface OfflineActivity {
  id: string
  service_name: string
  client_name: string
  amount_ttc: number
  created_at: string
}

interface Props {
  bookings: Booking[]
  loading: boolean
  stats: { total: number; pending: number; inProgress: number; revenue: number }
  revenueData: { month: string; revenue: number }[]
  bookingStatusData: { name: string; value: number; color: string }[]
  offlineActivities: OfflineActivity[]
  onViewAll: () => void
  onSelectBooking: (b: Booking) => void
}

export default function OverviewTab({ bookings, loading, stats, revenueData, bookingStatusData, offlineActivities, onViewAll, onSelectBooking }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <>
      {/* Stat bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
        overflow: 'hidden', marginBottom: '24px',
      }}>
        {[
          { label: t('admin.total'),      value: String(stats.total),       color: 'white', note: t('admin.kpiReservations') },
          { label: t('admin.pending'),    value: String(stats.pending),     color: 'white', note: t('admin.kpiToProcess')     },
          { label: t('admin.inProgress'), value: String(stats.inProgress),  color: 'white', note: t('admin.kpiInterventions') },
          { label: t('admin.revenue'),    value: `${stats.revenue} MAD`,    color: 'white', note: t('admin.kpiCompleted')     },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#0D0D0D', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 500 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{stat.note}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-6" style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-heading font-semibold text-base mb-6" style={{ color: 'white' }}>
            {t('admin.revenueChart')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                formatter={(val: unknown) => [`${val} MAD`, 'Revenus']}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="revenue" name="Revenus" fill="#43BCC9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="font-heading font-semibold text-base mb-6" style={{ color: 'white' }}>
            {t('admin.distributionChart')}
          </h3>
          {bookingStatusData.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t('admin.noReservationsPeriod')}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {bookingStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                    formatter={(val: unknown, name: unknown) => [`${val}`, name as string]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {bookingStatusData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl p-6" style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-base" style={{ color: 'white' }}>
            {t('admin.recentActivity')}
          </h3>
          <button onClick={onViewAll} className="text-sm transition-colors" style={{ color: '#43BCC9' }}>
            {t('admin.viewAll')} →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: '#141414' }} />
            ))}
          </div>
        ) : bookings.length === 0 && offlineActivities.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {t('admin.noReservationsPeriod')}
          </div>
        ) : (() => {
          const platformItems = bookings.map(b => ({ type: 'platform' as const, date: new Date(b.created_at).getTime(), booking: b }))
          const offlineItems  = offlineActivities.map(e => ({ type: 'offline' as const, date: new Date(e.created_at).getTime(), offline: e }))
          const merged = [...platformItems, ...offlineItems]
            .sort((a, b) => b.date - a.date)
            .slice(0, 10)
          return merged.map(item => item.type === 'offline' ? (
            <div
              key={item.offline.id}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(240,192,64,0.08)' }}>
                  <Wrench size={14} style={{ color: '#F0C040' }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'white' }}>{item.offline.service_name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.offline.client_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(240,192,64,0.12)', color: '#F0C040', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📞 Offline
                </span>
                <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.offline.amount_ttc} MAD</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(item.offline.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR')}
                </div>
              </div>
            </div>
          ) : (
            <div
              key={item.booking.id}
              className="flex items-center justify-between py-2.5 border-b last:border-0 cursor-pointer"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              onClick={() => onSelectBooking(item.booking)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(67,188,201,0.08)' }}>
                  <Wrench size={14} style={{ color: '#43BCC9' }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'white' }}>
                    {t('services.' + serviceIdFromName(item.booking.service_name))}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {!item.booking.user_id && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Guest
                      </span>
                    )}
                    {getGuestLabel(item.booking)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={item.booking.status} />
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(item.booking.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR')}
                </div>
              </div>
            </div>
          ))
        })()}
      </div>
    </>
  )
}
