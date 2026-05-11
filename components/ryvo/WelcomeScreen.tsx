'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Eye,
  EyeOff,
  BookMarked,
  History,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  Star,
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { ApiError } from '@/lib/api/client'
import { useReleases } from '@/hooks/use-releases'
import { getReleaseYear } from '@/lib/api/discover'

interface WelcomeScreenProps {
  onAuthenticated: () => void
}

// ─── Preview Deck (Novidades) ─────────────────────────────────────────────────

const FALLBACK_POSTERS = [
  { title: 'Nebula', bg: '#1c2a36', accent: '#4a9ab8', tag: 'Série' },
  { title: 'Cidade de Vidro', bg: '#2a1f35', accent: '#9a6abf', tag: 'Novo' },
  { title: 'Último Verão', bg: '#1e3028', accent: '#5ab87a', tag: 'Filme' },
]

function PreviewDeck() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const { data: releases } = useReleases()

  const items = releases
    ? [...releases.movies, ...releases.series].slice(0, 3)
    : []
  const count = items.length || FALLBACK_POSTERS.length

  useEffect(() => {
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % count), 3500)
    return () => clearInterval(t)
  }, [count])

  const activeItem = items[activeIdx]
  const activeFallback = FALLBACK_POSTERS[activeIdx % FALLBACK_POSTERS.length]

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-full max-w-[340px]"
    >
      {/* Ghost cards */}
      <div
        className="absolute -bottom-3 left-4 right-4 h-full rounded-2xl border"
        style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)', opacity: 0.5 }}
      />
      <div
        className="absolute -bottom-1.5 left-2 right-2 h-full rounded-2xl border"
        style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--border)', opacity: 0.7 }}
      />

      <div
        className="relative rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--ryvo-orange)' }}
            >
              <Play size={8} fill="white" className="text-white ml-[1px]" />
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
            >
              Novidades
            </span>
          </div>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{
              color: 'var(--muted-foreground)',
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-inter)',
            }}
          >
            Em cartaz
          </span>
        </div>

        {/* Poster row */}
        <div className="px-4 pt-4 pb-3 flex items-end gap-2.5 justify-center">
          {(items.length > 0 ? items : FALLBACK_POSTERS).map((poster, i) => {
            const isActive = i === activeIdx
            const release = items[i]
            const fallback = FALLBACK_POSTERS[i % FALLBACK_POSTERS.length]
            const hasImg = release?.poster_url && !imgErrors[i]

            return (
              <motion.button
                key={i}
                onClick={() => setActiveIdx(i)}
                animate={{ scale: isActive ? 1 : 0.88, opacity: isActive ? 1 : 0.55 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="relative rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                style={{
                  width: isActive ? 100 : 72,
                  height: isActive ? 138 : 100,
                  border: isActive
                    ? '1.5px solid var(--ryvo-orange)'
                    : '1.5px solid transparent',
                  transition: 'width 0.4s, height 0.4s, border 0.3s',
                  backgroundColor: fallback.bg,
                }}
              >
                {hasImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={release.poster_url}
                    alt={release.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                  />
                ) : (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, ${fallback.accent} 0, ${fallback.accent} 1px, transparent 0, transparent 50%)`,
                      backgroundSize: '10px 10px',
                    }}
                  />
                )}

                {/* Gradient overlay (always) */}
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)` }}
                />

                {/* Type tag */}
                <div className="absolute top-2 left-0 right-0 flex justify-center">
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isActive ? 'var(--ryvo-orange)' : 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {release ? (release.media_type === 'movie' ? 'Filme' : 'Série') : fallback.tag}
                  </span>
                </div>

                {/* Title */}
                {!hasImg && (
                  <div className="absolute bottom-2 left-0 right-0 px-2">
                    <p
                      className="text-center font-bold leading-tight"
                      style={{
                        color: '#fff',
                        fontFamily: 'var(--font-syne)',
                        fontSize: isActive ? '10px' : '8px',
                      }}
                    >
                      {release?.title ?? fallback.title}
                    </p>
                  </div>
                )}

                {/* Active play button */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--ryvo-orange)', opacity: 0.95 }}
                    >
                      <Play size={12} fill="white" className="text-white ml-0.5" />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Active item info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-2"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p
                className="text-sm font-bold leading-tight line-clamp-1"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
              >
                {activeItem?.title ?? activeFallback.title}
              </p>
              {activeItem?.vote_average ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={10} fill="#facc15" className="text-yellow-400" />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    {activeItem.vote_average.toFixed(1)}
                  </span>
                </div>
              ) : null}
            </div>
            <p
              className="text-[10px] leading-relaxed line-clamp-2"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              {activeItem?.overview
                ? activeItem.overview
                : 'Descubra os melhores lançamentos da temporada no Ryvo.'}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mx-4 h-px" style={{ backgroundColor: 'var(--border)' }} />

        {/* Footer row */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p
            className="text-[10px]"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
          >
            {activeItem
              ? `${activeItem.media_type === 'movie' ? 'Filme' : 'Série'} · ${getReleaseYear(activeItem.release_date)}`
              : 'Em cartaz agora'}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === activeIdx ? 16 : 6,
                  height: 6,
                  backgroundColor: i === activeIdx ? 'var(--ryvo-orange)' : 'var(--border)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Social Disabled Popup ────────────────────────────────────────────────────

function SocialDisabledPopup({
  provider,
  onClose,
}: {
  provider: 'Google' | 'Apple'
  onClose: () => void
}) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-sm rounded-2xl border p-6 relative"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
            }
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
            >
              {provider === 'Google' ? 'G' : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
              )}
            </div>

            <div>
              <p
                className="text-base font-bold mb-1"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
              >
                Login com {provider} desativado
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Esta opção está temporariamente indisponível. Por favor, use seu e-mail e senha para
                acessar o Ryvo.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 mt-1"
              style={{
                backgroundColor: 'var(--ryvo-orange)',
                color: '#fffefb',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Entendi
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Password Strength ───────────────────────────────────────────────────────

type StrengthLevel = 'fraca' | 'média' | 'forte'

function getPasswordStrength(pwd: string): StrengthLevel | null {
  if (!pwd) return null
  const hasMin = pwd.length >= 8
  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
  const isLong = pwd.length >= 12

  if (!hasMin) return 'fraca'
  if (hasUpper && hasNumber && (hasSpecial || isLong)) return 'forte'
  if (hasUpper || hasNumber) return 'média'
  return 'fraca'
}

const strengthColors: Record<StrengthLevel, string> = {
  fraca: '#ef4444',
  média: '#f97316',
  forte: '#22c55e',
}

const strengthWidth: Record<StrengthLevel, string> = {
  fraca: '33%',
  média: '66%',
  forte: '100%',
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  if (!strength) return null

  return (
    <div className="mt-2">
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <motion.div
          animate={{ width: strengthWidth[strength] }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: strengthColors[strength] }}
        />
      </div>
      <p
        className="text-[10px] mt-1"
        style={{ color: strengthColors[strength], fontFamily: 'var(--font-inter)' }}
      >
        Senha {strength}
        {strength === 'fraca' && ' — adicione maiúsculas e números'}
        {strength === 'média' && ' — adicione símbolos ou mais caracteres'}
      </p>
    </div>
  )
}

// ─── Auth Form ────────────────────────────────────────────────────────────────

function AuthForm({
  initialMode,
  onSuccess,
}: {
  initialMode: 'login' | 'register'
  onSuccess: () => void
}) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socialPopup, setSocialPopup] = useState<'Google' | 'Apple' | null>(null)

  const passwordsMatch = mode === 'login' || confirmPassword === '' || password === confirmPassword
  const confirmTouched = confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      const strength = getPasswordStrength(password)
      if (strength === 'fraca') {
        setError('Senha fraca — use ao menos 8 caracteres, uma maiúscula e um número.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError(null)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      {socialPopup && (
        <SocialDisabledPopup provider={socialPopup} onClose={() => setSocialPopup(null)} />
      )}

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22 }}
        className="w-full"
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: 'var(--ryvo-orange)', fontFamily: 'var(--font-inter)' }}
        >
          Acesso Ryvo
        </p>

        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
        >
          {mode === 'register' ? 'Criar conta' : 'Entrar no Ryvo'}
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
        >
          {mode === 'register'
            ? 'Crie sua conta e prepare seus perfis em poucos passos.'
            : 'Continue de onde parou em qualquer perfil.'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-3.5">
            {mode === 'register' && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  minLength={2}
                  maxLength={80}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--ryvo-orange)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
              >
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-inter)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--ryvo-orange)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                >
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-3 pr-11 rounded-xl border text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--ryvo-orange)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} />
                  ) : (
                    <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />
                  )}
                </button>
              </div>
              {mode === 'register' && <PasswordStrengthBar password={password} />}
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                >
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-3 pr-11 rounded-xl border text-sm outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: confirmTouched && !passwordsMatch ? '#ef4444' : 'var(--border)',
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-inter)',
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        confirmTouched && !passwordsMatch ? '#ef4444' : 'var(--ryvo-orange)')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        confirmTouched && !passwordsMatch ? '#ef4444' : 'var(--border)')
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    tabIndex={-1}
                  >
                    {showConfirmPass ? (
                      <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} />
                    ) : (
                      <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />
                    )}
                  </button>
                </div>
                {confirmTouched && !passwordsMatch && (
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}
                  >
                    As senhas não coincidem
                  </p>
                )}
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs px-3.5 py-2.5 rounded-xl"
                style={{
                  color: '#ef4444',
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-0.5 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--ryvo-orange)',
                color: '#fffefb',
                fontFamily: 'var(--font-inter)',
              }}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? 'Criar conta' : 'Entrar'}
                  <ChevronRight size={15} />
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <span
                className="text-xs"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                ou continue com
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(['Google', 'Apple'] as const).map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setSocialPopup(provider)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)')
                  }
                >
                  {provider === 'Google' ? (
                    <span className="font-bold text-sm leading-none">G</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                    </svg>
                  )}
                  {provider}
                </button>
              ))}
            </div>

            <p
              className="text-xs text-center pt-1"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              {mode === 'register' ? (
                <>
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-semibold underline-offset-2 hover:underline"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Entrar
                  </button>
                </>
              ) : (
                <>
                  Sem conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-semibold underline-offset-2 hover:underline"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Criar agora
                  </button>
                </>
              )}
            </p>
          </div>
        </form>
      </motion.div>
    </>
  )
}

