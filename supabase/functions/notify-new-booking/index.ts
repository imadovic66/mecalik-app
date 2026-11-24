import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface BookingRow {
  id: string
  reference: string
  service_name: string
  address: string | null
  address_notes: string | null
  slot_type: string | null
  preferred_date: string | null
  status: string
  user_id: string | null
  car_id: string | null
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: BookingRow
  old_record: BookingRow | null
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'imadgrify@gmail.com'
const CALLMEBOT_API_KEY = Deno.env.get('CALLMEBOT_API_KEY') || ''
const CALLMEBOT_PHONE = Deno.env.get('CALLMEBOT_PHONE') || '212777348065'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function fetchExtras(booking: BookingRow) {
  const headers = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` }
  let customerName = 'Client'
  let customerPhone = ''
  let carLabel = ''
  if (booking.user_id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${booking.user_id}&select=full_name,phone`, { headers })
    const d = await r.json()
    if (d?.[0]) { customerName = d[0].full_name || 'Client'; customerPhone = d[0].phone || '' }
  }
  if (booking.car_id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cars?id=eq.${booking.car_id}&select=brand,model,year,license_plate`, { headers })
    const d = await r.json()
    if (d?.[0]) { carLabel = `${d[0].brand} ${d[0].model}${d[0].year ? ` (${d[0].year})` : ''}${d[0].license_plate ? ` — ${d[0].license_plate}` : ''}` }
  }
  return { customerName, customerPhone, carLabel }
}

async function sendEmail(subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, reason: 'no RESEND_API_KEY' }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'MecaLIK <onboarding@resend.dev>', to: [ADMIN_EMAIL, "imadgrify@gmail.com"], subject, html }),
  })
  return { ok: r.ok, status: r.status, data: await r.json() }
}

async function sendWhatsApp(text: string) {
  if (!CALLMEBOT_API_KEY) return { ok: false, reason: 'no CALLMEBOT_API_KEY' }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodeURIComponent(text)}&apikey=${CALLMEBOT_API_KEY}`
  const r = await fetch(url)
  return { ok: r.ok, status: r.status, body: await r.text() }
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload
    if (payload.type !== 'INSERT' || payload.table !== 'bookings') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }
    const b = payload.record
    const { customerName, customerPhone, carLabel } = await fetchExtras(b)
    const dateStr = b.preferred_date
      ? new Date(b.preferred_date).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Non précisé'
    const urgent = b.slot_type === 'urgent'

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#0A0A0A;color:#fff;border-radius:12px">
        <div style="text-align:center;margin-bottom:20px"><div style="color:#43BCC9;font-size:24px;font-weight:800">MecaLIK</div></div>
        <div style="background:${urgent ? '#FF6B6B' : '#43BCC9'};color:#000;padding:10px 16px;border-radius:8px;font-weight:700;text-align:center;margin-bottom:20px">${urgent ? '⚡ URGENT — Nouvelle demande' : '🔔 Nouvelle demande'}</div>
        <div style="background:#14141A;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin-bottom:12px">
          <div style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.06em">Référence</div>
          <div style="font-size:20px;font-weight:700;color:#43BCC9;font-family:ui-monospace,monospace">${b.reference}</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5);width:120px">Service</td><td style="padding:8px 0;color:#fff;font-weight:600">${b.service_name}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Créneau</td><td style="padding:8px 0;color:#fff">${dateStr}${urgent ? ' (URGENT)' : ''}</td></tr>
          <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Client</td><td style="padding:8px 0;color:#fff">${customerName}</td></tr>
          ${customerPhone ? `<tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Téléphone</td><td style="padding:8px 0;color:#fff"><a href="tel:${customerPhone}" style="color:#43BCC9;text-decoration:none">${customerPhone}</a></td></tr>` : ''}
          ${carLabel ? `<tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Véhicule</td><td style="padding:8px 0;color:#fff">${carLabel}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Adresse</td><td style="padding:8px 0;color:#fff">${b.address || '—'}</td></tr>
          ${b.address_notes ? `<tr><td style="padding:8px 0;color:rgba(255,255,255,0.5)">Notes</td><td style="padding:8px 0;color:rgba(255,255,255,0.7);font-style:italic">${b.address_notes}</td></tr>` : ''}
        </table>
        <div style="margin-top:20px;text-align:center"><a href="https://mecalik.com/admin" style="display:inline-block;background:#43BCC9;color:#000;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Ouvrir dans l'admin →</a></div>
        <div style="margin-top:24px;font-size:11px;color:rgba(255,255,255,0.4);text-align:center">Envoyé automatiquement par MecaLIK · ${new Date().toLocaleString('fr-MA')}</div>
      </div>
    `
    const subject = `${urgent ? '⚡ URGENT ' : ''}🔔 ${b.reference} — ${b.service_name} · ${customerName}`
    const waText =
      `${urgent ? '⚡ URGENT\n' : '🔔 Nouvelle demande\n'}\n` +
      `Réf: ${b.reference}\nService: ${b.service_name}\nClient: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}\n` +
      (carLabel ? `Véhicule: ${carLabel}\n` : '') +
      `Adresse: ${b.address || '—'}\n` +
      (b.address_notes ? `Notes: ${b.address_notes}\n` : '') +
      `Créneau: ${dateStr}\n\nAdmin: https://mecalik.com/admin`

    const [emailRes, waRes] = await Promise.all([sendEmail(subject, html), sendWhatsApp(waText)])
    return new Response(JSON.stringify({ ok: true, email: emailRes, whatsapp: waRes }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
