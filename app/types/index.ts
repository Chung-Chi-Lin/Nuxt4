export interface GeoLocation {
  lat: number
  lng: number
}

export interface Spot {
  lat: number
  lng: number
  name: string
  emoji: string
  desc: string
  tags: string[]
}

export interface DbSpot {
  id: string
  user_id: string
  name: string
  emoji: string
  lat: number
  lng: number
  tags: string[]
  notes: string
  is_public: boolean
  photo_urls: string[]
  xp_earned: number
  created_at: string
  address?: string
  category: string
}

export type SidebarSpot = DbSpot & { distance: number }

export interface SpotComment {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  content: string
  created_at: string
  is_mine: boolean
}

export interface AuthUser {
  id: string
  email?: string
  username?: string
  avatar_url?: string | null
  user_level?: number
  xp?: number
  role?: string
}

export interface LoginResponse {
  token: string
}

export interface RegisterResponse {
  token?: string
  requiresConfirmation?: boolean
}
