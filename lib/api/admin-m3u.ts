import { apiRequest } from './client'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ParsedItem {
  line: number
  type: 'movie' | 'series'
  raw_name: string
  clean_name: string
  year: number | null
  season_number: number | null
  episode_number: number | null
  streaming_url: string
  category: string
  subcategory: string | null
}

export interface ParseStats {
  total: number
  movies: number
  series: number
  skipped_lines: number
}

export interface ParseResponse {
  stats: ParseStats
  items: ParsedItem[]
  total: number
  limit: number
  offset: number
}

export interface ResolvedItem extends ParsedItem {
  tmdb_id: number | null
  tmdb_title: string | null
  tmdb_year: number | null
  tmdb_poster_url: string | null
  confidence: 'high' | 'low' | 'not_found'
  confidence_notes: string | null
}

export interface ResolveSummary {
  total: number
  high: number
  low: number
  not_found: number
}

export interface ResolveResponse {
  resolved: ResolvedItem[]
  summary: ResolveSummary
}

export interface ImportResultItem {
  line: number | null
  type: 'movie' | 'series'
  tmdb_id: number
  action: 'created' | 'updated_url' | 'skipped' | 'failed'
  reason: string | null
  internal_id: string | null
}

export interface ImportSummary {
  total: number
  created: number
  updated_url: number
  skipped: number
  failed: number
}

export interface ImportResponse {
  summary: ImportSummary
  results: ImportResultItem[]
}

export interface BackgroundStartRequest {
  content?: string
  url?: string
  category: string
  subcategory?: string
  status?: 'draft' | 'published'
  language?: string
  tmdb_batch_size?: number
  tmdb_concurrency?: number
  import_concurrency?: number
}

export interface BackgroundStartResponse {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
}

export interface BackgroundStatusResponse {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  category: string
  subcategory: string | null
  progress: {
    parse_total: number
    selected_total: number
    resolved_total: number
    imported_total: number
  }
  summary: {
    total: number
    created: number
    updated_url: number
    skipped: number
    failed: number
    not_found: number
  }
  error: string | null
}

export interface BackgroundLogItem {
  ts: string
  level: 'info' | 'error'
  message: string
}

export interface BackgroundLogsResponse {
  logs: BackgroundLogItem[]
  next_cursor: number
  has_more: boolean
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

// SSE event payloads
export interface SseProgress {
  parsed: number
  movies: number
  series: number
  percent: number
  elapsed_ms: number
}
export interface SseLog { message: string }
export interface SseItems extends Array<ParsedItem> {}
export interface SseDone { stats: ParseStats }
export interface SseError { message: string }

export type SseEvent =
  | { type: 'log';      data: SseLog }
  | { type: 'progress'; data: SseProgress }
  | { type: 'items';    data: SseItems }
  | { type: 'done';     data: SseDone }
  | { type: 'error';    data: SseError }

export const m3uApi = {
  /**
   * POST /admin/contents/m3u/parse — responds with text/event-stream (SSE).
   * Use fetch + ReadableStream (NOT EventSource, which only supports GET).
   */
  async parseStream(
    body: { content?: string; url?: string; limit?: number; offset?: number },
    onEvent: (event: SseEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/contents/m3u/parse`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: 'Erro ao conectar ao servidor' }))
      throw new Error(err?.error ?? `HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE format: lines separated by \n\n
      const blocks = buffer.split(/\n\n/)
      buffer = blocks.pop() ?? ''

      for (const block of blocks) {
        let eventType = ''
        let dataStr = ''
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim()
          if (line.startsWith('data:'))  dataStr  = line.slice(5).trim()
        }
        if (!eventType || !dataStr) continue
        try {
          const parsed = JSON.parse(dataStr)
          onEvent({ type: eventType as SseEvent['type'], data: parsed })
        } catch { /* ignore malformed */ }
      }
    }
  },

  /** POST /admin/contents/m3u/resolve — max 50 items per call */
  resolve(items: ParsedItem[], language = 'pt-BR', throttle_ms = 100): Promise<ResolveResponse> {
    return apiRequest('/admin/contents/m3u/resolve', {
      method: 'POST',
      body: { items, language, throttle_ms },
    })
  },

  /** POST /admin/contents/m3u/import — max 100 items per call */
  import(items: object[], line_ref?: number[]): Promise<ImportResponse> {
    return apiRequest('/admin/contents/m3u/import', {
      method: 'POST',
      body: { items, ...(line_ref ? { line_ref } : {}) },
    })
  },

  startBackground(payload: BackgroundStartRequest): Promise<BackgroundStartResponse> {
    return apiRequest('/admin/contents/m3u/import/background/start', {
      method: 'POST',
      body: payload,
    })
  },

  getBackgroundStatus(jobId: string): Promise<BackgroundStatusResponse> {
    return apiRequest(`/admin/contents/m3u/import/background/${jobId}`, {
      method: 'GET',
    })
  },

  getBackgroundLogs(jobId: string, cursor = 0, limit = 200): Promise<BackgroundLogsResponse> {
    return apiRequest(`/admin/contents/m3u/import/background/${jobId}/logs?cursor=${cursor}&limit=${limit}`, {
      method: 'GET',
    })
  },
}
