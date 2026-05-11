import { useState, useEffect } from 'react'
import { discoverApi, type ReleasesResponse } from '@/lib/api/discover'

interface UseReleasesResult {
  data: ReleasesResponse | null
  isLoading: boolean
  error: string | null
}

let cachedData: ReleasesResponse | null = null
let cacheTimestamp = 0
const CACHE_TTL = 10 * 60 * 1000 // mirror server TTL: 10 min

export function useReleases(): UseReleasesResult {
  const [data, setData] = useState<ReleasesResponse | null>(cachedData)
  const [isLoading, setIsLoading] = useState(cachedData === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const now = Date.now()
    if (cachedData && now - cacheTimestamp < CACHE_TTL) {
      setData(cachedData)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    discoverApi
      .releases()
      .then((res) => {
        if (cancelled) return
        cachedData = res
        cacheTimestamp = Date.now()
        setData(res)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os lançamentos.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, error }
}
