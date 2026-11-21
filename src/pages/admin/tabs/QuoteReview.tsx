/** Quote review card (admin) — a read-first view of the quote a mechanic submitted:
 *  who / which car / what was asked, the lines in plain rows, totals against the price the customer saw,
 *  automatic checks, the split, then the decision buttons. Editing the lines stays available behind a button. */
import { useState } from 'react'
import { type Booking, type ServiceDetail, normalizeDetailType } from '../adminShared'
import { computeQuoteTotals, getCustomerName, getCustomerPhone, mechanicRateLabel, mecalikRateLabel } from '../../../lib/bookingUtils'

const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`
const TYPE: Record<string, { label: string; color: string; bg: string }> = {
  material: { label: 'Pièce', color: '#43BCC9', bg: 'rgba(67,188,201,0.14)' },
  labor: { label: "Main d'œuvre", color: '#F0C040', bg: 'rgba(240,192,64,0.14)' },
  discount: { label: 'Remise', color: '#FF6B6B', bg: 'rgba(255,107,107,0.14)' },
  vat: { label: 'TVA (ancienne ligne)', color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.08)' },
}
const QUICK = ['Ajouter le nom de chaque pièce', "Ajouter la ligne de main d'œuvre", 'Prix à revoir', 'Préciser le diagnostic']

interface Props {
  booking: Booking
  details: ServiceDetail[]
  submittedAgo: string
  approving: boolean
  editing: boolean
  onApprove: () => void
  onCorrection: (feedback: string) => void
  onReject: () => void
  onToggleEdit: () => void
}

export default function QuoteReview({ booking, details, submittedAgo, approving, editing, onApprove, onCorrection, onReject, onToggleEdit }: Props) {
  const [askFix, setAskFix] = useState(false)
  const [feedback, setFeedback] = useState('')
  const t = computeQuoteTotals(details, booking.amount_ttc, booking.completed_at ?? null)
  const phone = getCustomerPhone(booking)
  const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '212')}` : null
  const note = (booking.notes_admin?.match(/Devis:\s*([^|]+)/g) ?? []).pop()?.replace(/^Devis:\s*/, '').trim() || null
  const estimate = booking.price_quoted_ttc != null ? Number(booking.price_quoted_ttc) : null
  const gap = estimate != null ? t.totalTTC - estimate : null

  // Automatic checks — what to look at before approving
  const unnamed = details.filter(d => !d.name?.trim()).length
  const noPrice = details.filter(d => !(Number(d.unit_price) > 0)).length
  const hasLabour = details.some(d => normalizeDetailType(d.type) === 'labor')
  const checks: { level: 'bad' | 'warn'; text: string }[] = []
  if (details.length === 0) checks.push({ level: 'bad', text: 'Le devis ne contient aucune ligne.' })
  if (unnamed > 0) checks.push({ level: 'bad', text: `${unnamed} ligne${unnamed > 1 ? 's' : ''} sans description : le client ne saura pas ce qu'il paie.` })
  if (noPrice > 0) checks.push({ level: 'bad', text: `${noPrice} ligne${noPrice > 1 ? 's' : ''} sans prix.` })
  if (details.length > 0 && !hasLabour) checks.push({ level: 'warn', text: "Aucune ligne de main d'œuvre : la part du mécanicien et la marge MecaLIK sont à 0." })
  if (gap != null && Math.abs(gap) >= 1) checks.push({ level: 'warn', text: `Le client a vu un prix estimé de ${mad(estimate!)} : ce devis est ${gap > 0 ? 'plus cher' : 'moins cher'} de ${mad(Math.abs(gap))}.` })
  const blocking = checks.some(c => c.level === 'bad')

  const info: [string, React.ReactNode][] = [
    ['Client', <>{getCustomerName(booking)}{phone && <> · <a href={`tel:${phone}`} style={{ color: '#43BCC9' }}>{phone}</a></>}{wa && <> · <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366' }}>WhatsApp</a></>}</>],
    ['Véhicule', booking.vehicle_label || '—'],
    ['Demande', <>{booking.service_name}{booking.symptom ? ` — ${booking.symptom}` : ''}</>],
    ['Adresse', booking.address || '—'],
  ]

  return (
    <div className="mkq">
      <div className="mkq-head">
        <div>
          <div className="mkq-title">Devis à valider <span className="mkq-ref">{booking.reference}</span></div>
          <div className="mkq-sub">Envoyé par {booking.technician_name || '—'}{submittedAgo ? ` · ${submittedAgo}` : ''}</div>
        </div>
        <div className="mkq-total"><span>Total client TTC</span><b>{mad(t.totalTTC)}</b></div>
      </div>

      <div className="mkq-info">
        {info.map(([k, v]) => <div key={k}><span>{k}</span><div>{v}</div></div>)}
      </div>

      {checks.length > 0 && (
        <div className="mkq-checks">
          {checks.map((c, i) => <div key={i} className={c.level === 'bad' ? 'is-bad' : 'is-warn'}><i>{c.level === 'bad' ? '!' : 'i'}</i>{c.text}</div>)}
        </div>
      )}

      <div className="mkq-lines">
        <div className="mkq-row mkq-row-h"><span>Ligne</span><span>Qté</span><span>Prix unit.</span><span>Total</span></div>
        {details.length === 0 && <div className="mkq-empty">Aucune ligne.</div>}
        {details.map((d, i) => {
          const type = normalizeDetailType(d.type); const cfg = TYPE[type] ?? TYPE.material
          const qty = parseFloat(String(d.quantity || '1').replace(',', '.')) || 1
          const line = (Number(d.unit_price) || 0) * qty
          return (
            <div key={i} className="mkq-row">
              <span>
                <em style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</em>
                {d.name?.trim() ? <b>{d.name}{d.brand ? <small> · {d.brand}</small> : null}</b> : <b className="mkq-missing">Sans description</b>}
              </span>
              <span>{d.quantity || '1'}</span>
              <span>{mad(Number(d.unit_price) || 0)}</span>
              <span style={{ fontWeight: 700, color: type === 'discount' ? '#FF6B6B' : 'white' }}>{type === 'discount' ? '−' : ''}{mad(line)}</span>
            </div>
          )
        })}
      </div>

      <div className="mkq-foot">
        <div className="mkq-box">
          <div className="mkq-kv"><span>Pièces</span><b>{mad(t.materialsTTC)}</b></div>
          <div className="mkq-kv"><span>Main d'œuvre</span><b>{mad(t.labourTTC)}</b></div>
          {t.discountTTC > 0 && <div className="mkq-kv"><span>Remise</span><b style={{ color: '#FF6B6B' }}>−{mad(t.discountTTC)}</b></div>}
          <div className="mkq-kv mkq-kv-big"><span>Total TTC</span><b>{mad(t.totalTTC)}</b></div>
          <div className="mkq-kv mkq-kv-sm"><span>dont HT {mad(t.totalHT)}</span><span>dont TVA 20 % {mad(t.totalTVA)}</span></div>
          {estimate != null && <div className="mkq-kv mkq-kv-sm"><span>Prix estimé vu par le client</span><span>{mad(estimate)}</span></div>}
        </div>
        <div className="mkq-box">
          <div className="mkq-cap">Répartition (admin uniquement)</div>
          <div className="mkq-kv"><span>Part mécanicien ({mechanicRateLabel(null)} de la MO HT)</span><b>{mad(t.mechanicShare)}</b></div>
          <div className="mkq-kv"><span>Marge MecaLIK ({mecalikRateLabel(null)})</span><b style={{ color: '#43BCC9' }}>{mad(t.mecalikShare)}</b></div>
          {note && <><div className="mkq-cap" style={{ marginTop: 12 }}>Note du mécanicien</div><div className="mkq-note">{note}</div></>}
        </div>
      </div>

      {askFix ? (
        <div className="mkq-fix">
          <div className="mkq-cap">Que doit corriger {booking.technician_name || 'le mécanicien'} ?</div>
          <div className="mkq-quick">
            {QUICK.map(q => <button key={q} onClick={() => setFeedback(f => f ? `${f}. ${q}` : q)}>{q}</button>)}
          </div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={2} placeholder="Votre message au mécanicien…" />
          <div className="mkq-actions">
            <button className="mkq-btn mkq-btn-amber" disabled={!feedback.trim()} onClick={() => onCorrection(feedback.trim())}>Renvoyer au mécanicien</button>
            <button className="mkq-btn mkq-btn-ghost" onClick={() => setAskFix(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="mkq-actions">
          <button className="mkq-btn mkq-btn-teal" disabled={approving || blocking || t.totalTTC <= 0} onClick={onApprove}
            title={blocking ? 'Corrigez les points en rouge avant d’approuver' : undefined}>
            {approving ? 'Validation…' : 'Approuver et générer le devis'}
          </button>
          <button className="mkq-btn mkq-btn-amber" onClick={() => setAskFix(true)}>Demander une correction</button>
          <button className="mkq-btn mkq-btn-ghost" onClick={onToggleEdit}>{editing ? 'Masquer la modification' : 'Modifier les lignes moi-même'}</button>
          <button className="mkq-btn mkq-btn-red" onClick={onReject}>Refuser</button>
        </div>
      )}
      {blocking && !askFix && <div className="mkq-hint">Approuver est bloqué tant qu'il reste un point en rouge. Corrigez les lignes vous-même ou renvoyez le devis au mécanicien.</div>}
    </div>
  )
}
