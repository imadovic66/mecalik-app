/** Notifications tab — admin push subscription card and customer broadcast form */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'

interface Props {
  permission: NotificationPermission | null
  subscribed: boolean
  supported: boolean
  subscribe: () => void
  unsubscribe: () => void
}

export default function NotificationsTab({ permission, subscribed, supported, subscribe, unsubscribe }: Props) {
  const { t } = useTranslation()
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody]   = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifResult, setNotifResult]   = useState<string | null>(null)

  const handleSendBroadcast = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return
    setNotifSending(true)
    setNotifResult(null)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer', title: notifTitle.trim(), body: notifBody.trim(), url: '/dashboard' }),
      })
      const json = await res.json() as { sent?: number }
      setNotifResult(`Notification envoyée à ${json.sent ?? 0} client(s) abonné(s).`)
      setNotifTitle('')
      setNotifBody('')
    } catch {
      setNotifResult('Erreur lors de l\'envoi.')
    }
    setNotifSending(false)
  }

  return (
    <>
      {/* Admin subscribe card */}
      <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
          Votre abonnement aux notifications
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
          Activez les notifications sur ce navigateur pour être alerté des nouvelles réservations.
        </div>

        {!supported ? (
          <div style={{ fontSize: '12px', color: '#F0C040' }}>
            Notifications push non supportées sur ce navigateur.
          </div>
        ) : subscribed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', fontWeight: 500, color: '#00DD88',
              background: 'rgba(0,221,136,0.08)', borderRadius: '100px', padding: '6px 14px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00DD88' }} />
              Actif sur ce navigateur
            </span>
            <button
              onClick={unsubscribe}
              style={{ fontSize: '12px', color: '#FF4444', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '100px', padding: '6px 14px', cursor: 'pointer' }}
            >
              Se désabonner
            </button>
          </div>
        ) : (
          <button
            onClick={subscribe}
            disabled={permission === 'denied'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: permission === 'denied' ? 'rgba(255,255,255,0.06)' : '#43BCC9',
              color: permission === 'denied' ? 'rgba(255,255,255,0.3)' : '#080808',
              border: 'none', borderRadius: '100px',
              padding: '10px 20px', fontSize: '13px', fontWeight: 600,
              cursor: permission === 'denied' ? 'not-allowed' : 'pointer',
            }}
          >
            <Bell size={14} />
            {permission === 'denied' ? 'Notifications bloquées par le navigateur' : 'Activer les notifications'}
          </button>
        )}
      </div>

      {/* Broadcast card */}
      <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
          Envoyer une notification aux clients
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
          Envoyez une notification push à tous les clients abonnés.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Titre
            </label>
            <input
              type="text"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              placeholder="Ex: Offre spéciale ce week-end"
              style={{ width: '100%', boxSizing: 'border-box', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'white', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = '#43BCC9')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Message
            </label>
            <textarea
              rows={3}
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              placeholder={t('admin.notifPlaceholder')}
              style={{ width: '100%', boxSizing: 'border-box', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'white', outline: 'none', resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = '#43BCC9')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleSendBroadcast}
              disabled={!notifTitle.trim() || !notifBody.trim() || notifSending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: (!notifTitle.trim() || !notifBody.trim() || notifSending) ? 'rgba(67,188,201,0.2)' : '#43BCC9',
                color: (!notifTitle.trim() || !notifBody.trim() || notifSending) ? 'rgba(255,255,255,0.3)' : '#080808',
                border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', fontWeight: 600,
                cursor: (!notifTitle.trim() || !notifBody.trim() || notifSending) ? 'not-allowed' : 'pointer',
              }}
            >
              <Bell size={14} />
              {notifSending ? 'Envoi...' : 'Envoyer à tous les clients'}
            </button>
            {notifResult && (
              <span style={{ fontSize: '12px', color: notifResult.startsWith('Erreur') ? '#FF4444' : '#00DD88' }}>
                {notifResult}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
