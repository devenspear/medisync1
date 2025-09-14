import { supabase } from './supabase'
import { type SessionConfig } from './store'

export class SessionStorage {

  async saveSession(userId: string, sessionConfig: SessionConfig): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('session_configs')
        .insert({
          user_id: userId,
          name: sessionConfig.name,
          description: sessionConfig.description,
          duration: sessionConfig.duration,
          frequency: sessionConfig.frequency,
          voice_id: sessionConfig.voice_id,
          layers: sessionConfig.layers,
          assessment_data: sessionConfig.assessment_data,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Failed to save session to Supabase:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error saving session:', error)
      return null
    }
  }

  async loadUserSessions(userId: string): Promise<SessionConfig[]> {
    try {
      const { data, error } = await supabase
        .from('session_configs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load sessions from Supabase:', error)
        return []
      }

      return data.map(session => ({
        id: session.id,
        name: session.name,
        description: session.description,
        duration: session.duration,
        frequency: session.frequency,
        voice_id: session.voice_id,
        layers: session.layers,
        assessment_data: session.assessment_data,
      }))
    } catch (error) {
      console.error('Error loading sessions:', error)
      return []
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_configs')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Failed to delete session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting session:', error)
      return false
    }
  }

  async updateUserStats(userId: string, additionalMinutes: number): Promise<boolean> {
    try {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_minutes, current_streak')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch current profile:', fetchError)
        return false
      }

      const newTotalMinutes = (currentProfile.total_minutes || 0) + additionalMinutes
      const newStreak = (currentProfile.current_streak || 0) + 1

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_minutes: newTotalMinutes,
          current_streak: newStreak,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update user stats:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating user stats:', error)
      return false
    }
  }
}

// Singleton instance
let sessionStorageInstance: SessionStorage | null = null

export const getSessionStorage = () => {
  if (!sessionStorageInstance) {
    sessionStorageInstance = new SessionStorage()
  }
  return sessionStorageInstance
}