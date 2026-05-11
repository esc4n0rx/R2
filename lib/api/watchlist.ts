import { apiRequest } from './client'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface WatchlistItem {
  id: string
  profile_id: string
  content_id: string
  content_type: 'movie' | 'series'
  added_at: string
}

export interface WatchlistResponse {
  watchlist: WatchlistItem[]
}

export interface AddWatchlistResponse {
  item: WatchlistItem
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const watchlistApi = {
  /** GET /profiles/:profileId/watchlist */
  list(profileId: string): Promise<WatchlistResponse> {
    return apiRequest(`/profiles/${profileId}/watchlist`)
  },

  /** POST /profiles/:profileId/watchlist */
  add(
    profileId: string,
    contentId: string,
    contentType: 'movie' | 'series',
  ): Promise<AddWatchlistResponse> {
    return apiRequest(`/profiles/${profileId}/watchlist`, {
      method: 'POST',
      body: { content_id: contentId, content_type: contentType },
    })
  },

  /** DELETE /profiles/:profileId/watchlist/:contentId */
  remove(profileId: string, contentId: string): Promise<void> {
    return apiRequest(`/profiles/${profileId}/watchlist/${contentId}`, {
      method: 'DELETE',
    })
  },
}
