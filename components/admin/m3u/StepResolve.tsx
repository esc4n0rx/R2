'use client'
import { useMemo, useState } from 'react'
import { CheckSquare, Film, Loader2, PlayCircle, Square, Tv, Zap } from 'lucide-react'
import { m3uApi, type ImportResponse, type ParsedItem, type ResolvedItem } from '@/lib/api/admin-m3u'
import { setBackgroundJobId } from '@/hooks/use-m3u-background'

interface Props {
  items: ParsedItem[]
  source: { content?: string; url?: string } | null
  onResolved: (items: ResolvedItem[]) => void
  onDone: (result: ImportResponse) => void
}

const BATCH = 50
const PAGE_SIZE = 100

export default function StepResolve({ items, source, onResolved, onDone }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterCat, setFilterCat] = useState('Todos')
  const [filterSubCat, setFilterSubCat] = useState('Todas')
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [page, setPage] = useState(1)

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(items.map((i) => i.category))).sort()], [items])
  const subcategories = useMemo(() => {
    const subcats = new Set<string>()
    items.forEach((i) => {
      if (i.subcategory && (filterCat === 'Todos' || i.category === filterCat)) subcats.add(i.subcategory)
    })
    return ['Todas', ...Array.from(subcats).sort()]
  }, [items, filterCat])

  const filtered = useMemo(() => items.map((item, idx) => ({ item, idx })).filter(({ item }) => {
    const matchCat = filterCat === 'Todos' || item.category === filterCat
    const matchSubCat = filterSubCat === 'Todas' || item.subcategory === filterSubCat
    const matchType = filterType === 'all' || item.type === filterType
    return matchCat && matchSubCat && matchType
  }), [items, filterCat, filterSubCat, filterType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleAll() {
    const visibleIdxs = filtered.map((f) => f.idx)
    const allSelected = visibleIdxs.every((i) => selected.has(i))
    const next = new Set(selected)
    if (allSelected) visibleIdxs.forEach((i) => next.delete(i))
    else visibleIdxs.forEach((i) => next.add(i))
    setSelected(next)
  }

  function toggle(idx: number) {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  async function runResolve() {
    const toResolve = items.filter((_, i) => selected.has(i))
    if (!toResolve.length) return setError('Selecione ao menos 1 item para resolver.')

    setLoading(true)
    setError('')
    setProgress(0)
    try {
      const allResolved: ResolvedItem[] = []
      for (let i = 0; i < toResolve.length; i += BATCH) {
        const batch = toResolve.slice(i, i + BATCH)
        const res = await m3uApi.resolve(batch)
        allResolved.push(...res.resolved)
        setProgress(Math.round(((i + batch.length) / toResolve.length) * 100))
      }
      onResolved(allResolved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao resolver')
      setLoading(false)
    }
  }

  async function runBackground() {
    if (!source || (!source.content && !source.url)) return setError('Origem do M3U nao disponivel para background.')
    if (filterCat === 'Todos') return setError('Selecione uma categoria especifica para background.')

    setLoading(true)
    setError('')
    try {
      const payload: { content?: string; url?: string; category: string; subcategory?: string; status: 'draft' | 'published' } = {
        ...source,
        category: filterCat,
        status,
      }
      if (filterSubCat !== 'Todas') payload.subcategory = filterSubCat
      const started = await m3uApi.startBackground(payload)
      setBackgroundJobId(started.job_id)
      onDone({ summary: { total: 0, created: 0, updated_url: 0, skipped: 0, failed: 0 }, results: [] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar background')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Selecionar itens</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{items.length} itens encontrados no total</p>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ryvo-orange)', fontFamily: 'var(--font-syne)' }}>{selected.size} selecionados</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterSubCat('Todas'); setPage(1) }} className="px-2.5 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={filterSubCat} onChange={(e) => { setFilterSubCat(e.target.value); setPage(1) }} className="px-2.5 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{subcategories.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value as typeof filterType); setPage(1) }} className="px-2.5 py-1.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
            <option value="all">Todos os tipos</option>
            <option value="movie">Filmes</option>
            <option value="series">Series</option>
          </select>
          <div className="flex rounded-lg border overflow-hidden ml-auto" style={{ borderColor: 'var(--border)' }}>
            {(['draft', 'published'] as const).map((s) => <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 text-xs transition-colors" style={{ backgroundColor: status === s ? 'var(--ryvo-orange)' : 'var(--card)', color: status === s ? '#fff' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{s === 'draft' ? 'Rascunho' : 'Publicado'}</button>)}
          </div>
        </div>
      </div>

      {loading && <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}><div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: 'var(--ryvo-orange)' }} /></div>}
      {error && <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>}

      <div className="rounded-xl border overflow-hidden max-h-80 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2 border-b sticky top-0" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
          <button onClick={toggleAll} style={{ color: 'var(--muted-foreground)' }}>{filtered.every((f) => selected.has(f.idx)) && filtered.length > 0 ? <CheckSquare size={13} /> : <Square size={13} />}</button>
          {['Titulo (Original)', 'Tipo', 'Categoria'].map((h) => <p key={h} className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{h}</p>)}
        </div>
        {pageItems.map(({ item, idx }) => (
          <div key={idx} onClick={() => toggle(idx)} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-2.5 border-b cursor-pointer" style={{ borderColor: 'var(--border)', backgroundColor: selected.has(idx) ? 'transparent' : 'rgba(0,0,0,0.03)' }}>
            <div style={{ color: selected.has(idx) ? 'var(--ryvo-orange)' : 'var(--border)' }}>{selected.has(idx) ? <CheckSquare size={13} /> : <Square size={13} />}</div>
            <div className="min-w-0"><p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{item.clean_name}</p><p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.raw_name}</p></div>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.type === 'movie' ? <Film size={12} /> : <Tv size={12} />}{item.type === 'movie' ? 'Filme' : `S${String(item.season_number).padStart(2, '0')}E${String(item.episode_number).padStart(2, '0')}`}</span>
            <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.category}{item.subcategory ? ` > ${item.subcategory}` : ''}</span>
          </div>
        ))}
      </div>

      {filtered.length > 0 && <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
        <span>Pagina {currentPage}/{totalPages} - {filtered.length} itens</span>
        <div className="flex gap-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border)', opacity: currentPage === 1 ? 0.5 : 1 }}>Anterior</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border)', opacity: currentPage === totalPages ? 0.5 : 1 }}>Proxima</button></div>
      </div>}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button onClick={runResolve} disabled={loading || selected.size === 0} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: loading || selected.size === 0 ? 0.7 : 1, fontFamily: 'var(--font-inter)' }}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Resolver TMDB
        </button>
        <button onClick={runBackground} disabled={loading || selected.size === 0} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', opacity: loading || selected.size === 0 ? 0.7 : 1, fontFamily: 'var(--font-inter)' }}>
          <PlayCircle size={14} />
          Background
        </button>
      </div>
    </div>
  )
}
