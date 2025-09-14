import { type SessionConfig } from './store'

// Demo mode for when API keys are not available
export const isDemoMode = () => {
  const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL &&
                           process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'

  // App can run with just Supabase - AI features are optional
  console.log('Demo mode check:', { hasSupabaseConfig })

  return !hasSupabaseConfig
}

// Demo user for offline mode
export const getDemoUser = () => ({
  id: 'demo-user-123',
  email: 'demo@medisync.com',
  subscription_tier: 'free' as const,
  total_minutes: 45,
  current_streak: 3,
  preferences: {
    default_duration: 10,
    preferred_voice: 'female-1',
    favorite_frequency: 'alpha' as const
  }
})

// Demo saved sessions
export const getDemoSessions = (): SessionConfig[] => [
  {
    id: 'demo-session-1',
    name: 'Morning Focus',
    description: 'Start your day with clarity',
    duration: 10,
    frequency: 'beta',
    voice_id: 'female-1',
    layers: {
      binaural_volume: 0.6,
      music_volume: 0.3,
      voice_volume: 0.8,
      music_type: 'ambient'
    },
    assessment_data: {
      goal: 'focus',
      currentState: 'tired',
      duration: 10,
      experience: 'intermediate',
      timeOfDay: 'morning'
    }
  },
  {
    id: 'demo-session-2',
    name: 'Evening Relaxation',
    description: 'Unwind after a long day',
    duration: 15,
    frequency: 'alpha',
    voice_id: 'male-1',
    layers: {
      binaural_volume: 0.5,
      music_volume: 0.4,
      voice_volume: 0.7,
      music_type: 'ambient'
    },
    assessment_data: {
      goal: 'relaxation',
      currentState: 'stressed',
      duration: 15,
      experience: 'beginner',
      timeOfDay: 'evening'
    }
  },
  {
    id: 'demo-session-3',
    name: 'Sleep Preparation',
    description: 'Deep rest meditation',
    duration: 20,
    frequency: 'delta',
    voice_id: 'female-2',
    layers: {
      binaural_volume: 0.4,
      music_volume: 0.2,
      voice_volume: 0.6,
      music_type: 'ambient'
    },
    assessment_data: {
      goal: 'sleep',
      currentState: 'anxious',
      duration: 20,
      experience: 'advanced',
      timeOfDay: 'bedtime'
    }
  }
]