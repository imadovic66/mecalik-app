/** Customer in-app notifications (reminders, booking updates) from the `notifications` table. */
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Notif = { id: string; title: string; body: string | null; is_read: boolean; created_at: string; booking_id: string | null }

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `il y a ${Math.max(1, m)} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.round(h / 24)} j`
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!user) return
    const { data } = await supabase.from('notifications').select('id, title, body, is_read, created_at, booking_id')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
    setItems((data ?? []) as Notif[])
  }

  useEffect(() => {
    load()
    if (!user) return
    const ch = supabase.channel(`notif-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const unread = items.filter(i => !i.is_read).length

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0 && user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
      setItems(prev => prev.map(i => ({ ...i, is_read: true })))
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={toggle} aria-label="Notifications" style={{
        width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
      }}>
        <Bell size={16} color="rgba(255,255,255,0.7)" />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, minWidth: '16px', height: '16px', padding: '0 4px', boxSizing: 'border-box',
            background: '#FF4444', borderRadius: '8px', border: '2px solid #0A0A0A', color: 'white', fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '48px', width: 'min(320px, calc(100vw - 32px))', maxHeight: '420px', overflowY: 'auto',
          background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 60 }}>
          <div style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700, color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Notifications</div>
          {items.length === 0 && <div style={{ padding: '18px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Aucune notification pour le moment. Vos rappels de papiers et d'entretien apparaîtront ici.</div>}
          {items.map(n => (
            <a key={n.id} href={n.booking_id ? `/booking/${n.booking_id}` : '/dashboard/voitures'}
              style={{ display: 'block', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', background: n.is_read ? 'transparent' : 'rgba(67,188,201,0.06)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{n.title}</div>
              {n.body && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', lineHeight: 1.4 }}>{n.body}</div>}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{ago(n.created_at)}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
