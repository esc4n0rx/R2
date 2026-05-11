'use client'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

export type M3uStep = 'parse' | 'resolve' | 'import' | 'done'

const STEPS: { key: M3uStep; label: string }[] = [
  { key: 'parse', label: '1. Carregar lista' },
  { key: 'resolve', label: '2. Resolver TMDB' },
  { key: 'import', label: '3. Importar' },
]

interface Props {
  current: M3uStep
  loading?: boolean
}

export default function M3uStepBar({ current, loading }: Props) {
  const idx = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx || current === 'done'
        const active = step.key === current && current !== 'done'
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-2 px-3 py-2">
              {done ? (
                <CheckCircle2 size={16} style={{ color: '#4aaa6a' }} />
              ) : active && loading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--ryvo-orange)' }} />
              ) : (
                <Circle size={16} style={{ color: active ? 'var(--ryvo-orange)' : 'var(--border)' }} />
              )}
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                  color: active ? 'var(--foreground)' : done ? '#4aaa6a' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px" style={{ backgroundColor: i < idx ? '#4aaa6a' : 'var(--border)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
