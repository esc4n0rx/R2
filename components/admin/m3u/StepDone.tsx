'use client'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import type { ImportResponse } from '@/lib/api/admin-m3u'

interface Props {
  result: ImportResponse
  onClose: () => void
  onRefresh: () => void
}

const ACTION_STYLE = {
  created:     { bg: 'rgba(74,170,106,0.15)', text: '#4aaa6a',  label: 'Criado' },
  updated_url: { bg: 'rgba(100,149,237,0.15)', text: '#6495ed', label: 'URL atualizada' },
  skipped:     { bg: 'rgba(170,170,74,0.15)', text: '#aaaa4a',  label: 'Ignorado' },
  failed:      { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444',  label: 'Falhou' },
}

export default function StepDone({ result, onClose, onRefresh }: Props) {
  const { summary, results } = result
  const hasFailed = summary.failed > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-2 py-2">
        {hasFailed
          ? <XCircle size={40} style={{ color: '#ef4444' }} />
          : <CheckCircle2 size={40} style={{ color: '#4aaa6a' }} />}
        <p className="text-lg font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>
          {hasFailed ? 'Importação com erros' : 'Importação concluída!'}
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          ['Criados', summary.created, '#4aaa6a'],
          ['URL atualizada', summary.updated_url, '#6495ed'],
          ['Ignorados', summary.skipped, '#aaaa4a'],
          ['Falhas', summary.failed, '#ef4444'],
        ] as [string, number, string][]).map(([label, value, color]) => (
          <div key={label} className="rounded-lg border p-3 flex flex-col items-center" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
            <p className="text-xl font-bold" style={{ color, fontFamily: 'var(--font-syne)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="rounded-xl border overflow-hidden max-h-60 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
          {results.map((r, i) => {
            const style = ACTION_STYLE[r.action] ?? ACTION_STYLE.skipped
            return (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
                    TMDB #{r.tmdb_id} · {r.type === 'movie' ? 'Filme' : 'Série'}
                  </p>
                  {r.reason && (
                    <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>{r.reason}</p>
                  )}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: style.bg, color: style.text, fontFamily: 'var(--font-inter)' }}>
                  {style.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm border"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>
          Fechar
        </button>
        <button onClick={onRefresh} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: 'var(--ryvo-orange)', color: '#fff', fontFamily: 'var(--font-inter)' }}>
          <RefreshCw size={13} /> Atualizar catálogo
        </button>
      </div>
    </div>
  )
}
