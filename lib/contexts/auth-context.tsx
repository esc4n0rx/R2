'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authApi } from '@/lib/api/auth'
import { profilesApi } from '@/lib/api/profiles'
import { ApiError } from '@/lib/api/client'
import type { AuthUser, Profile, Session } from '@/lib/types'

interface AuthContextValue {
  user: AuthUser | null
  session: Session | null
  profiles: Profile[]
  activeProfile: Profile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  selectProfile: (profile: Profile) => void
  refreshProfiles: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const msUntilExpiry = expiresAt * 1000 - Date.now()
    const delay = Math.max(msUntilExpiry - 60_000, 10_000) // refresh 1 min before expiry
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await authApi.refresh()
        setSession(data.session)
        setUser(data.user)
        scheduleRefresh(data.session.expiresAt)
      } catch {
        setSession(null)
        setUser(null)
        setProfiles([])
        setActiveProfile(null)
      }
    }, delay)
  }, [])

  const fetchProfiles = useCallback(async (token: string) => {
    const data = await profilesApi.list(token)
    setProfiles(data.profiles)
    return data.profiles
  }, [])

  // Restore session on mount using httpOnly cookie via /auth/refresh
  useEffect(() => {
    ;(async () => {
      try {
        const data = await authApi.refresh()
        setUser(data.user)
        setSession(data.session)
        await fetchProfiles(data.session.accessToken)
        scheduleRefresh(data.session.expiresAt)
      } catch {
        // No valid session — stay unauthenticated
      } finally {
        setIsLoading(false)
      }
    })()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [fetchProfiles, scheduleRefresh])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password })
      setUser(data.user)
      setSession(data.session)
      await fetchProfiles(data.session.accessToken)
      scheduleRefresh(data.session.expiresAt)
    },
    [fetchProfiles, scheduleRefresh],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authApi.register({ name, email, password })
      setUser(data.user)
      setSession(data.session)
      await fetchProfiles(data.session.accessToken)
      scheduleRefresh(data.session.expiresAt)
    },
    [fetchProfiles, scheduleRefresh],
  )

  const logout = useCallback(async () => {
    try {
      if (session?.accessToken) {
        await authApi.logout(session.accessToken)
      }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      setUser(null)
      setSession(null)
      setProfiles([])
      setActiveProfile(null)
    }
  }, [session])

  const selectProfile = useCallback((profile: Profile) => {
    setActiveProfile(profile)
  }, [])

  const refreshProfiles = useCallback(async () => {
    if (!session?.accessToken) return
    await fetchProfiles(session.accessToken)
  }, [session, fetchProfiles])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profiles,
        activeProfile,
        isLoading,
        login,
        register,
        logout,
        selectProfile,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
