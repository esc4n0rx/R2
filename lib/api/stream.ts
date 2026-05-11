import { apiRequest, API_BASE_URL } from './client'

export type StreamContentType = 'movie' | 'episode'
export type StreamEventType = 'play' | 'pause' | 'seek' | 'stop' | 'complete'

export interface WatchProgress {
  id: string
  profile_id: string
  content_type: StreamContentType
  content_id: string
  position_seconds: number
  duration_seconds: number | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface WatchHistoryEvent {
  id: string
  profile_id: string
  content_type: StreamContentType
  content_id: string
  event_type: StreamEventType
  position_seconds: number
  duration_seconds: number | null
  occurred_at: string
  created_at: string
}

export interface ProgressListResponse {
  progress: WatchProgress[]
}

export interface ProgressItemResponse {
  progress: WatchProgress | null
}

export interface ProgressSaveResponse {
  progress: WatchProgress
}

export interface HistoryListResponse {
  events: WatchHistoryEvent[]
}

export interface HistorySaveResponse {
  event: WatchHistoryEvent
}

export const streamApi = {
  getStreamUrl(contentType: StreamContentType, contentId: string) {
    return `${API_BASE_URL}/stream/${contentType}/${contentId}`
  },

  listProgress(profileId: string): Promise<ProgressListResponse> {
    return apiRequest(`/stream/progress?profile_id=${profileId}`)
  },

  getProgressItem(
    profileId: string,
    contentType: StreamContentType,
    contentId: string,
  ): Promise<ProgressItemResponse> {
    return apiRequest(`/stream/progress/${contentType}/${contentId}?profile_id=${profileId}`)
  },

  saveProgress(input: {
    profile_id: string
    content_type: StreamContentType
    content_id: string
    position_seconds: number
    duration_seconds?: number
  }): Promise<ProgressSaveResponse> {
    return apiRequest('/stream/progress', {
      method: 'POST',
      body: input,
    })
  },

  listHistory(input: {
    profile_id: string
    content_type?: StreamContentType
    limit?: number
    offset?: number
  }): Promise<HistoryListResponse> {
    const params = new URLSearchParams({
      profile_id: input.profile_id,
      ...(input.content_type ? { content_type: input.content_type } : {}),
      ...(input.limit ? { limit: String(input.limit) } : {}),
      ...(input.offset ? { offset: String(input.offset) } : {}),
    })
    return apiRequest(`/stream/history?${params}`)
  },

  saveHistoryEvent(input: {
    profile_id: string
    content_type: StreamContentType
    content_id: string
    event_type: StreamEventType
    position_seconds: number
    duration_seconds?: number
    occurred_at?: string
  }): Promise<HistorySaveResponse> {
    return apiRequest('/stream/history/events', {
      method: 'POST',
      body: {
        ...input,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      },
    })
  },
}
