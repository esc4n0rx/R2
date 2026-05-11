'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Tv,
  Plus,
  Trash2,
  Archive,
  Search,
  Filter,
  LogOut,
  LayoutGrid,
  List,
  TrendingUp,
  FileText,
  BookOpen,
  ChevronDown,
  Pencil,
  X,
  Server,
  Loader2,
} from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { adminContentsApi, type AdminMovie, type AdminSeries } from '@/lib/api/admin-contents'
import TmdbSearchModal from './TmdbSearchModal'
import M3uImportModal from './m3u/M3uImportModal'
import { useM3uBackgroundStatus } from '@/hooks/use-m3u-background'
import AutoM3uManagerModal from './auto-m3u/AutoM3uManagerModal'
import { useAutoM3u } from '@/hooks/use-auto-m3u'

interface AdminDashboardProps {
  onSignOut: () => void
  userId?: string
}

type FilterStatus = 'all' | 'published' | 'draft'
type ViewMode = 'table' | 'grid'
type ContentItem = {
  id: string
  title: string
  genre: string[]
  year: number
  category: 'Filme' | 'Serie'
  status: 'draft' | 'published'
  posterColor: string
}

type EpisodeUrlItem = {
  id: string
  seasonNumber: number
  episodeNumber: number
  name: string
  streamingUrl: string
}

type EditModalState = {
  id: string
  category: 'Filme' | 'Serie'
  title: string
  overview: string
  status: 'draft' | 'published'
  streamingUrl: string
  episodeUrls: EpisodeUrlItem[]
  forcePublish: boolean
}

const toColor = (value: number) => `hsl(${(value * 37) % 360}, 35%, 22%)`

