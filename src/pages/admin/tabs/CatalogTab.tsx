/** Admin → Tarifs & pièces: edit service fees, part prices, car sizes. Packages recompute live in the DB view. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { loadCatalog, fmtMAD, type PackagePrice, type Tier } from '../../../lib/catalog'

type Service = { id: string; slug: string; name_fr: string; service_fee_ttc: number; price_mode: string; is_active: boolean; sort_order: number }
type Part = { id: string; sku: string; name: string; category: string; unit: string; cost_ttc: number; margin_pct: number; price_ttc: number; supplier: string | null; valid_until: string | null; is_active: boolean }
type Model = { id: string; brand: string; model: string; tier: Tier; is_active: boolean }

const box: React.CSSProperties = { background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '18px' }
const th: React.CSSProperties = { textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px 10px', fontSize: '13px', color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }
const input: React.CSSProperties = { background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '6px 8px', fontSize: '13px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const h2: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 4px' }
const sub: React.CSSProperties = { fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '0 0 14px', lineHeight: 1.5 }

const today = () => new Date().toISOString().slice(0, 10)
const daysUntil = (d: string | null) => d ? Math.round((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000) : null

export default function CatalogTab() {
  const [services, setServices] = useState<Service[]>([])
  const [parts, setParts]       = useState<Part[]>([])
  const [models, setModels]     = useState<Model[]>([])
  const [packages, setPackages] = useState<PackagePrice[]>([])
  const [status, setStatus]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [modelFilter, setModelFilter] = useState('')
  const [newModel, setNewModel] = useState<{ brand: string; model: string; tier: Tier }>({ brand: '', model: '', tier: 'S' })

  const load = useCallback(async () => {
    setLoading(true)
    const [s, p, m, cat] = await Promise.all([
      supabase.from('catalog_services').select('*').order('sort_order'),
      supabase.from('catalog_parts').select('*').order('category').order('name'),
      supabase.from('vehicle_models').select('id, brand, model, tier, is_active').order('brand').order('model'),
      loadCatalog(true).catch(() => null),
    ])
    setServices((s.data ?? []).map((r: any) => ({ ...r, service_fee_ttc: Number(r.service_fee_ttc) })))
    setParts((p.data ?? []).map((r: any) => ({ ...r, cost_ttc: Number(r.cost_ttc), margin_pct: Number(r.margin_pct), price_ttc: Number(r.price_ttc) })))
    setModels((m.data ?? []) as Model[])
    setPackages(cat?.packages ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (table: string, id: string, patch: Record<string, unknown>) => {
    setStatus('Enregistrement…')
    const { error } = await supabase.from(table).update({ ...patch, ...(table !== 'vehicle_models' ? { updated_at: new Date().toISOString() } : {}) }).eq('id', id)
    if (error) { setStatus('Erreur : ' + error.message); return }
    setStatus('Enregistré ✓')
    await load()
    setTimeout(() => setStatus(''), 2000)
  }

  const addModel = async () => {
    if (!newModel.brand.trim() || !newModel.model.trim()) return
    setStatus('Ajout…')
    const { error } = await supabase.from('vehicle_models').insert({ brand: newModel.brand.trim(), model: newModel.model.trim(), tier: newModel.tier })
    if (error) { setStatus('Erreur : ' + error.message); return }
    setNewModel({ brand: newModel.brand, model: '', tier: newModel.tier })
    setStatus('Modèle ajouté ✓')
    await load()
  }

  const expiring = parts.filter(p => p.is_active && p.valid_until && (daysUntil(p.valid_until) ?? 99) <= 7)
  const filteredModels = useMemo(() => {
    const q = modelFilter.toLowerCase()
    return q ? models.filter(m => `${m.brand} ${m.model}`.toLowerCase().includes(q)) : models
  }, [models, modelFilter])

  if (loading && !services.length) return <div style={{ color: 'rgba(255,255,255,0.5)', padding: '20px' }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          Prix client = pièces au prix catalogue + main-d'œuvre MecaLIK. Tout changement s'applique immédiatement au site et aux nouvelles réservations.
        </div>
        <div style={{ fontSize: '13px', color: status.startsWith('Erreur') ? '#FF6B6B' : 'var(--mk-success)', minHeight: '18px' }}>{status}</div>
      </div>

      {expiring.length > 0 && (
        <div style={{ ...box, background: 'rgba(255,153,0,0.07)', border: '1px solid rgba(255,153,0,0.25)', color: '#FFB347', fontSize: '13px' }}>
          ⚠️ {expiring.length} prix de pièce expirent dans 7 jours ou moins : {expiring.map(p => p.name).join(', ')}. Mettez à jour le coût et la date de validité.
        </div>
      )}

      {/* Services */}
      <div style={box}>
        <h2 style={h2}>Main-d'œuvre par service</h2>
        <p style={sub}>Frais MecaLIK TTC (déplacement inclus). Le mécanicien touche 50% de la main-d'œuvre HT, MecaLIK 50% (depuis le 3 nov. 2026).</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Service</th><th style={th}>Frais TTC</th><th style={th}>Mécanicien HT</th><th style={th}>MecaLIK HT</th><th style={th}>Type de prix</th><th style={th}>Actif</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={td}>{s.name_fr}</td>
                  <td style={{ ...td, width: '120px' }}>
                    <input type="number" defaultValue={s.service_fee_ttc} style={input}
                      onBlur={e => { const v = Number(e.target.value); if (v >= 0 && v !== s.service_fee_ttc) save('catalog_services', s.id, { service_fee_ttc: v }) }} />
                  </td>
                  <td style={td}>{fmtMAD(s.service_fee_ttc / 1.2 * 0.5)}</td>
                  <td style={td}>{fmtMAD(s.service_fee_ttc / 1.2 * 0.5)}</td>
                  <td style={td}>
                    <select defaultValue={s.price_mode} style={input} onChange={e => save('catalog_services', s.id, { price_mode: e.target.value })}>
                      <option value="fixed">Prix fixe</option><option value="from">À partir de</option><option value="quote">Sur devis</option>
                    </select>
                  </td>
                  <td style={td}><input type="checkbox" checked={s.is_active} onChange={e => save('catalog_services', s.id, { is_active: e.target.checked })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parts */}
      <div style={box}>
        <h2 style={h2}>Pièces</h2>
        <p style={sub}>Coût fournisseur TTC. Marge 0% = pièces au prix coûtant (option A). Prix client = coût × (1 + marge). Renseignez une date de validité pour être alerté.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
            <thead><tr><th style={th}>Pièce</th><th style={th}>Fournisseur</th><th style={th}>Coût TTC</th><th style={th}>Marge %</th><th style={th}>Prix client</th><th style={th}>Valide jusqu'au</th><th style={th}>Actif</th></tr></thead>
            <tbody>
              {parts.map(p => {
                const d = daysUntil(p.valid_until)
                const late = d != null && d < 0
                return (
                  <tr key={p.id}>
                    <td style={td}><div>{p.name}</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{p.sku} · {p.unit}</div></td>
                    <td style={{ ...td, width: '150px' }}>
                      <input defaultValue={p.supplier ?? ''} style={input} onBlur={e => { if ((e.target.value || null) !== p.supplier) save('catalog_parts', p.id, { supplier: e.target.value || null }) }} />
                    </td>
                    <td style={{ ...td, width: '110px' }}>
                      <input type="number" defaultValue={p.cost_ttc} style={input} onBlur={e => { const v = Number(e.target.value); if (v >= 0 && v !== p.cost_ttc) save('catalog_parts', p.id, { cost_ttc: v }) }} />
                    </td>
                    <td style={{ ...td, width: '90px' }}>
                      <input type="number" defaultValue={p.margin_pct} style={input} onBlur={e => { const v = Number(e.target.value); if (v >= 0 && v !== p.margin_pct) save('catalog_parts', p.id, { margin_pct: v }) }} />
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--mk-action)' }}>{fmtMAD(p.price_ttc)}</td>
                    <td style={{ ...td, width: '150px' }}>
                      <input type="date" defaultValue={p.valid_until ?? ''} min={today()} style={{ ...input, borderColor: late ? 'rgba(255,68,68,0.6)' : (d != null && d <= 7 ? 'rgba(255,153,0,0.6)' : 'rgba(255,255,255,0.1)') }}
                        onBlur={e => { if ((e.target.value || null) !== p.valid_until) save('catalog_parts', p.id, { valid_until: e.target.value || null }) }} />
                    </td>
                    <td style={td}><input type="checkbox" checked={p.is_active} onChange={e => save('catalog_parts', p.id, { is_active: e.target.checked })} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package preview */}
      <div style={box}>
        <h2 style={h2}>Formules : prix calculés</h2>
        <p style={sub}>Ce que voit le client. Calculé automatiquement à partir des deux tableaux ci-dessus.</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead><tr><th style={th}>Service</th><th style={th}>Formule</th><th style={th}>Taille</th><th style={th}>Pièces</th><th style={th}>Main-d'œuvre</th><th style={th}>Prix client TTC</th><th style={th}>Mécanicien HT</th><th style={th}>Marge MecaLIK HT</th></tr></thead>
            <tbody>
              {packages.map(p => (
                <tr key={p.package_id}>
                  <td style={td}>{p.service_name}</td>
                  <td style={td}>{p.name_fr}{p.fuel ? <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {p.fuel}</span> : null}</td>
                  <td style={td}>{p.tier ?? 'Toutes'}</td>
                  <td style={td}>{fmtMAD(p.parts_ttc)}</td>
                  <td style={td}>{fmtMAD(p.service_fee_ttc)}</td>
                  <td style={{ ...td, fontWeight: 700, color: 'var(--mk-action)' }}>{p.price_mode === 'from' ? 'dès ' : ''}{fmtMAD(p.total_ttc)}</td>
                  <td style={td}>{fmtMAD(p.mechanic_share_ht)}</td>
                  <td style={td}>{fmtMAD(p.mecalik_margin_ht)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Models */}
      <div style={box}>
        <h2 style={h2}>Modèles de véhicules et taille</h2>
        <p style={sub}>S = citadine · M = compacte / berline / SUV compact · L = SUV / premium / pick-up. La taille détermine la formule (quantité d'huile, batterie).</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <input placeholder="Marque" value={newModel.brand} onChange={e => setNewModel({ ...newModel, brand: e.target.value })} style={{ ...input, width: '140px' }} />
          <input placeholder="Modèle" value={newModel.model} onChange={e => setNewModel({ ...newModel, model: e.target.value })} style={{ ...input, width: '160px' }} />
          <select value={newModel.tier} onChange={e => setNewModel({ ...newModel, tier: e.target.value as Tier })} style={{ ...input, width: '80px' }}>
            <option value="S">S</option><option value="M">M</option><option value="L">L</option>
          </select>
          <button onClick={addModel} style={{ background: 'var(--mk-action)', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Ajouter</button>
          <input placeholder="Rechercher…" value={modelFilter} onChange={e => setModelFilter(e.target.value)} style={{ ...input, width: '180px', marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
          {filteredModels.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 10px', background: '#141414', borderRadius: '8px', opacity: m.is_active ? 1 : 0.4 }}>
              <span style={{ fontSize: '13px', color: 'white' }}>{m.brand} {m.model}</span>
              <select defaultValue={m.tier} onChange={e => save('vehicle_models', m.id, { tier: e.target.value })} style={{ ...input, width: '60px', padding: '3px 6px' }}>
                <option value="S">S</option><option value="M">M</option><option value="L">L</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
