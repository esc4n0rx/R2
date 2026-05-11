'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminAutoM3uApi, type AutoM3uSource, type SyncLogItem, type SyncStatusResponse } from '@/lib/api/admin-auto-m3u'

export function useAutoM3u() {
  const [sources, setSources] = useState<AutoM3uSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSources = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminAutoM3uApi.listSources()
      setSources(data.playlists ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fontes auto-sync')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSources()
  }, [loadSources])

  const summary = useMemo(() => {
    const syncing = sources.filter((s) => s.status === 'syncing').length
    const errorCount = sources.filter((s) => s.status === 'error').length
    const enabled = sources.filter((s) => s.auto_sync_enabled).length
    return {
      total: sources.length,
      syncing,
      error: errorCount,
      enabled,
      overallStatus: syncing > 0 ? 'syncing' : errorCount > 0 ? 'error' : 'idle',
    }
  }, [sources])

  return { sources, setSources, summary, loading, error, loadSources }
}

export function useAutoM3uSyncMonitor(sourceId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null)
  const [logs, setLogs] = useState<SyncLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const cursorRef = useRef(0)

  const resetLogs = useCallback(() => {
    setLogs([])
    cursorRef.current = 0
  }, [])

  useEffect(() => {
    if (!sourceId || !enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (cancelled) return
      setLoading(true)
      try {
        const nextStatus = await adminAutoM3uApi.getSyncStatus(sourceId)
        if (cancelled) return
        setStatus(nextStatus)
        if (nextStatus.is_active) {
          const logsData = await adminAutoM3uApi.getSyncLogs(sourceId, cursorRef.current, 200)
          if (!cancelled) {
            cursorRef.current = logsData.next_cursor
            if (logsData.logs.length > 0) setLogs((prev) => [...prev.slice(-399), ...logsData.logs])
          }
          timer = setTimeout(tick, 5000)
          return
        }
        timer = setTimeout(tick, 10000)
      } catch {
        if (!cancelled) timer = setTimeout(tick, 8000)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sourceId, enabled])

  return { status, logs, loading, resetLogs }
}