export default function AdminDashboard({ onSignOut, userId }: AdminDashboardProps) {
  const [movies, setMovies] = useState<AdminMovie[]>([])
  const [series, setSeries] = useState<AdminSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tmdbOpen, setTmdbOpen] = useState(false)
  const [m3uOpen, setM3uOpen] = useState(false)
  const [autoM3uOpen, setAutoM3uOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterType, setFilterType] = useState<'all' | 'Filme' | 'Serie'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [editModal, setEditModal] = useState<EditModalState | null>(null)
  const [saving, setSaving] = useState(false)
  const [backgroundOpen, setBackgroundOpen] = useState(false)
  const { status: backgroundStatus, logs: backgroundLogs, loading: backgroundLoading, hasActiveJob } = useM3uBackgroundStatus()
  const { summary: autoSummary } = useAutoM3u()

  useEffect(() => {
    console.log('[admin] authenticated user id:', userId ?? '(missing)')
    void refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const [movieData, seriesData] = await Promise.all([
        adminContentsApi.listMovies(),
        adminContentsApi.listSeries(),
      ])
      setMovies(movieData.movies)
      setSeries(seriesData.series)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Sessao expirada. Faca login novamente.')
          onSignOut()
        } else if (err.status === 403) {
          console.log('[admin] forbidden for user id:', userId ?? '(missing)')
          setError('Acesso negado. Sua conta nao possui permissao de administrador.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Nao foi possivel carregar o catalogo admin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const catalog = useMemo<ContentItem[]>(() => {
    const movieItems = movies.map((item) => ({
      id: item.id,
      title: item.title,
      genre: item.genres?.map((g) => g.name) ?? [],
      year: item.release_date ? new Date(item.release_date).getFullYear() : 0,
      category: 'Filme' as const,
      status: item.status,
      posterColor: toColor(item.tmdb_id),
    }))

    const seriesItems = series.map((item) => ({
      id: item.id,
      title: item.name,
      genre: item.genres?.map((g) => g.name) ?? [],
      year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 0,
      category: 'Serie' as const,
      status: item.status,
      posterColor: toColor(item.tmdb_id),
    }))

    return [...movieItems, ...seriesItems]
  }, [movies, series])

  async function openEditModal(item: ContentItem, forcePublish = false) {
    try {
      if (item.category === 'Filme') {
        const data = await adminContentsApi.getMovie(item.id)
        const movie = data.movie
        setEditModal({
          id: movie.id,
          category: 'Filme',
          title: movie.title,
          overview: movie.overview ?? '',
          status: forcePublish ? 'published' : movie.status,
          streamingUrl: movie.streaming_url ?? '',
          episodeUrls: [],
          forcePublish,
        })
        return
      }

      const data = await adminContentsApi.getSeries(item.id)
      const tv = data.series
      const episodeUrls: EpisodeUrlItem[] = (tv.seasons ?? []).flatMap((season) =>
        (season.episodes ?? []).map((ep) => ({
          id: ep.id,
          seasonNumber: season.season_number,
          episodeNumber: ep.episode_number,
          name: ep.name,
          streamingUrl: ep.streaming_url ?? '',
        })),
      )

      setEditModal({
        id: tv.id,
        category: 'Serie',
        title: tv.name,
        overview: tv.overview ?? '',
        status: forcePublish ? 'published' : tv.status,
        streamingUrl: '',
        episodeUrls,
        forcePublish,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes')
    }
  }

  async function submitEditModal() {
    if (!editModal) return

    if (editModal.status === 'published') {
      if (editModal.category === 'Filme' && !editModal.streamingUrl.trim()) {
        setError('Para publicar filme, preencha a streaming URL.')
        return
      }

      if (editModal.category === 'Serie') {
        const missing = editModal.episodeUrls.find((ep) => !ep.streamingUrl.trim())
        if (missing) {
          setError(`Para publicar serie, preencha todas as URLs. Faltando: T${missing.seasonNumber}E${missing.episodeNumber}.`)
          return
        }
      }
    }

    setSaving(true)
    setError('')
    try {
      if (editModal.category === 'Filme') {
        await adminContentsApi.updateMovie(editModal.id, {
          title: editModal.title.trim(),
          overview: editModal.overview.trim(),
          status: editModal.status,
          streaming_url: editModal.streamingUrl.trim() || null,
        })
      } else {
        await Promise.all(
          editModal.episodeUrls.map((ep) =>
            adminContentsApi.updateEpisode(ep.id, {
              streaming_url: ep.streamingUrl.trim() || null,
            }),
          ),
        )

        await adminContentsApi.updateSeries(editModal.id, {
          name: editModal.title.trim(),
          overview: editModal.overview.trim(),
          status: editModal.status,
        })
      }

      setEditModal(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alteracoes')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: ContentItem) {
    if (deleteConfirm !== item.id) {
      setDeleteConfirm(item.id)
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      if (item.category === 'Filme') {
        await adminContentsApi.deleteMovie(item.id)
      } else {
        await adminContentsApi.deleteSeries(item.id)
      }
      setDeleteConfirm(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item')
    }
  }

  async function handleArchiveToDraft(item: ContentItem) {
    try {
      if (item.category === 'Filme') {
        await adminContentsApi.updateMovie(item.id, { status: 'draft' })
      } else {
        await adminContentsApi.updateSeries(item.id, { status: 'draft' })
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  const filtered = useMemo(() => {
    return catalog.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchStatus = filterStatus === 'all' || item.status === filterStatus
      const matchType = filterType === 'all' || item.category === filterType
      return matchSearch && matchStatus && matchType
    })
  }, [catalog, searchQuery, filterStatus, filterType])

  const stats = useMemo(
    () => ({
      total: catalog.length,
      published: catalog.filter((c) => c.status === 'published').length,
      draft: catalog.filter((c) => c.status === 'draft').length,
    }),
    [catalog],
  )

  const statusColor = (status: ContentItem['status']) => {
    if (status === 'published') return { bg: 'rgba(74,170,106,0.15)', text: '#4aaa6a' }
    return { bg: 'rgba(170,170,74,0.15)', text: '#aaaa4a' }
  }

  const statusLabel = (status: ContentItem['status']) => (status === 'published' ? 'Publicado' : 'Rascunho')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <header className="sticky top-0 z-30 border-b" style={{ backgroundColor: 'var(--card)', borderBottomColor: 'var(--border)' }}>
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--ryvo-orange)' }}>
              <BookOpen size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Ryvo</span>
              <span style={{ color: 'var(--border)' }}>/</span>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Gerenciamento de Conteudo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setBackgroundOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: hasActiveJob ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
              >
                {backgroundLoading ? <Loader2 size={12} className="animate-spin" /> : <Server size={12} />}
                BG: {backgroundLoading ? 'carregando' : backgroundStatus?.status ?? 'idle'}
              </button>
              <AnimatePresence>
                {backgroundOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-80 rounded-xl border p-3 z-20"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>
                      Fluxos em background
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                      Status: {backgroundLoading ? 'carregando...' : backgroundStatus?.status ?? 'idle'}
                    </p>
                    {backgroundStatus && (
                      <>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                          Parse: {backgroundStatus.progress.parse_total} | Selecionados: {backgroundStatus.progress.selected_total}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                          Resolvidos: {backgroundStatus.progress.resolved_total} | Importados: {backgroundStatus.progress.imported_total}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                          Criados: {backgroundStatus.summary.created} | Atualizados: {backgroundStatus.summary.updated_url} | Falhas: {backgroundStatus.summary.failed}
                        </p>
                      </>
                    )}
                    {backgroundLogs.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto rounded border p-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                        {backgroundLogs.slice(-6).map((log, i) => (
                          <p key={`${log.ts}-${i}`} className="text-[10px] leading-4" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                            {log.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setAutoM3uOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                borderColor: autoSummary.overallStatus === 'syncing' ? '#3b82f6' : autoSummary.overallStatus === 'error' ? '#ef4444' : 'var(--border)',
                color: autoSummary.overallStatus === 'syncing' ? '#3b82f6' : autoSummary.overallStatus === 'error' ? '#ef4444' : 'var(--foreground)',
                fontFamily: 'var(--font-inter)',
              }}
              title="Gerenciar Auto Sync M3U"
            >
              <Server size={12} />
              AutoSync: {autoSummary.overallStatus}
            </button>
            <a href="/" className="text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', backgroundColor: 'transparent' }}>Ver site</a>
            <button onClick={onSignOut} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)', backgroundColor: 'transparent' }}>
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-6 flex flex-col gap-6">
        {error && <p className="text-sm" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: LayoutGrid, color: 'var(--ryvo-orange)' },
            { label: 'Publicados', value: stats.published, icon: TrendingUp, color: '#4aaa6a' },
            { label: 'Rascunhos', value: stats.draft, icon: FileText, color: '#aaaa4a' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{label}</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--muted)' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por titulo ou genero..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button onClick={() => setFilterOpen(!filterOpen)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm transition-colors" style={{ backgroundColor: 'var(--card)', borderColor: filterStatus !== 'all' || filterType !== 'all' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                <Filter size={13} />Filtros<ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-1 w-52 rounded-xl border p-3 z-20" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Status</p>
                      {(['all', 'published', 'draft'] as const).map((s) => (
                        <button key={s} onClick={() => { setFilterStatus(s); setFilterOpen(false) }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ backgroundColor: filterStatus === s ? 'var(--muted)' : 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                          {s === 'all' ? 'Todos' : statusLabel(s)}
                        </button>
                      ))}
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-2 mt-3" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Tipo</p>
                      {(['all', 'Filme', 'Serie'] as const).map((t) => (
                        <button key={t} onClick={() => { setFilterType(t); setFilterOpen(false) }} className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors" style={{ backgroundColor: filterType === t ? 'var(--muted)' : 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                          {t === 'all' ? 'Todos' : t}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              {([['table', List], ['grid', LayoutGrid]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)} className="px-3 py-2.5 transition-colors" style={{ backgroundColor: viewMode === mode ? 'var(--ryvo-orange)' : 'var(--card)', color: viewMode === mode ? '#fff' : 'var(--muted-foreground)' }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <button onClick={() => setTmdbOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', fontFamily: 'var(--font-inter)' }}>
              <Plus size={15} />Adicionar
            </button>
            <button onClick={() => setM3uOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', fontFamily: 'var(--font-inter)' }}>
              <FileText size={15} />Importar M3U
            </button>
            <button onClick={() => setAutoM3uOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)', fontFamily: 'var(--font-inter)' }}>
              <Server size={15} />Auto Sync M3U
            </button>
          </div>
        </div>

        {loading ? <p style={{ fontFamily: 'var(--font-inter)' }}>Carregando...</p> : viewMode === 'table' ? (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b" style={{ backgroundColor: 'var(--muted)', borderBottomColor: 'var(--border)' }}>
              {['', 'Titulo', 'Tipo', 'Ano', 'Status', 'Acoes'].map((h) => <p key={h} className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{h}</p>)}
            </div>
            {filtered.map((item) => {
              const colors = statusColor(item.status)
              const isConfirming = deleteConfirm === item.id
              return (
                <div key={item.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 border-b transition-colors" style={{ borderBottomColor: 'var(--border)' }}>
                  <div className="w-2 h-10 rounded-full" style={{ backgroundColor: item.posterColor }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{item.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.genre.join(', ') || '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">{item.category === 'Filme' ? <Film size={13} style={{ color: 'var(--muted-foreground)' }} /> : <Tv size={13} style={{ color: 'var(--muted-foreground)' }} />}<span className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.category}</span></div>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.year || '-'}</span>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: 'var(--font-inter)' }}>{statusLabel(item.status)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => void openEditModal(item, false)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }} title="Editar detalhes"><Pencil size={14} /></button>
                    {item.status === 'draft' ? (
                      <button onClick={() => void openEditModal(item, true)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }} title="Publicar (abrir detalhes)"><Archive size={14} /></button>
                    ) : (
                      <button onClick={() => void handleArchiveToDraft(item)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--muted-foreground)' }} title="Mover para rascunho"><Archive size={14} /></button>
                    )}
                    <button onClick={() => void handleDelete(item)} className="p-1.5 rounded-lg transition-colors" title={isConfirming ? 'Clique novamente para confirmar' : 'Excluir'} style={{ color: isConfirming ? '#ef4444' : 'var(--muted-foreground)', backgroundColor: isConfirming ? 'rgba(239,68,68,0.1)' : 'transparent' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((item) => {
              const colors = statusColor(item.status)
              return (
                <div key={item.id} className="rounded-xl border overflow-hidden group" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="h-40 flex items-center justify-center relative" style={{ backgroundColor: item.posterColor }}>
                    {item.category === 'Filme' ? <Film size={24} color="rgba(255,255,255,0.5)" /> : <Tv size={24} color="rgba(255,255,255,0.5)" />}
                    <span className="absolute top-2 right-2 text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: 'var(--font-inter)' }}>{statusLabel(item.status)}</span>
                  </div>
                  <div className="p-3"><p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{item.title}</p><p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.category} · {item.year || '-'}</p></div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs pb-2" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Exibindo {filtered.length} de {catalog.length} itens</p>
      </main>

      {tmdbOpen && (
        <TmdbSearchModal
          onClose={() => setTmdbOpen(false)}
          onImported={() => { setTmdbOpen(false); void refresh() }}
        />
      )}

      {backgroundOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setBackgroundOpen(false)} />
      )}

      {m3uOpen && (
        <M3uImportModal
          onClose={() => setM3uOpen(false)}
          onRefresh={() => void refresh()}
        />
      )}

      {autoM3uOpen && (
        <AutoM3uManagerModal
          onClose={() => setAutoM3uOpen(false)}
        />
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ryvo-overlay)' }}>
          <div className="w-full max-w-2xl rounded-2xl border max-h-[86vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderBottomColor: 'var(--border)' }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>
                  {editModal.forcePublish ? 'Publicar com Detalhes' : 'Editar Conteudo'}
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{editModal.category}</p>
              </div>
              <button onClick={() => setEditModal(null)} style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Titulo</label>
                <input value={editModal.title} onChange={(e) => setEditModal({ ...editModal, title: e.target.value })} className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
              </div>

              <div>
                <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Overview</label>
                <textarea value={editModal.overview} onChange={(e) => setEditModal({ ...editModal, overview: e.target.value })} rows={4} className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
              </div>

              {editModal.category === 'Filme' && (
                <div>
                  <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Streaming URL do filme (obrigatorio para publicar)</label>
                  <input value={editModal.streamingUrl} onChange={(e) => setEditModal({ ...editModal, streamingUrl: e.target.value })} placeholder="https://..." className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
                </div>
              )}

              {editModal.category === 'Serie' && (
                <div>
                  <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Streaming URL por episodio (obrigatorio para publicar)</label>
                  <div className="mt-1 rounded-lg border max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                    {editModal.episodeUrls.map((ep, idx) => (
                      <div key={ep.id} className="p-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                          T{ep.seasonNumber}E{ep.episodeNumber} - {ep.name}
                        </p>
                        <input
                          value={ep.streamingUrl}
                          onChange={(e) => {
                            const next = [...editModal.episodeUrls]
                            next[idx] = { ...next[idx], streamingUrl: e.target.value }
                            setEditModal({ ...editModal, episodeUrls: next })
                          }}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                        />
                      </div>
                    ))}
                    {editModal.episodeUrls.length === 0 && (
                      <p className="p-3 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                        Serie sem episodios carregados.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Status</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => setEditModal({ ...editModal, status: 'draft' })} className="py-2 rounded-lg border text-sm" style={{ borderColor: editModal.status === 'draft' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Rascunho</button>
                  <button onClick={() => setEditModal({ ...editModal, status: 'published' })} className="py-2 rounded-lg border text-sm" style={{ borderColor: editModal.status === 'published' ? 'var(--ryvo-orange)' : 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Publicado</button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderTopColor: 'var(--border)' }}>
              <button onClick={() => setEditModal(null)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Cancelar</button>
              <button onClick={() => void submitEditModal()} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-inter)' }}>
                {saving ? 'Salvando...' : editModal.forcePublish ? 'Salvar e Publicar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
