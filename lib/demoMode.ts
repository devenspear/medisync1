import { type SessionConfig } from './store'

// Demo mode for when API keys are not available
export const isDemoMode = () => {
  const hasElevenLabsKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  const hasOpenAIKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY

  // App requires AI features to be fully functional
  console.log('Demo mode check:', { hasElevenLabsKey: !!hasElevenLabsKey, hasOpenAIKey: !!hasOpenAIKey })

  return !hasElevenLabsKey || !hasOpenAIKey
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
      timeOfDay: 'morning',
      environment: 'quiet',
      wisdomSource: 'Default/Universal',
      selectedFeelings: ['tired'],
      userPrimer: 'Demo morning focus session'
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
      timeOfDay: 'evening',
      environment: 'quiet',
      wisdomSource: 'Default/Universal',
      selectedFeelings: ['stressed'],
      userPrimer: 'Demo evening relaxation session'
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
      timeOfDay: 'bedtime',
      environment: 'quiet',
      wisdomSource: 'Default/Universal',
      selectedFeelings: ['anxious'],
      userPrimer: 'Demo sleep preparation session'
    }
  }
]