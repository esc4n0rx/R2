'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  catalogApi,
  type ContentCard,
  type ContentDetailsResponse,
  type RecommendedResponse,
  type GenresResponse,
} from '@/lib/api/catalog'
import { watchlistApi, type WatchlistItem } from '@/lib/api/watchlist'
import { ApiError } from '@/lib/api/client'

// ─────────────────────────────────────────────
// Generic fetch hook
// ─────────────────────────────────────────────

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

function useFetch<T>(fetchFn: () => Promise<T>, deps: unknown[]): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false
    setState({ data: null, isLoading: true, error: null })
    fetchFn()
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, error: null })
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Erro desconhecido'
          setState({ data: null, isLoading: false, error: msg })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────

export function useHero(type: 'movie' | 'series') {
  return useFetch<{ items: ContentCard[] }>(
    () => catalogApi.getHero(type, 8),
    [type],
  )
}

// ─────────────────────────────────────────────
// New Releases
// ─────────────────────────────────────────────

export function useNewReleases(type: 'movie' | 'series') {
  return useFetch<{ items: ContentCard[] }>(
    () => catalogApi.getNew(type, 20),
    [type],
  )
}

// ─────────────────────────────────────────────
// Recommended
// ─────────────────────────────────────────────

export function useRecommended(profileId: string | null, type: 'movie' | 'series' | 'all' = 'all') {
  return useFetch<RecommendedResponse>(
    () =>
      profileId
        ? catalogApi.getRecommended(profileId, type, 20)
        : Promise.resolve({ has_enough_data: false, message: '', items: [] }),
    [profileId, type],
  )
}

// ─────────────────────────────────────────────
// Content Details (for modal)
// ─────────────────────────────────────────────

export function useContentDetails(
  type: 'movie' | 'series' | null,
  id: string | null,
) {
  return useFetch<ContentDetailsResponse>(
    () =>
      type && id
        ? catalogApi.getDetails(type, id)
        : Promise.resolve({ details: null as unknown as ContentDetailsResponse['details'], similar: [] }),
    [type, id],
  )
}

// ─────────────────────────────────────────────
// Search (debounced)
// ─────────────────────────────────────────────

interface SearchState {
  results: ContentCard[]
  isLoading: boolean
  error: string | null
}

export function useSearch(query: string, type: 'movie' | 'series' | 'all' = 'all') {
  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setState({ results: [], isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    timerRef.current = setTimeout(async () => {
      try {
        const data = await catalogApi.search(trimmed, type, 20)
        setState({ results: data.items ?? [], isLoading: false, error: null })
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Erro na busca'
        setState({ results: [], isLoading: false, error: msg })
      }
    }, 400)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, type])

  return state
}

// ─────────────────────────────────────────────
// Genres list
// ─────────────────────────────────────────────

export function useGenres() {
  return useFetch<GenresResponse>(
    () => catalogApi.getGenres(),
    [],
  )
}

// ─────────────────────────────────────────────
// Genre browse (infinite scroll)
// ─────────────────────────────────────────────

const PAGE_SIZE = 20

interface GenreBrowseState {
  items: ContentCard[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: string | null
}

export function useGenreBrowse(
  genre: string | null,
  type: 'movie' | 'series' | 'all' = 'all',
) {
  const [state, setState] = useState<GenreBrowseState>({
    items: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
  })
  const offsetRef = useRef(0)
  const activeGenreRef = useRef<string | null>(null)

  // Load first page whenever genre or type changes
  useEffect(() => {
    if (!genre) {
      setState({ items: [], isLoading: false, isLoadingMore: false, hasMore: false, error: null })
      return
    }
    activeGenreRef.current = genre
    offsetRef.current = 0
    setState({ items: [], isLoading: true, isLoadingMore: false, hasMore: false, error: null })

    catalogApi.getByGenre(genre, type, PAGE_SIZE, 0)
      .then((data) => {
        if (activeGenreRef.current !== genre) return
        const items = data.items ?? []
        offsetRef.current = items.length
        setState({
          items,
          isLoading: false,
          isLoadingMore: false,
          hasMore: items.length === PAGE_SIZE,
          error: null,
        })
      })
      .catch((err) => {
        if (activeGenreRef.current !== genre) return
        setState({
          items: [],
          isLoading: false,
          isLoadingMore: false,
          hasMore: false,
          error: err instanceof Error ? err.message : 'Erro ao carregar',
        })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, type])

  const loadMore = useCallback(async () => {
    if (!genre || state.isLoadingMore || !state.hasMore) return
    setState((prev) => ({ ...prev, isLoadingMore: true }))
    try {
      const data = await catalogApi.getByGenre(genre, type, PAGE_SIZE, offsetRef.current)
      const newItems = data.items ?? []
      offsetRef.current += newItems.length
      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
        isLoadingMore: false,
        hasMore: newItems.length === PAGE_SIZE,
      }))
    } catch {
      setState((prev) => ({ ...prev, isLoadingMore: false }))
    }
  }, [genre, type, state.isLoadingMore, state.hasMore])

  return { ...state, loadMore }
}

// ─────────────────────────────────────────────
// Watchlist
// ─────────────────────────────────────────────

interface WatchlistState {
  items: WatchlistItem[]
  isLoading: boolean
  error: string | null
}

export function useWatchlist(profileId: string | null) {
  const [state, setState] = useState<WatchlistState>({
    items: [],
    isLoading: false,
    error: null,
  })

  const load = useCallback(async () => {
    if (!profileId) {
      setState({ items: [], isLoading: false, error: null })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const data = await watchlistApi.list(profileId)
      setState({ items: data.watchlist ?? [], isLoading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar lista'
      setState({ items: [], isLoading: false, error: msg })
    }
  }, [profileId])

  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(
    async (contentId: string, contentType: 'movie' | 'series') => {
      if (!profileId) return
      const data = await watchlistApi.add(profileId, contentId, contentType)
      setState((prev) => ({ ...prev, items: [data.item, ...prev.items] }))
    },
    [profileId],
  )

  const removeItem = useCallback(
    async (contentId: string) => {
      if (!profileId) return
      await watchlistApi.remove(profileId, contentId)
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.content_id !== contentId),
      }))
    },
    [profileId],
  )

  const isInWatchlist = useCallback(
    (contentId: string) => state.items.some((i) => i.content_id === contentId),
    [state.items],
  )

  return { ...state, addItem, removeItem, isInWatchlist, reload: load }
}
