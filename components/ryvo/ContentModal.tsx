'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Play,
  Pause,
  Plus,
  Check,
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { useContentDetails } from '@/hooks/use-catalog'
import { useWatchlist } from '@/hooks/use-catalog'
import { streamApi, type StreamContentType } from '@/lib/api/stream'
import type { ContentCard, MovieDetails, SeriesDetails, Season } from '@/lib/api/catalog'

interface ContentModalProps {
  item: ContentCard | null
  profileId: string | null
  onClose: () => void
  onItemClick: (item: ContentCard) => void
  onPlaybackUpdated?: () => void
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   BANNER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ModalBanner({ item, details }: { item: ContentCard; details: MovieDetails | SeriesDetails | null }) {
  const backdrop = details?.backdrop_url ?? item.backdrop_url
  const poster = details?.poster_url ?? item.poster_url

  if (backdrop) {
    return (
      <div className="w-full h-[200px] md:h-[280px] relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backdrop} alt={item.title} className="w-full h-full object-cover" />
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--card))' }}
        />
      </div>
    )
  }

  if (poster) {
    return (
      <div className="w-full h-[200px] md:h-[280px] relative overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: 'var(--muted)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt={item.title} className="h-full w-auto object-contain" />
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--card))' }}
        />
      </div>
    )
  }

  return (
    <div
      className="w-full h-[160px] md:h-[200px] relative overflow-hidden"
      style={{ backgroundColor: 'var(--muted)' }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, var(--ryvo-orange) 0, var(--ryvo-orange) 1px, transparent 0, transparent 50%)`,
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <p
          className="text-center text-base font-bold px-4 opacity-40"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
        >
          {item.title}
        </p>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--card))' }}
      />
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SEASONS ACCORDION (for series)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SeasonsAccordion({
  seasons,
  onEpisodePlay,
}: {
  seasons: Season[]
  onEpisodePlay: (episodeId: string) => void
}) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(seasons[0]?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null

  useEffect(() => {
    if (!seasons.length) {
      setSelectedSeasonId(null)
      return
    }
    setSelectedSeasonId((current) => {
      if (current && seasons.some((season) => season.id === current)) return current
      return seasons[0].id
    })
  }, [seasons])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {seasons.map((season) => {
          const active = season.id === selectedSeasonId
          return (
            <button
              key={season.id}
              type="button"
              onClick={() => setSelectedSeasonId(season.id)}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                borderColor: active ? 'var(--ryvo-orange)' : 'var(--border)',
                backgroundColor: active ? 'var(--ryvo-orange)' : 'var(--background)',
                color: active ? '#fffefb' : 'var(--foreground)',
                fontFamily: 'var(--font-inter)',
              }}
            >
              {season.name}
            </button>
          )
        })}
      </div>
      {selectedSeason && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
              {selectedSeason.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
              {selectedSeason.episodes?.length ?? 0} episódios
            </p>
          </div>
          <div className="border-t divide-y" style={{ borderColor: 'var(--border)' }}>
            {selectedSeason.episodes && selectedSeason.episodes.length > 0 ? (
              selectedSeason.episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center gap-3 px-4 py-3 group"
                  style={{ backgroundColor: 'var(--card)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {ep.episode_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                    >
                      {ep.name}
                    </p>
                    {ep.runtime_minutes && (
                      <p
                        className="text-xs"
                        style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                      >
                        {ep.runtime_minutes} min
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onEpisodePlay(ep.id)}
                    disabled={!ep.streaming_url}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-opacity"
                    style={{
                      backgroundColor: ep.streaming_url ? 'var(--ryvo-orange)' : 'var(--muted)',
                      opacity: ep.streaming_url ? 1 : 0.5,
                    }}
                    title={ep.streaming_url ? `Assistir ${ep.name}` : 'Episódio sem streaming URL'}
                  >
                    <Play size={12} fill="white" className="text-white ml-0.5" />
                  </button>
                </div>
              ))
            ) : (
              <p
                className="px-4 py-4 text-xs"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Nenhum episodio disponivel nesta temporada.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SIMILAR CARD
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SimilarCard({ item, onClick }: { item: ContentCard; onClick: (item: ContentCard) => void }) {
  return (
    <button
      onClick={() => onClick(item)}
      className="group rounded-lg border overflow-hidden text-left transition-all duration-300"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <div
              className="w-full h-full opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, var(--ryvo-orange) 0, var(--ryvo-orange) 1px, transparent 0, transparent 50%)`,
                backgroundSize: '8px 8px',
              }}
            />
          </div>
        )}
      </div>
      <div className="p-2">
        <p
          className="text-xs font-semibold truncate transition-colors duration-300"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.title}
        </p>
        <p
          className="text-[10px] transition-colors duration-300"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {item.genres?.[0] ? (typeof item.genres[0] === 'string' ? item.genres[0] : (item.genres[0] as any).name) : (item.type === 'movie' ? 'Filme' : 'Série')}
        </p>
      </div>
    </button>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MAIN MODAL
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function ContentModal({ item, profileId, onClose, onItemClick, onPlaybackUpdated }: ContentModalProps) {
  const { data, isLoading: detailsLoading } = useContentDetails(
    item?.type ?? null,
    item?.id ?? null,
  )
  const { items: watchlistItems, addItem, removeItem, isInWatchlist } = useWatchlist(profileId)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [isPlayerLoading, setIsPlayerLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streamTarget, setStreamTarget] = useState<{
    contentType: StreamContentType
    contentId: string
  } | null>(null)
  const lastProgressSyncRef = useRef(0)
  const playerShellRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Suppress warnings about watchlistItems not being used directly
  void watchlistItems

  const details = data?.details ?? null
  const seriesSeasons: Season[] =
    item?.type === 'series' && details && Array.isArray((details as Partial<SeriesDetails>).seasons)
      ? ((details as Partial<SeriesDetails>).seasons as Season[])
      : []
  const similar = data?.similar ?? []

  const getRatingBadgeConfig = (rawRating?: string | null) => {
    if (!rawRating) return null
    const normalized = rawRating.trim().toUpperCase()
    const fallback = {
      label: normalized,
      backgroundColor: '#334155',
      borderColor: '#475569',
      color: '#f8fafc',
    }

    if (normalized === 'L' || normalized === 'LIVRE' || normalized === '0') {
      return { label: 'L', backgroundColor: '#15803d', borderColor: '#166534', color: '#f0fdf4' }
    }

    const ageValue = Number.parseInt(normalized.replace(/\D/g, ''), 10)
    if (Number.isNaN(ageValue)) return fallback
    if (ageValue >= 18) {
      return { label: '18', backgroundColor: '#b91c1c', borderColor: '#991b1b', color: '#fef2f2' }
    }
    if (ageValue >= 16) {
      return { label: '16', backgroundColor: '#ea580c', borderColor: '#c2410c', color: '#fff7ed' }
    }
    if (ageValue >= 14) {
      return { label: '14', backgroundColor: '#d97706', borderColor: '#b45309', color: '#fffbeb' }
    }
    if (ageValue >= 12) {
      return { label: '12', backgroundColor: '#ca8a04', borderColor: '#a16207', color: '#fefce8' }
    }
    if (ageValue >= 10) {
      return { label: '10', backgroundColor: '#2563eb', borderColor: '#1d4ed8', color: '#eff6ff' }
    }

    return { label: String(ageValue), backgroundColor: '#15803d', borderColor: '#166534', color: '#f0fdf4' }
  }

  const ratingBadge = getRatingBadgeConfig((details as MovieDetails | SeriesDetails | null)?.rating ?? item?.rating)

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [item])

  useEffect(() => {
    if (!item) {
      setIsPlayerOpen(false)
      setIsPlayerLoading(false)
      setCurrentTime(0)
      setDuration(0)
      setStreamTarget(null)
    }
  }, [item])

  const handleWatchlistToggle = useCallback(async () => {
    if (!item || !profileId) return
    setWatchlistLoading(true)
    try {
      if (isInWatchlist(item.id)) {
        await removeItem(item.id)
      } else {
        await addItem(item.id, item.type)
      }
    } catch {
      // silently ignore
    } finally {
      setWatchlistLoading(false)
    }
  }, [item, profileId, isInWatchlist, addItem, removeItem])

  const inList = item ? isInWatchlist(item.id) : false
  const streamUrl = streamTarget ? streamApi.getStreamUrl(streamTarget.contentType, streamTarget.contentId) : null

  const startPlayback = useCallback(
    async (contentType: StreamContentType, contentId: string) => {
      if (!profileId) return
      setIsPlayerOpen(true)
      setIsPlayerLoading(true)
      setStreamTarget({ contentType, contentId })
      lastProgressSyncRef.current = 0
      try {
        await streamApi.saveHistoryEvent({
          profile_id: profileId,
          content_type: contentType,
          content_id: contentId,
          event_type: 'play',
          position_seconds: 0,
        })
      } catch {
        // no-op
      } finally {
        onPlaybackUpdated?.()
      }
    },
    [profileId, onPlaybackUpdated],
  )

  const handlePrimaryPlay = useCallback(() => {
    if (!item || !profileId || item.type !== 'movie') return
    startPlayback('movie', item.id)
  }, [item, profileId, startPlayback])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }, [])

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return
    const total = Number.isFinite(video.duration) ? video.duration : 0
    const nextTime = Math.max(0, Math.min(video.currentTime + seconds, total || video.currentTime + seconds))
    video.currentTime = nextTime
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const setVideoVolume = useCallback((nextVolume: number) => {
    const video = videoRef.current
    if (!video) return
    const normalized = Math.max(0, Math.min(1, nextVolume))
    video.volume = normalized
    video.muted = normalized === 0
    setVolume(normalized)
    setIsMuted(video.muted)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const shell = playerShellRef.current
    if (!shell) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await shell.requestFullscreen()
      }
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const saveStreamState = useCallback(
    async (eventType: 'pause' | 'seek' | 'stop' | 'complete', currentTime: number, duration: number) => {
      if (!profileId || !streamTarget) return
      const position = Math.max(0, Math.floor(currentTime || 0))
      const total = duration > 0 ? Math.floor(duration) : undefined
      try {
        await streamApi.saveProgress({
          profile_id: profileId,
          content_type: streamTarget.contentType,
          content_id: streamTarget.contentId,
          position_seconds: position,
          duration_seconds: total,
        })
        await streamApi.saveHistoryEvent({
          profile_id: profileId,
          content_type: streamTarget.contentType,
          content_id: streamTarget.contentId,
          event_type: eventType,
          position_seconds: position,
          duration_seconds: total,
        })
      } catch {
        // no-op
      } finally {
        onPlaybackUpdated?.()
      }
    },
    [profileId, streamTarget, onPlaybackUpdated],
  )

  const closePlayer = useCallback(() => {
    const video = videoRef.current
    if (video) {
      void saveStreamState('stop', video.currentTime, video.duration)
      video.pause()
    }
    setIsPlayerOpen(false)
  }, [saveStreamState])

  useEffect(() => {
    if (!isPlayerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePlayer()
        return
      }
      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault()
        togglePlayPause()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekBy(10)
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekBy(-10)
        return
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        void toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPlayerOpen, closePlayer, togglePlayPause, seekBy, toggleFullscreen])

  const saveProgressOnly = useCallback(
    async (currentTime: number, duration: number) => {
      if (!profileId || !streamTarget) return
      const position = Math.max(0, Math.floor(currentTime || 0))
      const total = duration > 0 ? Math.floor(duration) : undefined
      try {
        await streamApi.saveProgress({
          profile_id: profileId,
          content_type: streamTarget.contentType,
          content_id: streamTarget.contentId,
          position_seconds: position,
          duration_seconds: total,
        })
      } catch {
        // no-op
      }
    },
    [profileId, streamTarget],
  )

  // Format metadata
  const getMetaChips = () => {
    if (!details) return []
    if (details.type === 'movie') {
      const d = details as MovieDetails
      const chips: string[] = []
      if (d.release_date) chips.push(new Date(d.release_date).getFullYear().toString())
      if (d.runtime_minutes) chips.push(`${d.runtime_minutes} min`)
      return chips
    } else {
      const d = details as SeriesDetails
      const chips: string[] = []
      if (d.first_air_date) chips.push(new Date(d.first_air_date).getFullYear().toString())
      if (d.number_of_seasons) chips.push(`${d.number_of_seasons} temporada${d.number_of_seasons !== 1 ? 's' : ''}`)
      if (d.number_of_episodes) chips.push(`${d.number_of_episodes} eps`)
      return chips
    }
  }

  const formatClock = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '00:00'
    const total = Math.max(0, Math.floor(seconds))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const activeEpisode =
    streamTarget?.contentType === 'episode'
      ? seriesSeasons.flatMap((season) =>
          (season.episodes ?? []).map((episode) => ({
            season_number: season.season_number,
            ...episode,
          })),
        ).find((episode) => episode.id === streamTarget.contentId)
      : null

  return (
    <AnimatePresence>
      {item && (
        <>
          {isPlayerOpen && streamUrl && (
            <motion.div
              ref={playerShellRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80] bg-black"
            >
              {isPlayerLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
                  <div className="flex items-center gap-2 text-white/90">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
                      Carregando player...
                    </span>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                src={streamUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget
                  setDuration(Number.isFinite(video.duration) ? video.duration : 0)
                  setVolume(video.volume)
                  setIsMuted(video.muted)
                }}
                onCanPlay={() => setIsPlayerLoading(false)}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
                onTimeUpdate={(e) => {
                  const now = Date.now()
                  setCurrentTime(e.currentTarget.currentTime || 0)
                  if (now - lastProgressSyncRef.current < 15000) return
                  lastProgressSyncRef.current = now
                  saveProgressOnly(e.currentTarget.currentTime, e.currentTarget.duration)
                }}
                onVolumeChange={(e) => {
                  setVolume(e.currentTarget.volume)
                  setIsMuted(e.currentTarget.muted)
                }}
                onSeeking={(e) => saveStreamState('seek', e.currentTarget.currentTime, e.currentTarget.duration)}
                onEnded={(e) => {
                  setIsPaused(true)
                  saveStreamState('complete', e.currentTarget.currentTime, e.currentTarget.duration)
                }}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

              <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter)' }}>
                    {item.type === 'movie' ? 'Filme' : 'Série'}
                  </p>
                  <h3 className="text-white text-lg md:text-2xl font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>
                    {item.title}
                  </h3>
                  {activeEpisode && (
                    <p className="text-white/80 text-sm mt-1" style={{ fontFamily: 'var(--font-inter)' }}>
                      T{activeEpisode.season_number}E{activeEpisode.episode_number} • {activeEpisode.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={closePlayer}
                  className="pointer-events-auto w-10 h-10 rounded-full border flex items-center justify-center"
                  style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                  aria-label="Fechar player"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-30 p-4 md:p-6">
                <div className="mb-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(duration, 0)}
                    step={1}
                    value={Math.min(currentTime, duration || currentTime)}
                    onChange={(e) => {
                      const video = videoRef.current
                      if (!video) return
                      const next = Number(e.target.value)
                      video.currentTime = next
                      setCurrentTime(next)
                    }}
                    className="w-full accent-[var(--ryvo-orange)]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-white/75" style={{ fontFamily: 'var(--font-inter)' }}>
                    <span>{formatClock(currentTime)}</span>
                    <span>{formatClock(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => seekBy(-10)}
                      className="w-10 h-10 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                      aria-label="Voltar 10 segundos"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff' }}
                      aria-label={isPaused ? 'Reproduzir' : 'Pausar'}
                    >
                      {isPaused ? <Play size={18} fill="white" className="ml-0.5" /> : <Pause size={18} fill="white" />}
                    </button>
                    <button
                      onClick={() => seekBy(10)}
                      className="w-10 h-10 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                      aria-label="Avançar 10 segundos"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                      aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVideoVolume(Number(e.target.value))}
                      className="w-24 md:w-32 accent-[var(--ryvo-orange)]"
                      aria-label="Volume"
                    />
                    <button
                      onClick={() => void toggleFullscreen()}
                      className="w-10 h-10 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff' }}
                      aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                      title="Tela cheia (tecla F)"
                    >
                      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            style={{ backgroundColor: 'var(--ryvo-overlay)' }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full md:max-w-2xl md:rounded-xl border overflow-hidden flex flex-col transition-colors duration-300"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                maxHeight: '90vh',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--ryvo-charcoal)',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)')
                }
                aria-label="Fechar"
              >
                <X size={14} />
              </button>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1">
                {/* Banner */}
                <ModalBanner item={item} details={details} />

                {/* Content */}
                <div className="px-5 pb-24 md:pb-6 -mt-4 relative z-10">
                  {/* Category + title */}
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    {item.type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                  <h2
                    className="text-2xl md:text-3xl font-bold leading-tight mt-1 mb-3 text-balance transition-colors duration-300"
                    style={{
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-syne)',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {item.title}
                  </h2>

                  {/* Loading details */}
                  {detailsLoading && (
                    <div className="flex items-center gap-2 py-4" style={{ color: 'var(--muted-foreground)' }}>
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
                        Carregando detalhes...
                      </span>
                    </div>
                  )}

                  {/* Metadata chips */}
                  {!detailsLoading && (
                    <>
                      {(getMetaChips().length > 0 || ratingBadge) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ratingBadge && (
                            <span
                              className="px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors duration-300"
                              style={{
                                backgroundColor: ratingBadge.backgroundColor,
                                borderColor: ratingBadge.borderColor,
                                color: ratingBadge.color,
                                fontFamily: 'var(--font-inter)',
                              }}
                              title="Classificação indicativa"
                            >
                              {ratingBadge.label}
                            </span>
                          )}
                          {getMetaChips().map((meta, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-full border text-xs font-medium transition-colors duration-300"
                              style={{
                                backgroundColor: 'var(--muted)',
                                borderColor: 'var(--border)',
                                color: 'var(--ryvo-charcoal)',
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              {meta}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Genre chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(details?.genres ?? item.genres ?? []).map((g, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-300"
                            style={{
                              borderColor: 'var(--border)',
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-inter)',
                              backgroundColor: 'transparent',
                            }}
                          >
                            {typeof g === 'string' ? g : (g as any).name}
                          </span>
                        ))}
                      </div>

                      {/* Tagline */}
                      {details && 'tagline' in details && details.tagline && (
                        <p
                          className="text-sm italic mb-3"
                          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                        >
                          &ldquo;{details.tagline}&rdquo;
                        </p>
                      )}

                      {/* Overview / Synopsis */}
                      <p
                        className="text-sm leading-relaxed mb-5 text-pretty transition-colors duration-300"
                        style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                      >
                        {details?.overview ?? item.overview}
                      </p>

                      {/* Cast (movie) */}
                      {details?.type === 'movie' && (details as MovieDetails).cast_members?.length > 0 && (
                        <div className="mb-5">
                          <h4
                            className="text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-300"
                            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                          >
                            Elenco
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(details as MovieDetails).cast_members.slice(0, 8).map((actor, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-1 rounded-lg border transition-colors duration-300"
                                style={{
                                  backgroundColor: 'var(--background)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--ryvo-charcoal)',
                                  fontFamily: 'var(--font-inter)',
                                }}
                              >
                                {actor.name}
                                {actor.character ? ` · ${actor.character}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seasons (series) */}
                      {item.type === 'series' && (
                        <div className="mb-5">
                          <h4
                            className="text-sm font-semibold mb-3 transition-colors duration-300"
                            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                          >
                            Temporadas e Episódios
                          </h4>
                          {seriesSeasons.length > 0 ? (
                            <SeasonsAccordion
                              seasons={seriesSeasons}
                              onEpisodePlay={(episodeId) => startPlayback('episode', episodeId)}
                            />
                          ) : (
                            <p
                              className="text-xs"
                              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                            >
                              Temporadas e episódios ainda não disponíveis para este conteúdo.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Similar content */}
                      {similar.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-semibold mb-3 transition-colors duration-300"
                            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                          >
                            Parecidos com este
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {similar.slice(0, 8).map((sim) => (
                              <SimilarCard key={sim.id} item={sim} onClick={onItemClick} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Sticky action buttons */}
              <div
                className="absolute bottom-0 left-0 right-0 p-4 border-t flex gap-3 md:relative md:border-t md:p-5 transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--card)',
                  borderTopColor: 'var(--muted)',
                }}
              >
                {item.type === 'movie' && (
                  <button
                    onClick={handlePrimaryPlay}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--ryvo-orange)',
                      color: '#fffefb',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    <Play size={14} fill="white" />
                    Assistir agora
                  </button>
                )}
                <button
                  onClick={handleWatchlistToggle}
                  disabled={watchlistLoading || !profileId}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold border transition-all duration-300"
                  style={{
                    backgroundColor: inList ? 'var(--ryvo-orange)' : 'var(--card)',
                    borderColor: inList ? 'var(--ryvo-orange)' : 'var(--border)',
                    color: inList ? '#fffefb' : 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                    opacity: watchlistLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!inList)
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)'
                  }}
                  onMouseLeave={(e) => {
                    if (!inList)
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)'
                  }}
                >
                  {watchlistLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : inList ? (
                    <Check size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {inList ? 'Na minha lista' : 'Adicionar à lista'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
