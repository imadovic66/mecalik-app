import { X, ChevronRight, Car, MapPin, Calendar, User, Phone, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Service = {
  id: string
  name: string
  duration: string
}

const SERVICES: Service[] = [
  { id: 'lavage', name: 'Lavage Auto', duration: '~45 min' },
  { id: 'vidange', name: 'Vidange & Filtres', duration: '~60 min' },
  { id: 'batterie', name: 'Batterie', duration: '~30 min' },
  { id: 'pneus', name: 'Pneus', duration: '~45 min' },
  { id: 'diagnostic', name: 'Diagnostic', duration: '~30 min' },
  { id: 'urgence', name: 'Urgence 24/7', duration: 'ASAP' },
]

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
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [selectedService, setSelectedService] = useState(preselectedService || '')
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    car: '',
    address: '',
    date: 'today',
    note: '',
  })
  const [errors, setErrors] = useState<ErrorState>({
    name: false,
    phone: false,
    car: false,
    address: false,
  })

  if (!isOpen) return null

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleSubmit = async () => {
    const newErrors: ErrorState = {
      name: !form.name.trim(),
      phone: !form.phone.trim(),
      car: !form.car.trim(),
      address: !form.address.trim(),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    const service = SERVICES.find((s) => s.id === selectedService)
    const dateLabel =
      form.date === 'today'
        ? "Aujourd'hui"
        : form.date === 'tomorrow'
        ? 'Demain'
        : form.date

    const msg =
      `Bonjour MecaLIK\n\n` +
      `*Nouvelle demande de devis*\n\n` +
      `Service: ${service?.name}\n` +
      `Nom: ${form.name}\n` +
      `Telephone: ${form.phone}\n` +
      `Voiture: ${form.car}\n` +
      `Lieu: ${form.address}\n` +
      `Date: ${dateLabel}` +
      (form.note ? `\nNote: ${form.note}` : '') +
      `\n\nMerci !`

    const url = 'https://wa.me/212667101341?text=' + encodeURIComponent(msg)

    setSubmitting(true)
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user?.id || null,
        service_name: selectedService,
        address: form.address,
        notes_admin: form.note || null,
        preferred_date: form.date === 'tomorrow'
          ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
          : null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Booking insert error:', insertError.message, insertError.code)
    }

    console.log('Booking created:', newBooking)

    setSubmitting(false)

    if (newBooking && user) {
      window.open(url, '_blank')
      onClose()
      setTimeout(() => {
        navigate('/booking/' + newBooking.id)
      }, 500)
    } else {
      window.open(url, '_blank')
      onClose()
    }
  }

  const selectedServiceData = SERVICES.find((s) => s.id === selectedService)

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
  const inputError: React.CSSProperties = {
    ...inputBase,
    border: '1px solid #FF4444',
  }

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
          background: '#0F0F0F',
          border: '1px solid rgba(255,255,255,0.08)',
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
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step >= 1 ? '#43BCC9' : 'rgba(255,255,255,0.08)',
                color: step >= 1 ? '#080808' : 'rgba(255,255,255,0.4)',
              }}
            >
              1
            </div>
            <span className="text-xs" style={{ color: step === 1 ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
              Service
            </span>
          </div>

          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step === 2 ? '#43BCC9' : 'rgba(255,255,255,0.08)',
                color: step === 2 ? '#080808' : 'rgba(255,255,255,0.4)',
              }}
            >
              2
            </div>
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
                {SERVICES.map((s) => {
                  const active = selectedService === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s.id)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200"
                      style={{
                        border: active ? '1px solid #43BCC9' : '1px solid rgba(255,255,255,0.06)',
                        background: active ? 'rgba(67,188,201,0.08)' : '#141414',
                      }}
                    >
                      <div
                        className="text-sm font-semibold"
                        style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.7)' }}
                      >
                        {s.name}
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: active ? '#43BCC9' : 'rgba(255,255,255,0.35)' }}
                      >
                        {s.duration}
                      </div>
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
                  background: selectedService ? '#43BCC9' : 'rgba(255,255,255,0.08)',
                  color: selectedService ? '#080808' : 'rgba(255,255,255,0.25)',
                  cursor: selectedService ? 'pointer' : 'not-allowed',
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
              {/* Back + service pill */}
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                ← {selectedServiceData?.name}
              </button>

              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: 'rgba(67,188,201,0.08)',
                  border: '1px solid rgba(67,188,201,0.2)',
                }}
              >
                <span className="text-xs font-medium" style={{ color: '#43BCC9' }}>
                  {selectedServiceData?.name} · {selectedServiceData?.duration}
                </span>
              </div>

              {/* Name */}
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
                    onChange={(e) => updateField('name', e.target.value)}
                    style={errors.name ? inputError : inputBase}
                  />
                </div>
                {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* Phone */}
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
                    onChange={(e) => updateField('phone', e.target.value)}
                    style={errors.phone ? inputError : inputBase}
                  />
                </div>
                {errors.phone && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* Car */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Voiture *
                </label>
                <div className="relative">
                  <Car size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Dacia Logan 2019"
                    value={form.car}
                    onChange={(e) => updateField('car', e.target.value)}
                    style={errors.car ? inputError : inputBase}
                  />
                </div>
                {errors.car && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* Address */}
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
                    onChange={(e) => updateField('address', e.target.value)}
                    style={errors.address ? inputError : inputBase}
                  />
                </div>
                {errors.address && <p className="text-xs mt-1" style={{ color: '#FF4444' }}>Champ obligatoire</p>}
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Date souhaitée
                </label>
                <div className="relative">
                  <Calendar size={16} color="rgba(255,255,255,0.25)" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={form.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    style={{ ...inputBase, appearance: 'none' as const }}
                  >
                    <option value="today">{"Aujourd'hui — dès que possible"}</option>
                    <option value="tomorrow">Demain matin</option>
                    <option value="choose">Choisir une date</option>
                  </select>
                </div>
              </div>

              {/* Note */}
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
                    onChange={(e) => updateField('note', e.target.value)}
                    style={{
                      ...inputBase,
                      padding: '14px 16px 14px 40px',
                      resize: 'none',
                    }}
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
                  color: '#080808',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Envoi...' : <><span>Envoyer sur WhatsApp</span><ChevronRight size={18} /></>}
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
