export type UserRole = 'pending' | 'member' | 'admin'

export interface Profile {
  id: string
  full_name: string
  flat_number: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface HallBooking {
  id: string
  user_id: string
  start_at: string
  end_at: string
  title: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  user_id: string
  flat_number: string
  registration_number: string
  vehicle_type: string | null
  created_at: string
}

export interface Contact {
  id: string
  name: string
  role_label: string | null
  phone: string | null
  email: string | null
  sort_order: number
  created_at: string
}

export type LandmarkCategory = 'school' | 'hospital' | 'other'

export interface Landmark {
  id: string
  name: string
  category: LandmarkCategory
  address: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string | null
  price: string | null
  category: string | null
  status: 'active' | 'sold' | 'pending'
  created_at: string
  updated_at: string
}
