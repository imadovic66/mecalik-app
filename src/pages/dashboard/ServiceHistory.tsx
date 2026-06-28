import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ChevronLeft, Plus, Wrench } from 'lucide-react'
import { Home, Clock as ClockIcon, Car as CarIcon, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Car {
  id: string
  brand: string
  model: string
  year: number | null
  license_plate: string | null
  is_primary: boolean
}

interface ServiceEntry {
  id: string
  car_id: string
  service_name: string
  service_date: string
  mileage: number | null
  provider: string | null
  cost: number | null
  notes: string | null
  source: 'mecalik' | 'external'
}

export default function ServiceHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [cars, setCars] = useState<Car[]>([])
  const [history, setHistory] = useState<ServiceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    car_id: '',
    service_name: '',
    service_date: new Date().toISOString().substring(0, 10),
    mileage: '',
    provider: '',
    cost: '',
    notes: '',
  })

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const [{ data: carsData }, { data: historyData }] = await Promise.all([
        supabase.from('cars').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
        supabase.from('service_history').select('*').eq('user_id', user.id).order('service_date', { ascending: false }),
      ])
      setCars(carsData ?? [])
      setHistory(historyData ?? [])
      if (carsData && carsData.length > 0) {
        setNewEntry(prev => ({ ...prev, car_id: carsData[0].id }))
      }
      setLoading(false)
    })()
  }, [user])

  const getCarLabel = (carId: string) => {
    const car = cars.find(c => c.id === carId)
    if (!car) return 'Véhicule inconnu'
    return `${car.brand} ${car.model}${car.license_plate ? ` (${car.license_plate})` : ''}`
  }

  const handleAdd = async () => {
    if (!user || !newEntry.car_id || !newEntry.service_name || !newEntry.service_date) return
    const { data, error } = await supabase.from('service_history').insert({
      car_id: newEntry.car_id,
      user_id: user.id,
      service_name: newEntry.service_name,
      service_date: newEntry.service_date,
      mileage: newEntry.mileage ? parseInt(newEntry.mileage) : null,
      provider: newEntry.provider || null,
      cost: newEntry.cost ? parseFloat(newEntry.cost) : null,
      notes: newEntry.notes || null,
      source: 'external',
    }).select().single()

    if (error) { alert('Erreur: ' + error.message); return }

    setHistory(prev => [data as ServiceEntry, ...prev])
    setNewEntry({
      car_id: cars[0]?.id || '',
      service_name: '',
      service_date: new Date().toISOString().substring(0, 10),
      mileage: '', provider: '', cost: '', notes: '',
    })
    setShowModal(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: '5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '480px', background: '#0A0A0A',
        minHeight: '100vh', position: 'relative', paddingBottom: '90px',
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ═══ TOP BAR ═══ */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <button onClick={() => navigate('/dashboard')} style={{
            width: '36px', height: '36px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '17px', fontWeight: 600, color: 'white', letterSpacing: '-0.01em' }}>
              Historique service
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {history.length} service{history.length !== 1 ? 's' : ''} enregistré{history.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={cars.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: cars.length === 0 ? 'rgba(255,255,255,0.04)' : '#43BCC9',
              color: cars.length === 0 ? 'rgba(255,255,255,0.3)' : '#0A0A0A',
              border: 'none', padding: '8px 14px', borderRadius: '10px',
              fontSize: '12px', fontWeight: 600, cursor: cars.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ padding: '20px 18px' }}>

          {cars.length === 0 && !loading && (
            <div style={{
              padding: '16px', borderRadius: '12px',
              background: 'rgba(240,192,64,0.06)', border: '1px solid rgba(240,192,64,0.2)',
              fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', lineHeight: 1.5,
            }}>
              Ajoutez d'abord un véhicule pour enregistrer un historique de services.
            </div>
          )}

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              Chargement…
            </div>
          ) : history.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.08)', marginTop: '8px',
            }}>
              <Wrench size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Aucun service enregistré</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', lineHeight: 1.5 }}>
                Ajoutez vos services passés (autres garages, DIY) pour un suivi complet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(entry => (
                <div key={entry.id} style={{
                  padding: '14px 16px', borderRadius: '12px',
                  background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{entry.service_name}</span>
                      {entry.source === 'mecalik' ? (
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(67,188,201,0.15)', color: '#43BCC9', fontWeight: 700, letterSpacing: '0.05em' }}>MECALIK</span>
                      ) : (
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.05em' }}>EXTERNE</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>
                      🚗 {getCarLabel(entry.car_id)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(entry.service_date).toLocaleDateString('fr-MA')}
                      {entry.mileage ? ` · ${entry.mileage.toLocaleString('fr-FR')} km` : ''}
                      {entry.provider ? ` · ${entry.provider}` : ''}
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '5px', fontStyle: 'italic' }}>
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {entry.cost != null && (
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{entry.cost} MAD</div>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm('Supprimer cet historique ?')) return
                        await supabase.from('service_history').delete().eq('id', entry.id)
                        setHistory(prev => prev.filter(e => e.id !== entry.id))
                      }}
                      style={{
                        display: 'block', marginTop: '6px', background: 'none', border: 'none',
                        color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '11px', padding: 0,
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ BOTTOM TAB BAR ═══ */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 18px 22px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', zIndex: 50,
        }}>
          {([
            { Icon: Home,      labelKey: 'nav.home',        active: false, onClick: () => navigate('/dashboard') },
            { Icon: ClockIcon, labelKey: 'customer.history', active: false, onClick: () => navigate('/dashboard/historique') },
            { Icon: CarIcon,   labelKey: 'customer.myCars',  active: false, onClick: () => navigate('/dashboard/voitures') },
            { Icon: User,      labelKey: 'customer.profile', active: false, onClick: () => navigate('/dashboard/profil') },
          ] as const).map(({ Icon, labelKey, active, onClick }, i) => (
            <button key={i} onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: active ? '6px 14px' : '4px', borderRadius: '10px',
                background: active ? 'rgba(67,188,201,0.1)' : 'transparent',
              }}>
                <Icon size={20} color={active ? '#43BCC9' : 'rgba(255,255,255,0.4)'} />
                <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400, color: active ? '#43BCC9' : 'rgba(255,255,255,0.4)' }}>
                  {t(labelKey)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* ═══ ADD MODAL ═══ */}
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <div onClick={e => e.stopPropagation()} style={{ background: '#111114', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>🔧 Ajouter un service</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Véhicule *</label>
                  <select
                    value={newEntry.car_id}
                    onChange={e => setNewEntry(prev => ({ ...prev, car_id: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {cars.map(car => (
                      <option key={car.id} value={car.id} style={{ background: '#111114' }}>
                        {car.brand} {car.model}{car.license_plate ? ` (${car.license_plate})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {([
                  { label: 'Service effectué *', field: 'service_name', type: 'text',   placeholder: 'Ex: Vidange, Frein, Pneus...' },
                  { label: 'Date *',             field: 'service_date', type: 'date',   placeholder: '' },
                  { label: 'Kilométrage',        field: 'mileage',      type: 'number', placeholder: 'Ex: 85000' },
                  { label: 'Prestataire',        field: 'provider',     type: 'text',   placeholder: 'Ex: Garage XYZ, Soi-même...' },
                  { label: 'Coût (MAD)',         field: 'cost',         type: 'number', placeholder: 'Ex: 250' },
                  { label: 'Notes',              field: 'notes',        type: 'text',   placeholder: 'Détails optionnels...' },
                ] as { label: string; field: string; type: string; placeholder: string }[]).map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type={type}
                      value={(newEntry as Record<string, string>)[field]}
                      placeholder={placeholder}
                      onChange={e => setNewEntry(prev => ({ ...prev, [field]: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                ))}
                <button
                  onClick={handleAdd}
                  disabled={!newEntry.car_id || !newEntry.service_name || !newEntry.service_date}
                  style={{
                    marginTop: '6px', padding: '12px', borderRadius: '8px',
                    background: '#43BCC9', border: 'none', color: '#0A0A0A',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Ajouter à l'historique
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
