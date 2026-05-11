'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  streamApi,
  type WatchProgress,
  type WatchHistoryEvent,
  type StreamContentType,
} from '@/lib/api/stream'

export function useWatchProgress(profileId: string | null) {
  const [progress, setProgress] = useState<WatchProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!profileId) {
      setProgress([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await streamApi.listProgress(profileId)
      setProgress(data.progress ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar progresso')
      setProgress([])
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    reload()
  }, [reload])

  return { progress, isLoading, error, reload }
}

export function useWatchHistory(profileId: string | null, limit = 100) {
  const [events, setEvents] = useState<WatchHistoryEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!profileId) {
      setEvents([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await streamApi.listHistory({ profile_id: profileId, limit })
      setEvents(data.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico')
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [profileId, limit])

  useEffect(() => {
    reload()
  }, [reload])

  const trackEvent = useCallback(
    async (
      contentType: StreamContentType,
      contentId: string,
      eventType: 'play' | 'pause' | 'seek' | 'stop' | 'complete',
      positionSeconds: number,
      durationSeconds?: number,
    ) => {
      if (!profileId) return
      await streamApi.saveHistoryEvent({
        profile_id: profileId,
        content_type: contentType,
        content_id: contentId,
        event_type: eventType,
        position_seconds: Math.max(0, Math.floor(positionSeconds || 0)),
        duration_seconds: durationSeconds ? Math.floor(durationSeconds) : undefined,
      })
    },
    [profileId],
  )

  return { events, isLoading, error, reload, trackEvent }
}
