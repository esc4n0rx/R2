import { apiRequest } from './client'
import type { AuthResponse, AuthUser } from '@/lib/types'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  name: string
  email: string
  password: string
}

export const authApi = {
  login(params: LoginParams): Promise<AuthResponse> {
    return apiRequest('/auth/login', { method: 'POST', body: params })
  },

  register(params: RegisterParams): Promise<AuthResponse> {
    return apiRequest('/auth/register', { method: 'POST', body: params })
  },

  logout(token: string): Promise<void> {
    return apiRequest('/auth/logout', { method: 'POST', token })
  },

  refresh(): Promise<AuthResponse> {
    return apiRequest('/auth/refresh', { method: 'POST' })
  },

  me(token: string): Promise<{ user: AuthUser }> {
    return apiRequest('/auth/me', { method: 'GET', token })
  },
}
