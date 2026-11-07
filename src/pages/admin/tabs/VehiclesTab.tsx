/** Admin → Véhicules: every customer car, what's due, and one-tap WhatsApp to the owner. */
import { useEffect, useMemo, useState } from 'react'
import {
  loadAdminVehicles, fmtKm, fmtDate, fmtMoney, docLabel, waNumber, garageUrl, carName,
  type AdminVehicle,
} from '../../../lib/garage'

type Filter = 'all' | 'due' | 'missing'

const box: React.CSSProperties = { background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }
const chip = (sel: boolean): React.CSSProperties => ({
  padding: '7px 12px', borderRadius: '9px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  background: sel ? 'rgba(67,188,201,0.12)' : '#111', color: sel ? '#43BCC9' : 'rgba(255,255,255,0.7)',
  border: sel ? '1px solid rgba(67,188,201,0.45)' : '1px solid rgba(255,255,255,0.08)', fontWeight: sel ? 600 : 400,
})
const btn: React.CSSProperties = { background: '#151515', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }

function dueLine(v: AdminVehicle) {
  const parts: string[] = []
  for (const d of v.docs_due ?? []) parts.push(`${docLabel(d.doc_type)} ${d.days_left < 0 ? `expirée (${fmtDate(d.expiry_date)})` : `expire le ${fmtDate(d.expiry_date)}`}`)
  for (const m of v.due ?? []) {
    const bits: string[] = []
    if (m.km_left != null) bits.push(m.km_left <= 0 ? `dépassé de ${fmtKm(-m.km_left)}` : `dans ${fmtKm(m.km_left)}`)
    if (m.days_left != null) bits.push(m.days_left <= 0 ? `en retard de ${-m.days_left} j` : `dans ${m.days_left} j`)
    parts.push(`${m.label} ${bits.join(' / ')}`)
  }
  return parts
}

export default function VehiclesTab() {
  const [rows, setRows] = useState<AdminVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    loadAdminVehicles().then(r => { setRows(r ?? []); setLoading(false) })
      .catch(e => { setError(String(e?.message || e)); setLoading(false) })
  }, [])

  const list = useMemo(() => rows
    .filter(v => filter === 'all' || (filter === 'due' ? v.urgency < 2 : v.unknown_count > 0 || v.mileage == null))
    .filter(v => !q || `${v.owner_name ?? ''} ${v.owner_phone ?? ''} ${v.brand} ${v.model ?? ''} ${v.license_plate ?? ''}`.toLowerCase().includes(q.toLowerCase())),
  [rows, filter, q])

  const counts = { all: rows.length, due: rows.filter(v => v.urgency < 2).length, missing: rows.filter(v => v.unknown_count > 0 || v.mileage == null).length }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>Chargement…</div>
  if (error) return <div style={{ color: '#FF6B6B', padding: '20px' }}>Erreur : {error}</div>

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        {[['Véhicules', counts.all, 'white'], ['À relancer', counts.due, '#F0C040'], ['Infos manquantes', counts.missing, 'rgba(255,255,255,0.6)'],
          ['CA MecaLIK (véhicules)', fmtMoney(rows.reduce((s, v) => s + Number(v.mecalik_revenue || 0), 0)), '#43BCC9']].map(([l, val, c]) => (
          <div key={String(l)} style={box}><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{l}</div><div style={{ fontSize: '20px', fontWeight: 800, color: String(c), marginTop: '4px' }}>{val}</div></div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>Tous ({counts.all})</button>
        <button onClick={() => setFilter('due')} style={chip(filter === 'due')}>À relancer ({counts.due})</button>
        <button onClick={() => setFilter('missing')} style={chip(filter === 'missing')}>Infos manquantes ({counts.missing})</button>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Client, téléphone, plaque…" style={{ marginLeft: 'auto', background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: 'white', padding: '7px 10px', fontSize: '13px', fontFamily: 'inherit', minWidth: '200px' }} />
      </div>

      {list.length === 0 && <div style={{ ...box, color: 'rgba(255,255,255,0.5)' }}>Aucun véhicule dans ce filtre.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.map(v => {
          const first = (v.owner_name || '').trim().split(/\s+/)[0] || ''
          const d = waNumber(v.owner_phone)
          const due = dueLine(v)
          const linkMsg = `Bonjour ${first}, voici votre garage MecaLIK pour votre ${carName(v)} : papiers, entretien, kilométrage et rappels au même endroit. ${garageUrl(v.token)} (lien privé, ne le partagez pas)`
          const remindMsg = `Bonjour ${first}, petit rappel MecaLIK pour votre ${carName(v)} : ${due.join(' ; ')}. On passe chez vous ? Votre garage : ${garageUrl(v.token)}`
          const color = v.urgency === 0 ? '#FF6B6B' : v.urgency === 1 ? '#F0C040' : 'rgba(255,255,255,0.15)'
          return (
            <div key={v.id} style={{ ...box, borderLeft: `3px solid ${color}`, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{carName(v)}{v.license_plate ? <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {v.license_plate}</span> : null}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                  {v.owner_name || 'Client'}{v.owner_phone ? ` · ${v.owner_phone}` : ''}{v.has_account ? ' · compte' : ' · lien privé'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                  {fmtKm(v.est_km ?? v.mileage)}{v.fuel_type ? ` · ${v.fuel_type}` : ''} · {v.bookings_count} réservation(s){v.last_mecalik ? ` · dernière intervention ${fmtDate(v.last_mecalik)}` : ''}
                </div>
                {due.length > 0 && <div style={{ fontSize: '12px', color, marginTop: '4px' }}>{due.join(' · ')}</div>}
                {v.unknown_count > 0 && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{v.unknown_count} élément(s) d'entretien sans date{v.mileage == null ? ' · km inconnu' : ''}</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {d && due.length > 0 && <a href={`https://wa.me/${d}?text=${encodeURIComponent(remindMsg)}`} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#25D366', color: '#0A0A0A', border: 'none' }}>Relancer</a>}
                {d && <a href={`https://wa.me/${d}?text=${encodeURIComponent(linkMsg)}`} target="_blank" rel="noopener noreferrer" style={btn}>Envoyer le lien garage</a>}
                <a href={`/garage/${v.token}`} target="_blank" rel="noopener noreferrer" style={btn}>Ouvrir</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
