import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowLeft, Phone, MapPin, User, Car as CarIcon, MessageCircle, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase, type Car } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { analytics } from '../../lib/analytics'
import { isServiceComingSoon } from '../../data/serviceStatus'
import { WHATSAPP_NUMBER } from '../../lib/constants'
import {
  loadCatalog, packagesFor, fromPrice, fmtMAD, SERVICE_TO_SLUG,
  type Catalog, type PackagePrice, type Tier,
} from '../../lib/catalog'

// Active services; Pneus and Lavage are not bookable while "coming soon"
const SERVICE_OPTIONS = [
  { id: 'vidange',    duration: '~60 min' },
  { id: 'batterie',   duration: '~30 min' },
  { id: 'diagnostic', duration: '~45 min' },
  { id: 'urgence',    duration: null },
].filter(svc => !isServiceComingSoon(svc.id))

const SERVICE_LABELS: Record<string, string> = {
  lavage:     'Lavage Auto',
  vidange:    'Vidange & Filtres',
  batterie:   'Batterie',
  pneus:      'Pneus',
  diagnostic: 'Diagnostic',
  urgence:    'Urgence & Dépannage',
}
const resolveServiceName = (id: string): string => SERVICE_LABELS[id] || id

const SYMPTOMS_FR = ['Ne démarre pas', 'Batterie à plat', 'Crevaison', 'Voyant moteur allumé', 'Bruit anormal', 'Surchauffe', 'Autre']
const SYMPTOMS_EN = ["Won't start", 'Flat battery', 'Flat tyre', 'Engine warning light', 'Strange noise', 'Overheating', 'Other']

const WINDOWS = [
  { id: 'matin',      fr: 'Matin · 8h–12h',       en: 'Morning · 8–12' },
  { id: 'apres-midi', fr: 'Après-midi · 12h–17h', en: 'Afternoon · 12–17' },
  { id: 'soir',       fr: 'Soir · 17h–20h',       en: 'Evening · 17–20' },
]

const OTHER = '__other__'
const norm = (s: string | null | undefined) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

function nextDays(n: number, isFr: boolean) {
  const out: { iso: string; label: string }[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    const label = i === 0 ? (isFr ? "Aujourd'hui" : 'Today')
      : i === 1 ? (isFr ? 'Demain' : 'Tomorrow')
      : x.toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { weekday: 'short', day: 'numeric' })
    out.push({ iso, label })
  }
  return out
}

