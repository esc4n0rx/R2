import { apiRequest } from './client'

export interface ReleaseItem {
  tmdb_id: number
  title: string
  overview: string
  poster_url: string
  backdrop_url: string
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  media_type: 'movie' | 'tv'
}

export interface ReleasesResponse {
  movies: ReleaseItem[]
  series: ReleaseItem[]
  cached: boolean
}

export const discoverApi = {
  releases(): Promise<ReleasesResponse> {
    return apiRequest('/discover/releases', { method: 'GET' })
  },
}

const GENRE_MAP: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
  10759: 'Ação & Aventura',
  10762: 'Infantil',
  10764: 'Reality',
  10765: 'Ficção Científica',
  10766: 'Novela',
}

export function getGenreLabel(genre_ids: number[]): string {
  for (const id of genre_ids) {
    if (GENRE_MAP[id]) return GENRE_MAP[id]
  }
  return 'Lançamento'
}

export function getReleaseYear(release_date: string): number {
  return new Date(release_date).getFullYear() || new Date().getFullYear()
}
