// DEPRECATED: Supabase is no longer used - we've switched to Vercel Postgres
// This file is kept for legacy compatibility but is not functional

console.warn('Supabase client is deprecated - using Vercel Postgres with custom auth')

export const supabase = {
  auth: {
    signUp: () => Promise.reject(new Error('Supabase deprecated')),
    signIn: () => Promise.reject(new Error('Supabase deprecated')),
    signOut: () => Promise.reject(new Error('Supabase deprecated')),
    onAuthStateChange: () => () => {},
  },
  from: () => ({
    select: () => Promise.reject(new Error('Supabase deprecated')),
    insert: () => Promise.reject(new Error('Supabase deprecated')),
    update: () => Promise.reject(new Error('Supabase deprecated')),
    delete: () => Promise.reject(new Error('Supabase deprecated')),
  })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          subscription_tier: 'free' | 'premium'
          total_minutes: number
          current_streak: number
          created_at: string
          preferences: {
            default_duration: number
            preferred_voice: string
            favorite_frequency: string
          }
        }
        Insert: {
          id: string
          email: string
          subscription_tier?: 'free' | 'premium'
          total_minutes?: number
          current_streak?: number
          created_at?: string
          preferences?: {
            default_duration: number
            preferred_voice: string
            favorite_frequency: string
          }
        }
        Update: {
          id?: string
          email?: string
          subscription_tier?: 'free' | 'premium'
          total_minutes?: number
          current_streak?: number
          preferences?: {
            default_duration: number
            preferred_voice: string
            favorite_frequency: string
          }
        }
      }
      session_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          duration: number
          frequency: string
          voice_id: string
          layers: {
            binaural_volume: number
            music_volume: number
            voice_volume: number
            music_type: string
          }
          assessment_data: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          duration: number
          frequency: string
          voice_id: string
          layers: {
            binaural_volume: number
            music_volume: number
            voice_volume: number
            music_type: string
          }
          assessment_data: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          duration?: number
          frequency?: string
          voice_id?: string
          layers?: {
            binaural_volume: number
            music_volume: number
            voice_volume: number
            music_type: string
          }
          assessment_data?: Record<string, any>
        }
      }
      meditation_scripts: {
        Row: {
          id: string
          session_id: string
          intro_text: string
          main_content: string
          closing_text: string
          total_words: number
          estimated_duration: number
          generated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          intro_text: string
          main_content: string
          closing_text: string
          total_words: number
          estimated_duration: number
          generated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          intro_text?: string
          main_content?: string
          closing_text?: string
          total_words?: number
          estimated_duration?: number
        }
      }
    }
  }
}