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
  review_token: string | null
  review_requested_at: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: BookingRow
  old_record: BookingRow | null
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CALLMEBOT_API_KEY = Deno.env.get('CALLMEBOT_API_KEY') || ''
const CALLMEBOT_PHONE = Deno.env.get('CALLMEBOT_PHONE') || '212777348065'

const H = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' }

async function getProfile(userId: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=full_name,phone,expo_push_token`, { headers: H })
  const d = await r.json()
  return d?.[0] || null
}

async function getMechanic(name: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?full_name=eq.${encodeURIComponent(name)}&role=eq.mechanic&select=id,expo_push_token`, { headers: H })
  const d = await r.json()
  return d?.[0] || null
}

async function sendPush(token: string, title: string, body: string, data: Record<string, unknown>) {
  if (!token) return { ok: false, reason: 'no token' }
  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, sound: 'default', priority: 'high', title, body, data }),
  })
  return { ok: r.ok, status: r.status }
}

async function sendWhatsApp(text: string) {
  if (!CALLMEBOT_API_KEY) return { ok: false, reason: 'no CALLMEBOT_API_KEY' }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_API_KEY}`
  const r = await fetch(url)
  return { ok: r.ok, status: r.status }
}

const CUSTOMER_PUSH: Record<string, { title: string; body: (b: BookingRow) => string }> = {
  confirmed: { title: '✅ Demande confirmée', body: (b) => `${b.service_name} · Réf ${b.reference}. Un technicien vous a été assigné.` },
  on_the_way: { title: '🚗 Mécanicien en route', body: (b) => `Votre technicien est en chemin pour ${b.service_name}.` },
  in_progress: { title: '🔧 Intervention en cours', body: (b) => `Votre ${b.service_name} vient de démarrer.` },
  completed: { title: '✨ Intervention terminée', body: (b) => `${b.service_name} terminé. Votre avis nous aiderait beaucoup !` },
  cancelled: { title: '❌ Réservation annulée', body: (b) => `Votre réservation ${b.reference} a été annulée.` },
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload
    if (payload.table !== 'bookings') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const b = payload.record
    const old = payload.old_record
    const results: unknown[] = []
    const statusChanged = payload.type === 'UPDATE' && b.status !== old?.status

    // 1) Customer push on status change
    if (statusChanged && b.user_id) {
      const spec = CUSTOMER_PUSH[b.status]
      if (spec) {
        const p = await getProfile(b.user_id)
        if (p?.expo_push_token) {
          const res = await sendPush(p.expo_push_token, spec.title, spec.body(b), {
            type: 'booking_status', booking_id: b.id, reference: b.reference, status: b.status,
          })
          results.push({ target: 'customer_push', status: b.status, res })
        }
      }
    }

    // 2) Mechanic push when assigned
    const wasAssigned = b.technician_name && (payload.type === 'INSERT' || old?.technician_name !== b.technician_name)
    if (wasAssigned && b.technician_name) {
      const m = await getMechanic(b.technician_name)
      if (m?.expo_push_token) {
        const dateStr = b.preferred_date
          ? new Date(b.preferred_date).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })
          : 'à confirmer'
        const res = await sendPush(m.expo_push_token, '🔔 Nouvelle intervention',
          `${b.service_name} · ${dateStr}\n${b.address || ''}`,
          { type: 'booking_status', booking_id: b.id, reference: b.reference })
        results.push({ target: 'mechanic_push', res })
      }
    }

    // 3) REVIEW REQUEST — WhatsApp-first, one-tap send
    const justCompleted = statusChanged && b.status === 'completed'
    if (justCompleted && !b.review_requested_at && b.review_token) {
      let customerName = 'Client'
      let customerPhone = ''

      if (b.user_id) {
        const p = await getProfile(b.user_id)
        if (p) { customerName = p.full_name || 'Client'; customerPhone = p.phone || '' }
      }

      const link = `https://mecalik.com/avis/${b.review_token}`
      const digits = customerPhone.replace(/\D/g, '')
      const customerMsg = `Bonjour ${customerName}, merci d'avoir fait confiance à MecaLIK pour votre ${b.service_name}. Si vous avez 30 secondes, votre avis nous aiderait beaucoup : ${link}`
      const waLink = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(customerMsg)}` : null

      const adminMsg =
        `⭐️ INTERVENTION TERMINÉE\n\n` +
        `Réf: ${b.reference}\n` +
        `Service: ${b.service_name}\n` +
        `Client: ${customerName}${customerPhone ? ` — ${customerPhone}` : ''}\n\n` +
        (waLink
          ? `👉 Tapez ce lien pour envoyer la demande d'avis :\n${waLink}`
          : `⚠️ Pas de numéro client. Lien d'avis à envoyer manuellement :\n${link}`)

      const waRes = await sendWhatsApp(adminMsg)
      results.push({ target: 'review_request_whatsapp', hasPhone: !!digits, res: waRes })

      await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ review_requested_at: new Date().toISOString() }),
      })
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
