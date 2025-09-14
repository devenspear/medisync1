'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import { isDemoMode, getDemoUser, getDemoSessions } from '@/lib/demoMode'

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

    // Production mode with Supabase
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          subscription_tier: 'free',
          total_minutes: 0,
          current_streak: 0,
          preferences: {
            default_duration: 10,
            preferred_voice: 'female-1',
            favorite_frequency: 'alpha'
          }
        })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch or create user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
        } else {
          // Create new profile
          const newProfile = {
            id: session.user.id,
            email: session.user.email!,
            subscription_tier: 'free' as const,
            total_minutes: 0,
            current_streak: 0,
            preferences: {
              default_duration: 10,
              preferred_voice: 'female-1',
              favorite_frequency: 'alpha' as const
            }
          }

          await supabase.from('profiles').insert(newProfile)
          setUser(newProfile)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return <>{children}</>
}