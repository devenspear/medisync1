import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FrequencyType = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

export interface AssessmentData {
  goal: string
  currentState: string
  duration: number
  experience: string
  timeOfDay: string
  challenges?: string
  meditationStyle?: string
  environment?: string
  // New fields for master prompt template
  wisdomSource: string
  selectedFeelings: string[]
  userPrimer: string
  selectedMusic?: string // Simple music selection
  // Music generation selections
  selectedPrimaryTheme?: {
    displayName: string
    keywords: string
  }
  selectedAtmosphericElements?: Array<{
    displayName: string
    description: string
  }>
  selectedSoundscapeJourney?: {
    displayName: string
    structure: string
  }
}

export interface AudioLayers {
  music_volume: number
  voice_volume: number
  music_type: string
  music_file?: string // Optional MP3 file path for simple music playback
}

export interface SessionConfig {
  id?: string
  name: string
  description?: string
  duration: number
  voice_id: string
  layers: AudioLayers
  assessment_data: AssessmentData
}

export interface UserPreferences {
  default_duration: number
  preferred_voice: string
  favorite_frequency: FrequencyType
}

export interface User {
  id: string
  email: string
  subscription_tier: 'free' | 'premium'
  total_minutes: number
  current_streak: number
  preferences: UserPreferences
}

interface AppState {
  user: User | null
  currentSession: SessionConfig | null
  savedSessions: SessionConfig[]
  isPlaying: boolean
  currentTime: number

  // Actions
  setUser: (user: User | null) => void
  setCurrentSession: (session: SessionConfig) => void
  saveSession: (session: SessionConfig) => void
  removeSavedSession: (sessionId: string) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  updateUserStats: (minutes: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      currentSession: null,
      savedSessions: [],
      isPlaying: false,
      currentTime: 0,

      setUser: (user) => set({ user }),

      setCurrentSession: (session) => set({ currentSession: session }),

      saveSession: (session) => {
        const { savedSessions, user } = get()
        const maxSessions = user?.subscription_tier === 'premium' ? Infinity : 10

        if (savedSessions.length >= maxSessions) {
          // Remove oldest session for free users
          const updatedSessions = [...savedSessions.slice(1), session]
          set({ savedSessions: updatedSessions })
        } else {
          set({ savedSessions: [...savedSessions, session] })
        }
      },

      removeSavedSession: (sessionId) => {
        const { savedSessions } = get()
        set({
          savedSessions: savedSessions.filter(s => s.id !== sessionId)
        })
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      setCurrentTime: (time) => set({ currentTime: time }),

      updateUserStats: (minutes) => {
        const { user } = get()
        if (user) {
          set({
            user: {
              ...user,
              total_minutes: user.total_minutes + minutes
            }
          })
        }
      },
    }),
    {
      name: 'stillcaster-store',
      partialize: (state) => ({
        user: state.user,
        savedSessions: state.savedSessions,
      }),
    }
  )
)