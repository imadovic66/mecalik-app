import { useState, useEffect } from 'react'
import { X, Car as CarIcon } from 'lucide-react'
import { supabase, type Car } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingCar?: Car | null
}

const POPULAR_BRANDS = [
  'Dacia', 'Renault', 'Peugeot', 'Hyundai', 'Volkswagen',
  'Toyota', 'Ford', 'Citroën', 'Fiat', 'Kia',
  'Mercedes', 'BMW', 'Audi', 'Autre',
]
const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique']

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#111111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '12px 14px',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.4)',
  display: 'block',
  marginBottom: '6px',
  textTransform: 'uppercase',
}

export default function AddCarModal({ isOpen, onClose, onSuccess, editingCar }: Props) {
  const { user } = useAuth()
  const [brand, setBrand]       = useState('')
  const [model, setModel]       = useState('')
  const [year, setYear]         = useState('')
  const [plate, setPlate]       = useState('')
  const [mileage, setMileage]   = useState('')
  const [fuelType, setFuelType] = useState('Diesel')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Pre-fill when editing, reset when adding
  useEffect(() => {
    if (editingCar) {
      setBrand(editingCar.brand)
      setModel(editingCar.model)
      setYear(editingCar.year?.toString() || '')
      setPlate(editingCar.license_plate || '')
      setMileage(editingCar.mileage?.toString() || '')
      setFuelType(editingCar.fuel_type || 'Diesel')
    } else {
      setBrand(''); setModel(''); setYear('')
      setPlate(''); setMileage(''); setFuelType('Diesel')
    }
    setError('')
  }, [editingCar, isOpen])

  if (!isOpen) return null

  const handleClose = () => { setError(''); onClose() }

  const handleSubmit = async () => {
    if (!user || !brand || !model) {
      setError('Marque et modèle obligatoires')
      return
    }
    setLoading(true)
    setError('')

    const payload = {
      user_id:       user.id,
      brand,
      model,
      year:          year    ? parseInt(year)    : null,
      license_plate: plate   || null,
      mileage:       mileage ? parseInt(mileage) : null,
      fuel_type:     fuelType,
    }

    const result = editingCar
      ? await supabase.from('cars').update(payload).eq('id', editingCar.id)
      : await supabase.from('cars').insert({ ...payload, is_primary: false })

    setLoading(false)
    if (result.error) {
      setError('Erreur : ' + result.error.message)
      return
    }
    onSuccess()
    onClose()
  }

  const canSubmit = !loading && !!brand && !!model

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0D0D0D',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.05)', border: 'none',
            borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} color="rgba(255,255,255,0.6)" />
        </button>

        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'rgba(67,188,201,0.1)', border: '1px solid rgba(67,188,201,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <CarIcon size={22} color="var(--mk-action)" />
        </div>

        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '22px', fontWeight: 600, color: 'white',
          letterSpacing: '-0.02em', marginBottom: '6px',
        }}>
          {editingCar ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '28px' }}>
          {editingCar
            ? 'Mettez à jour les informations de votre véhicule'
            : 'Enregistrez votre voiture pour des réservations en un tap'}
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Brand */}
          <div>
            <label style={labelStyle}>Marque *</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle}>
              <option value="">Sélectionner...</option>
              {POPULAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Model */}
          <div>
            <label style={labelStyle}>Modèle *</label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="Ex: Logan, Clio, Sandero..."
              style={inputStyle}
            />
          </div>

          {/* Year + Plate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Année</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="2020"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Immatriculation</label>
              <input
                value={plate}
                onChange={e => setPlate(e.target.value)}
                placeholder="12345-A-1"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Mileage + Fuel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Kilométrage</label>
              <input
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                placeholder="120000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Carburant</label>
              <select value={fuelType} onChange={e => setFuelType(e.target.value)} style={inputStyle}>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '8px', color: 'var(--mk-urgent)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: '24px', width: '100%',
            background: canSubmit ? 'white' : 'rgba(255,255,255,0.06)',
            color:      canSubmit ? '#080808' : 'rgba(255,255,255,0.25)',
            padding: '14px', borderRadius: '10px', border: 'none',
            fontSize: '14px', fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {loading ? 'Enregistrement...' : editingCar ? 'Enregistrer' : 'Ajouter le véhicule'}
        </button>
      </div>
    </div>
  )
}
