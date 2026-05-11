import { apiRequest } from './client'

export type AutoM3uSourceStatus = 'idle' | 'syncing' | 'error'

export interface AutoM3uFilter {
  category: string
  subcategory: string | null
}

export interface AutoM3uSummary {
  total: number
  created: number
  updated_url: number
  skipped: number
  failed: number
  not_found: number
  filters_processed: number
}

export interface AutoM3uSource {
  id: string
  name: string
  url: string
  active_filters: AutoM3uFilter[]
  language: string
  tmdb_batch_size: number
  tmdb_concurrency: number
  import_concurrency: number
  auto_sync_enabled: boolean
  sync_hour: number
  status: AutoM3uSourceStatus
  last_sync_at: string | null
  last_sync_summary: AutoM3uSummary | null
  last_sync_error: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface DiscoverCategory {
  category: string
  total: number
  subcategories: Array<{ name: string | null; count: number }>
}

export interface DiscoverResponse {
  total_categories: number
  categories: DiscoverCategory[]
}

export interface ListSourcesResponse {
  total: number
  playlists: AutoM3uSource[]
}

export interface SyncStatusResponse {
  playlist_id: string
  is_active: boolean
  progress: {
    parsed: number
    resolved: number
    imported: number
    current_filter: string
  } | null
  db_status: AutoM3uSourceStatus
  last_sync_at: string | null
  last_sync_summary: AutoM3uSummary | null
  last_sync_error: string | null
}

export interface SyncLogItem {
  ts: string
  level: 'info' | 'error'
  message: string
}

export interface SyncLogsResponse {
  logs: SyncLogItem[]
  next_cursor: number
  has_more: boolean
}

export const adminAutoM3uApi = {
  discover(url: string, language = 'pt-BR'): Promise<DiscoverResponse> {
    return apiRequest('/admin/contents/auto-m3u/discover', {
      method: 'POST',
      body: { url, language },
    })
  },

  createSource(payload: {
    name: string
    url: string
    active_filters: AutoM3uFilter[]
    language?: string
    tmdb_batch_size?: number
    tmdb_concurrency?: number
    import_concurrency?: number
    auto_sync_enabled?: boolean
    sync_hour?: number
  }): Promise<AutoM3uSource> {
    return apiRequest('/admin/contents/auto-m3u/sources', {
      method: 'POST',
      body: payload,
    })
  },

  listSources(): Promise<ListSourcesResponse> {
    return apiRequest('/admin/contents/auto-m3u/sources', { method: 'GET' })
  },

  getSource(id: string): Promise<AutoM3uSource> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}`, { method: 'GET' })
  },

  updateSource(
    id: string,
    payload: Partial<{
      name: string
      active_filters: AutoM3uFilter[]
      language: string
      tmdb_batch_size: number
      tmdb_concurrency: number
      import_concurrency: number
      auto_sync_enabled: boolean
      sync_hour: number
    }>,
  ): Promise<AutoM3uSource> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}`, {
      method: 'PATCH',
      body: payload,
    })
  },

  deleteSource(id: string): Promise<void> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}`, { method: 'DELETE' })
  },

  triggerSync(id: string): Promise<{ started: boolean; reason?: string }> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}/sync`, { method: 'POST' })
  },

  getSyncStatus(id: string): Promise<SyncStatusResponse> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}/sync/status`, { method: 'GET' })
  },

  getSyncLogs(id: string, cursor = 0, limit = 100): Promise<SyncLogsResponse> {
    return apiRequest(`/admin/contents/auto-m3u/sources/${id}/sync/logs?cursor=${cursor}&limit=${limit}`, {
      method: 'GET',
    })
  },
}

