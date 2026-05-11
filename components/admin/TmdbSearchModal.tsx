'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, AlertCircle, Loader2, Search, Star } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import {
  adminContentsApi,
  type MovieSearchResult,
  type SeriesSearchResult,
} from '@/lib/api/admin-contents'

interface TmdbSearchModalProps {
  onClose: () => void
  onImported: () => void
}

export default function TmdbSearchModal({ onClose, onImported }: TmdbSearchModalProps) {
  const [type, setType] = useState<'movie' | 'series'>('movie')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [movieResults, setMovieResults] = useState<MovieSearchResult[]>([])
  const [seriesResults, setSeriesResults] = useState<SeriesSearchResult[]>([])
  const [tmdbId, setTmdbId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [fetchEpisodes, setFetchEpisodes] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!query.trim()) {
      setMovieResults([])
      setSeriesResults([])
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      setError('')
      try {
        if (type === 'movie') {
          const data = await adminContentsApi.searchMovies(query.trim())
          setMovieResults(data.results)
          setSeriesResults([])
        } else {
          const data = await adminContentsApi.searchSeries(query.trim())
          setSeriesResults(data.results)
          setMovieResults([])
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Falha ao buscar conteudo.')
        }
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [query, type])

  async function handleImport() {
    const id = Number(tmdbId)
    if (!Number.isInteger(id) || id <= 0) {
      setError('Informe um tmdb_id valido (inteiro positivo).')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (type === 'movie') {
        await adminContentsApi.addMovie({ tmdb_id: id, status, language: 'pt-BR' })
      } else {
        await adminContentsApi.addSeries({ tmdb_id: id, status, language: 'pt-BR', fetch_episodes: fetchEpisodes })
      }
      onImported()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Falha ao importar conteudo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const results = type === 'movie' ? movieResults : seriesResults

  return (
    <AnimatePresence>
      <motion.div key="tmdb-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ryvo-overlay)' }} onClick={onClose} />
      <motion.div key="tmdb-modal" initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ type: 'spring', stiffness: 360, damping: 32 }} className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="relative w-full max-w-xl flex flex-col rounded-2xl border overflow-hidden pointer-events-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderBottomColor: 'var(--border)' }}>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Importar Conteudo</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Busque por nome para obter o TMDB ID e importar.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }}><X size={18} /></button>
          </div>

          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setType('movie')} className="py-2 rounded-lg border text-sm" style={{ borderColor: type === 'movie' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Filme</button>
              <button onClick={() => setType('series')} className="py-2 rounded-lg border text-sm" style={{ borderColor: type === 'series' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Serie</button>
            </div>

            <div>
              <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Buscar por nome</label>
              <div className="relative mt-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={type === 'movie' ? 'Ex: Clube da Luta' : 'Ex: Breaking Bad'} className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
              </div>
            </div>

            {query.trim() && (
              <div className="max-h-56 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                {searching ? (
                  <div className="px-3 py-4 flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                    <Loader2 size={13} className="animate-spin" />
                    Buscando...
                  </div>
                ) : results.length === 0 ? (
                  <p className="px-3 py-4 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Nenhum resultado.</p>
                ) : (
                  results.map((item) => {
                    const title = type === 'movie' ? (item as MovieSearchResult).title : (item as SeriesSearchResult).name
                    const date = type === 'movie' ? (item as MovieSearchResult).release_date : (item as SeriesSearchResult).first_air_date
                    return (
                      <button key={item.tmdb_id} onClick={() => setTmdbId(String(item.tmdb_id))} className="w-full text-left px-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{title}</p>
                        <p className="text-xs flex items-center gap-2" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                          <span>ID: {item.tmdb_id}</span>
                          <span>{date?.slice(0, 4) ?? '-'}</span>
                          <span className="inline-flex items-center gap-1"><Star size={10} />{item.vote_average?.toFixed(1) ?? '0.0'}</span>
                        </p>
                      </button>
                    )
                  })
                )}
              </div>
            )}

            <div>
              <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>TMDB ID selecionado</label>
              <input value={tmdbId} onChange={(e) => setTmdbId(e.target.value.replace(/\D/g, ''))} placeholder={type === 'movie' ? 'Ex: 550' : 'Ex: 1396'} className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
            </div>

            <div>
              <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Status inicial</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setStatus('draft')} className="py-2 rounded-lg border text-sm" style={{ borderColor: status === 'draft' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Rascunho</button>
                <button onClick={() => setStatus('published')} className="py-2 rounded-lg border text-sm" style={{ borderColor: status === 'published' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Publicado</button>
              </div>
            </div>

            {type === 'series' && (
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                <input type="checkbox" checked={fetchEpisodes} onChange={(e) => setFetchEpisodes(e.target.checked)} />
                Buscar episodios na importacao
              </label>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={13} color="#ef4444" />
                <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>
              </div>
            )}

            <button onClick={() => void handleImport()} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', fontFamily: 'var(--font-inter)', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
