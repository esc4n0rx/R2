'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  BookMarked,
  Settings,
  Moon,
  Sun,
  Bell,
  Globe,
  Shield,
  Trash2,
  Loader2,
} from 'lucide-react'
import WelcomeScreen from '@/components/ryvo/WelcomeScreen'
import ProfileCreation from '@/components/ryvo/ProfileCreation'
import AppHeader from '@/components/ryvo/AppHeader'
import HeroCarousel from '@/components/ryvo/HeroCarousel'
import ContentModal from '@/components/ryvo/ContentModal'
import GenreBrowseView from '@/components/ryvo/GenreBrowseView'
import {
  ContinueWatchingSection,
  NewReleasesSection,
  RecommendedSection,
  DynamicGenreSections,
} from '@/components/ryvo/ContentSections'
import { useWatchProgress, useWatchHistory } from '@/hooks/use-stream'
import { useTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/contexts/auth-context'
import { useWatchlist } from '@/hooks/use-catalog'
import { catalogApi, type ContentCard } from '@/lib/api/catalog'
import { type WatchProgress, type WatchHistoryEvent } from '@/lib/api/stream'
import type { Profile } from '@/lib/types'

type AppScreen = 'welcome' | 'profile' | 'home'

export default function RyvoApp() {
  const { isLoading, user, activeProfile, selectProfile } = useAuth()
  const [screen, setScreen] = useState<AppScreen>('welcome')
  const [activeNav, setActiveNav] = useState<'movies' | 'series'>('movies')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [modalItem, setModalItem] = useState<ContentCard | null>(null)
  const [myListOpen, setMyListOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [playbackRevision, setPlaybackRevision] = useState(0)
  const { theme, toggleTheme } = useTheme()

  // Map nav to content type
  const contentType = activeNav === 'series' ? 'series' : 'movie'

  // Real watchlist
  const {
    items: watchlistItems,
    isLoading: watchlistLoading,
    reload: reloadWatchlist,
  } = useWatchlist(activeProfile?.id ?? null)

  // Watchlist detail cards for the panel
  const [watchlistCards, setWatchlistCards] = useState<ContentCard[]>([])
  const [watchlistDetailsLoading, setWatchlistDetailsLoading] = useState(false)
  const [continueWatchingCards, setContinueWatchingCards] = useState<
    Array<{ progress: WatchProgress; card: ContentCard; progressPercent: number; timeLeftLabel: string }>
  >([])
  const [continueWatchingLoading, setContinueWatchingLoading] = useState(false)
  const [historyCards, setHistoryCards] = useState<Array<{ event: WatchHistoryEvent; card: ContentCard }>>([])
  const [newReleaseItems, setNewReleaseItems] = useState<ContentCard[]>([])
  const [historyCardsLoading, setHistoryCardsLoading] = useState(false)

  const { progress, reload: reloadProgress } = useWatchProgress(activeProfile?.id ?? null)
  const { events: historyEvents, reload: reloadHistory } = useWatchHistory(activeProfile?.id ?? null, 120)

  // Load content details for each watchlist item to show in the panel
  const loadWatchlistDetails = useCallback(async () => {
    if (!watchlistItems.length) {
      setWatchlistCards([])
      return
    }
    setWatchlistDetailsLoading(true)
    try {
      const results = await Promise.allSettled(
        watchlistItems.map((wl) =>
          catalogApi.getDetails(wl.content_type, wl.content_id).then((r) => {
            const d = r.details
            // Build a ContentCard from details
            const card: ContentCard = {
              id: d.id,
              type: d.type,
              title: d.type === 'movie' ? (d as { title: string }).title : (d as { name: string }).name,
              overview: d.overview,
              poster_url: d.poster_url ?? null,
              backdrop_url: d.backdrop_url ?? null,
              genres: d.genres ?? [],
              popularity: 0,
              created_at: '',
            }
            return card
          }),
        ),
      )
      const cards = results
        .filter((r): r is PromiseFulfilledResult<ContentCard> => r.status === 'fulfilled')
        .map((r) => r.value)
      setWatchlistCards(cards)
    } catch {
      // ignore
    } finally {
      setWatchlistDetailsLoading(false)
    }
  }, [watchlistItems])

  const loadContinueWatchingCards = useCallback(async () => {
    const targetType = contentType
    const filteredProgress = progress.filter((p) => p.content_type === targetType && !p.completed)
    if (filteredProgress.length === 0) {
      setContinueWatchingCards([])
      return
    }
    setContinueWatchingLoading(true)
    try {
      const results = await Promise.allSettled(
        filteredProgress.map(async (entry) => {
          const r = await catalogApi.getDetails(targetType, entry.content_id)
          const d = r.details
          const duration = entry.duration_seconds ?? (d.type === 'movie' ? ((d.runtime_minutes ?? 0) * 60) : 0)
          const remaining = Math.max(0, duration - entry.position_seconds)
          const card: ContentCard = {
            id: d.id,
            type: 'movie',
            title: d.type === 'movie' ? d.title : d.name,
            overview: d.overview,
            poster_url: d.poster_url ?? null,
            backdrop_url: d.backdrop_url ?? null,
            genres: d.genres ?? [],
            popularity: 0,
            created_at: '',
          }
          return {
            progress: entry,
            card,
            progressPercent: duration > 0 ? Math.min(100, Math.round((entry.position_seconds / duration) * 100)) : 0,
            timeLeftLabel: remaining > 0 ? `${Math.ceil(remaining / 60)} min restantes` : 'Quase concluído',
          }
        }),
      )
      setContinueWatchingCards(
        results
          .filter((r): r is PromiseFulfilledResult<{ progress: WatchProgress; card: ContentCard; progressPercent: number; timeLeftLabel: string }> => r.status === 'fulfilled')
          .map((r) => r.value),
      )
    } finally {
      setContinueWatchingLoading(false)
    }
  }, [contentType, progress])

  const loadHistoryCards = useCallback(async () => {
    const filtered = historyEvents.filter((e) => e.content_type === 'movie')
    if (filtered.length === 0) {
      setHistoryCards([])
      return
    }
    setHistoryCardsLoading(true)
    try {
      const deduped = filtered.filter((event, idx, arr) => arr.findIndex((x) => x.content_id === event.content_id) === idx)
      const results = await Promise.allSettled(
        deduped.map(async (event) => {
          const r = await catalogApi.getDetails('movie', event.content_id)
          const d = r.details
          const card: ContentCard = {
            id: d.id,
            type: 'movie',
            title: d.type === 'movie' ? d.title : d.name,
            overview: d.overview,
            poster_url: d.poster_url ?? null,
            backdrop_url: d.backdrop_url ?? null,
            genres: d.genres ?? [],
            popularity: 0,
            created_at: '',
          }
          return { event, card }
        }),
      )
      setHistoryCards(
        results
          .filter((r): r is PromiseFulfilledResult<{ event: WatchHistoryEvent; card: ContentCard }> => r.status === 'fulfilled')
          .map((r) => r.value),
      )
    } finally {
      setHistoryCardsLoading(false)
    }
  }, [historyEvents])

  useEffect(() => {
    if (myListOpen) {
      reloadWatchlist()
    }
  }, [myListOpen, reloadWatchlist])

  useEffect(() => {
    if (historyOpen) {
      reloadHistory()
    }
  }, [historyOpen, reloadHistory])

  useEffect(() => {
    reloadProgress()
    reloadHistory()
  }, [playbackRevision, reloadProgress, reloadHistory])

  useEffect(() => {
    if (!watchlistLoading) {
      loadWatchlistDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistItems])

  useEffect(() => {
    loadContinueWatchingCards()
  }, [loadContinueWatchingCards])

  useEffect(() => {
    if (historyOpen) {
      loadHistoryCards()
    }
  }, [historyOpen, loadHistoryCards])

  // Auto-route based on auth state
  useEffect(() => {
    if (isLoading) return
    if (!user) {
      setScreen('welcome')
    } else if (!activeProfile) {
      setScreen('profile')
    } else {
      setScreen('home')
    }
  }, [isLoading, user, activeProfile])

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <span
            className="font-bold text-2xl tracking-tight"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
          >
            Ryvo
          </span>
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ryvo-orange)' }} />
        </div>
      </div>
    )
  }

  const handleAuthenticated = () => {
    setScreen('profile')
  }

  const handleProfileSelect = (profile: Profile) => {
    selectProfile(profile)
    setScreen('home')
  }

  const handleSwitchProfile = () => {
    setScreen('profile')
  }

  const handleSignOut = () => {
    setScreen('welcome')
  }

  return (
    <div
      className="transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}
    >
      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeScreen onAuthenticated={handleAuthenticated} />
          </motion.div>
        )}

        {screen === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ProfileCreation onContinue={handleProfileSelect} />
          </motion.div>
        )}

        {screen === 'home' && activeProfile && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AppHeader
              currentProfile={activeProfile}
              activeNav={activeNav}
              onNavChange={(nav) => {
                setActiveNav(nav)
                setActiveGenre(null) // reset genre on nav change
              }}
              onMyList={() => setMyListOpen(true)}
              onHistory={() => setHistoryOpen(true)}
              onSettings={() => setSettingsOpen(true)}
              onSwitchProfile={handleSwitchProfile}
              onSignOut={handleSignOut}
              onContentClick={(item) => setModalItem(item)}
              onGenreSelect={(genre) => setActiveGenre(genre)}
            />

            <main>
              {/* Genre browse view — replaces hero + sections when a genre is selected */}
              <AnimatePresence mode="wait">
                {activeGenre ? (
                  <GenreBrowseView
                    key={`genre-${activeGenre}-${contentType}`}
                    genre={activeGenre}
                    contentType={contentType}
                    onClose={() => setActiveGenre(null)}
                    onItemClick={setModalItem}
                  />
                ) : (
                  <motion.div
                    key="home-sections"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HeroCarousel
                      contentType={contentType}
                      onDetailClick={setModalItem}
                    />
                    <ContinueWatchingSection
                      items={continueWatchingCards}
                      isLoading={continueWatchingLoading}
                      onItemClick={setModalItem}
                    />
                    <NewReleasesSection
                      contentType={contentType}
                      isKidsProfile={activeProfile.is_kids}
                      onItemsLoaded={setNewReleaseItems}
                      onItemClick={setModalItem}
                    />
                    <DynamicGenreSections
                      contentType={contentType}
                      items={newReleaseItems}
                      onItemClick={setModalItem}
                    />
                    <RecommendedSection
                      contentType={contentType}
                      profileId={activeProfile.id}
                      isKidsProfile={activeProfile.is_kids}
                      onItemClick={setModalItem}
                    />

                    <footer
                      className="py-10 transition-colors duration-300"
                      style={{ backgroundColor: 'var(--ryvo-footer-bg)' }}
                    >
                      <div className="px-6 md:px-12 lg:px-16">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div>
                            <span
                              className="font-bold text-xl tracking-tight block mb-2"
                              style={{
                                color: 'var(--ryvo-footer-text)',
                                fontFamily: 'var(--font-syne)',
                              }}
                            >
                              Ryvo
                            </span>
                            <p
                              className="text-sm max-w-xs"
                              style={{
                                color: 'var(--ryvo-footer-muted)',
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              Filmes, séries e histórias para continuar de onde você parou.
                            </p>
                          </div>
                        </div>
                        <div
                          className="border-t mt-8 pt-6 flex items-center justify-between gap-3"
                          style={{ borderTopColor: 'var(--ryvo-footer-border)' }}
                        >
                          <p
                            className="text-xs"
                            style={{ color: 'var(--ryvo-footer-muted)', fontFamily: 'var(--font-inter)' }}
                          >
                            © 2025 Ryvo. Todos os direitos reservados.
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ryvo-orange)' }} />
                            <span className="text-xs" style={{ color: 'var(--ryvo-footer-muted)', fontFamily: 'var(--font-inter)' }}>
                              Todos os serviços operacionais
                            </span>
                          </div>
                        </div>
                      </div>
                    </footer>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content modal — full real API */}
      <ContentModal
        item={modalItem}
        profileId={activeProfile?.id ?? null}
        onClose={() => setModalItem(null)}
        onItemClick={(item) => setModalItem(item)}
        onPlaybackUpdated={() => setPlaybackRevision((v) => v + 1)}
      />

      {/* Minha Lista — real watchlist */}
      <AnimatePresence>
        {myListOpen && (
          <>
            <motion.div
              key="my-list-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'var(--ryvo-overlay)' }}
              onClick={() => setMyListOpen(false)}
            />
            <motion.div
              key="my-list-panel"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col"
              style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-between px-6 py-5 border-b shrink-0"
                style={{ borderBottomColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <BookMarked size={18} style={{ color: 'var(--ryvo-orange)' }} />
                  <h2
                    className="text-lg font-bold"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
                  >
                    Minha Lista
                  </h2>
                </div>
                <button
                  onClick={() => setMyListOpen(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {(watchlistLoading || watchlistDetailsLoading) && (
                  <div className="flex items-center gap-2 py-6" style={{ color: 'var(--muted-foreground)' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                      Carregando lista…
                    </span>
                  </div>
                )}

                {!watchlistLoading && !watchlistDetailsLoading && watchlistCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <BookMarked size={32} style={{ color: 'var(--border)' }} />
                    <p
                      className="text-sm text-center"
                      style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                    >
                      Sua lista está vazia. Adicione conteúdos clicando em &ldquo;+ Adicionar à lista&rdquo;.
                    </p>
                  </div>
                )}

                {!watchlistLoading && !watchlistDetailsLoading && watchlistCards.length > 0 && (
                  <>
                    <p
                      className="text-xs uppercase tracking-wider font-semibold mb-4"
                      style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                    >
                      {watchlistCards.length} {watchlistCards.length === 1 ? 'item salvo' : 'itens salvos'}
                    </p>
                    <div className="flex flex-col gap-3">
                      {watchlistCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => {
                            setMyListOpen(false)
                            setModalItem(card)
                          }}
                          className="flex items-center gap-4 p-3 rounded-xl border text-left transition-colors group"
                          style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                          }
                        >
                          {/* Poster thumbnail */}
                          <div className="w-12 h-16 rounded-lg shrink-0 overflow-hidden">
                            {card.poster_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={card.poster_url}
                                alt={card.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full"
                                style={{ backgroundColor: 'var(--muted)' }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
                            >
                              {card.title}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{
                                color: 'var(--muted-foreground)',
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              {card.type === 'movie' ? 'Filme' : 'Série'}
                              {card.genres?.[0] ? ` · ${card.genres[0]}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              key="history-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'var(--ryvo-overlay)' }}
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col"
              style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderBottomColor: 'var(--border)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>
                  Histórico
                </h2>
                <button onClick={() => setHistoryOpen(false)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {historyCardsLoading && (
                  <div className="flex items-center gap-2 py-6" style={{ color: 'var(--muted-foreground)' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Carregando histórico...</span>
                  </div>
                )}
                {!historyCardsLoading && historyCards.length === 0 && (
                  <p className="text-sm py-6" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                    Nenhum conteúdo assistido até agora.
                  </p>
                )}
                {!historyCardsLoading && historyCards.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {historyCards.map(({ event, card }) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          setHistoryOpen(false)
                          setModalItem(card)
                        }}
                        className="flex items-center gap-4 p-3 rounded-xl border text-left transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="w-12 h-16 rounded-lg shrink-0 overflow-hidden">
                          {card.poster_url ? <img src={card.poster_url} alt={card.title} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ backgroundColor: 'var(--muted)' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{card.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                            {event.event_type} · {Math.floor(event.position_seconds / 60)} min
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Configurações */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              key="settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'var(--ryvo-overlay)' }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              key="settings-panel"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col"
              style={{ backgroundColor: 'var(--card)', borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-between px-6 py-5 border-b shrink-0"
                style={{ borderBottomColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={18} style={{ color: 'var(--ryvo-orange)' }} />
                  <h2
                    className="text-lg font-bold"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
                  >
                    Configurações
                  </h2>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                  }
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Aparência */}
                <div className="mb-6">
                  <p
                    className="text-xs uppercase tracking-wider font-semibold mb-3"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Aparência
                  </p>
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3.5"
                      style={{ backgroundColor: 'var(--background)' }}
                    >
                      <div className="flex items-center gap-3">
                        {theme === 'dark' ? (
                          <Moon size={16} style={{ color: 'var(--muted-foreground)' }} />
                        ) : (
                          <Sun size={16} style={{ color: 'var(--muted-foreground)' }} />
                        )}
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                          >
                            Tema
                          </p>
                          <p
                            className="text-xs"
                            style={{
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-inter)',
                            }}
                          >
                            {theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="relative flex-none w-[46px] h-[26px] rounded-full border transition-colors duration-300"
                        style={{
                          backgroundColor: theme === 'dark' ? '#ff4f00' : 'var(--muted)',
                          borderColor: theme === 'dark' ? '#ff4f00' : 'var(--border)',
                        }}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-sm"
                          style={{
                            left: theme === 'dark' ? 'calc(100% - 21px)' : '3px',
                            backgroundColor: '#fff',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notificações */}
                <div className="mb-6">
                  <p
                    className="text-xs uppercase tracking-wider font-semibold mb-3"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Notificações
                  </p>
                  <div
                    className="rounded-xl border overflow-hidden divide-y"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {[
                      { label: 'Novos lançamentos', desc: 'Seja notificado quando um título chegar' },
                      { label: 'Recomendações', desc: 'Sugestões baseadas no seu Histórico' },
                    ].map(({ label, desc }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-3.5"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Bell size={16} style={{ color: 'var(--muted-foreground)' }} />
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{
                                color: 'var(--foreground)',
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              {label}
                            </p>
                            <p
                              className="text-xs"
                              style={{
                                color: 'var(--muted-foreground)',
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              {desc}
                            </p>
                          </div>
                        </div>
                        <div
                          className="w-[46px] h-[26px] rounded-full"
                          style={{ backgroundColor: 'var(--ryvo-orange)' }}
                        >
                          <div className="flex justify-end p-[3px]">
                            <div className="w-[18px] h-[18px] rounded-full bg-white shadow-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacidade */}
                <div className="mb-6">
                  <p
                    className="text-xs uppercase tracking-wider font-semibold mb-3"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Privacidade
                  </p>
                  <div
                    className="rounded-xl border overflow-hidden divide-y"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {[
                      { icon: Globe, label: 'Idioma', value: 'Português (BR)' },
                      { icon: Shield, label: 'Controle parental', value: 'Desativado' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between px-4 py-3.5"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} style={{ color: 'var(--muted-foreground)' }} />
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                          >
                            {label}
                          </p>
                        </div>
                        <p
                          className="text-xs"
                          style={{
                            color: 'var(--muted-foreground)',
                            fontFamily: 'var(--font-inter)',
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zona de risco */}
                <div>
                  <p
                    className="text-xs uppercase tracking-wider font-semibold mb-3"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Zona de risco
                  </p>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                    }
                  >
                    <Trash2 size={16} />
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                        Limpar Histórico
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        Remove todos os registros de visualização
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


