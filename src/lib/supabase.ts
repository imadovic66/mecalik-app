import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Car = {
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'mechanic' | 'admin' | 'fleet_manager'
          company_id: string | null
          created_at: string
        }
      }
      cars: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          plate: string | null
          created_at: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          car_id: string | null
          service: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          address: string
          scheduled_at: string | null
          price: number | null
          notes: string | null
          created_at: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
        }
      }
    }
  }
}
