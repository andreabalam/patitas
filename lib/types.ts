export type UserRole = 'adopter' | 'volunteer' | 'shelter_admin'

export type Species = 'dog' | 'cat' | 'other'

export type PetSize = 'small' | 'medium' | 'large'

export type PetSex = 'male' | 'female'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Pet {
  id: string
  created_by: string
  name: string
  species: Species
  age_years: number | null
  sex: PetSex | null
  size: PetSize | null
  city: string
  state: string
  description: string | null
  is_urgent: boolean
  is_active: boolean
  days_in_shelter: number
  video_url: string | null
  created_at: string
  // joined from pet_photos
  pet_photos?: PetPhoto[]
  // joined from profiles
  profiles?: Profile
}

export interface PetPhoto {
  id: string
  pet_id: string
  url: string
  is_primary: boolean
  created_at: string
}

export interface MexicanState {
  id: number
  name: string
  code: string
}

export interface FilterState {
  species: Species | 'all'
  state: string | 'all'
  size: PetSize | 'all'
  urgent_only: boolean
}
