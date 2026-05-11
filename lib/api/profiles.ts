import { apiRequest } from './client'
import type { AvatarColor, Profile, ProfileResponse, ProfilesResponse } from '@/lib/types'

export interface CreateProfileParams {
  name: string
  avatar_color?: AvatarColor
  avatar_url?: string | null
  is_kids?: boolean
}

export interface UpdateProfileParams {
  name?: string
  avatar_color?: AvatarColor
  avatar_url?: string | null
}

export const profilesApi = {
  list(token: string): Promise<ProfilesResponse> {
    return apiRequest('/profiles', { method: 'GET', token })
  },

  get(id: string, token: string): Promise<ProfileResponse> {
    return apiRequest(`/profiles/${id}`, { method: 'GET', token })
  },

  create(params: CreateProfileParams, token: string): Promise<ProfileResponse> {
    return apiRequest('/profiles', { method: 'POST', body: params, token })
  },

  update(id: string, params: UpdateProfileParams, token: string): Promise<ProfileResponse> {
    return apiRequest(`/profiles/${id}`, { method: 'PATCH', body: params, token })
  },

  delete(id: string, token: string): Promise<void> {
    return apiRequest(`/profiles/${id}`, { method: 'DELETE', token })
  },
}

export function getAvatarHex(color: AvatarColor): string {
  const map: Record<AvatarColor, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    pink: '#ec4899',
    teal: '#14b8a6',
    yellow: '#eab308',
  }
  return map[color] ?? '#3b82f6'
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function profileToHeader(profile: Profile) {
  return {
    name: profile.name,
    initials: getInitials(profile.name),
    color: getAvatarHex(profile.avatar_color),
    isKids: profile.is_kids,
  }
}
