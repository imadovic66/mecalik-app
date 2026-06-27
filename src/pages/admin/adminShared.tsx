/** Shared types, constants, and components used across AdminDashboard tabs */

import { useTranslation } from 'react-i18next'

export type BookingStatus = 'pending' | 'confirmed' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled'

export type ServiceDetail = {
  type: 'product' | 'part' | 'labor'
  name: string
  brand?: string
  reference?: string
  quantity?: string
  unit_price?: number
  total_price?: number
  photo_url?: string | null
  notes?: string | null
}

export type Booking = {
  id: string
  user_id: string | null
  service_name: string
  status: BookingStatus
  address: string
  preferred_date: string | null
  amount_ttc: number | null
  notes_admin: string | null
  rating: number | null
  rating_comment: string | null
  technician_name: string | null
  created_at: string
  service_details?: ServiceDetail[] | null
  profiles?: { full_name: string | null; phone: string | null }
}

export type Customer = {
  id: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
}

export type Review = {
  id: string
  booking_id: string
  customer_id: string
  service_type: string | null
  rating: number
  comment: string | null
  is_visible: boolean
  created_at: string
  profiles?: { full_name: string | null }
}

export type FinanceBooking = {
  id: string
  amount_ttc: number
  service_name: string
  created_at: string
  company_id: string | null
  service_details?: ServiceDetail[] | null
}

export type Tab = 'overview' | 'bookings' | 'customers' | 'finances' | 'reviews' | 'notifications'

export const STATUS_CONFIG = {
  pending:     { label: 'En attente',          color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.25)'  },
  confirmed:   { label: 'Confirmé',            color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  on_the_way:  { label: 'Mécanicien en route', color: '#F0C040', bg: 'rgba(240,192,64,0.1)',  border: 'rgba(240,192,64,0.25)'  },
  in_progress: { label: 'En cours',            color: '#43BCC9', bg: 'rgba(67,188,201,0.1)',  border: 'rgba(67,188,201,0.25)'  },
  completed:   { label: 'Terminé',             color: '#00DD88', bg: 'rgba(0,221,136,0.1)',   border: 'rgba(0,221,136,0.25)'   },
  cancelled:   { label: 'Annulé',              color: '#FF4444', bg: 'rgba(255,68,68,0.1)',   border: 'rgba(255,68,68,0.25)'   },
}

export const STATUS_COLORS: Record<string, string> = {
  pending:     '#F0C040',
  confirmed:   '#43BCC9',
  on_the_way:  '#F0C040',
  in_progress: '#43BCC9',
  completed:   '#00DD88',
  cancelled:   '#FF4444',
}

export const STATUS_KEYS = ['pending', 'confirmed', 'on_the_way', 'in_progress', 'completed', 'cancelled'] as const

export function getGuestLabel(booking: { user_id: string | null; notes_admin: string | null; profiles?: { full_name: string | null } | undefined }): string {
  if (booking.profiles?.full_name) return booking.profiles.full_name
  if (!booking.user_id && booking.notes_admin) {
    const m = booking.notes_admin.match(/Nom:\s*([^|]+)/)
    if (m) return m[1].trim()
  }
  return 'Anonyme'
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {t(`status.${status}`)}
    </span>
  )
}
