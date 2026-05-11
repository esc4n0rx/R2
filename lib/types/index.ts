export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export type AvatarColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'teal'
  | 'yellow'

export interface Profile {
  id: string
  user_id: string
  name: string
  avatar_color: AvatarColor
  avatar_url: string | null
  is_kids: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  profiles: Profile[]
  activeProfile: Profile | null
  isLoading: boolean
}

// API response shapes
export interface AuthResponse {
  user: AuthUser
  session: Session
}

export interface ProfilesResponse {
  profiles: Profile[]
}

export interface ProfileResponse {
  profile: Profile
}

export interface ApiError {
  error: string
}
