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

export interface Trip {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  my_role: 'owner' | 'editor' | 'viewer'
}

export interface TripDay {
  id: string
  trip_id: string
  day_index: number
  label: string | null
}

export interface TripWaypoint {
  id: string
  day_id: string
  spot_id: string | null
  order_index: number
  custom_name: string
  emoji: string
  lat: number
  lng: number
  transport_mode: 'car' | 'walk' | 'bike' | 'bus'
  notes: string | null
}

export interface TripMember {
  user_id: string
  username: string
  avatar_url: string | null
  user_level: number
  role: 'owner' | 'editor' | 'viewer'
  joined_at: string
  is_me: boolean
}

export interface TripDetail {
  trip: Trip
  days: TripDay[]
  waypoints: TripWaypoint[]
}

export interface PendingSpot {
  lat: number
  lng: number
  name: string
  spot_id: string
  emoji: string
}

export interface LoginResponse {
  token: string
  sessionToken: string
}

export interface RegisterResponse {
  token?: string | null
  sessionToken?: string | null
  requiresConfirmation?: boolean
}
