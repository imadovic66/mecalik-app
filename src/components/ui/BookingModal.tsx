import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowLeft, Phone, MapPin, User, Car as CarIcon, MessageCircle, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase, type Car } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { SERVICES, getPrice } from '../../data/pricing'

const SERVICE_OPTIONS = [
  { id: 'lavage',     duration: '~45 min' },
  { id: 'vidange',    duration: '~60 min' },
  { id: 'batterie',   duration: '~30 min' },
  { id: 'pneus',      duration: '~45 min' },
  { id: 'diagnostic', duration: '~30 min' },
  { id: 'urgence',    duration: 'ASAP' },
]

export default function BookingModal() {
  const { user, profile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [isOpen, setIsOpen]                 = useState(false)
  const [step, setStep]                     = useState(1)
  const [selectedService, setSelectedService] = useState<string>('')
  const [name, setName]                     = useState('')
  const [phone, setPhone]                   = useState('')
  const [address, setAddress]               = useState('')
  const [addressNotes, setAddressNotes]     = useState('')
  const [cars, setCars]                     = useState<Car[]>([])
  const [selectedCarId, setSelectedCarId]   = useState<string>('')
  const [submitting, setSubmitting]         = useState(false)
  const [error, setError]                   = useState('')

  // Listen for openBooking events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ service?: string }>).detail
      setIsOpen(true)
      setError('')
      if (detail?.service) {
        setSelectedService(detail.service.toLowerCase())
        setStep(2)
      } else {
        setStep(1)
      }
    }
    window.addEventListener('openBooking', handler)
    return () => window.removeEventListener('openBooking', handler)
  }, [])

  // Load user info + cars when modal opens
  useEffect(() => {
    if (!user || !isOpen) return
    if (profile?.full_name) setName(profile.full_name)
    if (profile?.phone)     setPhone(profile.phone)

    supabase
      .from('cars')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .then(({ data }) => {
        const list = data ?? []
        setCars(list)
        if (list.length > 0 && !selectedCarId) {
          setSelectedCarId(list[0].id)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, isOpen])

  if (!isOpen) return null

  const close = () => {
    setIsOpen(false)
    setStep(1)
    setSelectedService('')
    setError('')
  }

  const buildWhatsAppMessage = () => {
    const selectedCar = cars.find(c => c.id === selectedCarId)
    const carInfo = selectedCar
      ? `${selectedCar.brand} ${selectedCar.model}${selectedCar.year ? ' ' + selectedCar.year : ''}${selectedCar.license_plate ? ' · ' + selectedCar.license_plate : ''}`
      : ''
    return (
      `Bonjour MecaLIK,\n\n` +
      `Je souhaite réserver:\n` +
      `Service: ${selectedService}\n` +
      (carInfo ? `Véhicule: ${carInfo}\n` : '') +
      `Adresse: ${address}\n` +
      (addressNotes ? `Précisions: ${addressNotes}\n` : '') +
      `Nom: ${name}\n` +
      `Téléphone: ${phone}\n\n` +
      `Merci !`
    )
  }

  const handleGuestBooking = async () => {
    if (!name || !phone || !address) { setError('Tous les champs marqués * sont obligatoires'); return }
    // Save guest booking to DB — no user_id, contact info stored in notes_admin
    try {
      await supabase.from('bookings').insert({
        service_name:  selectedService,
        address,
        address_notes: addressNotes || null,
        status:        'pending',
        notes_admin:   `Guest booking — Nom: ${name} | Tél: ${phone}`,
      })
    } catch (err) {
      console.error('Failed to save guest booking', err)
      // Don't block WhatsApp even if DB save fails
    }
    window.open(`https://wa.me/212777348065?text=${encodeURIComponent(buildWhatsAppMessage())}`, '_blank')
    close()
  }

  const handleCreateAccount = () => {
    if (!name || !phone || !address) { setError('Tous les champs marqués * sont obligatoires'); return }
    window.open(`https://wa.me/212777348065?text=${encodeURIComponent(buildWhatsAppMessage())}`, '_blank')
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      service: selectedService, name, phone, address, notes: addressNotes || '',
    }))
    close()
    window.location.href = '/signup?from=booking'
  }

  const goToStep2 = () => {
    if (!selectedService) {
      setError('Veuillez choisir un service')
      return
    }
    setError('')
    setStep(2)
  }

  const submit = async () => {
    if (!name || !phone || !address) {
      setError('Tous les champs marqués * sont obligatoires')
      return
    }
    // Guard: must be authenticated so user_id is never null
    if (!user) {
      close()
      navigate('/login')
      return
    }
    setSubmitting(true)
    setError('')

    const selectedCar = cars.find(c => c.id === selectedCarId)
    const carInfo = selectedCar
      ? `${selectedCar.brand} ${selectedCar.model}${selectedCar.year ? ' ' + selectedCar.year : ''}${selectedCar.license_plate ? ' · ' + selectedCar.license_plate : ''}`
      : ''

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id:       user.id,
        car_id:        selectedCarId || null,
        service_name:  selectedService,
        address,
        address_notes: addressNotes || null,
        status:        'pending',
      })
      .select()
      .single()

    if (insertError) {
      setSubmitting(false)
      setError('Erreur: ' + insertError.message)
      return
    }

    const message = encodeURIComponent(
      `Bonjour MecaLIK,\n\n` +
      `Je souhaite réserver:\n` +
      `Service: ${selectedService}\n` +
      (carInfo ? `Véhicule: ${carInfo}\n` : '') +
      `Adresse: ${address}\n` +
      (addressNotes ? `Précisions: ${addressNotes}\n` : '') +
      `Nom: ${name}\n` +
      `Téléphone: ${phone}\n\n` +
      `Référence: ${(booking as { reference?: string } | null)?.reference ?? ''}\n\n` +
      `Merci !`
    )
    window.open(`https://wa.me/212777348065?text=${message}`, '_blank')

    setSubmitting(false)
    close()

    if (user && booking?.id) {
      navigate(`/booking/${booking.id}`)
    }
  }

  const canSubmit = !submitting && !!name && !!phone && !!address

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          animation: 'bmFadeIn 0.2s ease',
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '92vh',
        background: '#0A0A0A',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        zIndex: 101,
        animation: 'bmSlideUp 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
      }}>

        {/* Drag handle */}
        <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '8px 20px 16px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setError('') }}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '0 0 6px 0', marginLeft: '-2px',
                }}
              >
                <ArrowLeft size={13} />
                {t('booking.changeService')}
              </button>
            )}
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: '20px', fontWeight: 600, color: 'white',
              letterSpacing: '-0.015em', marginBottom: '2px',
            }}>
              {step === 1 ? t('booking.chooseService') : t('booking.title')}
            </h2>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {step === 1 ? t('booking.chooseService') : t('booking.whatsappResponse')}
            </div>
          </div>
          <button
            onClick={close}
            style={{
              width: '32px', height: '32px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '6px',
          flexShrink: 0,
        }}>
          <div style={{
            flex: step === 1 ? 1 : 0.3,
            height: '3px', background: '#43BCC9',
            borderRadius: '2px', transition: 'flex 0.3s',
          }} />
          <div style={{
            flex: step === 2 ? 1 : 0.3,
            height: '3px',
            background: step === 2 ? '#43BCC9' : 'rgba(255,255,255,0.1)',
            borderRadius: '2px', transition: 'all 0.3s',
          }} />
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>

          {/* ── STEP 1 — service selection ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SERVICE_OPTIONS.map(svc => {
                const isSelected     = selectedService === svc.id
                const pricingService = SERVICES.find(s => s.id === svc.id)
                const price          = pricingService && !pricingService.contactOnly
                  ? getPrice(pricingService, 'zone1')
                  : null
                const isUrgent = svc.id === 'urgence'

                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc.id)}
                    style={{
                      width: '100%', padding: '16px',
                      background: isSelected ? 'rgba(67,188,201,0.08)' : '#0F0F0F',
                      border: isSelected
                        ? '1.5px solid rgba(67,188,201,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: isSelected ? 'rgba(67,188,201,0.15)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1px solid rgba(67,188,201,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected ? (
                        <Check size={16} color="#43BCC9" />
                      ) : (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: isUrgent ? 'rgba(255,68,68,0.6)' : 'rgba(255,255,255,0.2)',
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: 'white', marginBottom: '2px' }}>
                        {t('services.' + svc.id)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '8px' }}>
                        <span>{svc.duration}</span>
                        {price && !isUrgent && (
                          <>
                            <span>·</span>
                            <span>Dès {price}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── STEP 2 — user info ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Service chip */}
              {selectedService && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 14px', borderRadius: '10px',
                  background: 'rgba(67,188,201,0.08)',
                  border: '1px solid rgba(67,188,201,0.2)',
                  alignSelf: 'flex-start',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#43BCC9', display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: '#43BCC9', fontWeight: 600 }}>
                    {t('services.' + selectedService)}
                  </span>
                </div>
              )}

              {/* Name */}
              <FieldLabel>{t('booking.fullName')} *</FieldLabel>
              <FieldWrapper icon={<User size={14} color="rgba(255,255,255,0.4)" />}>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('booking.fullNamePlaceholder')}
                  style={inputStyle}
                />
              </FieldWrapper>

              {/* Phone */}
              <FieldLabel>{t('common.phone')} *</FieldLabel>
              <FieldWrapper icon={<Phone size={14} color="rgba(255,255,255,0.4)" />}>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="06 XX XX XX XX"
                  style={inputStyle}
                />
              </FieldWrapper>

              {/* Vehicle */}
              {cars.length > 0 && (
                <>
                  <FieldLabel>{t('booking.vehicle')}</FieldLabel>
                  <FieldWrapper icon={<CarIcon size={14} color="rgba(255,255,255,0.4)" />}>
                    <select
                      value={selectedCarId}
                      onChange={e => setSelectedCarId(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {cars.map(car => (
                        <option key={car.id} value={car.id} style={{ background: '#111111' }}>
                          {car.brand} {car.model}{car.year ? ` ${car.year}` : ''}{car.license_plate ? ` · ${car.license_plate}` : ''}
                        </option>
                      ))}
                    </select>
                  </FieldWrapper>
                </>
              )}

              {/* Address */}
              <FieldLabel>{t('booking.address')} *</FieldLabel>
              <FieldWrapper icon={<MapPin size={14} color="rgba(255,255,255,0.4)" />}>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('booking.addressPlaceholder')}
                  style={inputStyle}
                />
              </FieldWrapper>

              {/* Address notes */}
              <FieldLabel>{t('booking.addressNotes')}</FieldLabel>
              <textarea
                value={addressNotes}
                onChange={e => setAddressNotes(e.target.value)}
                placeholder={t('booking.addressNotesPlaceholder')}
                rows={2}
                style={{
                  ...inputStyle,
                  padding: '12px 14px',
                  resize: 'none',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '14px', padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.18)',
              color: '#FF6B6B', fontSize: '12px',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: '14px 20px 28px',
          background: '#0A0A0A',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          {step === 1 && (
            <button
              onClick={goToStep2}
              disabled={!selectedService}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '12px', border: 'none',
                background: selectedService ? 'white' : 'rgba(255,255,255,0.06)',
                color:      selectedService ? '#080808' : 'rgba(255,255,255,0.3)',
                fontSize: '15px', fontWeight: 600,
                cursor: selectedService ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              Continuer
            </button>
          )}

          {step === 2 && (
            user ? (
              /* Logged-in: save to DB + WhatsApp (existing flow) */
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background: canSubmit ? '#00DD88' : 'rgba(255,255,255,0.06)',
                  color:      canSubmit ? '#0A0A0A' : 'rgba(255,255,255,0.3)',
                  fontSize: '15px', fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.15s',
                }}
              >
                {submitting ? t('common.loading') : (
                  <>
                    <MessageCircle size={16} />
                    {t('booking.submitWhatsapp')}
                  </>
                )}
              </button>
            ) : (
              /* Guest: two-option layout */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('booking.chooseOption')}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>

                <button
                  onClick={handleGuestBooking}
                  disabled={!canSubmit}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    background: canSubmit ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: canSubmit ? 'white' : 'rgba(255,255,255,0.3)',
                    fontSize: '14px', fontWeight: 600,
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: 'inherit',
                  }}
                >
                  <span>💬</span>
                  {t('booking.continueAsGuest')}
                </button>

                <button
                  onClick={handleCreateAccount}
                  disabled={!canSubmit}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    background: canSubmit ? '#43BCC9' : 'rgba(67,188,201,0.3)',
                    border: 'none',
                    color: '#0A0A0A', fontSize: '14px', fontWeight: 700,
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: 'inherit', marginTop: '8px',
                  }}
                >
                  <span>✦</span>
                  {t('booking.createAccountAndBook')}
                </button>

                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '8px 0 0' }}>
                  {t('booking.accountBenefit')}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes bmFadeIn  { from { opacity: 0 }             to { opacity: 1 } }
        @keyframes bmSlideUp { from { transform: translate(-50%, 100%) } to { transform: translate(-50%, 0) } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        input:focus, select:focus, textarea:focus { outline: none; }
        select option { background: #111111 !important; color: white !important; }
      `}</style>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.45)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '-8px', marginTop: '4px',
    }}>
      {children}
    </div>
  )
}

function FieldWrapper({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      paddingLeft: '14px', gap: '10px',
    }}>
      {icon}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  padding: '12px 14px 12px 0',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
}
