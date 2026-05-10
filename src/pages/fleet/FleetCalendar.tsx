import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay,
  locales: { 'fr': fr },
})

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource?: {
    vehicle_id: string
    vehicle_name: string
    service_type: string
    status: string
  }
}

type Vehicle = {
  id: string
  brand: string
  model: string
  year: number
  plate: string | null
}

export default function FleetCalendar() {
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    vehicle_id: '',
    service_type: 'vidange',
    date: '',
    notes: '',
  })
  useEffect(() => {
    if (profile?.company_id) {
      fetchVehicles()
      fetchEvents()
    }
  }, [profile])

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('company_id', profile!.company_id!)
    setVehicles(data || [])
  }

  const fetchEvents = async () => {
    setEvents([])
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setNewEvent(prev => ({
      ...prev,
      date: start.toISOString().split('T')[0],
    }))
    setShowAddEvent(true)
  }

  const saveEvent = () => {
    if (!newEvent.vehicle_id || !newEvent.date) return
    const vehicle = vehicles.find(v => v.id === newEvent.vehicle_id)
    const serviceLabel = SERVICE_TYPES.find(s => s.value === newEvent.service_type)?.label ?? newEvent.service_type
    const msg = `Bonjour MecaLIK, je souhaite planifier un service pour:\nVéhicule: ${vehicle?.brand} ${vehicle?.model} (${vehicle?.plate})\nService: ${serviceLabel}\nDate souhaitée: ${newEvent.date}`
    window.open('https://wa.me/212777348065?text=' + encodeURIComponent(msg), '_blank')
    setShowAddEvent(false)
    setNewEvent({ vehicle_id: '', service_type: 'vidange', date: '', notes: '' })
  }

  const SERVICE_TYPES = [
    { value: 'vidange',    label: t('services.vidange') },
    { value: 'pneus',      label: t('services.pneus') },
    { value: 'batterie',   label: t('services.batterie') },
    { value: 'diagnostic', label: t('services.diagnostic') },
    { value: 'lavage',     label: t('services.lavage') },
  ]

  return (
    <div className="h-full">
      <style>{`
        .rbc-calendar { background: transparent; color: rgba(255,255,255,0.88); font-family: 'Outfit', sans-serif; }
        .rbc-header { background: #141414; border-color: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.5); font-size: 12px; padding: 8px; }
        .rbc-month-view, .rbc-time-view { border-color: rgba(255,255,255,0.08) !important; background: #0F0F0F; border-radius: 16px; overflow: hidden; }
        .rbc-day-bg { border-color: rgba(255,255,255,0.06) !important; }
        .rbc-off-range-bg { background: rgba(255,255,255,0.02); }
        .rbc-today { background: rgba(240,192,64,0.05) !important; }
        .rbc-event { background: rgba(240,192,64,0.2) !important; border: 1px solid rgba(240,192,64,0.4) !important; color: #F0C040 !important; font-size: 11px; border-radius: 6px; }
        .rbc-event.rbc-selected { background: rgba(240,192,64,0.3) !important; }
        .rbc-show-more { color: #43BCC9; font-size: 11px; }
        .rbc-toolbar button { color: rgba(255,255,255,0.6); background: #141414; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-family: 'Outfit', sans-serif; }
        .rbc-toolbar button:hover { background: rgba(255,255,255,0.08); color: white; }
        .rbc-toolbar button.rbc-active { background: rgba(240,192,64,0.15); color: #F0C040; border-color: rgba(240,192,64,0.3); }
        .rbc-toolbar-label { color: white; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; }
        .rbc-date-cell { color: rgba(255,255,255,0.5); font-size: 12px; padding: 4px 8px; }
        .rbc-date-cell.rbc-now { color: #F0C040; font-weight: 700; }
        .rbc-month-row { border-color: rgba(255,255,255,0.06) !important; }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-semibold text-lg" style={{ color: 'white' }}>
            Planning de maintenance
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Cliquez sur un jour pour planifier un service
          </p>
        </div>
        <button
          onClick={() => setShowAddEvent(true)}
          className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm transition-colors"
          style={{ background: '#F0C040', color: '#080808' }}
        >
          <Plus size={16} />
          Planifier un service
        </button>
      </div>

      <div style={{ height: '560px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="fr"
          selectable
          onSelectSlot={handleSelectSlot}
          messages={{
            next: 'Suivant',
            previous: 'Précédent',
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
            noEventsInRange: 'Aucun service planifié',
          }}
        />
      </div>

      {showAddEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 mx-4"
            style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg" style={{ color: 'white' }}>
                Planifier un service
              </h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Véhicule *</label>
                <select
                  value={newEvent.vehicle_id}
                  onChange={e => setNewEvent(p => ({ ...p, vehicle_id: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.year}{v.plate ? ` (${v.plate})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Type de service</label>
                <select
                  value={newEvent.service_type}
                  onChange={e => setNewEvent(p => ({ ...p, service_type: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                >
                  {SERVICE_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Date prévue *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddEvent(false)}
                className="flex-1 py-3 rounded-full text-sm font-medium"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              >
                Annuler
              </button>
              <button
                onClick={saveEvent}
                className="flex-1 py-3 rounded-full text-sm font-bold transition-colors"
                style={{ background: '#F0C040', color: '#080808' }}
              >
                Envoyer sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
