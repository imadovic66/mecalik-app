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
  review_token: string | null
  review_requested_at: string | null
  review_submitted_at: string | null
  reviewer_name: string | null
  admin_response: string | null
  is_hidden: boolean | null
  quote_submitted_at: string | null
  quote_submitted_by: string | null
  quote_approved_at: string | null
  quote_approved_by: string | null
  quote_sent_at: string | null
  quote_feedback: string | null
  quote_reference: string | null
}

/** A row from the `public_reviews` view — the public-safe, non-hidden subset of reviewed bookings */
export interface PublicReview {
  id: string
  reference: string | null
  service_name: string | null
  rating: number
  rating_comment: string | null
  reviewer_name: string | null
  review_submitted_at: string
  admin_response: string | null
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
