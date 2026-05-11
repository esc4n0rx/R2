import { apiRequest } from './client'

export type AdminContentStatus = 'draft' | 'published'

export interface AdminMovie {
  id: string
  tmdb_id: number
  title: string
  release_date: string | null
  genres: { tmdb_id: number; name: string }[]
  status: AdminContentStatus
  poster_url: string | null
  backdrop_url: string | null
  overview: string
  streaming_url: string | null
}

export interface AdminEpisode {
  id: string
  episode_number: number
  name: string
  streaming_url: string | null
}

export interface AdminSeason {
  id: string
  season_number: number
  episodes: AdminEpisode[]
}

export interface AdminSeries {
  id: string
  tmdb_id: number
  name: string
  first_air_date: string | null
  genres: { tmdb_id: number; name: string }[]
  status: AdminContentStatus
  poster_url: string | null
  backdrop_url: string | null
  overview: string
  seasons?: AdminSeason[]
}

export interface SeriesDetailResponse {
  series: AdminSeries
}

export interface MovieDetailResponse {
  movie: AdminMovie
}

interface ListMoviesResponse {
  movies: AdminMovie[]
  total: number
}

interface ListSeriesResponse {
  series: AdminSeries[]
  total: number
}

export interface MovieSearchResult {
  tmdb_id: number
  title: string
  original_title: string
  overview: string
  release_date: string | null
  popularity: number
  vote_average: number
  poster_url: string | null
}

export interface SeriesSearchResult {
  tmdb_id: number
  name: string
  original_name: string
  overview: string
  first_air_date: string | null
  popularity: number
  vote_average: number
  poster_url: string | null
}

export const adminContentsApi = {
  searchMovies(q: string, page = 1, language = 'pt-BR'): Promise<{ results: MovieSearchResult[]; total: number }> {
    const query = encodeURIComponent(q)
    const lang = encodeURIComponent(language)
    return apiRequest(`/admin/contents/movies/search?q=${query}&page=${page}&language=${lang}`, {
      method: 'GET',
    })
  },

  searchSeries(q: string, page = 1, language = 'pt-BR'): Promise<{ results: SeriesSearchResult[]; total: number }> {
    const query = encodeURIComponent(q)
    const lang = encodeURIComponent(language)
    return apiRequest(`/admin/contents/series/search?q=${query}&page=${page}&language=${lang}`, {
      method: 'GET',
    })
  },

  listMovies(page = 1, limit = 100): Promise<ListMoviesResponse> {
    return apiRequest(`/admin/contents/movies?page=${page}&limit=${limit}`, { method: 'GET' })
  },

  listSeries(page = 1, limit = 100): Promise<ListSeriesResponse> {
    return apiRequest(`/admin/contents/series?page=${page}&limit=${limit}`, { method: 'GET' })
  },

  getMovie(id: string): Promise<MovieDetailResponse> {
    return apiRequest(`/admin/contents/movies/${id}`, { method: 'GET' })
  },

  getSeries(id: string): Promise<SeriesDetailResponse> {
    return apiRequest(`/admin/contents/series/${id}`, { method: 'GET' })
  },

  addMovie(payload: {
    tmdb_id: number
    language?: string
    status?: AdminContentStatus
  }): Promise<{ movie: AdminMovie }> {
    return apiRequest('/admin/contents/movies', { method: 'POST', body: payload })
  },

  addSeries(payload: {
    tmdb_id: number
    language?: string
    status?: AdminContentStatus
    fetch_episodes?: boolean
  }): Promise<{ series: AdminSeries }> {
    return apiRequest('/admin/contents/series', { method: 'POST', body: payload })
  },

  updateMovie(id: string, payload: Partial<Pick<AdminMovie, 'title' | 'overview' | 'status' | 'streaming_url'>>): Promise<{ movie: AdminMovie }> {
    return apiRequest(`/admin/contents/movies/${id}`, { method: 'PATCH', body: payload })
  },

  updateSeries(id: string, payload: Partial<Pick<AdminSeries, 'name' | 'overview' | 'status'>>): Promise<{ series: AdminSeries }> {
    return apiRequest(`/admin/contents/series/${id}`, { method: 'PATCH', body: payload })
  },

  updateEpisode(episodeId: string, payload: { streaming_url: string | null }): Promise<{ episode: AdminEpisode }> {
    return apiRequest(`/admin/contents/series/episodes/${episodeId}`, { method: 'PATCH', body: payload })
  },

  deleteMovie(id: string): Promise<void> {
    return apiRequest(`/admin/contents/movies/${id}`, { method: 'DELETE' })
  },

  deleteSeries(id: string): Promise<void> {
    return apiRequest(`/admin/contents/series/${id}`, { method: 'DELETE' })
  },
}
