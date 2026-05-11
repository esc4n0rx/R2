'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  BookMarked,
  Settings,
  Users,
  LogOut,
  Loader2,
  History,
} from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { getAvatarHex, getInitials } from '@/lib/api/profiles'
import { useSearch, useGenres } from '@/hooks/use-catalog'
import type { Profile } from '@/lib/types'
import type { ContentCard } from '@/lib/api/catalog'

interface AppHeaderProps {
  currentProfile: Profile
  activeNav: 'movies' | 'series'
  onNavChange: (nav: 'movies' | 'series') => void
  onMyList: () => void
  onSettings: () => void
  onHistory: () => void
  onSwitchProfile: () => void
  onSignOut: () => void
  onContentClick: (item: ContentCard) => void
  onGenreSelect: (genre: string) => void
  // Legacy props kept for compat
  activeCategory?: string
  onCategoryChange?: (cat: string) => void
  onSearchClick?: () => void
}

function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="relative flex-none w-[46px] h-[26px] rounded-full border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      style={{
        backgroundColor: isDark ? '#ff4f00' : 'var(--muted)',
        borderColor: isDark ? '#ff4f00' : 'var(--border)',
      }}
    >
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        <Moon size={11} className="text-white" />
      </span>
      <span
        className="absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 1, color: 'var(--muted-foreground)' }}
      >
        <Sun size={11} />
      </span>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-sm"
        style={{
          left: isDark ? 'calc(100% - 21px)' : '3px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}
      />
    </button>
  )
}

function ProfileAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' }) {
  const color = getAvatarHex(profile.avatar_color)
  const initials = getInitials(profile.name)
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs'

  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt={profile.name} className={`${dim} rounded-full object-cover shrink-0`} />
    )
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SEARCH OVERLAY
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SearchOverlay({
  activeNav,
  onClose,
  onResultClick,
}: {
  activeNav: 'movies' | 'series'
  onClose: () => void
  onResultClick: (item: ContentCard) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchType = activeNav === 'series' ? 'series' : 'movie'
  const { results, isLoading } = useSearch(query, searchType)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 right-0 top-full z-50 border-b shadow-lg"
      style={{ backgroundColor: 'var(--background)', borderBottomColor: 'var(--border)' }}
    >
      {/* Search bar */}
      <div
        className="px-6 md:px-12 lg:px-16 py-3 flex items-center gap-3 border-b"
        style={{ borderBottomColor: 'var(--border)' }}
      >
        <Search size={16} style={{ color: 'var(--muted-foreground)' }} className="shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Buscar ${activeNav === 'series' ? 'séries' : 'filmes'}…`}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        />
        {isLoading && <Loader2 size={14} className="animate-spin shrink-0" style={{ color: 'var(--muted-foreground)' }} />}
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Results dropdown */}
      {query.length >= 2 && (
        <div className="max-h-[60vh] overflow-y-auto px-6 md:px-12 lg:px-16 py-3">
          {!isLoading && results.length === 0 && (
            <p
              className="text-sm py-3 text-center"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onResultClick(item)
                  onClose()
                }}
                className="group rounded-xl border overflow-hidden text-left transition-all duration-200 flex flex-col"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ryvo-orange)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')
                }
              >
                <div className="aspect-[2/3] relative overflow-hidden">
                  {item.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--muted)' }}
                    >
                      <span
                        className="text-[9px] font-semibold text-center px-1 z-10 relative"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p
                    className="text-xs font-semibold truncate leading-tight"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    {item.type === 'movie' ? 'Filme' : 'Série'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   APP HEADER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function AppHeader({
  currentProfile,
  activeNav,
  onNavChange,
  onMyList,
  onSettings,
  onHistory,
  onSwitchProfile,
  onSignOut,
  onContentClick,
  onGenreSelect,
}: AppHeaderProps) {
  const { profiles, selectProfile, logout, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileSwitchOpen, setProfileSwitchOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  // Load genres from API
  const { data: genresData } = useGenres()
  const genres = genresData?.genres ?? []

  const otherProfiles = profiles.filter((p) => p.id !== currentProfile.id)

  const handleSwitchProfile = (profile: Profile) => {
    selectProfile(profile)
    setProfileMenuOpen(false)
    setProfileSwitchOpen(false)
  }

  const handleSignOut = async () => {
    setProfileMenuOpen(false)
    await logout()
    onSignOut()
  }

  return (
    <header
      className="sticky top-0 z-50 border-b transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)', borderBottomColor: 'var(--border)' }}
    >
      <div className="px-6 md:px-12 lg:px-16 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <span
            className="font-display font-bold text-xl tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
          >
            Ryvo
          </span>

          {/* Desktop nav — Filmes / Séries */}
          <nav className="hidden md:flex items-center">
            {[
              { key: 'movies' as const, label: 'Filmes' },
              { key: 'series' as const, label: 'Séries' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => onNavChange(item.key)}
                className="px-4 py-[14px] text-sm font-medium transition-all"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-inter)',
                  boxShadow:
                    activeNav === item.key
                      ? 'var(--ryvo-orange) 0px -3px 0px 0px inset'
                      : 'transparent 0px -3px 0px 0px inset',
                }}
                onMouseEnter={(e) => {
                  if (activeNav !== item.key)
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      'var(--border) 0px -3px 0px 0px inset'
                }}
                onMouseLeave={(e) => {
                  if (activeNav !== item.key)
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      'transparent 0px -3px 0px 0px inset'
                }}
              >
                {item.label}
              </button>
            ))}

            {/* Category dropdown — genres from API */}
            {genres.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setCategoryOpen(!categoryOpen)}
                  className="flex items-center gap-1.5 px-4 py-[14px] text-sm font-medium transition-colors"
                  style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                >
                  Categorias
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${categoryOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-52 rounded-lg border overflow-hidden z-50 max-h-72 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      }}
                    >
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => {
                            onGenreSelect(genre)
                            setCategoryOpen(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{
                            color: 'var(--foreground)',
                            fontWeight: 400,
                            fontFamily: 'var(--font-inter)',
                            backgroundColor: 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          }}
                        >
                          {genre}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <ThemeSwitch />

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--ryvo-charcoal)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            }
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>

          <button
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--ryvo-charcoal)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            }
            aria-label="Notificações"
          >
            <Bell size={18} />
          </button>
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 pl-2 rounded-lg py-1 pr-1 transition-colors"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
              }
            >
              <ProfileAvatar profile={currentProfile} />
              <span
                className="hidden md:block text-sm font-medium"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
              >
                {currentProfile.name}
              </span>
              <ChevronDown
                size={14}
                className={`hidden md:block transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--muted-foreground)' }}
              />
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden z-50"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                  }}
                >
                  {/* Profile info */}
                  <div className="px-4 py-3 border-b" style={{ borderBottomColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <ProfileAvatar profile={currentProfile} size="md" />
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold leading-none truncate"
                          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
                        >
                          {currentProfile.name}
                        </p>
                        <p
                          className="text-xs mt-0.5 truncate"
                          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                        >
                          {user?.email ?? 'Perfil ativo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {[
                      { label: 'Minha Lista', icon: BookMarked, action: onMyList },
                      { label: 'Histórico', icon: History, action: onHistory },
                      { label: 'Configurações', icon: Settings, action: onSettings },
                    ].map(({ label, icon: Icon, action }) => (
                      <button
                        key={label}
                        onClick={() => {
                          setProfileMenuOpen(false)
                          action()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                        style={{
                          color: 'var(--foreground)',
                          fontFamily: 'var(--font-inter)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                        }
                      >
                        <Icon size={15} style={{ color: 'var(--muted-foreground)' }} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Trocar Perfil */}
                  <div className="border-t py-1.5" style={{ borderTopColor: 'var(--border)' }}>
                    <button
                      onClick={() => setProfileSwitchOpen(!profileSwitchOpen)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                      style={{
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-inter)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                      }
                    >
                      <span className="flex items-center gap-3">
                        <Users size={15} style={{ color: 'var(--muted-foreground)' }} />
                        Trocar de Perfil
                      </span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${profileSwitchOpen ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--muted-foreground)' }}
                      />
                    </button>

                    <AnimatePresence>
                      {profileSwitchOpen && otherProfiles.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          {otherProfiles.map((profile) => (
                            <button
                              key={profile.id}
                              onClick={() => handleSwitchProfile(profile)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left"
                              style={{
                                color: 'var(--foreground)',
                                fontFamily: 'var(--font-inter)',
                                backgroundColor: 'transparent',
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor =
                                  'var(--muted)')
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLElement).style.backgroundColor =
                                  'transparent')
                              }
                            >
                              <ProfileAvatar profile={profile} size="sm" />
                              <span className="flex-1 truncate">{profile.name}</span>
                              {profile.is_kids && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: 'var(--muted)',
                                    color: 'var(--muted-foreground)',
                                  }}
                                >
                                  Kids
                                </span>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                      style={{
                        color: 'var(--ryvo-orange)',
                        fontFamily: 'var(--font-inter)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                      }
                    >
                      <LogOut size={15} style={{ color: 'var(--ryvo-orange)' }} />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            }
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t overflow-hidden transition-colors duration-300"
            style={{ borderTopColor: 'var(--border)', backgroundColor: 'var(--background)' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {[
                { key: 'movies' as const, label: 'Filmes' },
                { key: 'series' as const, label: 'Séries' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    onNavChange(item.key)
                    setMobileMenuOpen(false)
                  }}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: activeNav === item.key ? 'var(--ryvo-orange)' : 'var(--foreground)',
                    backgroundColor: activeNav === item.key ? 'var(--muted)' : 'transparent',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setSearchOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                }
              >
                <Search size={15} />
                Buscar
              </button>

              {/* Mobile genre list */}
              {genres.length > 0 && (
                <div className="pt-2 border-t" style={{ borderTopColor: 'var(--muted)' }}>
                  <p
                    className="text-xs uppercase tracking-wider px-3 pb-1 font-semibold"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Categorias
                  </p>
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => {
                        onGenreSelect(genre)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors"
                      style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)', backgroundColor: 'transparent' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                      }
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay
            activeNav={activeNav}
            onClose={() => setSearchOpen(false)}
            onResultClick={onContentClick}
          />
        )}
      </AnimatePresence>

      {/* Backdrops */}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
      )}
      {categoryOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
      )}
    </header>
  )
}


