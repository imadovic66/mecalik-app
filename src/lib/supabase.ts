import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nggvlwiisvvjczpyccfj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZ3Zsd2lpc3Z2amN6cHljY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTA3ODksImV4cCI6MjA5MDYyNjc4OX0.qjYAD4YVjEMANIVXfvfbj5O6VvkXqagwZIo_6sbrQ6Y'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  if (import.meta.env.DEV) console.warn('Missing Supabase env vars — check .env file')
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
          status: 'pending' | 'confirmed' | 'on_the_way' | 'in_progress' | 'completed' | 'cancelled'
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
