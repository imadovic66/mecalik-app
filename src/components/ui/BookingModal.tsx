import { X, ChevronRight, Car, MapPin, Calendar, User, Phone, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SERVICES as PRICING_SERVICES, getPrice } from '../../data/pricing'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Service = {
  id: string
  name: string
  duration: string
}

type CarType = {
  id: string
  brand: string
  model: string
  year: number
  license_plate: string | null
  is_default: boolean | null
}

const SERVICES: Service[] = [
  { id: 'lavage',     name: 'Lavage Auto',       duration: '~45 min' },
  { id: 'vidange',    name: 'Vidange & Filtres',  duration: '~60 min' },
  { id: 'batterie',   name: 'Batterie',           duration: '~30 min' },
  { id: 'pneus',      name: 'Pneus',              duration: '~45 min' },
  { id: 'diagnostic', name: 'Diagnostic',         duration: '~30 min' },
  { id: 'urgence',    name: 'Urgence 24/7',       duration: 'ASAP'    },
]

function carLabel(car: CarType): string {
  return `${car.brand} ${car.model} ${car.year}${car.license_plate ? ' · ' + car.license_plate : ''}`
}

type BookingModalProps = {
  isOpen: boolean
  onClose: () => void
  preselectedService?: string
}

type FormState = {
  name: string
  phone: string
  car: string
  address: string
  date: string
  note: string
}

type ErrorState = {
  name: boolean
  phone: boolean
  car: boolean
  address: boolean
}

