'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { m3uApi, type BackgroundLogItem, type BackgroundStatusResponse } from '@/lib/api/admin-m3u'

const STORAGE_KEY = 'ryvo_m3u_background_job_id'
const LAST_STATUS_KEY = 'ryvo_m3u_background_last_status'

export function setBackgroundJobId(jobId: string | null) {
  if (typeof window === 'undefined') return
  if (!jobId) window.localStorage.removeItem(STORAGE_KEY)
  else window.localStorage.setItem(STORAGE_KEY, jobId)
  window.dispatchEvent(new Event('ryvo:m3u-background-job'))
}

function getStoredJobId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export function useM3uBackgroundStatus() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<BackgroundStatusResponse | null>(null)
  const [logs, setLogs] = useState<BackgroundLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const cursorRef = useRef(0)

  const refreshJob = useCallback(() => setJobId(getStoredJobId()), [])

  useEffect(() => {
    refreshJob()
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(LAST_STATUS_KEY)
      if (raw) {
        try {
          setStatus(JSON.parse(raw) as BackgroundStatusResponse)
        } catch {
          window.localStorage.removeItem(LAST_STATUS_KEY)
        }
      }
    }
    const onChange = () => refreshJob()
    window.addEventListener('storage', onChange)
    window.addEventListener('ryvo:m3u-background-job', onChange)
    return () => {
      window.removeEventListener('storage', onChange)
      window.removeEventListener('ryvo:m3u-background-job', onChange)
    }
  }, [refreshJob])

  useEffect(() => {
    if (!jobId) {
      setStatus(null)
      setLogs([])
      cursorRef.current = 0
      return
    }

    let cancelled = false
    let statusTimer: ReturnType<typeof setTimeout> | null = null
    let logsTimer: ReturnType<typeof setTimeout> | null = null

    const isFinal = (s: string) => s === 'completed' || s === 'failed' || s === 'cancelled'

    const pollStatus = async () => {
      if (cancelled) return
      setLoading(true)
      try {
        const next = await m3uApi.getBackgroundStatus(jobId)
        if (cancelled) return
        setStatus(next)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LAST_STATUS_KEY, JSON.stringify(next))
        }
        if (isFinal(next.status)) {
          setBackgroundJobId(null)
          return
        }
        statusTimer = setTimeout(pollStatus, 2000)
      } catch {
        if (!cancelled) statusTimer = setTimeout(pollStatus, 5000)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const pollLogs = async () => {
      if (cancelled) return
      try {
        const data = await m3uApi.getBackgroundLogs(jobId, cursorRef.current, 200)
        if (cancelled) return
        cursorRef.current = data.next_cursor
        if (data.logs.length) setLogs((prev) => [...prev.slice(-299), ...data.logs])
        logsTimer = setTimeout(pollLogs, data.has_more ? 0 : 1500)
      } catch {
        if (!cancelled) logsTimer = setTimeout(pollLogs, 5000)
      }
    }

    void pollStatus()
    void pollLogs()
    return () => {
      cancelled = true
      if (statusTimer) clearTimeout(statusTimer)
      if (logsTimer) clearTimeout(logsTimer)
    }
  }, [jobId])

  return { jobId, status, logs, loading, hasActiveJob: Boolean(jobId) }
}
