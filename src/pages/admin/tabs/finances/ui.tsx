/** Shared presentation bits for the Finances sections. */

import { PAYMENT_STATUS_CONFIG, type PaymentStatus } from '../../../../lib/invoices'

export const PAYMENT_METHODS = ['Espèces', 'Virement bancaire', 'Chèque', 'Carte bancaire']

export function fmtMAD(n: number, digits = 2): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} MAD`
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.unpaid
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
      fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: '13px', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  letterSpacing: '0.06em', display: 'block', marginBottom: '6px',
}

export const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
}

export function pillButton(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', whiteSpace: 'nowrap',
    background: active ? '#43BCC9' : 'rgba(255,255,255,0.07)',
    color: active ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
  }
}
