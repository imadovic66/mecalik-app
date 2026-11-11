/** "Mon garage" — the customer's cars, papers, maintenance plan, history and expenses.
 *  token = private link for guests; null = logged-in customer (session). Same screen for both. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCustTheme } from '../../lib/custTheme'
import { ThemeButton } from '../ui/ThemeToggle'
import { Plus, X, Check, Pencil, Trash2, Gauge, ArrowLeft, FileText, Wrench, History, LayoutGrid, Link2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { loadCatalog, type VehicleModel } from '../../lib/catalog'
import { WHATSAPP_NUMBER } from '../../lib/constants'
import {
  garageApi, garageError, linkGarageToAccount, DOC_TYPES, CATEGORIES, signDocFiles, uploadDocFile, deleteDocFile,
  fmtKm, fmtMoney, fmtDate, daysText, carName, docLabel, dueText, STATUS_COLOR, STATUS_LABEL,
  type GarageData, type CarBundle, type Car, type Doc, type DocType, type Maint, type LogEntry, type Category, type DocFile,
} from '../../lib/garage'

type Tab = 'apercu' | 'papiers' | 'entretien' | 'historique'
type Modal =
  | { kind: 'car'; car: Partial<Car> | null }
  | { kind: 'km' }
  | { kind: 'doc'; doc: Partial<Doc> & { doc_type: DocType } }
  | { kind: 'done'; m: Maint }
  | { kind: 'maint'; m: Partial<Maint> | null }
  | { kind: 'log'; log: Partial<LogEntry> | null }
  | null

const BOOKABLE: Record<string, string> = { vidange: 'vidange', filtre_air: 'vidange', filtre_gasoil: 'vidange', filtre_habitacle: 'vidange', batterie: 'batterie' }
const openBooking = (service: string) => window.dispatchEvent(new CustomEvent('openBooking', { detail: { service } }))
const askMecalik = (text: string) => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank')

export default function Garage({ token, onBack }: { token: string | null; onBack?: () => void }) {
  const { user, profile } = useAuth()
  const api = useMemo(() => garageApi(token), [token])
  const [data, setData] = useState<GarageData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [carId, setCarId] = useState<string>('')
  const [tab, setTab] = useState<Tab>('apercu')
  const [modal, setModal] = useState<Modal>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [models, setModels] = useState<VehicleModel[]>([])
  const [logFilter, setLogFilter] = useState<Category | 'all'>('all')

  const reload = useCallback(async () => {
    try {
      const d = await api.load()
      setData(d)
      setError('')
      setCarId(prev => (prev && d.cars.some(c => c.car.id === prev)) ? prev : (d.cars[0]?.car.id ?? ''))
    } catch (e) { setError(garageError(e)) }
    finally { setLoading(false) }
  }, [api])

  useEffect(() => { reload() }, [reload])
  useEffect(() => { loadCatalog().then(c => setModels(c.models)).catch(() => setModels([])) }, [])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try { await fn(); setModal(null); await reload(); setToast(ok); setTimeout(() => setToast(''), 2200) }
    catch (e) { setToast(garageError(e)); setTimeout(() => setToast(''), 3500) }
    finally { setBusy(false) }
  }

  const bundle: CarBundle | undefined = data?.cars.find(c => c.car.id === carId)

  if (loading) return <PageShell onBack={onBack}><div style={{ color: 'rgba(var(--c-fg-rgb),0.5)', padding: '60px 0', textAlign: 'center' }}>Chargement de votre garage…</div></PageShell>
  if (error) return (
    <PageShell onBack={onBack}>
      <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
        <div style={{ color: 'var(--c-text)', fontWeight: 600, marginBottom: '6px' }}>{error}</div>
        <div style={{ color: 'rgba(var(--c-fg-rgb),0.5)', fontSize: '13px' }}>Demandez votre lien à MecaLIK sur WhatsApp.</div>
        <button onClick={() => askMecalik('Bonjour, je souhaite recevoir le lien de mon garage MecaLIK.')} style={{ ...btnPrimary, marginTop: '16px' }}>Demander mon lien</button>
      </div>
    </PageShell>
  )
  if (!data) return null

  const g = data.garage
  const alerts = bundle ? buildAlerts(bundle) : []

  return (
    <PageShell onBack={onBack}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--c-link)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Mon garage</div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--c-text)', margin: '4px 0 0' }}>{g.name ? `Bonjour ${g.name.split(' ')[0]}` : 'Vos véhicules'}</h1>
        </div>
        <button onClick={() => setModal({ kind: 'car', car: null })} style={btnGhost}><Plus size={14} /> Ajouter un véhicule</button>
      </div>

      {token && user && profile?.role === 'customer' && !g.is_mine && !g.linked && (
        <div style={{ ...card, borderColor: 'rgba(67,188,201,0.35)', background: 'rgba(67,188,201,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link2 size={16} color="var(--mk-action)" />
          <div style={{ flex: 1, minWidth: '200px', fontSize: '13px', color: 'rgba(var(--c-fg-rgb),0.8)' }}>Rattachez ce garage à votre compte pour le retrouver sans lien.</div>
          <button disabled={busy} onClick={() => run(() => linkGarageToAccount(token), 'Garage rattaché à votre compte ✓')} style={btnPrimary}>Rattacher</button>
        </div>
      )}
      {token && !user && (
        <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.4)', marginBottom: '14px' }}>
          🔒 Lien privé : ne le partagez pas. Vous pouvez aussi <a href="/signup" style={{ color: 'var(--c-link)' }}>créer un compte</a>.
        </div>
      )}

      <ReminderSettings garage={g} busy={busy} onSave={(email, notify) => run(() => api.setContact(email, notify), notify ? 'Rappels par email activés ✓' : 'Rappels par email désactivés')} />

      {/* Empty state */}
      {data.cars.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🚗</div>
          <div style={{ color: 'var(--c-text)', fontWeight: 600, marginBottom: '6px' }}>Ajoutez votre premier véhicule</div>
          <div style={{ color: 'rgba(var(--c-fg-rgb),0.5)', fontSize: '13px', marginBottom: '16px' }}>Papiers, entretien, kilométrage et dépenses au même endroit, avec des rappels.</div>
          <button onClick={() => setModal({ kind: 'car', car: null })} style={btnPrimary}><Plus size={14} /> Ajouter</button>
        </div>
      )}

      {/* Car chips */}
      {data.cars.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '2px' }}>
          {data.cars.map(c => {
            const n = buildAlerts(c).filter(a => a.level !== 'info').length
            return (
              <button key={c.car.id} onClick={() => setCarId(c.car.id)} style={{ ...chip(c.car.id === carId), whiteSpace: 'nowrap' }}>
                {carName(c.car)}{n > 0 && <span style={{ marginLeft: '6px', background: '#FF6B6B', color: '#0A0A0A', borderRadius: '10px', padding: '0 6px', fontSize: '11px', fontWeight: 700 }}>{n}</span>}
              </button>
            )
          })}
        </div>
      )}

      {bundle && (
        <>
          {/* Car card */}
          <div style={{ ...card, display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚗</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-text)' }}>{carName(bundle.car)}</div>
              <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.5)', marginTop: '2px' }}>
                {[bundle.car.license_plate, bundle.car.fuel_type, bundle.car.color].filter(Boolean).join(' · ') || 'Complétez la fiche du véhicule'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.4)' }}>Kilométrage{bundle.est_km != null && bundle.car.mileage != null && bundle.est_km !== bundle.car.mileage ? ' estimé' : ''}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--c-text)' }}>{fmtKm(bundle.est_km ?? bundle.car.mileage)}</div>
              <button onClick={() => setModal({ kind: 'km' })} style={linkBtn}><Gauge size={12} /> Mettre à jour</button>
            </div>
            <button onClick={() => setModal({ kind: 'car', car: bundle.car })} style={iconBtn} title="Modifier"><Pencil size={14} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px', margin: '14px 0', overflowX: 'auto' }}>
            {([
              ['apercu', 'Aperçu', LayoutGrid], ['papiers', 'Papiers', FileText], ['entretien', 'Entretien', Wrench], ['historique', 'Historique & dépenses', History],
            ] as [Tab, string, typeof Wrench][]).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} style={{ ...chip(tab === id), display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* APERÇU */}
          {tab === 'apercu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={card}>
                <SectionTitle>À surveiller</SectionTitle>
                {alerts.length === 0 && <Muted>Rien d'urgent. Renseignez vos papiers et votre dernier entretien pour recevoir des rappels.</Muted>}
                {alerts.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderTop: i ? '1px solid rgba(var(--c-fg-rgb),0.05)' : 'none' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: 'var(--c-text)', fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: '12px', color: a.color }}>{a.sub}</div>
                    </div>
                    {a.action && <button onClick={a.action.fn} style={btnSmall}>{a.action.label}</button>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <Stat label="Dépenses 12 mois" value={fmtMoney(bundle.spend_12m)} />
                <Stat label="Dépenses totales" value={fmtMoney(bundle.spend_total)} />
                <Stat label="Interventions MecaLIK" value={String(bundle.history.filter(h => h.source === 'mecalik').length)} />
                <Stat label="Km / jour (moyenne)" value={bundle.car.km_per_day ? `${bundle.car.km_per_day}` : '—'} />
              </div>
              {bundle.bookings.length > 0 && (
                <div style={card}>
                  <SectionTitle>Réservations en cours</SectionTitle>
                  {bundle.bookings.map(b => (
                    <a key={b.reference} href={`/track/${b.reference}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: 'var(--c-text)', textDecoration: 'none', fontSize: '13px' }}>
                      <span>{b.service_name} · <span style={{ color: 'rgba(var(--c-fg-rgb),0.5)' }}>{b.reference}</span></span>
                      <span style={{ color: 'var(--c-link)' }}>Suivre →</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAPIERS */}
          {tab === 'papiers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {DOC_TYPES.map(t => {
                const d = bundle.documents.find(x => x.doc_type === t.id)
                const col = d?.days_left == null ? 'rgba(var(--c-fg-rgb),0.35)' : d.days_left < 0 ? 'var(--c-danger-text)' : d.days_left <= 30 ? 'var(--c-warn)' : 'var(--c-success-text)'
                return (
                  <button key={t.id} onClick={() => setModal({ kind: 'doc', doc: d ?? { doc_type: t.id, car_id: bundle.car.id } })} style={{ ...card, textAlign: 'left', cursor: 'pointer', margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-text)' }}>{t.label}</span>
                      <Pencil size={13} color="rgba(var(--c-fg-rgb),0.4)" />
                    </div>
                    {d ? (
                      <>
                        <div style={{ fontSize: '13px', color: 'rgba(var(--c-fg-rgb),0.7)', marginTop: '8px' }}>
                          {d.expiry_date ? <>Échéance <b style={{ color: 'var(--c-text)' }}>{fmtDate(d.expiry_date)}</b></> : 'Sans échéance'}
                        </div>
                        {d.days_left != null && <div style={{ fontSize: '12px', color: col, marginTop: '2px' }}>{d.days_left < 0 ? `Expiré ${daysText(d.days_left)}` : `Expire ${daysText(d.days_left)}`}</div>}
                        {(d.provider || d.reference) && <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.4)', marginTop: '4px' }}>{[d.provider, d.reference].filter(Boolean).join(' · ')}</div>}
                        {!!d.files?.length && <div style={{ fontSize: '12px', color: 'var(--c-link)', marginTop: '4px' }}>📎 {d.files.length} photo{d.files.length > 1 ? 's' : ''}</div>}
                      </>
                    ) : <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.4)', marginTop: '8px' }}>Non renseigné — {t.hint.toLowerCase()}</div>}
                  </button>
                )
              })}
              {bundle.documents.filter(d => d.doc_type === 'autre').map(d => (
                <button key={d.id} onClick={() => setModal({ kind: 'doc', doc: d })} style={{ ...card, textAlign: 'left', cursor: 'pointer', margin: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-text)' }}>{d.reference || 'Autre document'}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.5)', marginTop: '6px' }}>{d.expiry_date ? `Échéance ${fmtDate(d.expiry_date)}` : 'Sans échéance'}</div>
                </button>
              ))}
              <button onClick={() => setModal({ kind: 'doc', doc: { doc_type: 'autre', car_id: bundle.car.id } })} style={{ ...card, margin: 0, cursor: 'pointer', color: 'var(--c-link)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderStyle: 'dashed' }}>
                <Plus size={14} /> Autre document
              </button>
            </div>
          )}

          {/* ENTRETIEN */}
          {tab === 'entretien' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                <SectionTitle>Plan d'entretien</SectionTitle>
                <button onClick={() => setModal({ kind: 'maint', m: null })} style={btnSmall}><Plus size={12} /> Ajouter</button>
              </div>
              <Muted>Intervalles indicatifs : adaptez-les au carnet de votre véhicule. « Fait » met à jour la prochaine échéance.</Muted>
              {bundle.maintenance.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderTop: i ? '1px solid rgba(var(--c-fg-rgb),0.05)' : 'none', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', color: '#0A0A0A', background: STATUS_COLOR[m.status], minWidth: '70px', textAlign: 'center' }}>{STATUS_LABEL[m.status]}</span>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--c-text)', fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.5)' }}>
                      {m.status === 'unknown' ? 'Dernier remplacement inconnu' : `Fait le ${fmtDate(m.last_done_date)}${m.last_done_km != null ? ` à ${fmtKm(m.last_done_km)}` : ''}`}
                      {' · '}{[m.interval_km ? `tous les ${fmtKm(m.interval_km)}` : '', m.interval_months ? `${m.interval_months} mois` : ''].filter(Boolean).join(' / ')}
                    </div>
                    {m.status !== 'unknown' && <div style={{ fontSize: '12px', color: STATUS_TEXT[m.status] }}>Prochain : {dueText(m)}</div>}
                  </div>
                  <button onClick={() => setModal({ kind: 'done', m })} style={btnSmall}><Check size={12} /> Fait</button>
                  {(m.status === 'soon' || m.status === 'overdue') && (
                    BOOKABLE[m.item]
                      ? <button onClick={() => openBooking(BOOKABLE[m.item])} style={{ ...btnSmall, background: 'var(--mk-action)', color: '#0A0A0A', border: 'none' }}>Réserver</button>
                      : <button onClick={() => askMecalik(`Bonjour, je voudrais un devis pour : ${m.label} — ${carName(bundle.car)}.`)} style={btnSmall}>Devis</button>
                  )}
                  <button onClick={() => setModal({ kind: 'maint', m })} style={iconBtn} title="Modifier"><Pencil size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {/* HISTORIQUE */}
          {tab === 'historique' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <SectionTitle>Historique & dépenses</SectionTitle>
                <button onClick={() => setModal({ kind: 'log', log: null })} style={btnSmall}><Plus size={12} /> Ajouter une dépense</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px' }}>
                <button onClick={() => setLogFilter('all')} style={chip(logFilter === 'all')}>Tout</button>
                {CATEGORIES.filter(c => bundle.history.some(h => h.category === c.id)).map(c => (
                  <button key={c.id} onClick={() => setLogFilter(c.id)} style={{ ...chip(logFilter === c.id), whiteSpace: 'nowrap' }}>{c.icon} {c.label}</button>
                ))}
              </div>
              <CategoryTotals history={bundle.history} />
              {bundle.history.filter(h => logFilter === 'all' || h.category === logFilter).length === 0 && <Muted>Aucune entrée pour le moment.</Muted>}
              {bundle.history.filter(h => logFilter === 'all' || h.category === logFilter).map((h, i) => {
                const cat = CATEGORIES.find(c => c.id === h.category) ?? CATEGORIES[CATEGORIES.length - 1]
                const isMk = h.source === 'mecalik'
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderTop: i ? '1px solid rgba(var(--c-fg-rgb),0.05)' : 'none' }}>
                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{cat.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: 'var(--c-text)', fontWeight: 600 }}>
                        {h.service_name}{isMk && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#0A0A0A', background: 'var(--mk-action)', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>MecaLIK</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.45)' }}>
                        {[fmtDate(h.service_date), h.mileage != null ? fmtKm(h.mileage) : '', h.liters ? `${h.liters} L` : '', h.provider || ''].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>{h.cost != null ? fmtMoney(h.cost) : ''}</div>
                    {!isMk && <button onClick={() => setModal({ kind: 'log', log: h })} style={iconBtn} title="Modifier"><Pencil size={13} /></button>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modal?.kind === 'car' && (
        <CarModal car={modal.car} models={models} busy={busy} onClose={() => setModal(null)}
          onSave={c => run(() => api.saveCar(c), modal.car ? 'Véhicule mis à jour ✓' : 'Véhicule ajouté ✓')}
          onArchive={modal.car?.id ? () => run(() => api.archiveCar(modal.car!.id!), 'Véhicule retiré') : undefined} />
      )}
      {modal?.kind === 'km' && bundle && (
        <KmModal current={bundle.est_km ?? bundle.car.mileage} busy={busy} onClose={() => setModal(null)}
          onSave={km => run(() => api.saveCar({ ...bundle.car, mileage: km }), 'Kilométrage enregistré ✓')} />
      )}
      {modal?.kind === 'doc' && bundle && (
        <DocModal doc={modal.doc} token={token} busy={busy} onClose={() => { setModal(null); reload() }}
          onSave={(d, pending) => run(async () => {
            const id = await api.saveDocument({ ...d, car_id: bundle.car.id })
            for (const f of pending) await uploadDocFile(token, id, f)
          }, pending.length ? 'Document et photo enregistrés ✓' : 'Document enregistré ✓')}
          onDelete={modal.doc.id ? () => run(() => api.deleteDocument(modal.doc.id!), 'Document supprimé') : undefined} />
      )}
      {modal?.kind === 'done' && (
        <DoneModal m={modal.m} est={bundle?.est_km ?? null} busy={busy} onClose={() => setModal(null)}
          onSave={p => run(() => api.saveMaintenance({ id: modal.m.id, mark_done: true, ...p }), 'Entretien enregistré ✓')} />
      )}
      {modal?.kind === 'maint' && bundle && (
        <MaintModal m={modal.m} busy={busy} onClose={() => setModal(null)}
          onSave={p => run(() => api.saveMaintenance({ car_id: bundle.car.id, ...(modal.m?.id ? { id: modal.m.id } : {}), ...p }), 'Plan mis à jour ✓')}
          onDisable={modal.m?.id ? () => run(() => api.saveMaintenance({ id: modal.m!.id, is_active: false }), 'Élément retiré') : undefined} />
      )}
      {modal?.kind === 'log' && bundle && (
        <LogModal log={modal.log} busy={busy} onClose={() => setModal(null)}
          onSave={p => run(() => api.saveLog({ car_id: bundle.car.id, ...(modal.log?.id ? { id: modal.log.id } : {}), ...p }), 'Entrée enregistrée ✓')}
          onDelete={modal.log?.id ? () => run(() => api.deleteLog(modal.log!.id!), 'Entrée supprimée') : undefined} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--c-surface2)', border: '1px solid rgba(var(--c-fg-rgb),0.12)', color: 'var(--c-text)', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', zIndex: 200 }}>{toast}</div>
      )}
    </PageShell>
  )

  function buildAlerts(b: CarBundle) {
    const out: { title: string; sub: string; color: string; level: 'red' | 'amber' | 'info'; action?: { label: string; fn: () => void } }[] = []
    for (const d of b.documents) {
      if (d.days_left == null || d.days_left > 30) continue
      out.push({ title: docLabel(d.doc_type), sub: d.days_left < 0 ? `Expiré ${daysText(d.days_left)}` : `Expire ${daysText(d.days_left)} (${fmtDate(d.expiry_date)})`,
        color: d.days_left < 0 ? 'var(--c-danger-text)' : 'var(--c-warn)', level: d.days_left < 0 ? 'red' : 'amber',
        action: { label: 'Mettre à jour', fn: () => { setCarId(b.car.id); setModal({ kind: 'doc', doc: d }) } } })
    }
    for (const m of b.maintenance) {
      if (m.status !== 'overdue' && m.status !== 'soon') continue
      out.push({ title: m.label, sub: dueText(m), color: STATUS_TEXT[m.status], level: m.status === 'overdue' ? 'red' : 'amber',
        action: BOOKABLE[m.item] ? { label: 'Réserver', fn: () => openBooking(BOOKABLE[m.item]) } : { label: 'Devis', fn: () => askMecalik(`Bonjour, je voudrais un devis pour : ${m.label} — ${carName(b.car)}.`) } })
    }
    for (const t of DOC_TYPES.filter(t => t.id !== 'carte_grise')) {
      if (!b.documents.some(d => d.doc_type === t.id)) out.push({ title: `${t.label} non renseignée`, sub: 'Ajoutez la date pour être prévenu à temps', color: 'rgba(var(--c-fg-rgb),0.4)', level: 'info',
        action: { label: 'Ajouter', fn: () => { setCarId(b.car.id); setModal({ kind: 'doc', doc: { doc_type: t.id, car_id: b.car.id } }) } } })
    }
    if (b.car.mileage == null) out.push({ title: 'Kilométrage inconnu', sub: "Indispensable pour calculer l'entretien", color: 'rgba(var(--c-fg-rgb),0.4)', level: 'info', action: { label: 'Renseigner', fn: () => setModal({ kind: 'km' }) } })
    const vid = b.maintenance.find(m => m.item === 'vidange')
    if (vid && vid.status === 'unknown') out.push({ title: 'Dernière vidange inconnue', sub: 'Indiquez quand elle a été faite', color: 'rgba(var(--c-fg-rgb),0.4)', level: 'info', action: { label: 'Renseigner', fn: () => setModal({ kind: 'done', m: vid }) } })
    return out.sort((a, b2) => ({ red: 0, amber: 1, info: 2 }[a.level] - { red: 0, amber: 1, info: 2 }[b2.level]))
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ReminderSettings({ garage, busy, onSave }: { garage: GarageData['garage']; busy: boolean; onSave: (email: string | null, notify: boolean) => void }) {
  const current = garage.email || garage.account_email || ''
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(garage.email ?? '')
  const active = garage.notify_email && !!current
  return (
    <div style={{ ...card, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '16px' }}>🔔</span>
        <div style={{ flex: 1, minWidth: '180px', fontSize: '13px', color: 'rgba(var(--c-fg-rgb),0.8)' }}>
          {active ? <>Rappels par email activés : <b style={{ color: 'var(--c-text)' }}>{current}</b></>
            : current ? 'Rappels par email désactivés' : 'Recevez vos rappels (papiers, entretien) par email'}
        </div>
        <button onClick={() => setOpen(!open)} style={btnSmall}>{open ? 'Fermer' : current ? 'Modifier' : 'Activer'}</button>
      </div>
      {open && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={garage.account_email || 'votre@email.com'} style={{ ...input, flex: '1 1 220px' }} />
          <button disabled={busy || (!email.trim() && !garage.account_email)} onClick={() => { onSave(email.trim() || null, true); setOpen(false) }} style={btnPrimary}>Activer</button>
          {garage.notify_email && current && <button disabled={busy} onClick={() => { onSave(null, false); setOpen(false) }} style={btnGhost}>Désactiver</button>}
        </div>
      )}
    </div>
  )
}

function CategoryTotals({ history }: { history: LogEntry[] }) {
  const since = new Date(); since.setFullYear(since.getFullYear() - 1)
  const rows = CATEGORIES.map(c => ({ c, total: history.filter(h => h.category === c.id && h.cost && new Date(h.service_date) >= since).reduce((s, h) => s + Number(h.cost || 0), 0) }))
    .filter(r => r.total > 0)
  if (!rows.length) return null
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
      {rows.map(r => <span key={r.c.id} style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.7)', background: 'var(--c-surface2)', borderRadius: '8px', padding: '4px 8px' }}>{r.c.icon} {r.c.label} 12 mois : <b style={{ color: 'var(--c-text)' }}>{fmtMoney(r.total)}</b></span>)}
    </div>
  )
}

function CarModal({ car, models, busy, onClose, onSave, onArchive }: { car: Partial<Car> | null; models: VehicleModel[]; busy: boolean; onClose: () => void; onSave: (c: Partial<Car>) => void; onArchive?: () => void }) {
  const [f, setF] = useState<Partial<Car>>(car ?? { fuel_type: 'diesel' })
  const set = (k: keyof Car, v: unknown) => setF(prev => ({ ...prev, [k]: v }))
  const brands = Array.from(new Set(models.map(m => m.brand)))
  const save = () => {
    const match = models.find(m => m.brand.toLowerCase() === (f.brand || '').trim().toLowerCase() && m.model.toLowerCase() === (f.model || '').trim().toLowerCase())
    onSave({ ...f, vehicle_model_id: match?.id ?? f.vehicle_model_id ?? null })
  }
  return (
    <Sheet title={car ? 'Modifier le véhicule' : 'Ajouter un véhicule'} onClose={onClose}>
      <Grid>
        <Field label="Marque *"><input list="mk-brands" value={f.brand ?? ''} onChange={e => set('brand', e.target.value)} style={input} placeholder="Dacia" /></Field>
        <Field label="Modèle"><input list="mk-models" value={f.model ?? ''} onChange={e => set('model', e.target.value)} style={input} placeholder="Logan" /></Field>
        <Field label="Année"><input type="number" value={f.year ?? ''} onChange={e => set('year', e.target.value)} style={input} placeholder="2019" /></Field>
        <Field label="Immatriculation"><input value={f.license_plate ?? ''} onChange={e => set('license_plate', e.target.value)} style={input} placeholder="12345-A-6" /></Field>
        <Field label="Carburant">
          <select value={(f.fuel_type ?? '').toLowerCase()} onChange={e => set('fuel_type', e.target.value)} style={input}>
            <option value="">—</option><option value="diesel">Diesel</option><option value="essence">Essence</option><option value="hybride">Hybride</option><option value="electrique">Électrique</option>
          </select>
        </Field>
        <Field label="Kilométrage"><input type="number" value={f.mileage ?? ''} onChange={e => set('mileage', e.target.value)} style={input} placeholder="120000" /></Field>
        <Field label="Couleur"><input value={f.color ?? ''} onChange={e => set('color', e.target.value)} style={input} /></Field>
        <Field label="1ère mise en circulation"><input type="date" value={f.first_registration ?? ''} onChange={e => set('first_registration', e.target.value)} style={input} /></Field>
        <Field label="N° de châssis (VIN)" wide><input value={f.vin ?? ''} onChange={e => set('vin', e.target.value)} style={input} placeholder="Sur la carte grise (case E)" /></Field>
        <Field label="Notes" wide><textarea value={f.notes ?? ''} onChange={e => set('notes', e.target.value)} style={{ ...input, minHeight: '60px', resize: 'vertical' }} /></Field>
      </Grid>
      <datalist id="mk-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
      <datalist id="mk-models">{models.filter(m => m.brand.toLowerCase() === (f.brand || '').toLowerCase()).map(m => <option key={m.id} value={m.model} />)}</datalist>
      <Footer busy={busy} canSave={!!(f.brand || '').trim()} onSave={save} onDelete={onArchive} deleteLabel="Retirer ce véhicule" />
    </Sheet>
  )
}

function KmModal({ current, busy, onClose, onSave }: { current: number | null; busy: boolean; onClose: () => void; onSave: (km: number) => void }) {
  const [km, setKm] = useState<string>(current != null ? String(current) : '')
  return (
    <Sheet title="Kilométrage actuel" onClose={onClose}>
      <Muted>Lisez le compteur et saisissez la valeur exacte. Nous calculons votre moyenne km/jour pour prévoir l'entretien.</Muted>
      <input type="number" value={km} onChange={e => setKm(e.target.value)} style={{ ...input, fontSize: '22px', fontWeight: 700, marginTop: '12px' }} autoFocus />
      <Footer busy={busy} canSave={!!km && Number(km) > 0} onSave={() => onSave(Number(km))} />
    </Sheet>
  )
}

function DocModal({ doc, token, busy, onClose, onSave, onDelete }: { doc: Partial<Doc> & { doc_type: DocType }; token: string | null; busy: boolean; onClose: () => void; onSave: (d: Partial<Doc>, pending: File[]) => void; onDelete?: () => void }) {
  const [f, setF] = useState<Partial<Doc>>(doc)
  const [files, setFiles] = useState<DocFile[]>([])
  const [pending, setPending] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState('')
  const set = (k: keyof Doc, v: unknown) => setF(prev => ({ ...prev, [k]: v }))
  const meta = DOC_TYPES.find(t => t.id === doc.doc_type)

  useEffect(() => {
    if (!doc.id || !doc.files?.length) return
    signDocFiles(token, doc.id).then(setFiles).catch(() => setFileError("Impossible d'afficher les photos."))
  }, [doc.id, doc.files?.length, token])

  const pick = async (list: FileList | null) => {
    if (!list?.length) return
    setFileError('')
    const picked = Array.from(list)
    if (!doc.id) { setPending(p => [...p, ...picked]); return }
    setUploading(true)
    try {
      for (const file of picked) await uploadDocFile(token, doc.id, file)
      setFiles(await signDocFiles(token, doc.id))
    } catch (e) { setFileError(garageError(e)) }
    finally { setUploading(false) }
  }
  const remove = async (path: string) => {
    if (!doc.id) return
    try { await deleteDocFile(token, doc.id, path); setFiles(await signDocFiles(token, doc.id)) }
    catch (e) { setFileError(garageError(e)) }
  }

  return (
    <Sheet title={meta?.label ?? 'Document'} onClose={onClose}>
      {meta && <Muted>{meta.hint}.</Muted>}
      <Grid>
        <Field label={meta ? "Date d'échéance" : "Date d'échéance (si applicable)"}><input type="date" value={f.expiry_date ?? ''} onChange={e => set('expiry_date', e.target.value)} style={input} /></Field>
        <Field label="Date d'émission / paiement"><input type="date" value={f.issue_date ?? ''} onChange={e => set('issue_date', e.target.value)} style={input} /></Field>
        <Field label={doc.doc_type === 'assurance' ? 'Assureur' : doc.doc_type === 'visite_technique' ? 'Centre' : 'Organisme'}><input value={f.provider ?? ''} onChange={e => set('provider', e.target.value)} style={input} /></Field>
        <Field label={doc.doc_type === 'autre' ? 'Nom du document' : 'Numéro / référence'}><input value={f.reference ?? ''} onChange={e => set('reference', e.target.value)} style={input} /></Field>
        <Field label="Montant payé (MAD)"><input type="number" value={f.amount ?? ''} onChange={e => set('amount', e.target.value)} style={input} /></Field>
        <Field label="Notes" wide><input value={f.notes ?? ''} onChange={e => set('notes', e.target.value)} style={input} /></Field>
      </Grid>

      <div style={{ marginTop: '14px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photos du document</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
          {files.map(file => (
            <div key={file.path} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '10px', overflow: 'hidden', background: 'var(--c-surface2)', border: '1px solid rgba(var(--c-fg-rgb),0.1)' }}>
              <a href={file.url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                {file.type.startsWith('image/') && file.url
                  ? <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--c-text)', fontSize: '12px', fontWeight: 700 }}>PDF</span>}
              </a>
              <button onClick={() => remove(file.path)} aria-label="Supprimer" style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.7)', color: 'var(--c-text)', cursor: 'pointer', fontSize: '12px' }}>×</button>
            </div>
          ))}
          {pending.map((file, i) => (
            <div key={i} style={{ width: '84px', height: '84px', borderRadius: '10px', background: 'var(--c-surface2)', border: '1px dashed rgba(67,188,201,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--c-link)', textAlign: 'center', padding: '4px', boxSizing: 'border-box', overflow: 'hidden' }}>{file.name}</div>
          ))}
          <label style={{ width: '84px', height: '84px', borderRadius: '10px', border: '1px dashed rgba(var(--c-fg-rgb),0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', color: 'rgba(var(--c-fg-rgb),0.6)', fontSize: '11px' }}>
            <span style={{ fontSize: '20px' }}>{uploading ? '⏳' : '📷'}</span>{uploading ? 'Envoi…' : 'Ajouter'}
            <input type="file" accept="image/*,application/pdf" multiple disabled={uploading} onChange={e => { pick(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.35)', marginTop: '6px' }}>Stockées de façon privée. Seuls vous et MecaLIK pouvez les voir.</div>
        {fileError && <div style={{ fontSize: '12px', color: 'var(--c-danger-text)', marginTop: '6px' }}>{fileError}</div>}
      </div>
      <Footer busy={busy || uploading} canSave onSave={() => onSave(f, pending)} onDelete={onDelete} deleteLabel="Supprimer" />
    </Sheet>
  )
}

function DoneModal({ m, est, busy, onClose, onSave }: { m: Maint; est: number | null; busy: boolean; onClose: () => void; onSave: (p: Record<string, unknown>) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [km, setKm] = useState(est != null ? String(est) : '')
  const [cost, setCost] = useState('')
  const [provider, setProvider] = useState('')
  return (
    <Sheet title={`${m.label} — fait`} onClose={onClose}>
      <Muted>Indiquez quand et à quel kilométrage. Si c'était il y a longtemps, une date approximative suffit.</Muted>
      <Grid>
        <Field label="Date"><input type="date" max={today} value={date} onChange={e => setDate(e.target.value)} style={input} /></Field>
        <Field label="Kilométrage à ce moment"><input type="number" value={km} onChange={e => setKm(e.target.value)} style={input} /></Field>
        <Field label="Coût (MAD, optionnel)"><input type="number" value={cost} onChange={e => setCost(e.target.value)} style={input} /></Field>
        <Field label="Où ? (optionnel)"><input value={provider} onChange={e => setProvider(e.target.value)} style={input} placeholder="Garage, MecaLIK…" /></Field>
      </Grid>
      <Footer busy={busy} canSave={!!date} onSave={() => onSave({ last_done_date: date, last_done_km: km, cost, provider })} />
    </Sheet>
  )
}

function MaintModal({ m, busy, onClose, onSave, onDisable }: { m: Partial<Maint> | null; busy: boolean; onClose: () => void; onSave: (p: Record<string, unknown>) => void; onDisable?: () => void }) {
  const [label, setLabel] = useState(m?.label ?? '')
  const [km, setKm] = useState(m?.interval_km != null ? String(m.interval_km) : '')
  const [months, setMonths] = useState(m?.interval_months != null ? String(m.interval_months) : '')
  return (
    <Sheet title={m ? 'Modifier l’intervalle' : 'Ajouter un élément'} onClose={onClose}>
      <Grid>
        <Field label="Élément" wide><input value={label} onChange={e => setLabel(e.target.value)} style={input} placeholder="Ex : Liquide de frein" /></Field>
        <Field label="Tous les … km"><input type="number" value={km} onChange={e => setKm(e.target.value)} style={input} placeholder="10000" /></Field>
        <Field label="ou tous les … mois"><input type="number" value={months} onChange={e => setMonths(e.target.value)} style={input} placeholder="12" /></Field>
      </Grid>
      <Muted>Le premier des deux atteint déclenche le rappel.</Muted>
      <Footer busy={busy} canSave={!!label.trim() && (!!km || !!months)} onSave={() => onSave({ label, interval_km: km, interval_months: months })} onDelete={onDisable} deleteLabel="Retirer du plan" />
    </Sheet>
  )
}

function LogModal({ log, busy, onClose, onSave, onDelete }: { log: Partial<LogEntry> | null; busy: boolean; onClose: () => void; onSave: (p: Record<string, unknown>) => void; onDelete?: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState<Record<string, unknown>>({ category: 'carburant', service_date: today, ...(log ?? {}) })
  const set = (k: string, v: unknown) => setF(prev => ({ ...prev, [k]: v }))
  const cat = f.category as Category
  return (
    <Sheet title={log ? 'Modifier' : 'Ajouter une dépense'} onClose={onClose}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {CATEGORIES.filter(c => c.id !== 'kilometrage').map(c => <button key={c.id} onClick={() => set('category', c.id)} style={chip(cat === c.id)}>{c.icon} {c.label}</button>)}
      </div>
      <Grid>
        <Field label="Intitulé" wide><input value={(f.service_name as string) ?? ''} onChange={e => set('service_name', e.target.value)} style={input} placeholder={cat === 'carburant' ? 'Plein' : 'Ex : Changement plaquettes'} /></Field>
        <Field label="Date"><input type="date" max={today} value={(f.service_date as string) ?? ''} onChange={e => set('service_date', e.target.value)} style={input} /></Field>
        <Field label="Montant (MAD)"><input type="number" value={(f.cost as string) ?? ''} onChange={e => set('cost', e.target.value)} style={input} /></Field>
        <Field label="Kilométrage"><input type="number" value={(f.mileage as string) ?? ''} onChange={e => set('mileage', e.target.value)} style={input} /></Field>
        {cat === 'carburant'
          ? <Field label="Litres"><input type="number" value={(f.liters as string) ?? ''} onChange={e => set('liters', e.target.value)} style={input} /></Field>
          : <Field label="Où ?"><input value={(f.provider as string) ?? ''} onChange={e => set('provider', e.target.value)} style={input} /></Field>}
        <Field label="Notes" wide><input value={(f.notes as string) ?? ''} onChange={e => set('notes', e.target.value)} style={input} /></Field>
      </Grid>
      <Footer busy={busy} canSave={!!f.service_date} onSave={() => onSave(f)} onDelete={onDelete} deleteLabel="Supprimer" />
    </Sheet>
  )
}

// ── UI primitives ────────────────────────────────────────────────────────────

function PageShell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const { mode } = useCustTheme()
  return (
    <main data-mk-theme={mode} style={{ background: 'var(--c-bg)', minHeight: '100vh', color: 'var(--c-text)', fontFamily: 'Outfit, sans-serif', padding: onBack ? '0 16px 60px' : '90px 16px 60px' }}>
      {onBack && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--c-bar)', backdropFilter: 'blur(12px)', margin: '0 -16px 16px', padding: '12px 16px', borderBottom: '1px solid rgba(var(--c-fg-rgb),0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBack} style={iconBtn} aria-label="Retour"><ArrowLeft size={15} /></button>
          <span style={{ fontWeight: 600, fontSize: '16px', flex: 1 }}>Mon garage</span>
          <ThemeButton />
        </div>
      )}
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>{children}</div>
    </main>
  )
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{children}</div>
}
function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '12px', color: 'rgba(var(--c-fg-rgb),0.45)', lineHeight: 1.5, marginBottom: '6px' }}>{children}</div>
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div style={{ ...card, margin: 0 }}><div style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.45)' }}>{label}</div><div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--c-text)', marginTop: '4px' }}>{value}</div></div>
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px' }}>{children}</div>
}
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: wide ? '1 / -1' : undefined }}><span style={{ fontSize: '11px', color: 'rgba(var(--c-fg-rgb),0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>{children}</label>
}
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 150 }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--c-surface)', border: '1px solid rgba(var(--c-fg-rgb),0.08)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '18px 18px 28px', zIndex: 151, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--c-text)' }}>{title}</div>
          <button onClick={onClose} style={iconBtn}><X size={15} /></button>
        </div>
        {children}
      </div>
    </>
  )
}
function Footer({ busy, canSave, onSave, onDelete, deleteLabel }: { busy: boolean; canSave: boolean; onSave: () => void; onDelete?: () => void; deleteLabel?: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignItems: 'center' }}>
      {onDelete && <button disabled={busy} onClick={onDelete} style={{ ...btnGhost, color: 'var(--c-danger-text)', borderColor: 'rgba(255,107,107,0.3)' }}><Trash2 size={13} /> {deleteLabel}</button>}
      <button disabled={busy || !canSave} onClick={onSave} style={{ ...btnPrimary, flex: 1, opacity: busy || !canSave ? 0.5 : 1 }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </div>
  )
}

/** Status colours for text — readable in day and night mode */
const STATUS_TEXT: Record<string, string> = { overdue: 'var(--c-danger-text)', soon: 'var(--c-warn)', ok: 'var(--c-success-text)', unknown: 'rgba(var(--c-fg-rgb),0.35)' }
const card: React.CSSProperties = { background: 'var(--c-surface)', border: '1px solid rgba(var(--c-fg-rgb),0.07)', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxSizing: 'border-box', width: '100%', fontFamily: 'inherit' }
const input: React.CSSProperties = { background: 'var(--c-surface2)', border: '1px solid rgba(var(--c-fg-rgb),0.1)', borderRadius: '10px', color: 'var(--c-text)', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' }
const btnPrimary: React.CSSProperties = { background: 'var(--mk-action)', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '11px 16px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }
const btnGhost: React.CSSProperties = { background: 'transparent', color: 'var(--c-text)', border: '1px solid rgba(var(--c-fg-rgb),0.15)', borderRadius: '10px', padding: '9px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px' }
const btnSmall: React.CSSProperties = { background: 'var(--c-surface2)', color: 'var(--c-text)', border: '1px solid rgba(var(--c-fg-rgb),0.12)', borderRadius: '8px', padding: '6px 10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }
const iconBtn: React.CSSProperties = { background: 'rgba(var(--c-fg-rgb),0.05)', color: 'rgba(var(--c-fg-rgb),0.7)', border: '1px solid rgba(var(--c-fg-rgb),0.08)', borderRadius: '8px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--c-link)', fontSize: '12px', cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }
const chip = (sel: boolean): React.CSSProperties => ({
  padding: '8px 12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  background: sel ? 'rgba(67,188,201,0.12)' : 'var(--c-surface2)', color: sel ? 'var(--c-link)' : 'rgba(var(--c-fg-rgb),0.75)',
  border: sel ? '1px solid rgba(67,188,201,0.45)' : '1px solid rgba(var(--c-fg-rgb),0.08)', fontWeight: sel ? 600 : 400,
})

