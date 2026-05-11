'use client'
import { useMemo, useState } from 'react'
import { CheckSquare, Download, Loader2, Square } from 'lucide-react'
import { m3uApi, type ImportResponse, type ResolvedItem } from '@/lib/api/admin-m3u'

interface Props {
  items: ResolvedItem[]
  onDone: (result: ImportResponse) => void
}

const PAGE_SIZE = 100
const IMPORT_BATCH = 100

export default function StepImport({ items, onDone }: Props) {
  const importable = useMemo(() => items.filter((i) => i.tmdb_id !== null), [items])
  const [selected, setSelected] = useState<Set<number>>(() => new Set(importable.map((_, i) => i)))
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalPages = Math.max(1, Math.ceil(importable.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = importable.map((item, idx) => ({ item, idx })).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleAllPage() {
    const idxs = pageItems.map((p) => p.idx)
    const allSelected = idxs.every((i) => selected.has(i))
    const next = new Set(selected)
    if (allSelected) idxs.forEach((i) => next.delete(i))
    else idxs.forEach((i) => next.add(i))
    setSelected(next)
  }

  function toggle(idx: number) {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  async function runImport() {
    const toImport = importable.filter((_, i) => selected.has(i))
    if (!toImport.length) return setError('Selecione ao menos 1 item.')
    setLoading(true)
    setError('')
    try {
      const payload = toImport.map((r) => r.type === 'movie'
        ? { type: 'movie', tmdb_id: r.tmdb_id!, streaming_url: r.streaming_url, status, language: 'pt-BR' }
        : { type: 'series', tmdb_id: r.tmdb_id!, season_number: r.season_number!, episode_number: r.episode_number!, streaming_url: r.streaming_url, status, language: 'pt-BR' })
      const lineRefs = toImport.map((r) => r.line)

      const allResults: ImportResponse = { summary: { total: 0, created: 0, updated_url: 0, skipped: 0, failed: 0 }, results: [] }
      for (let i = 0; i < payload.length; i += IMPORT_BATCH) {
        const res = await m3uApi.import(payload.slice(i, i + IMPORT_BATCH), lineRefs.slice(i, i + IMPORT_BATCH))
        allResults.results.push(...res.results)
        allResults.summary.total += res.summary.total
        allResults.summary.created += res.summary.created
        allResults.summary.updated_url += res.summary.updated_url
        allResults.summary.skipped += res.summary.skipped
        allResults.summary.failed += res.summary.failed
      }
      onDone(allResults)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao importar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
        <span>{selected.size} selecionados de {importable.length}</span>
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {(['draft', 'published'] as const).map((s) => <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 transition-colors" style={{ backgroundColor: status === s ? 'var(--ryvo-orange)' : 'var(--card)', color: status === s ? '#fff' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{s === 'draft' ? 'Rascunho' : 'Publicado'}</button>)}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-2 border-b sticky top-0" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
          <button onClick={toggleAllPage} style={{ color: 'var(--muted-foreground)' }}>{pageItems.every((f) => selected.has(f.idx)) && pageItems.length > 0 ? <CheckSquare size={13} /> : <Square size={13} />}</button>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Titulo</p>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Tipo</p>
        </div>
        {pageItems.map(({ item, idx }) => (
          <div key={idx} onClick={() => toggle(idx)} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-2.5 border-b cursor-pointer" style={{ borderColor: 'var(--border)', backgroundColor: selected.has(idx) ? 'transparent' : 'rgba(0,0,0,0.03)' }}>
            <div style={{ color: selected.has(idx) ? 'var(--ryvo-orange)' : 'var(--border)' }}>{selected.has(idx) ? <CheckSquare size={13} /> : <Square size={13} />}</div>
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{item.tmdb_title ?? item.clean_name}</p>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{item.type === 'movie' ? 'Filme' : 'Serie'}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
        <span>Pagina {currentPage}/{totalPages}</span>
        <div className="flex gap-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border)', opacity: currentPage === 1 ? 0.5 : 1 }}>Anterior</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border)', opacity: currentPage === totalPages ? 0.5 : 1 }}>Proxima</button></div>
      </div>

      {error && <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>}

      <button onClick={runImport} disabled={loading || selected.size === 0} className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: loading || selected.size === 0 ? 0.7 : 1, fontFamily: 'var(--font-inter)' }}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {loading ? 'Importando...' : `Importar ${selected.size} itens`}
      </button>
    </div>
  )
}