export default function BookingModal() {
  const { user, profile } = useAuth()
  const { t, i18n } = useTranslation()
  const isFr = i18n.language !== 'en'
  const navigate = useNavigate()

  const [isOpen, setIsOpen]                     = useState(false)
  const [step, setStep]                         = useState(1)
  const [bookingReference, setBookingReference] = useState('')
  const [confirmedPrice, setConfirmedPrice]     = useState<number | null>(null)
  const [selectedService, setSelectedService]   = useState<string>('')

  // Catalogue
  const [catalog, setCatalog]           = useState<Catalog | null>(null)
  const [catalogError, setCatalogError] = useState(false)

  // Vehicle + package
  const [cars, setCars]                     = useState<Car[]>([])
  const [selectedCarId, setSelectedCarId]   = useState<string>('')
  const [brand, setBrand]                   = useState('')
  const [modelId, setModelId]               = useState('')
  const [otherLabel, setOtherLabel]         = useState('')
  const [manualTier, setManualTier]         = useState<Tier | ''>('')
  const [fuel, setFuel]                     = useState('')
  const [packageId, setPackageId]           = useState('')
  const [symptom, setSymptom]               = useState('')
  const [showBreakdown, setShowBreakdown]   = useState(false)

  // Details
  const [name, setName]                 = useState('')
  const [phone, setPhone]               = useState('')
  const [address, setAddress]           = useState('')
  const [addressNotes, setAddressNotes] = useState('')
  const [asap, setAsap]                 = useState(true)
  const [prefDate, setPrefDate]         = useState('')
  const [prefWindow, setPrefWindow]     = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  // Listen for openBooking events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ service?: string }>).detail
      setIsOpen(true)
      setError('')
      const svc = detail?.service?.toLowerCase()
      const known = svc && SERVICE_OPTIONS.find(s => s.id === svc || norm(resolveServiceName(s.id)) === norm(svc))
      if (known) { setSelectedService(known.id); setStep(2) } else { setStep(1) }
    }
    window.addEventListener('openBooking', handler)
    return () => window.removeEventListener('openBooking', handler)
  }, [])

  // Load the catalogue once the modal opens
  useEffect(() => {
    if (!isOpen || catalog) return
    loadCatalog().then(setCatalog).catch(() => setCatalogError(true))
  }, [isOpen, catalog])

  // Load user info + cars when modal opens
  useEffect(() => {
    if (!user || !isOpen) return
    if (profile?.full_name) setName(profile.full_name)
    if (profile?.phone)     setPhone(profile.phone)
    supabase.from('cars').select('*').eq('user_id', user.id).order('is_primary', { ascending: false })
      .then(({ data }) => {
        const list = data ?? []
        setCars(list)
        if (list.length > 0 && !selectedCarId) setSelectedCarId(list[0].id)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, isOpen])

  // A saved car pre-fills make / model / fuel when it matches the catalogue
  useEffect(() => {
    if (!catalog || !selectedCarId) return
    const car = cars.find(c => c.id === selectedCarId)
    if (!car) return
    const m = catalog.models.find(x => norm(x.brand) === norm(car.brand) && norm(x.model) === norm(car.model))
    if (m) { setBrand(m.brand); setModelId(m.id); setOtherLabel('') }
    else { setBrand(OTHER); setModelId(OTHER); setOtherLabel(`${car.brand} ${car.model}`) }
    const f = norm(car.fuel_type)
    if (f.includes('diesel') || f.includes('gasoil')) setFuel('diesel')
    else if (f.includes('essence') || f.includes('petrol')) setFuel('essence')
    else if (f.includes('hybr')) setFuel('hybride')
    else if (f.includes('elec')) setFuel('electrique')
  }, [catalog, selectedCarId, cars])

  const brands        = useMemo(() => catalog ? Array.from(new Set(catalog.models.map(m => m.brand))) : [], [catalog])
  const modelsOfBrand = useMemo(() => catalog ? catalog.models.filter(m => m.brand === brand) : [], [catalog, brand])
  const selectedModel = catalog?.models.find(m => m.id === modelId) ?? null
  const tier: Tier | null = selectedModel?.tier ?? (manualTier || null)
  const serviceSlug   = SERVICE_TO_SLUG[selectedService] ?? ''
  const fuelForFilter = fuel === 'essence' || fuel === 'diesel' ? fuel : null
  const needsTier     = selectedService === 'vidange' || selectedService === 'batterie'
  const isElectric    = fuel === 'electrique'

  const availablePackages: PackagePrice[] = useMemo(() => {
    if (!catalog || !serviceSlug) return []
    if (needsTier && !tier) return []
    return packagesFor(catalog, serviceSlug, tier, fuelForFilter)
  }, [catalog, serviceSlug, tier, fuelForFilter, needsTier])

  // Pre-select the default package whenever the list changes
  useEffect(() => {
    if (!availablePackages.length) { setPackageId(''); return }
    if (availablePackages.some(p => p.package_id === packageId)) return
    const def = availablePackages.find(p => p.is_default) ?? availablePackages[0]
    setPackageId(def.package_id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages])

  useEffect(() => { if (selectedService === 'urgence') setAsap(true) }, [selectedService])

  if (!isOpen) return null

  const selectedPackage = availablePackages.find(p => p.package_id === packageId) ?? null
  const price           = selectedPackage?.total_ttc ?? null
  const priceIsFrom     = selectedPackage?.price_mode === 'from'
  const savedCar        = cars.find(c => c.id === selectedCarId)
  const vehicleLabel    = selectedModel
    ? `${selectedModel.brand} ${selectedModel.model}`
    : (otherLabel.trim() || (savedCar ? `${savedCar.brand} ${savedCar.model}` : ''))
  const slotType    = asap ? 'urgent' : 'scheduled'
  const windowLabel = WINDOWS.find(w => w.id === prefWindow)?.[isFr ? 'fr' : 'en'] ?? ''
  const slotText    = asap
    ? (isFr ? 'Dès que possible' : 'As soon as possible')
    : `${prefDate ? new Date(prefDate + 'T12:00:00').toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}${windowLabel ? ' · ' + windowLabel : ''}`

  const reset = () => {
    setStep(1); setSelectedService(''); setError(''); setPackageId(''); setSymptom('')
    setShowBreakdown(false); setConfirmedPrice(null)
  }
  const close = () => { setIsOpen(false); reset() }

  const openWhatsApp = (message: string) => {
    analytics.whatsappClick('success_screen')
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) window.location.href = url
    else window.open(url, '_blank')
  }

  const buildWhatsAppMessage = (bookingRef: string, finalPrice: number | null) => {
    const priceLine = finalPrice
      ? `\n💰 *${isFr ? 'Prix' : 'Price'} :* ${priceIsFrom ? (isFr ? 'dès ' : 'from ') : ''}${fmtMAD(finalPrice)} TTC${selectedPackage ? ` (${selectedPackage.name_fr})` : ''}`
      : ''
    const trackingLine = bookingRef
      ? `\n\n📋 *${isFr ? 'Référence' : 'Reference'} :* ${bookingRef}\n🔗 *${isFr ? 'Suivi' : 'Track'} :* https://mecalik.com/track/${bookingRef}`
      : ''
    const lines = [
      `🔧 *Service :* ${resolveServiceName(selectedService)}`,
      vehicleLabel ? `🚗 *${isFr ? 'Véhicule' : 'Vehicle'} :* ${vehicleLabel}${fuel ? ' · ' + fuel : ''}` : '',
      symptom ? `⚠️ *${isFr ? 'Problème' : 'Issue'} :* ${symptom}` : '',
      `🕐 *${isFr ? 'Créneau' : 'Slot'} :* ${slotText}`,
      `📍 *${isFr ? 'Adresse' : 'Address'} :* ${address}`,
      addressNotes ? `📝 *Notes :* ${addressNotes}` : '',
      `👤 *${isFr ? 'Nom' : 'Name'} :* ${name}`,
      `📞 *${isFr ? 'Téléphone' : 'Phone'} :* ${phone}`,
    ].filter(Boolean).join('\n')
    return isFr
      ? `Bonjour MecaLIK ! 👋\n\nJe viens de réserver :\n\n${lines}${priceLine}${trackingLine}\n\nMerci !`
      : `Hello MecaLIK! 👋\n\nI just booked:\n\n${lines}${priceLine}${trackingLine}\n\nThank you!`
  }

  const bookingFields = () => ({
    service_name:     resolveServiceName(selectedService),
    address,
    address_notes:    addressNotes || null,
    package_id:       packageId || null,
    vehicle_model_id: selectedModel?.id ?? null,
    vehicle_label:    vehicleLabel ? `${vehicleLabel}${fuel ? ' · ' + fuel : ''}` : null,
    vehicle_tier:     tier,
    slot_type:        slotType,
    preferred_date:   asap ? null : (prefDate || null),
    preferred_window: asap ? null : (prefWindow || null),
    symptom:          symptom || null,
  })

  const requireDetails = () => {
    if (!name || !phone || !address) { setError(isFr ? 'Tous les champs marqués * sont obligatoires' : 'All fields marked * are required'); return false }
    if (!asap && (!prefDate || !prefWindow)) { setError(isFr ? 'Choisissez un jour et un créneau' : 'Pick a day and a time slot'); return false }
    return true
  }

  const handleGuestBooking = async () => {
    if (submitting || !requireDetails()) return
    setSubmitting(true)
    setError('')
    let reference: string | null = null
    let quoted: number | null = price
    try {
      const f = bookingFields()
      const { data, error: rpcError } = await supabase.rpc('create_guest_booking', {
        p_service_name: f.service_name, p_address: f.address, p_address_notes: f.address_notes,
        p_customer_name: name, p_customer_phone: phone,
        p_package_id: f.package_id, p_vehicle_model_id: f.vehicle_model_id, p_vehicle_label: f.vehicle_label,
        p_vehicle_tier: f.vehicle_tier, p_slot_type: f.slot_type, p_preferred_date: f.preferred_date,
        p_preferred_window: f.preferred_window, p_symptom: f.symptom,
      })
      if (rpcError) throw rpcError
      const res = data as { reference: string; price_quoted_ttc: number | null } | null
      reference = res?.reference ?? null
      if (res?.price_quoted_ttc != null) quoted = Number(res.price_quoted_ttc)
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to save guest booking', err)
    } finally {
      setSubmitting(false)
    }
    analytics.bookingCompleted(reference ?? '', resolveServiceName(selectedService), quoted ?? 0)
    openWhatsApp(buildWhatsAppMessage(reference ?? '', quoted))
    setBookingReference(reference ?? '')
    setConfirmedPrice(quoted)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      ;(window as any).fbq('track', 'Lead', { content_name: resolveServiceName(selectedService), content_category: 'Booking', value: quoted ?? 0, currency: 'MAD' })
    }
    setStep(4)
  }

  const handleCreateAccount = () => {
    if (!requireDetails()) return
    openWhatsApp(buildWhatsAppMessage('', price))
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      service: selectedService, name, phone, notes: addressNotes || '', ...bookingFields(),
    }))
    close()
    window.location.href = '/signup?from=booking'
  }

  const submit = async () => {
    if (submitting || !requireDetails()) return
    if (!user) { close(); navigate('/login'); return }
    setSubmitting(true)
    setError('')
    try {
      const f = bookingFields()
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data: existing } = await supabase
        .from('bookings').select('id, reference, price_quoted_ttc')
        .eq('user_id', user.id).eq('service_name', f.service_name).gte('created_at', twoMinAgo)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()

      const booking = existing ?? await (async () => {
        const { data, error: insertError } = await supabase.from('bookings')
          .insert({ ...f, user_id: user.id, car_id: selectedCarId || null, status: 'pending', source: 'platform' })
          .select('id, reference, price_quoted_ttc').single()
        if (insertError) throw insertError
        return data
      })()

      const b = booking as { id?: string; reference?: string; price_quoted_ttc?: number | null } | null
      const quoted = b?.price_quoted_ttc != null ? Number(b.price_quoted_ttc) : price
      analytics.bookingCompleted(b?.reference ?? '', f.service_name, quoted ?? 0)
      openWhatsApp(buildWhatsAppMessage(b?.reference ?? '', quoted))
      close()
      if (b?.id) navigate(`/booking/${b.id}`)
    } catch (err) {
      setError('Erreur: ' + (err instanceof Error ? err.message : 'inconnue'))
    } finally {
      setSubmitting(false)
    }
  }

  const goToStep2 = () => {
    if (!selectedService) { setError(isFr ? 'Veuillez choisir un service' : 'Please choose a service'); return }
    setError(''); setStep(2)
  }
  const goToStep3 = () => {
    if (selectedService === 'urgence' && !symptom) { setError(isFr ? 'Dites-nous ce qui se passe' : 'Tell us what is happening'); return }
    if (selectedService === 'vidange' && isElectric) { setError(isFr ? "Une voiture 100% électrique n'a pas de vidange moteur." : 'A fully electric car has no engine oil change.'); return }
    if (catalog && needsTier && !tier) { setError(isFr ? 'Choisissez votre véhicule (ou sa taille)' : 'Choose your car (or its size)'); return }
    if (catalog && !selectedPackage) { setError(isFr ? 'Choisissez une formule' : 'Choose a package'); return }
    setError(''); setStep(3)
  }

  const canSubmit = !submitting && !!name && !!phone && !!address && (asap || (!!prefDate && !!prefWindow))
  const titles = [
    '',
    t('booking.chooseService'),
    isFr ? 'Votre véhicule et votre prix' : 'Your car and your price',
    isFr ? 'Où et quand ?' : 'Where and when?',
    t('booking.confirmed'),
  ]

  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, animation: 'bmFadeIn 0.2s ease' }} />

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', maxHeight: '92vh', background: '#0A0A0A',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 101,
        animation: 'bmSlideUp 0.25s ease', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {(step === 2 || step === 3) && (
              <button onClick={() => { setStep(step - 1); setError('') }} style={backBtn}>
                <ArrowLeft size={13} />
                {step === 2 ? t('booking.changeService') : (isFr ? 'Retour' : 'Back')}
              </button>
            )}
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '20px', fontWeight: 600, color: 'white', letterSpacing: '-0.015em', marginBottom: '2px' }}>
              {titles[step]}
            </h2>
            {step < 4 && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {step === 1
                  ? (isFr ? 'Prix fixe affiché avant de réserver' : 'Fixed price shown before you book')
                  : (isFr ? "Paiement après l'intervention" : 'Pay after the service')}
              </div>
            )}
          </div>
          <button onClick={close} style={closeBtn}><X size={15} color="rgba(255,255,255,0.6)" /></button>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div style={{ padding: '12px 20px', display: 'flex', gap: '6px', flexShrink: 0 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: s === step ? 1 : 0.4, height: '3px', borderRadius: '2px', transition: 'all 0.3s', background: s <= step ? 'var(--mk-action)' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>

          {/* STEP 1 — service */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SERVICE_OPTIONS.map(svc => {
                const isSelected = selectedService === svc.id
                const from = catalog ? fromPrice(catalog, SERVICE_TO_SLUG[svc.id]) : null
                const isUrgent = svc.id === 'urgence'
                return (
                  <button key={svc.id}
                    onClick={() => { setSelectedService(svc.id); analytics.selectService(resolveServiceName(svc.id), from ?? 0) }}
                    style={{ ...card(isSelected), display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                    <div style={iconBox(isSelected)}>
                      {isSelected
                        ? <Check size={16} color="var(--mk-action)" />
                        : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUrgent ? 'rgba(255,68,68,0.6)' : 'rgba(255,255,255,0.2)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>{t('services.' + svc.id)}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{svc.duration ?? (isFr ? 'Intervention rapide' : 'Fast response')}</div>
                    </div>
                    {from != null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{isFr ? 'dès' : 'from'}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--mk-action)' }}>{fmtMAD(from)}</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP 2 — vehicle, symptom, package */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ServiceChip label={t('services.' + selectedService)} />

              {catalogError && (
                <div style={warnBox}>
                  {isFr
                    ? "Les prix n'ont pas pu être chargés. Vous pouvez continuer : nous vous confirmerons le prix sur WhatsApp."
                    : "Prices could not load. You can continue and we'll confirm the price on WhatsApp."}
                </div>
              )}

              {selectedService === 'urgence' && (
                <>
                  <FieldLabel>{isFr ? 'Que se passe-t-il ? *' : 'What is happening? *'}</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(isFr ? SYMPTOMS_FR : SYMPTOMS_EN).map(s => (
                      <button key={s} onClick={() => setSymptom(s)} style={chip(symptom === s)}>{s}</button>
                    ))}
                  </div>
                </>
              )}

              {cars.length > 0 && (
                <>
                  <FieldLabel>{isFr ? 'Mes véhicules' : 'My cars'}</FieldLabel>
                  <FieldWrapper icon={<CarIcon size={14} color="rgba(255,255,255,0.4)" />}>
                    <select value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {cars.map(car => (
                        <option key={car.id} value={car.id}>{car.brand} {car.model}{car.year ? ` ${car.year}` : ''}{car.license_plate ? ` · ${car.license_plate}` : ''}</option>
                      ))}
                      <option value="">{isFr ? 'Un autre véhicule' : 'Another car'}</option>
                    </select>
                  </FieldWrapper>
                </>
              )}

              <FieldLabel>{isFr ? 'Marque' : 'Make'}{needsTier ? ' *' : ''}</FieldLabel>
              <FieldWrapper icon={<CarIcon size={14} color="rgba(255,255,255,0.4)" />}>
                <select value={brand}
                  onChange={e => { setBrand(e.target.value); setModelId(e.target.value === OTHER ? OTHER : ''); setManualTier('') }}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{isFr ? 'Choisir la marque' : 'Choose make'}</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value={OTHER}>{isFr ? 'Autre marque' : 'Other make'}</option>
                </select>
              </FieldWrapper>

              {brand && brand !== OTHER && (
                <>
                  <FieldLabel>{isFr ? 'Modèle' : 'Model'}{needsTier ? ' *' : ''}</FieldLabel>
                  <FieldWrapper icon={<ChevronDown size={14} color="rgba(255,255,255,0.4)" />}>
                    <select value={modelId} onChange={e => { setModelId(e.target.value); setManualTier('') }} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">{isFr ? 'Choisir le modèle' : 'Choose model'}</option>
                      {modelsOfBrand.map(m => <option key={m.id} value={m.id}>{m.model}</option>)}
                      <option value={OTHER}>{isFr ? 'Autre modèle' : 'Other model'}</option>
                    </select>
                  </FieldWrapper>
                </>
              )}

              {(brand === OTHER || modelId === OTHER) && (
                <>
                  <FieldLabel>{isFr ? 'Votre véhicule' : 'Your car'}</FieldLabel>
                  <FieldWrapper icon={<CarIcon size={14} color="rgba(255,255,255,0.4)" />}>
                    <input value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder={isFr ? 'Ex : Chery Tiggo 4' : 'E.g. Chery Tiggo 4'} style={inputStyle} />
                  </FieldWrapper>
                  {catalog && (
                    <>
                      <FieldLabel>{isFr ? 'Taille du véhicule' : 'Car size'}{needsTier ? ' *' : ''}</FieldLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {catalog.tiers.map(tr => (
                          <button key={tr.code} onClick={() => setManualTier(tr.code)} style={{ ...card(manualTier === tr.code), padding: '10px 14px' }}>
                            <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{tr.label_fr}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{tr.examples}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {(selectedService === 'vidange' || selectedService === 'diagnostic' || selectedService === 'urgence') && (
                <>
                  <FieldLabel>{isFr ? 'Carburant' : 'Fuel'}</FieldLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[['essence', isFr ? 'Essence' : 'Petrol'], ['diesel', 'Diesel'], ['hybride', isFr ? 'Hybride' : 'Hybrid'], ['electrique', isFr ? 'Électrique' : 'Electric']].map(([id, label]) => (
                      <button key={id} onClick={() => setFuel(fuel === id ? '' : id)} style={chip(fuel === id)}>{label}</button>
                    ))}
                  </div>
                </>
              )}

              {/* Packages with firm price */}
              {availablePackages.length > 0 && !(selectedService === 'vidange' && isElectric) && (
                <>
                  <FieldLabel>{isFr ? 'Votre formule' : 'Your package'}</FieldLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availablePackages.map(p => {
                      const sel = p.package_id === packageId
                      return (
                        <button key={p.package_id} onClick={() => setPackageId(p.package_id)} style={{ ...card(sel), padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>{p.name_fr}</div>
                            {p.description_fr && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', lineHeight: 1.4 }}>{p.description_fr}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {p.price_mode === 'from' && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{isFr ? 'dès' : 'from'}</div>}
                            <div style={{ fontSize: '16px', fontWeight: 800, color: sel ? 'var(--mk-action)' : 'white' }}>{fmtMAD(p.total_ttc)}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>TTC</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedPackage && (
                    <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ ...linkBtn, alignSelf: 'flex-start' }}>
                      {showBreakdown ? (isFr ? 'Masquer le détail' : 'Hide details') : (isFr ? 'Voir le détail du prix' : 'See price details')}
                    </button>
                  )}
                  {selectedPackage && showBreakdown && (
                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      {selectedPackage.parts.map(pt => (
                        <Row key={pt.sku} l={`${pt.name}${Number(pt.qty) !== 1 ? ` × ${pt.qty}` : ''}`} r={fmtMAD(Number(pt.line_ttc))} />
                      ))}
                      <Row l={isFr ? "Main-d'œuvre et déplacement MecaLIK" : 'MecaLIK labour and travel'} r={fmtMAD(selectedPackage.service_fee_ttc)} />
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '6px', paddingTop: '6px' }}>
                        <Row l="Total TTC" r={fmtMAD(selectedPackage.total_ttc)} bold />
                      </div>
                    </div>
                  )}
                  {priceIsFrom && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                      {isFr
                        ? 'Si une pièce est nécessaire, elle vous est proposée au prix catalogue et vous validez avant toute intervention.'
                        : 'If a part is needed, it is offered at catalogue price and you approve before any work.'}
                    </div>
                  )}
                </>
              )}
              {needsTier && !tier && catalog && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {isFr ? 'Choisissez votre véhicule pour voir le prix exact.' : 'Choose your car to see the exact price.'}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — details + slot */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ServiceChip label={`${t('services.' + selectedService)}${vehicleLabel ? ' · ' + vehicleLabel : ''}`} />

              <FieldLabel>{isFr ? 'Quand ?' : 'When?'} *</FieldLabel>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setAsap(true)} style={{ ...chip(asap), flex: 1 }}>{isFr ? 'Dès que possible' : 'As soon as possible'}</button>
                {selectedService !== 'urgence' && (
                  <button onClick={() => setAsap(false)} style={{ ...chip(!asap), flex: 1 }}>{isFr ? 'Choisir un créneau' : 'Pick a slot'}</button>
                )}
              </div>
              {!asap && (
                <>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {nextDays(7, isFr).map(d => (
                      <button key={d.iso} onClick={() => setPrefDate(d.iso)} style={{ ...chip(prefDate === d.iso), whiteSpace: 'nowrap' }}>{d.label}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {WINDOWS.map(w => (
                      <button key={w.id} onClick={() => setPrefWindow(w.id)} style={{ ...chip(prefWindow === w.id), textAlign: 'left' }}>{isFr ? w.fr : w.en}</button>
                    ))}
                  </div>
                </>
              )}

              <FieldLabel>{t('booking.fullName')} *</FieldLabel>
              <FieldWrapper icon={<User size={14} color="rgba(255,255,255,0.4)" />}>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('booking.fullNamePlaceholder')} style={inputStyle} />
              </FieldWrapper>

              <FieldLabel>{t('common.phone')} *</FieldLabel>
              <FieldWrapper icon={<Phone size={14} color="rgba(255,255,255,0.4)" />}>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="06 XX XX XX XX" style={inputStyle} />
              </FieldWrapper>

              <FieldLabel>{t('booking.address')} *</FieldLabel>
              <FieldWrapper icon={<MapPin size={14} color="rgba(255,255,255,0.4)" />}>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('booking.addressPlaceholder')} style={inputStyle} />
              </FieldWrapper>

              <FieldLabel>{t('booking.addressNotes')}</FieldLabel>
              <textarea value={addressNotes} onChange={e => setAddressNotes(e.target.value)} placeholder={t('booking.addressNotesPlaceholder')} rows={2}
                style={{ ...inputStyle, padding: '12px 14px', resize: 'none', minHeight: '60px', background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }} />
            </div>
          )}

          {/* STEP 4 — confirmation */}
          {step === 4 && (
            <div style={{ padding: '8px 0 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(67,188,201,0.12)', border: '2px solid var(--mk-action)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>✓</div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
                {isFr
                  ? 'Votre réservation est enregistrée. Un technicien vous est attribué et vous confirme sur WhatsApp.'
                  : 'Your booking is saved. A technician is assigned and will confirm on WhatsApp.'}
              </p>
              <div style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{t('booking.yourReference')}</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--mk-action)', letterSpacing: '0.05em', fontFamily: 'Space Grotesk, monospace' }}>{bookingReference || '—'}</div>
                {confirmedPrice != null && (
                  <div style={{ marginTop: '10px', fontSize: '15px', color: 'white', fontWeight: 700 }}>
                    {priceIsFrom ? (isFr ? 'Dès ' : 'From ') : (isFr ? 'Prix ferme : ' : 'Firm price: ')}{fmtMAD(confirmedPrice)} TTC
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{slotText}</div>
              </div>
              {bookingReference && (
                <a href={`/track/${bookingReference}`} target="_blank" rel="noopener noreferrer"
                  style={{ width: '100%', padding: '13px', borderRadius: '10px', background: 'var(--mk-action)', color: '#0A0A0A', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                  🔍 {t('booking.trackBooking')}
                </a>
              )}
              <button onClick={() => openWhatsApp(buildWhatsAppMessage(bookingReference, confirmedPrice))} style={{ ...linkBtn, color: 'var(--mk-success)', display: 'inline-flex', alignItems: 'center' }}>
                <MessageCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                {isFr ? 'Renvoyer sur WhatsApp' : 'Send again on WhatsApp'}
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                {t('booking.wantHistory')}{' '}<a href="/signup" style={{ color: 'var(--mk-action)', textDecoration: 'none' }}>{t('booking.createAccountLink')}</a>
              </p>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.close')}</button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.18)', color: '#FF6B6B', fontSize: '12px' }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div style={{ padding: '14px 20px 28px', background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            {(step === 2 || step === 3) && price != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                  {priceIsFrom ? (isFr ? 'Prix de départ' : 'Starting price') : (isFr ? 'Prix ferme, payé après le service' : 'Firm price, paid after the service')}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{priceIsFrom ? (isFr ? 'dès ' : 'from ') : ''}{fmtMAD(price)}</span>
              </div>
            )}

            {step === 1 && (
              <button onClick={goToStep2} disabled={!selectedService} style={primaryBtn(!!selectedService, 'white', '#080808')}>{isFr ? 'Continuer' : 'Continue'}</button>
            )}
            {step === 2 && (
              <button onClick={goToStep3} style={primaryBtn(true, 'white', '#080808')}>{isFr ? 'Continuer' : 'Continue'}</button>
            )}
            {step === 3 && (
              user ? (
                <button onClick={submit} disabled={!canSubmit} style={primaryBtn(canSubmit, 'var(--mk-success)', '#0A0A0A')}>
                  {submitting ? <><Spinner /> {t('common.loading')}</> : <><MessageCircle size={16} />{isFr ? 'Réserver' : 'Book'}</>}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button onClick={handleGuestBooking} disabled={!canSubmit} style={primaryBtn(canSubmit, 'var(--mk-action)', '#0A0A0A')}>
                    {submitting ? <><Spinner /> {t('common.loading')}</> : <><span>💬</span>{isFr ? 'Réserver (sans compte)' : 'Book (no account)'}</>}
                  </button>
                  <button onClick={handleCreateAccount} disabled={!canSubmit}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', marginTop: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: canSubmit ? 'white' : 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                    ✦ {t('booking.createAccountAndBook')}
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bmFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bmSlideUp { from { transform: translate(-50%, 100%) } to { transform: translate(-50%, 0) } }
        @keyframes bmSpin    { to { transform: rotate(360deg) } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, select:focus, textarea:focus { outline: none; }
        select option { background: #111111 !important; color: white !important; }
      `}</style>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <span style={{ display: 'inline-block', width: '15px', height: '15px', borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'bmSpin 0.7s linear infinite', flexShrink: 0 }} />
}

function Row({ l, r, bold }: { l: string; r: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '2px 0', fontWeight: bold ? 700 : 400, color: bold ? 'white' : undefined }}>
      <span>{l}</span><span style={{ whiteSpace: 'nowrap' }}>{r}</span>
    </div>
  )
}

function ServiceChip({ label }: { label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.2)', alignSelf: 'flex-start' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--mk-action)', display: 'inline-block' }} />
      <span style={{ fontSize: '12px', color: 'var(--mk-action)', fontWeight: 600 }}>{label}</span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '-8px', marginTop: '4px' }}>{children}</div>
}

function FieldWrapper({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', paddingLeft: '14px', gap: '10px' }}>{icon}{children}</div>
}

const inputStyle: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', padding: '12px 14px 12px 0', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit', width: '100%' }
const backBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 0 6px 0', marginLeft: '-2px' }
const closeBtn: React.CSSProperties = { width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--mk-action)', fontSize: '12px', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }
const warnBox: React.CSSProperties = { padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,153,0,0.08)', border: '1px solid rgba(255,153,0,0.2)', color: '#FFB347', fontSize: '12px', lineHeight: 1.5 }

const card = (sel: boolean): React.CSSProperties => ({
  width: '100%', background: sel ? 'rgba(67,188,201,0.08)' : '#0F0F0F',
  border: sel ? '1.5px solid rgba(67,188,201,0.4)' : '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
})
const iconBox = (sel: boolean): React.CSSProperties => ({
  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: sel ? 'rgba(67,188,201,0.15)' : 'rgba(255,255,255,0.04)',
  border: sel ? '1px solid rgba(67,188,201,0.25)' : '1px solid rgba(255,255,255,0.06)',
})
const chip = (sel: boolean): React.CSSProperties => ({
  padding: '9px 14px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  background: sel ? 'rgba(67,188,201,0.12)' : '#111111', color: sel ? 'var(--mk-action)' : 'rgba(255,255,255,0.75)',
  border: sel ? '1px solid rgba(67,188,201,0.45)' : '1px solid rgba(255,255,255,0.08)', fontWeight: sel ? 600 : 400,
})
const primaryBtn = (on: boolean, bg: string, fg: string): React.CSSProperties => ({
  width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontFamily: 'inherit',
  background: on ? bg : 'rgba(255,255,255,0.06)', color: on ? fg : 'rgba(255,255,255,0.3)',
  fontSize: '15px', fontWeight: 700, cursor: on ? 'pointer' : 'not-allowed',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s',
})
