// Fires on booking INSERT (mechanic assigned) and UPDATE (status change).
// Sends Expo push to the right person(s).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface BookingRow {
  id: string
  reference: string
  service_name: string
  status: string
  technician_name: string | null
  user_id: string | null
  address: string | null
  preferred_date: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: BookingRow
  old_record: BookingRow | null
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const H = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' }

async function getPushToken(userId: string): Promise<string | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=expo_push_token`, { headers: H })
  const d = await r.json()
  return d?.[0]?.expo_push_token || null
}

async function getMechanicByName(name: string): Promise<{ id: string; push?: string } | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?full_name=eq.${encodeURIComponent(name)}&role=eq.mechanic&select=id,expo_push_token`,
    { headers: H }
  )
  const d = await r.json()
  if (!d?.[0]) return null
  return { id: d[0].id, push: d[0].expo_push_token }
}

async function sendPush(token: string, title: string, body: string, data: Record<string, unknown>) {
  if (!token) return { ok: false, reason: 'no token' }
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      priority: 'high',
      title,
      body,
      data,
    }),
  })
  return { ok: r.ok, status: r.status, data: await r.json() }
}

const CUSTOMER_MSG: Record<string, { title: string; body: (b: BookingRow) => string }> = {
  confirmed: {
    title: '✅ Demande confirmée',
    body: (b) => `${b.service_name} · Réf ${b.reference}. Un technicien vous a été assigné.`,
  },
  on_the_way: {
    title: '🚗 Mécanicien en route',
    body: (b) => `Votre technicien est en chemin pour ${b.service_name}.`,
  },
  in_progress: {
    title: '🔧 Intervention en cours',
    body: (b) => `Votre ${b.service_name} vient de démarrer.`,
  },
  completed: {
    title: '✨ Intervention terminée',
    body: (b) => `${b.service_name} · Réf ${b.reference}. Nous restons à votre disposition !`,
  },
  cancelled: {
    title: '❌ Réservation annulée',
    body: (b) => `Votre réservation ${b.reference} a été annulée.`,
  },
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload
    if (payload.table !== 'bookings') {
      return new Response(JSON.stringify({ skipped: true, reason: 'wrong table' }), { status: 200 })
    }

    const b = payload.record
    const old = payload.old_record
    const results: unknown[] = []

    // 1) Customer notification on status change
    if (payload.type === 'UPDATE' && b.user_id && b.status && b.status !== old?.status) {
      const spec = CUSTOMER_MSG[b.status]
      if (spec) {
        const token = await getPushToken(b.user_id)
        if (token) {
          const res = await sendPush(token, spec.title, spec.body(b), {
            type: 'booking_status',
            booking_id: b.id,
            reference: b.reference,
            status: b.status,
          })
          results.push({ target: 'customer', status: b.status, res })
        }
      }
    }

    // 2) Mechanic notification when they are assigned
    const wasAssigned =
      b.technician_name &&
      (payload.type === 'INSERT' || old?.technician_name !== b.technician_name)
    if (wasAssigned && b.technician_name) {
      const m = await getMechanicByName(b.technician_name)
      if (m?.push) {
        const dateStr = b.preferred_date
          ? new Date(b.preferred_date).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })
          : 'à confirmer'
        const res = await sendPush(
          m.push,
          '🔔 Nouvelle intervention',
          `${b.service_name} · ${dateStr}\n${b.address || ''}`,
          { type: 'booking_status', booking_id: b.id, reference: b.reference }
        )
        results.push({ target: 'mechanic', name: b.technician_name, res })
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