// ─── Auth Right Panel ─────────────────────────────────────────────────────────

function AuthRightPanel() {
  return (
    <div className="relative flex flex-col gap-6">
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ border: '1px solid var(--muted)', opacity: 0.6 }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ border: '1px solid var(--muted)', opacity: 0.4 }}
      />

      <div className="relative">
        <p
          className="text-2xl font-bold mb-2 text-balance"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
        >
          Continue sua sessão
        </p>
        <p
          className="text-sm leading-relaxed text-pretty"
          style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
        >
          Entre para acessar seus perfis, recomendações e conteúdos salvos.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {[
          {
            icon: BookMarked,
            label: 'Perfis personalizados',
            desc: 'Cada pessoa da casa com seu próprio gosto.',
          },
          {
            icon: History,
            label: 'Histórico sincronizado',
            desc: 'Continue exatamente de onde parou.',
          },
          {
            icon: Sparkles,
            label: 'Recomendações por gosto',
            desc: 'Sugestões inteligentes para cada perfil.',
          },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)' }}
            >
              <Icon size={14} style={{ color: 'var(--ryvo-orange)' }} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
              >
                {label}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WelcomeScreen({ onAuthenticated }: WelcomeScreenProps) {
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none')

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Decorative background rings */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full"
          style={{ border: '1px solid var(--muted)', opacity: 0.55 }}
        />
        <div
          className="absolute -bottom-60 -left-40 w-[520px] h-[520px] rounded-full"
          style={{ border: '1px solid var(--muted)', opacity: 0.45 }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{ border: '1px solid var(--muted)', opacity: 0.2 }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-[1200px] mx-auto w-full">
        <span
          className="font-bold text-2xl tracking-tight"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
        >
          Ryvo
        </span>
        <button
          onClick={() => setAuthMode('login')}
          className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-inter)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
          }
        >
          Entrar
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center px-6 py-8 max-w-[1200px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {authMode === 'none' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16"
            >
              {/* Left */}
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-6"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-inter)',
                    backgroundColor: 'var(--muted)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--ryvo-orange)' }}
                  />
                  Novo: Cidade de Vidro — assistir agora
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-5xl md:text-6xl lg:text-[72px] font-bold leading-[0.92] mb-5 text-balance"
                  style={{
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-syne)',
                    letterSpacing: '-1.5px',
                  }}
                >
                  Bem-vindo ao Ryvo
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="text-lg leading-relaxed mb-3 text-pretty max-w-md"
                  style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
                >
                  Seu catálogo pessoal de filmes e séries. Continue histórias, descubra novidades e
                  encontre algo perfeito para assistir agora.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.18 }}
                  className="text-sm mb-8 text-pretty max-w-sm"
                  style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                >
                  Perfis personalizados, recomendações inteligentes e uma experiência feita para
                  maratonar sem esforço.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.22 }}
                  className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                >
                  <button
                    onClick={() => setAuthMode('register')}
                    className="px-7 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--ryvo-orange)',
                      color: '#fffefb',
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    Vamos começar
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className="px-7 py-3.5 rounded-xl text-sm font-semibold border transition-colors"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                      fontFamily: 'var(--font-inter)',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)')
                    }
                  >
                    Entrar
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.32 }}
                  className="flex items-center gap-3 mt-8"
                >
                  <div className="flex -space-x-2">
                    {[
                      { initials: 'MA', color: '#4a8fa8' },
                      { initials: 'RF', color: '#aa4a4a' },
                      { initials: 'LC', color: '#4aaa6a' },
                      { initials: '+', color: '#939084' },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: p.color, borderColor: 'var(--background)' }}
                      >
                        {p.initials}
                      </div>
                    ))}
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                  >
                    Mais de{' '}
                    <strong style={{ color: 'var(--ryvo-charcoal)' }}>12 mil</strong> espectadores
                  </p>
                </motion.div>
              </div>

              {/* Right: Preview Deck */}
              <motion.div
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="flex-1 flex items-center justify-center lg:justify-end"
              >
                <PreviewDeck />
              </motion.div>
            </motion.div>
          )}

          {authMode !== 'none' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28 }}
              className="w-full flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-16"
            >
              {/* Left: Auth card */}
              <div className="w-full lg:max-w-md">
                <button
                  onClick={() => setAuthMode('none')}
                  className="flex items-center gap-1.5 text-sm mb-7 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
                >
                  {'← Voltar'}
                </button>

                <div
                  className="w-full rounded-2xl border p-7 transition-colors duration-300"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <AnimatePresence mode="wait">
                    <AuthForm
                      key={authMode}
                      initialMode={authMode === 'login' ? 'login' : 'register'}
                      onSuccess={onAuthenticated}
                    />
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Editorial panel */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.38, delay: 0.1 }}
                className="hidden lg:block flex-1 max-w-sm"
              >
                <AuthRightPanel />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-4 border-t transition-colors duration-300"
        style={{ borderTopColor: 'var(--border)' }}
      >
        <p
          className="text-xs text-center"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
        >
          Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade do Ryvo.
        </p>
      </footer>
    </div>
  )
}
