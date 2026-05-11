/** Shared TypeScript types used across dashboards and pages */

import type { BookingStatus } from './constants'

export interface Booking {
  id: string
  reference: string | null
  service_name: string | null
  status: BookingStatus
  address: string | null
  address_notes?: string | null
  user_id: string | null
  company_id: string | null
  technician_name: string | null
  technician_phone: string | null
  amount_ht: number | null
  tva: number | null
  amount_ttc: number | null
  rating: number | null
  rating_comment: string | null
  notes_admin: string | null
  created_at: string
  confirmed_at: string | null
  completed_at: string | null
  preferred_date?: string | null
  profiles?: { full_name: string | null; phone: string | null }
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: 'customer' | 'mechanic' | 'admin' | 'fleet_manager'
  company_id: string | null
  created_at: string
}

export interface Car {
  id: string
  user_id: string
  brand: string
  model: string
  year: number | null
  license_plate: string | null
  mileage: number | null
  color: string | null
  fuel_type: string | null
  is_primary: boolean
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
