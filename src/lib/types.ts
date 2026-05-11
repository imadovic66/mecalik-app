import type { BookingStatus } from './constants'

/** A booking record from the bookings table */
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
}

/** A user profile from the profiles table */
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
  created_at: string
}

/** A vehicle registered by a customer */
export interface Car {
  id: string
  user_id: string
  brand: string
  model: string
  year: number | null
  license_plate: string | null
  fuel_type: string | null
  is_primary: boolean
  created_at: string
}

/** Form data collected in the booking modal */
export interface BookingFormData {
  name: string
  phone: string
  address: string
  notes: string
}

/** A service option shown in booking modal step 1 */
export interface ServiceOption {
  id: string
  label: string
  description?: string
  price?: string
  duration?: string
  icon?: string
}
