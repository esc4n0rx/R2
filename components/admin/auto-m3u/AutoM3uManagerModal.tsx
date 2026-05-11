'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, Play, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { adminAutoM3uApi, type AutoM3uFilter, type DiscoverCategory } from '@/lib/api/admin-auto-m3u'
import { useAutoM3u, useAutoM3uSyncMonitor } from '@/hooks/use-auto-m3u'

interface Props {
  onClose: () => void
}

const statusLabel: Record<string, string> = {
  idle: 'Ocioso',
  syncing: 'Sincronizando',
  error: 'Erro',
}

export default function AutoM3uManagerModal({ onClose }: Props) {
  const { sources, summary, loading, error, loadSources } = useAutoM3u()
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [discoverUrl, setDiscoverUrl] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<DiscoverCategory[]>([])
  const [selectedFilters, setSelectedFilters] = useState<Record<string, boolean>>({})
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('pt-BR')
  const [syncHour, setSyncHour] = useState(3)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const selectedSource = sources.find((s) => s.id === selectedId) ?? null
  const { status, logs, loading: monitorLoading, resetLogs } = useAutoM3uSyncMonitor(selectedSource?.id ?? null, Boolean(selectedSource))

  useEffect(() => {
    if (!selectedSource) return
    setSyncHour(selectedSource.sync_hour)
  }, [selectedSource])

  useEffect(() => {
    if (view === 'detail' && !selectedSource) setView('list')
  }, [view, selectedSource])

  const selectedFilterCount = useMemo(
    () => Object.values(selectedFilters).filter(Boolean).length,
    [selectedFilters],
  )

  function keyFor(category: string, subcategory: string | null) {
    return `${category}|||${subcategory ?? 'null'}`
  }

  function toggleFilter(category: string, subcategory: string | null) {
    const key = keyFor(category, subcategory)
    setSelectedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toFilters(): AutoM3uFilter[] {
    const filters: AutoM3uFilter[] = []
    for (const [key, checked] of Object.entries(selectedFilters)) {
      if (!checked) continue
      const [category, subcategory] = key.split('|||')
      filters.push({ category, subcategory: subcategory === 'null' ? null : subcategory })
    }
    return filters
  }

  async function runDiscover() {
    if (!discoverUrl.trim()) return
    setDiscovering(true)
    setFormError('')
    try {
      const data = await adminAutoM3uApi.discover(discoverUrl.trim(), language)
      setDiscoverResult(data.categories ?? [])
      setSelectedFilters({})
      if (!name.trim()) setName(`Fonte M3U ${new Date().toLocaleDateString('pt-BR')}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao inspecionar URL')
    } finally {
      setDiscovering(false)
    }
  }

  async function createSource() {
    const filters = toFilters()
    if (!discoverUrl.trim() || !name.trim() || filters.length === 0) {
      setFormError('Preencha URL, nome e selecione ao menos um filtro.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const created = await adminAutoM3uApi.createSource({
        name: name.trim(),
        url: discoverUrl.trim(),
        active_filters: filters,
        language,
        auto_sync_enabled: autoEnabled,
        sync_hour: syncHour,
      })
      await loadSources()
      setSelectedId(created.id)
      setView('detail')
      setDiscoverResult([])
      setSelectedFilters({})
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao criar fonte')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAutoSync() {
    if (!selectedSource) return
    await adminAutoM3uApi.updateSource(selectedSource.id, { auto_sync_enabled: !selectedSource.auto_sync_enabled })
    await loadSources()
  }

  async function saveSyncHour() {
    if (!selectedSource) return
    await adminAutoM3uApi.updateSource(selectedSource.id, { sync_hour: syncHour })
    await loadSources()
  }

  async function triggerSync() {
    if (!selectedSource) return
    await adminAutoM3uApi.triggerSync(selectedSource.id)
    resetLogs()
    await loadSources()
  }

  async function removeSource() {
    if (!selectedSource) return
    await adminAutoM3uApi.deleteSource(selectedSource.id)
    setSelectedId(null)
    setView('list')
    resetLogs()
    await loadSources()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ryvo-overlay)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Auto Sync M3U</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
              Fontes: {summary.total} | Ativas: {summary.enabled} | Sincronizando: {summary.syncing} | Erro: {summary.error}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Fontes</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void loadSources()} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      {loading ? <Loader2 size={12} className="animate-spin" /> : 'Atualizar'}
                    </button>
                    <button onClick={() => setView('create')} className="text-xs px-3 py-1 rounded border font-semibold" style={{ borderColor: 'var(--ryvo-orange)', color: 'var(--ryvo-orange)' }}>
                      Nova fonte
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs mb-2" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>}
                <div className="grid md:grid-cols-2 gap-2">
                  {sources.map((source) => (
                    <button key={source.id} onClick={() => { setSelectedId(source.id); setView('detail') }} className="text-left rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{source.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{source.url}</p>
                      <span className="inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: source.status === 'error' ? 'rgba(239,68,68,0.16)' : source.status === 'syncing' ? 'rgba(59,130,246,0.16)' : 'var(--muted)', color: source.status === 'error' ? '#ef4444' : source.status === 'syncing' ? '#3b82f6' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                        {statusLabel[source.status] ?? source.status}
                      </span>
                    </button>
                  ))}
                </div>
                {!loading && sources.length === 0 && <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Nenhuma fonte cadastrada.</p>}
              </motion.div>
            )}

            {view === 'detail' && selectedSource && (
                <motion.div key={selectedSource.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    <ArrowLeft size={12} />Voltar para lista
                  </button>
                  <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>{selectedSource.name}</p>
                    <p className="text-xs mt-0.5 break-all" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{selectedSource.url}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button onClick={() => void triggerSync()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff' }}>
                        <Play size={12} />Sync manual
                      </button>
                      <button onClick={() => void toggleAutoSync()} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                        Auto-sync: {selectedSource.auto_sync_enabled ? 'Ligado' : 'Desligado'}
                      </button>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={23} value={syncHour} onChange={(e) => setSyncHour(Number(e.target.value || 0))} className="w-16 px-2 py-1.5 rounded border text-xs" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                        <button onClick={() => void saveSyncHour()} className="px-2.5 py-1.5 rounded border text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                          <Save size={12} />
                        </button>
                      </div>
                      <button onClick={() => void removeSource()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                        <Trash2 size={12} />Excluir
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Status do sync</p>
                      {(monitorLoading || status?.is_active) && <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />}
                    </div>
                    <p className="text-sm mt-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                      {status ? `${status.is_active ? 'Sincronizando' : 'Parado'} | DB: ${status.db_status}` : 'Sem dados ao vivo'}
                    </p>
                    {status?.progress && (
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                        Parse: {status.progress.parsed} | TMDB: {status.progress.resolved} | Import: {status.progress.imported} | Filtro: {status.progress.current_filter}
                      </p>
                    )}
                    {status?.last_sync_summary && (
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                        Ultimo: total {status.last_sync_summary.total} | criados {status.last_sync_summary.created} | urls {status.last_sync_summary.updated_url} | skipped {status.last_sync_summary.skipped} | falhas {status.last_sync_summary.failed}
                      </p>
                    )}
                    {status?.last_sync_error && (
                      <p className="text-xs mt-1" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>
                        Erro: {status.last_sync_error}
                      </p>
                    )}
                    {logs.length > 0 && (
                      <div className="mt-3 max-h-40 overflow-y-auto rounded border p-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
                        {logs.slice(-50).map((log, idx) => (
                          <p key={`${log.ts}-${idx}`} className="text-[11px] leading-4" style={{ color: log.level === 'error' ? '#ef4444' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                            [{log.level.toUpperCase()}] {log.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
            )}

            {view === 'create' && (
                <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    <ArrowLeft size={12} />Voltar para lista
                  </button>
                  <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Nova fonte</p>
                    <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                      <input value={discoverUrl} onChange={(e) => setDiscoverUrl(e.target.value)} placeholder="https://.../playlist.m3u" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
                      <button onClick={() => void runDiscover()} disabled={discovering} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: discovering ? 0.7 : 1 }}>
                        {discovering ? 'Inspecionando...' : 'Inspecionar'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da fonte" className="px-3 py-2 rounded-lg border text-sm col-span-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                        <option value="pt-BR">pt-BR</option>
                        <option value="en-US">en-US</option>
                      </select>
                      <input type="number" min={0} max={23} value={syncHour} onChange={(e) => setSyncHour(Number(e.target.value || 0))} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }} />
                    </div>
                    <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                      <input type="checkbox" checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} />
                      Habilitar auto-sync diario
                    </label>
                    {formError && <p className="text-xs mt-2" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{formError}</p>}
                  </div>

                  {discoverResult.length > 0 && (
                    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                        Filtros ({selectedFilterCount} selecionados)
                      </p>
                      <div className="max-h-56 overflow-y-auto space-y-3">
                        {discoverResult.map((cat) => (
                          <div key={cat.category}>
                            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{cat.category} ({cat.total})</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <label className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                                <input className="mr-1" type="checkbox" checked={Boolean(selectedFilters[keyFor(cat.category, null)])} onChange={() => toggleFilter(cat.category, null)} />
                                Todas
                              </label>
                              {cat.subcategories.map((sub, idx) => (
                                <label key={`${cat.category}-${idx}`} className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                                  <input className="mr-1" type="checkbox" checked={Boolean(selectedFilters[keyFor(cat.category, sub.name)])} onChange={() => toggleFilter(cat.category, sub.name)} />
                                  {(sub.name ?? '[sem subcategoria]')} ({sub.count})
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => void createSource()} disabled={saving} className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Salvando...' : 'Criar fonte'}
                      </button>
                    </div>
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
