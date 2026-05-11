'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import M3uStepBar, { type M3uStep } from './M3uStepBar'
import StepParse from './StepParse'
import StepResolve from './StepResolve'
import StepImport from './StepImport'
import StepDone from './StepDone'
import type { ParsedItem, ParseStats, ResolvedItem, ImportResponse } from '@/lib/api/admin-m3u'

interface Props {
  onClose: () => void
  onRefresh: () => void
}

const SLIDE = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
}

export default function M3uImportModal({ onClose, onRefresh }: Props) {
  const [step, setStep] = useState<M3uStep>('parse')
  const [dir, setDir] = useState(1)
  const [parsed, setParsed] = useState<ParsedItem[]>([])
  const [stats, setStats] = useState<ParseStats | null>(null)
  const [resolved, setResolved] = useState<ResolvedItem[]>([])
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [source, setSource] = useState<{ content?: string; url?: string } | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  function goNext(next: M3uStep) { setDir(1); setStep(next) }

  function handleParsed(items: ParsedItem[], s: ParseStats, parseSource: { content?: string; url?: string }) {
    setParsed(items)
    setStats(s)
    setSource(parseSource)
    goNext('resolve')
  }

  function handleResolved(items: ResolvedItem[]) {
    setResolved(items)
    goNext('import')
  }

  function handleDone(result: ImportResponse) {
    setImportResult(result)
    goNext('done')
  }

  const stepTitles: Record<M3uStep, string> = {
    parse: 'Carregar Lista M3U',
    resolve: 'Selecionar e Resolver',
    import: 'Selecionar e Importar',
    done: 'Resultado',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ryvo-overlay)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 16 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-2xl border flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}>Importar lista M3U</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>
              {stepTitles[step]}{stats && step !== 'parse' && ` - ${stats.total.toLocaleString()} itens na lista`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
        </div>

        <div className="px-6 py-3 border-b shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
          <M3uStepBar current={step} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={SLIDE} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22, ease: 'easeOut' }}>
              {step === 'parse' && <StepParse onParsed={handleParsed} />}
              {step === 'resolve' && <StepResolve items={parsed} source={source} onResolved={handleResolved} onDone={handleDone} />}
              {step === 'import' && <StepImport items={resolved} onDone={handleDone} />}
              {step === 'done' && importResult && <StepDone result={importResult} onClose={onClose} onRefresh={() => { onClose(); onRefresh() }} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
