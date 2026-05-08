import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/*
  Required Supabase column (run once in Supabase SQL editor):
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription jsonb;

  Required Vercel env vars:
    VAPID_PUBLIC_KEY   — same value as VITE_VAPID_PUBLIC_KEY
    VAPID_PRIVATE_KEY  — secret, never expose to client
    VITE_SUPABASE_URL  — already set
    SUPABASE_SERVICE_ROLE_KEY — from Supabase project settings → API
*/

const VAPID_SUBJECT = 'mailto:contact@mecalik.ma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { subscription, user_id, role, title, body, url } = req.body as {
    subscription?: webpush.PushSubscription
    user_id?: string
    role?: string
    title: string
    body: string
    url?: string
  }

  if (!title || !body) return res.status(400).json({ error: 'title and body required' })

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY  || process.env.VITE_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: 'VAPID keys not configured' })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, vapidPublic, vapidPrivate)

  let targets: webpush.PushSubscription[] = []

  if (subscription) {
    targets = [subscription]
  } else if (user_id || role) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Supabase service role not configured' })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    let query = supabase.from('profiles').select('push_subscription').not('push_subscription', 'is', null)

    if (user_id) {
      query = query.eq('id', user_id)
    } else if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query
    if (error) console.error('Supabase fetch error:', error.message)

    targets = (data ?? [])
      .filter(p => p.push_subscription)
      .map(p => p.push_subscription as webpush.PushSubscription)
  }

  if (targets.length === 0) return res.status(200).json({ ok: true, sent: 0 })

  const payload = JSON.stringify({ title, body, url: url || '/' })

  const results = await Promise.allSettled(
    targets.map(sub => webpush.sendNotification(sub, payload))
  )

  // Clean up expired subscriptions (410 Gone)
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 && user_id) {
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        supabase.from('profiles').update({ push_subscription: null }).eq('id', user_id).then(() => {})
      }
      console.warn('Push failed for target', i, err?.statusCode)
    }
  })

  const sent = results.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ ok: true, sent, total: targets.length })
}
