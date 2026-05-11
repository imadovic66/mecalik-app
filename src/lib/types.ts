/** Shared TypeScript types used across dashboards and pages */

import type { BookingStatus } from './constants'

/** A booking record from the database */
export interface Booking {
  id: string
  reference: string
  service_name: string | null
  status: BookingStatus
  address: string | null
  address_notes?: string | null
  user_id: string | null
  company_id: string | null
  fleet_vehicle_id?: string | null
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

/** A user profile record from the database */
export interface Profile {
  id: string
  full_name: string | null
  first_name?: string | null
  last_name?: string | null
  email: string | null
  phone: string | null
  role: 'customer' | 'mechanic' | 'admin' | 'fleet manager'
  company_id: string | null
  push_token?: string | null
  push_subscription?: string | null
  referral_code?: string | null
  created_at: string
}

/** A car record from the database */
export interface Car {
  id: string
  user_id: string
  brand: string
  model: string
  year: number | null
  license_plate: string | null
  mileage?: number | null
  color?: string | null
  fuel_type: string | null
  is_primary: boolean
  photo_url?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string
}

/** Service option shown in the booking modal */
export interface ServiceOption {
  id: string
  label: string
  description?: string
  price?: string
  duration?: string
  icon?: string
}

/** Form data collected during booking flow */
export interface BookingFormData {
  name: string
  phone: string
  address: string
  notes: string
}
