'use client'
import { useRef, useState } from 'react'
import { Upload, Link2, Loader2, FileText, X, WifiOff } from 'lucide-react'
import { m3uApi, type ParsedItem, type ParseStats, type SseProgress } from '@/lib/api/admin-m3u'

interface Props {
  onParsed: (items: ParsedItem[], stats: ParseStats, source: { content?: string; url?: string }) => void
}

interface ParseState {
  progress: SseProgress | null
  logs: string[]
  error: string
}

export default function StepParse({ onParsed }: Props) {
  const [mode, setMode] = useState<'content' | 'url'>('content')
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<ParseState>({ progress: null, logs: [], error: '' })
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setContent('')
    setState({ progress: null, logs: [], error: '' })
    const reader = new FileReader()
    reader.onload = (e) => setContent(e.target?.result as string ?? '')
    reader.onerror = () => setState((s) => ({ ...s, error: 'Erro ao ler o arquivo.' }))
    reader.readAsText(f, 'utf-8')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function run() {
    setState({ progress: null, logs: [], error: '' })
    setLoading(true)
    abortRef.current = new AbortController()

    try {
      let finalItems: ParsedItem[] = []

      await m3uApi.parseStream(
        mode === 'content' ? { content, limit: 500, offset: 0 } : { url, limit: 500, offset: 0 },
        (event) => {
          if (event.type === 'log') {
            setState((s) => ({ ...s, logs: [...s.logs.slice(-49), event.data.message] }))
          } else if (event.type === 'progress') {
            setState((s) => ({ ...s, progress: event.data }))
          } else if (event.type === 'items') {
            finalItems.push(...event.data)
          } else if (event.type === 'done') {
            onParsed(finalItems, event.data.stats, mode === 'content' ? { content } : { url })
          } else if (event.type === 'error') {
            setState((s) => ({ ...s, error: event.data.message }))
          }
        },
        abortRef.current.signal,
      )
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : 'Erro ao fazer parse' }))
      }
    } finally {
      setLoading(false)
    }
  }

  function cancel() {
    abortRef.current?.abort()
    setLoading(false)
  }

  const { progress, logs, error } = state
  const canRun = mode === 'content' ? !!content && !loading : !!url.trim() && !loading

  return (
    <div className="flex flex-col gap-5">
      {/* Mode tabs */}
      <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {(['content', 'url'] as const).map((m) => (
          <button key={m} onClick={() => !loading && setMode(m)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors"
            style={{ backgroundColor: mode === m ? 'var(--ryvo-orange)' : 'var(--card)', color: mode === m ? '#fff' : 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
            {m === 'content' ? <FileText size={13} /> : <Link2 size={13} />}
            {m === 'content' ? 'Arquivo M3U' : 'URL do M3U'}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === 'content' ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !file && !loading && inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors"
          style={{ minHeight: 160, borderColor: file ? 'var(--ryvo-orange)' : 'var(--border)', backgroundColor: 'var(--background)', cursor: file ? 'default' : 'pointer' }}
        >
          <input ref={inputRef} type="file" accept=".m3u,.m3u8,.txt" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          {file ? (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <FileText size={28} style={{ color: 'var(--ryvo-orange)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{file.name}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB · {content ? `${content.split('\n').length.toLocaleString()} linhas` : 'lendo...'}
              </p>
              {!loading && (
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setContent('') }}
                  className="flex items-center gap-1 text-xs mt-1"
                  style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>
                  <X size={12} /> Remover
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <Upload size={28} style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>Arraste o arquivo M3U aqui</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>ou clique para selecionar · .m3u / .m3u8</p>
            </div>
          )}
        </div>
      ) : (
        <input value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading}
          placeholder="http://provedor.example.com/get.php?username=...&type=m3u_plus"
          className="w-full px-3 py-2.5 rounded-lg border text-sm"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }} />
      )}

      {/* Progress bar + stats */}
      {loading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
              {progress ? `${progress.percent}% — ${progress.parsed.toLocaleString()} itens` : 'Iniciando...'}
            </span>
            {progress && (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
                🎬 {progress.movies.toLocaleString()} filmes · 📺 {progress.series.toLocaleString()} séries · {(progress.elapsed_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress?.percent ?? 0}%`, backgroundColor: 'var(--ryvo-orange)' }} />
          </div>
        </div>
      )}

      {/* SSE logs */}
      {logs.length > 0 && (
        <div className="rounded-lg border max-h-28 overflow-y-auto px-3 py-2 flex flex-col gap-0.5"
          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
          {logs.map((log, i) => (
            <p key={i} className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{log}</p>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <WifiOff size={14} style={{ color: '#ef4444' }} />
          <p className="text-xs" style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}>{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {loading && (
          <button onClick={cancel} className="px-4 py-3 rounded-lg text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
            Cancelar
          </button>
        )}
        <button onClick={run} disabled={!canRun}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-opacity"
          style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', opacity: !canRun ? 0.6 : 1, fontFamily: 'var(--font-inter)' }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {loading ? 'Processando via SSE...' : 'Iniciar parse'}
        </button>
      </div>
    </div>
  )
}