export default function BookingModal({ isOpen, onClose, preselectedService }: BookingModalProps) {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [step, setStep]               = useState(1)
  const [submitting, setSubmitting]   = useState(false)
  const [selectedService, setSelectedService] = useState(preselectedService || '')

  const [form, setForm] = useState<FormState>({
    name: '', phone: '', car: '', address: '', date: 'today', note: '',
  })
  const [errors, setErrors] = useState<ErrorState>({
    name: false, phone: false, car: false, address: false,
  })

  // ── vehicle state ─────────────────────────────────────────────────────────
  const [userCars, setUserCars]               = useState<CarType[]>([])
  const [carsLoaded, setCarsLoaded]           = useState(false)
  const [showCarSelector, setShowCarSelector] = useState(false) // Case A → expand

  // ── pre-fill on open ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // reset navigation state when modal closes
      setStep(1)
      setShowCarSelector(false)
      return
    }

    // Pre-fill name + phone from profile (already in memory — no extra fetch)
    setForm(prev => ({
      ...prev,
      name:  profile?.full_name ?? prev.name,
      phone: profile?.phone     ?? prev.phone,
    }))

    // Fetch cars for logged-in users
    if (!user) return

    supabase
      .from('cars')
      .select('id, brand, model, year, license_plate, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false }) // default car first
      .order('created_at',  { ascending: false })
      .then(({ data }) => {
        const cars: CarType[] = data ?? []
        setUserCars(cars)
        setCarsLoaded(true)

        if (cars.length === 0) return // Case C — leave form.car empty

        // Case A or B — auto-select best car
        const best = cars.find(c => c.is_default) ?? cars[0]
        setForm(prev => ({ ...prev, car: carLabel(best) }))
      })
      .catch(() => {
        setCarsLoaded(true) // graceful fallback — show text input
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field in errors) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const handleCarSelect = (carId: string) => {
    const car = userCars.find(c => c.id === carId)
    if (car) {
      setForm(prev => ({ ...prev, car: carLabel(car) }))
      setErrors(prev => ({ ...prev, car: false }))
    }
  }

  // Car is required only for non-logged-in users or logged-in with 0 cars
  // (but we still accept an empty car for Case C to allow booking anyway)
  const carRequired = !user

  const handleSubmit = async () => {
    const newErrors: ErrorState = {
      name:    !form.name.trim(),
      phone:   !form.phone.trim(),
      car:     carRequired ? !form.car.trim() : false,
      address: !form.address.trim(),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    const service   = SERVICES.find(s => s.id === selectedService)
    const dateLabel = form.date === 'today' ? "Aujourd'hui" : form.date === 'tomorrow' ? 'Demain' : form.date

    const msg =
      `Bonjour MecaLIK\n\n` +
      `*Nouvelle demande de devis*\n\n` +
      `Service: ${service?.name}\n` +
      `Nom: ${form.name}\n` +
      `Telephone: ${form.phone}\n` +
      (form.car ? `Voiture: ${form.car}\n` : '') +
      `Lieu: ${form.address}\n` +
      `Date: ${dateLabel}` +
      (form.note ? `\nNote: ${form.note}` : '') +
      `\n\nMerci !`

    const url = 'https://wa.me/212777348065?text=' + encodeURIComponent(msg)

    setSubmitting(true)
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id:        user?.id || null,
        service_name:   selectedService,
        address:        form.address,
        notes_admin:    form.note || null,
        preferred_date: form.date === 'tomorrow'
          ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
          : null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Booking insert error:', insertError.message, insertError.code)
    }

    setSubmitting(false)

    if (newBooking) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role:  'admin',
          title: 'Nouvelle réservation',
          body:  `${service?.name} — ${form.address}`,
          url:   '/admin',
        }),
      }).catch(() => {})
    }

    if (newBooking && user) {
      window.open(url, '_blank')
      onClose()
      setTimeout(() => navigate('/booking/' + newBooking.id), 500)
    } else {
      window.open(url, '_blank')
      onClose()
    }
  }

  const selectedServiceData = SERVICES.find(s => s.id === selectedService)

  const inputBase: React.CSSProperties = {
    background: '#141414',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    width: '100%',
    padding: '14px 16px 14px 40px',
    outline: 'none',
  }
  const inputError: React.CSSProperties = { ...inputBase, border: '1px solid #FF4444' }

  // ── vehicle section helpers ───────────────────────────────────────────────
  const loggedIn      = !!user
  const caseA         = loggedIn && carsLoaded && userCars.length === 1 && !showCarSelector
  const caseB         = loggedIn && carsLoaded && (userCars.length > 1 || (userCars.length === 1 && showCarSelector))
  const caseC         = loggedIn && carsLoaded && userCars.length === 0
  const noAuthOrLoad  = !loggedIn || !carsLoaded // show plain input while loading or if guest

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full md:max-w-lg mx-0 md:mx-4 overflow-y-auto"
        style={{
          background: '#0D0D0D',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="font-heading font-bold text-lg" style={{ color: '#ffffff' }}>
              Demander un devis
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Réponse WhatsApp en moins de 5 min
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Fermer"
          >
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step >= 1 ? '#43BCC9' : 'rgba(255,255,255,0.08)',
                color: step >= 1 ? '#080808' : 'rgba(255,255,255,0.4)',
              }}
            >1</div>
            <span className="text-xs" style={{ color: step === 1 ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
              Service
            </span>
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step === 2 ? '#43BCC9' : 'rgba(255,255,255,0.08)',
                color: step === 2 ? '#080808' : 'rgba(255,255,255,0.4)',
              }}
            >2</div>
            <span className="text-xs" style={{ color: step === 2 ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
              Vos infos
            </span>
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <div className="px-6 py-4">
              <p className="text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Quel service souhaitez-vous ?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(s => {
                  const active         = selectedService === s.id
                  const pricingService = PRICING_SERVICES.find(p => p.id === s.id)
                  const priceLabel     = pricingService
                    ? (pricingService.contactOnly ? 'Sur devis' : `À partir de ${getPrice(pricingService, 'zone1')}`)
                    : null
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s.id)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200"
                      style={{
                        border:     active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                        background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                      }}
                    >
                      <div className="text-sm font-semibold" style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>
                        {s.name}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {s.duration}
                      </div>
                      {priceLabel && (
                        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                          {priceLabel}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4">
              <button
                onClick={() => { if (selectedService) setStep(2) }}
                disabled={!selectedService}
                className="w-full rounded-full py-4 text-sm font-semibold transition-all"
                style={{
                  background: selectedService ? 'white' : 'rgba(255,255,255,0.06)',
                  color:      selectedService ? '#080808' : 'rgba(255,255,255,0.3)',
                  cursor:     selectedService ? 'pointer' : 'not-allowed',
                }}
              >
                Continuer
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <div className="px-6 py-4 space-y-4">
              {/* Back */}
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                ← {selectedServiceData?.name}
              </button>

              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: 'rgba(67,188,201,0.08)', border: '1px solid rgba(67,188,201,0.2)' }}
              >
                <span className="text-xs font-medium" style={{ color: '#43BCC9' }}>
                  {selectedServiceData?.name} · {selectedServiceData?.duration}
                </span>
              </div>

              {/* ── Name ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nom complet *
                </label>
                <div className="relative">
                  <User size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Votre nom complet"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    style={errors.name ? inputError : inputBase}
                  />
                </div>
                {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* ── Phone ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="06 XX XX XX XX"
                    value={form.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    style={errors.phone ? inputError : inputBase}
                  />
                </div>
                {errors.phone && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* ── Vehicle — smart selection ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Véhicule{carRequired ? ' *' : ''}
                </label>

                {/* CASE A — 1 car, auto-selected, read-only display */}
                {caseA && (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#141414',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '13px 16px',
                    }}>
                      <Car size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                        {form.car}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCarSelector(true)}
                      style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#43BCC9',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Changer de véhicule
                    </button>
                  </div>
                )}

                {/* CASE B — 2+ cars or "Changer" clicked — dropdown */}
                {caseB && (
                  <div>
                    <div className="relative">
                      <Car size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={userCars.find(c => carLabel(c) === form.car)?.id ?? ''}
                        onChange={e => handleCarSelect(e.target.value)}
                        style={{ ...inputBase, appearance: 'none' as const }}
                      >
                        <option value="" disabled>Sélectionnez votre véhicule</option>
                        {userCars.map(car => (
                          <option key={car.id} value={car.id}>
                            {carLabel(car)}{car.is_default ? ' (par défaut)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.car && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
                  </div>
                )}

                {/* CASE C — 0 cars — prompt + optional free-text */}
                {caseC && (
                  <div>
                    <div style={{
                      background: 'rgba(67,188,201,0.04)',
                      border: '1px solid rgba(67,188,201,0.12)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
                        Ajoutez votre véhicule pour accélérer vos réservations
                      </span>
                      <button
                        onClick={() => { onClose(); navigate('/dashboard?tab=vehicles') }}
                        style={{
                          fontSize: '12px', fontWeight: 600,
                          color: '#43BCC9', background: 'none',
                          border: '1px solid rgba(67,188,201,0.25)',
                          borderRadius: '100px', padding: '5px 12px',
                          cursor: 'pointer', flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Ajouter
                      </button>
                    </div>
                    <div className="relative">
                      <Car size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: Dacia Logan 2019 (facultatif)"
                        value={form.car}
                        onChange={e => updateField('car', e.target.value)}
                        style={inputBase}
                      />
                    </div>
                  </div>
                )}

                {/* Guest or loading — plain text input */}
                {noAuthOrLoad && (
                  <div className="relative">
                    <Car size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ex: Dacia Logan 2019"
                      value={form.car}
                      onChange={e => updateField('car', e.target.value)}
                      style={errors.car ? inputError : inputBase}
                    />
                    {errors.car && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
                  </div>
                )}
              </div>

              {/* ── Address ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Adresse / Lieu *
                </label>
                <div className="relative">
                  <MapPin size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Domicile, bureau, parking..."
                    value={form.address}
                    onChange={e => updateField('address', e.target.value)}
                    style={errors.address ? inputError : inputBase}
                  />
                </div>
                {errors.address && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* ── Date ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Date souhaitée
                </label>
                <div className="relative">
                  <Calendar size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={form.date}
                    onChange={e => updateField('date', e.target.value)}
                    style={{ ...inputBase, appearance: 'none' as const }}
                  >
                    <option value="today">{"Aujourd'hui — dès que possible"}</option>
                    <option value="tomorrow">Demain matin</option>
                    <option value="choose">Choisir une date</option>
                  </select>
                </div>
              </div>

              {/* ── Note ── */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Note optionnelle
                </label>
                <div className="relative">
                  <MessageSquare size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-4" />
                  <textarea
                    rows={2}
                    placeholder="Précisions sur le problème, accès, etc."
                    value={form.note}
                    onChange={e => updateField('note', e.target.value)}
                    style={{ ...inputBase, padding: '14px 16px 14px 40px', resize: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 pb-6 pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-full transition-colors duration-200 text-sm"
                style={{
                  background: submitting ? 'rgba(67,188,201,0.5)' : '#43BCC9',
                  color:  '#080808',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting
                  ? 'Envoi...'
                  : <><span>Envoyer sur WhatsApp</span><ChevronRight size={18} /></>}
              </button>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Vous recevrez une réponse en moins de 5 minutes
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
