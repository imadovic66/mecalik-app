import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SW_PATH = '/sw.js'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (!ok) return

    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setSubscribed(!!sub))
      .catch(() => {})
  }, [])

  const subscribe = async (): Promise<boolean> => {
    if (!supported || !VAPID_PUBLIC_KEY) return false

    try {
      const reg = await navigator.serviceWorker.register(SW_PATH)
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      })

      setSubscribed(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_subscription: sub.toJSON() })
          .eq('id', user.id)
      }

      return true
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Push subscribe error:', err)
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
      return false
    }
  }

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id)
      }

      setSubscribed(false)
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Push unsubscribe error:', err)
    }
  }

  /** Fire-and-forget call to /api/notify */
  const notify = async (opts: {
    subscription?: object
    user_id?: string
    role?: string
    title: string
    body: string
    url?: string
  }) => {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Notify API error:', err)
    }
  }

  return { permission, subscribed, supported, subscribe, unsubscribe, notify }
}
