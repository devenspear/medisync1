import { authClient } from './authClient'
import { type SessionConfig } from './store'

export class SessionStorage {

  async saveSession(userId: string, sessionConfig: SessionConfig): Promise<string | null> {
    try {
      const response = await authClient.authenticatedFetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionConfig.name,
          description: sessionConfig.description,
          duration: sessionConfig.duration,
          voice_id: sessionConfig.voice_id,
          layers: sessionConfig.layers,
          assessment_data: sessionConfig.assessment_data,
        })
      })

      if (!response.ok) {
        console.error('Failed to save session:', response.statusText)
        return null
      }

      const data = await response.json()
      return data.session.id
    } catch (error) {
      console.error('Error saving session:', error)
      return null
    }
  }

  async loadUserSessions(userId: string): Promise<SessionConfig[]> {
    try {
      const response = await authClient.authenticatedFetch('/api/sessions')

      if (!response.ok) {
        console.error('Failed to load sessions:', response.statusText)
        return []
      }

      const data = await response.json()
      return data.sessions || []
    } catch (error) {
      console.error('Error loading sessions:', error)
      return []
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await authClient.authenticatedFetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.error('Failed to delete session:', response.statusText)
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
      // For now, just return true - we'll implement user stats updating later
      // This could be done through a dedicated API endpoint
      console.log(`Would update user ${userId} stats with ${additionalMinutes} minutes`)
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