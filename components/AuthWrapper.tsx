'use client'

import { useEffect } from 'react'
import { auth } from '@/lib/authClient'
import { useAppStore, type FrequencyType } from '@/lib/store'
import { isDemoMode, getDemoUser, getDemoSessions } from '@/lib/demoMode'
import type { AuthUser } from '@/lib/auth'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { setUser, savedSessions, saveSession } = useAppStore()

  useEffect(() => {
    if (isDemoMode()) {
      // Demo mode - automatically log in with demo user and data
      console.log('Running in demo mode')
      const demoUser = getDemoUser()
      const demoSessions = getDemoSessions()

      setUser(demoUser)

      // Load demo sessions
      demoSessions.forEach(session => saveSession(session))

      return
    }

    // Production mode with custom auth
    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChange((user: AuthUser | null) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email,
          subscription_tier: user.subscription_tier,
          total_minutes: user.total_minutes,
          current_streak: user.current_streak,
          preferences: {
            default_duration: user.preferences.default_duration,
            preferred_voice: user.preferences.preferred_voice,
            favorite_frequency: user.preferences.favorite_frequency as FrequencyType
          }
        })
      } else {
        setUser(null)
      }
    })

    return unsubscribe
  }, [setUser])

  return <>{children}</>
}