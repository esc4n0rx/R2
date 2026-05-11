'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { getAvatarHex, getInitials } from '@/lib/api/profiles'
import type { Profile } from '@/lib/types'

interface ProfileCreationProps {
  onContinue: (profile: Profile) => void
}

export default function ProfileCreation({ onContinue }: ProfileCreationProps) {
  const { profiles } = useAuth()
  const [selected, setSelected] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    if (isLoading) return
    setIsLoading(true)
    const profile = selected
      ? (profiles.find((p) => p.id === selected) ?? profiles[0])
      : profiles[0]
    if (profile) onContinue(profile)
    setIsLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Header */}
      <header
        className="px-6 py-5 border-b transition-colors duration-300"
        style={{ borderBottomColor: 'var(--border)' }}
      >
        <span
          className="font-bold text-xl tracking-tight"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-syne)' }}
        >
          Ryvo
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-10">
            <h1
              className="text-4xl md:text-5xl font-bold leading-[0.92] mb-4 text-balance"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'var(--font-syne)',
                letterSpacing: '-0.5px',
              }}
            >
              Quem vai assistir?
            </h1>
            <p
              className="text-base md:text-lg max-w-md mx-auto text-pretty"
              style={{ color: 'var(--ryvo-charcoal)', fontFamily: 'var(--font-inter)' }}
            >
              Selecione um perfil para personalizar recomendações, histórico e favoritos.
            </p>
          </div>

          {/* Profile grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {profiles.map((profile, i) => {
              const color = getAvatarHex(profile.avatar_color)
              const initials = getInitials(profile.name)
              const isSelected = selected === profile.id

              return (
                <motion.button
                  key={profile.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  onClick={() => setSelected(profile.id)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: isSelected ? 'var(--ryvo-orange)' : 'var(--border)',
                    boxShadow: isSelected ? '0 0 0 2px rgba(255, 79, 0, 0.12)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--ryvo-orange)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </div>

                  <div className="text-center">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}
                    >
                      {profile.name}
                    </p>
                    {profile.is_kids && (
                      <p
                        className="text-xs mt-0.5"
                        style={{
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-inter)',
                        }}
                      >
                        Infantil
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--ryvo-orange)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4L3 5.5L6.5 2"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}

            {/* Add profile (visual only for now) */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: profiles.length * 0.06 }}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--ryvo-orange)'
                ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <Plus size={24} style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p
                className="text-sm font-medium text-center"
                style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
              >
                Adicionar perfil
              </p>
            </motion.button>
          </div>

          {/* Continue */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleContinue}
              disabled={isLoading || profiles.length === 0}
              className="px-8 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              style={{
                backgroundColor: 'var(--ryvo-orange)',
                color: '#fffefb',
                fontFamily: 'var(--font-inter)',
              }}
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              Continuar
            </button>
            <p
              className="text-xs"
              style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}
            >
              Você poderá editar os perfis depois.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
