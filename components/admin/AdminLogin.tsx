'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/contexts/auth-context'

interface AdminLoginProps {
  onAuthenticated: () => void
}

export default function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
      onAuthenticated()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('E-mail ou senha incorretos.')
        } else if (err.status === 403) {
          setError('Acesso negado para esta conta.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Nao foi possivel autenticar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.35,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--ryvo-orange)' }}
            >
              <ShieldCheck size={22} color="#fff" strokeWidth={2} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
            >
              Ryvo Admin
            </h1>
            <p
              className="text-sm mt-1 text-center"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              Acesso restrito ao painel de conteudo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ryvo.app"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ryvo-orange)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-inter)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--ryvo-orange)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle size={14} color="#ef4444" className="mt-0.5 shrink-0" />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: '#ef4444', fontFamily: 'var(--font-inter)' }}
                >
                  {error}
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity mt-1"
              style={{
                backgroundColor: 'var(--ryvo-orange)',
                color: '#fff',
                fontFamily: 'var(--font-inter)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verificando...' : 'Entrar no Admin'}
            </button>
          </form>
        </div>

        <p
          className="text-xs text-center mt-4"
          style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
        >
          <a
            href="/"
            style={{ color: 'var(--ryvo-orange)' }}
          >
            Voltar para o Ryvo
          </a>
        </p>
      </motion.div>
    </div>
  )
}
