/** Dashboard strip: what needs attention across the customer's cars, linking to Mon garage. */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { garageApi, docLabel, dueText, daysText, carName, type GarageData } from '../../lib/garage'

export default function GarageAlertsCard() {
  const navigate = useNavigate()
  const [data, setData] = useState<GarageData | null>(null)
  useEffect(() => { garageApi(null).load().then(setData).catch(() => setData(null)) }, [])
  if (!data || data.cars.length === 0) return null

  const items: { text: string; red: boolean }[] = []
  for (const c of data.cars) {
    for (const d of c.documents) if (d.days_left != null && d.days_left <= 30)
      items.push({ text: `${docLabel(d.doc_type)} · ${carName(c.car)} — ${d.days_left < 0 ? 'expirée' : 'expire'} ${daysText(d.days_left)}`, red: d.days_left < 0 })
    for (const m of c.maintenance) if (m.status === 'overdue' || m.status === 'soon')
      items.push({ text: `${m.label} · ${carName(c.car)} — ${dueText(m)}`, red: m.status === 'overdue' })
  }
  const missing = data.cars.reduce((n, c) => n + (c.documents.length === 0 ? 1 : 0) + (c.car.mileage == null ? 1 : 0), 0)
  if (items.length === 0 && missing === 0) return null

  return (
    <button onClick={() => navigate('/dashboard/voitures')} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '20px',
      background: items.some(i => i.red) ? 'rgba(255,107,107,0.07)' : 'rgba(240,192,64,0.07)',
      border: `1px solid ${items.some(i => i.red) ? 'rgba(255,107,107,0.3)' : 'rgba(240,192,64,0.3)'}`,
      borderRadius: '14px', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
        🚗 Mon garage {items.length > 0 ? `· ${items.length} point${items.length > 1 ? 's' : ''} à surveiller` : ''}
      </div>
      {items.slice(0, 3).map((i, k) => (
        <div key={k} style={{ fontSize: '12px', color: i.red ? '#FF6B6B' : '#F0C040', lineHeight: 1.6 }}>• {i.text}</div>
      ))}
      {items.length === 0 && missing > 0 && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Ajoutez vos papiers et votre kilométrage pour recevoir des rappels.</div>
      )}
      <div style={{ fontSize: '12px', color: 'var(--mk-action)', marginTop: '6px', fontWeight: 600 }}>Ouvrir mon garage →</div>
    </button>
  )
}
