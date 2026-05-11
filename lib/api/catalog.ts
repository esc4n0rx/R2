import { apiRequest } from './client'

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

export interface ContentCard {
  id: string
  type: 'movie' | 'series'
  title: string
  overview: string
  rating?: string | null
  poster_url: string | null
  backdrop_url: string | null
  genres: string[]
  popularity: number
  created_at: string
}

export interface CastMember {
  id?: number
  name: string
  character?: string
  profile_path?: string | null
}

export interface CrewMember {
  id?: number
  name: string
  job?: string
  department?: string
}

export interface Trailer {
  key: string
  name: string
  site?: string
}

export interface Episode {
  id: string
  episode_number: number
  name: string
  overview?: string
  runtime_minutes?: number | null
  streaming_url?: string | null
  still_url?: string | null
}

export interface Season {
  id: string
  season_number: number
  name: string
  overview?: string
  poster_url?: string | null
  air_date?: string | null
  episodes: Episode[]
}

export interface MovieDetails {
  id: string
  type: 'movie'
  title: string
  original_title: string
  overview: string
  rating?: string | null
  tagline: string | null
  release_date: string | null
  runtime_minutes: number | null
  genres: string[]
  poster_url?: string | null
  backdrop_url?: string | null
  cast_members: CastMember[]
  crew: CrewMember[]
  trailers: Trailer[]
  streaming_url: string | null
}

export interface SeriesDetails {
  id: string
  type: 'series'
  name: string
  original_name: string
  overview: string
  rating?: string | null
  tagline: string | null
  first_air_date: string | null
  last_air_date: string | null
  number_of_seasons: number
  number_of_episodes: number
  genres: string[]
  poster_url?: string | null
  backdrop_url?: string | null
  seasons: Season[]
}

export type ContentDetails = MovieDetails | SeriesDetails

export interface ContentDetailsResponse {
  details: ContentDetails
  similar: ContentCard[]
}

export interface ContentListResponse {
  items: ContentCard[]
  total?: number
}

export interface RecommendedResponse {
  has_enough_data: boolean
  message: string
  items: ContentCard[]
}

export interface GenresResponse {
  genres: string[]
  cached: boolean
}

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

export const catalogApi = {
  /** GET /contents/hero?type=movie|series&limit=N */
  getHero(type: 'movie' | 'series', limit = 8): Promise<ContentListResponse> {
    return apiRequest(`/contents/hero?type=${type}&limit=${limit}`)
  },

  /** GET /contents/new?type=movie|series&limit=N&offset=N */
  getNew(type: 'movie' | 'series', limit = 20, offset = 0): Promise<ContentListResponse> {
    return apiRequest(`/contents/new?type=${type}&limit=${limit}&offset=${offset}`)
  },

  /** GET /contents/recommended?profile_id=...&type=...&limit=N */
  getRecommended(
    profileId: string,
    type: 'movie' | 'series' | 'all' = 'all',
    limit = 20,
  ): Promise<RecommendedResponse> {
    return apiRequest(
      `/contents/recommended?profile_id=${profileId}&type=${type}&limit=${limit}`,
    )
  },

  /** GET /contents/search?q=...&type=...&limit=N */
  search(
    q: string,
    type: 'movie' | 'series' | 'all' = 'all',
    limit = 20,
  ): Promise<ContentListResponse> {
    const params = new URLSearchParams({ q, type, limit: String(limit) })
    return apiRequest(`/contents/search?${params}`)
  },

  /** GET /contents/:type/:id?similar_limit=N */
  getDetails(
    type: 'movie' | 'series',
    id: string,
    similarLimit = 8,
  ): Promise<ContentDetailsResponse> {
    return apiRequest(`/contents/${type}/${id}?similar_limit=${similarLimit}`)
  },

  /** GET /discover/genres */
  getGenres(): Promise<GenresResponse> {
    return apiRequest('/discover/genres')
  },

  /** GET /contents/genre/:genre?type=...&limit=N&offset=N */
  getByGenre(
    genre: string,
    type: 'movie' | 'series' | 'all' = 'all',
    limit = 20,
    offset = 0,
  ): Promise<ContentListResponse> {
    const params = new URLSearchParams({ type, limit: String(limit), offset: String(offset) })
    return apiRequest(`/contents/genre/${encodeURIComponent(genre)}?${params}`)
  },
}
