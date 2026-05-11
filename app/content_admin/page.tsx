'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useAuth } from '@/lib/contexts/auth-context'

export default function ContentAdminPage() {
  const { user, session, isLoading, logout } = useAuth()
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    setAuthenticated(Boolean(user && session?.accessToken))
  }, [user, session])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <p style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-inter)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!authenticated ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <AdminLogin onAuthenticated={() => setAuthenticated(true)} />
        </motion.div>
      ) : (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <AdminDashboard onSignOut={() => void logout()} userId={user?.id} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
