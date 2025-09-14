'use client'

import { useState } from 'react'
import { useAppStore, type SessionConfig } from '@/lib/store'
import { auth } from '@/lib/authClient'
import { isDemoMode } from '@/lib/demoMode'
import AssessmentFlow from './AssessmentFlow'
import SessionPlayer from './SessionPlayer'

export default function Dashboard() {
  const { user, savedSessions } = useAppStore()
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionConfig | null>(null)

  const handleSignOut = async () => {
    if (!isDemoMode()) {
      await auth.signOut()
    }
    // For demo mode, we could reset the store or just ignore sign out
  }

  const handleAssessmentComplete = (sessionConfig: SessionConfig) => {
    setCurrentSession(sessionConfig)
    setShowAssessment(false)
  }

  if (showAssessment) {
    return (
      <AssessmentFlow
        onComplete={handleAssessmentComplete}
        onCancel={() => setShowAssessment(false)}
      />
    )
  }

  if (currentSession) {
    return <SessionPlayer session={currentSession} onClose={() => setCurrentSession(null)} />
  }

  return (
    <div className="min-h-screen w-full">
      {/* Demo Mode Banner */}
      {isDemoMode() && (
        <div className="mx-4 mt-4 mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-orange-400 text-lg mt-0.5">⚡</span>
            <div>
              <p className="text-orange-100 font-medium mb-1">Demo Mode</p>
              <p className="text-orange-200/80 text-sm leading-relaxed">
                You're experiencing MediSync with sample data. Add API keys to enable full functionality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Good Evening</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-9 h-9 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-400 no-select"
          >
            <span className="text-lg">⚙️</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="ios-card text-center py-4">
            <p className="text-2xl font-bold text-blue-400 mb-1">{user?.total_minutes || 0}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Minutes</p>
          </div>
          <div className="ios-card text-center py-4">
            <p className="text-2xl font-bold text-green-400 mb-1">{user?.current_streak || 0}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Day Streak</p>
          </div>
          <div className="ios-card text-center py-4">
            <p className="text-2xl font-bold text-purple-400 mb-1">{savedSessions.length}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Sessions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => setShowAssessment(true)}
            className="w-full p-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-left no-select active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Start New Session</h3>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              Create a personalized meditation with AI guidance
            </p>
          </button>

          <button className="w-full ios-card text-left p-6 no-select active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Quick Meditation</h3>
              <span className="text-xl">🧘‍♀️</span>
            </div>
            <p className="text-gray-400 text-sm">Use your last configuration</p>
          </button>
        </div>

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Sessions</h2>
            <div className="space-y-3">
              {savedSessions.map((session, index) => (
                <div
                  key={index}
                  className="ios-card p-4 no-select"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white mb-1 truncate">{session.name}</h4>
                      <p className="text-sm text-gray-400">
                        {session.duration} min • {session.frequency}
                      </p>
                      {session.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentSession(session)}
                      className="ml-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg shrink-0 active:scale-95 transition-transform"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Safe Area Padding */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}

