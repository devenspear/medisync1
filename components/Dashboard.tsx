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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="flex flex-col min-h-screen">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <div className="p-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <span className="text-orange-400 text-lg mt-0.5">⚡</span>
                <div>
                  <p className="text-lg font-semibold text-orange-100 mb-1">Demo Mode</p>
                  <p className="text-orange-200/80 leading-relaxed">
                    You're experiencing MediSync with sample data. Add API keys to enable full functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Good Evening</h1>
              <p className="text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-11 h-11 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-all"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400 mb-1">{user?.total_minutes || 0}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400">Minutes</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400 mb-1">{user?.current_streak || 0}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400">Day Streak</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400 mb-1">{savedSessions.length}</p>
              <p className="text-xs uppercase tracking-wide text-gray-400">Sessions</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            <button
              onClick={() => setShowAssessment(true)}
              className="w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-left active:scale-[0.98] transition-transform shadow-lg shadow-blue-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">Start New Session</h3>
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-blue-100 leading-relaxed">
                Create a personalized meditation with AI guidance
              </p>
            </button>

            <button className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-left active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">Quick Meditation</h3>
                <span className="text-xl">🧘‍♀️</span>
              </div>
              <p className="text-gray-400">Use your last configuration</p>
            </button>
          </div>
        </div>

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Sessions</h2>
              {savedSessions.length > 2 && (
                <button className="text-blue-400 font-medium">
                  View All ({savedSessions.length})
                </button>
              )}
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              <div className="max-h-32 overflow-y-auto">
                <div className="divide-y divide-gray-700/50">
                  {savedSessions.slice(0, 2).map((session, index) => (
                    <div
                      key={index}
                      className="p-4 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-start justify-between flex-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-white mb-1 truncate">{session.name}</h4>
                          <p className="text-gray-400">
                            {session.duration} min • {session.layers.music_type}
                          </p>
                          {session.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{session.description}</p>
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
                  {savedSessions.length > 2 && (
                    <div className="p-4 text-center border-t border-gray-700">
                      <button className="w-full py-2 text-blue-400 font-medium">
                        Show {savedSessions.length - 2} More Sessions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Safe Area Padding */}
        <div className="pb-8"></div>
      </div>
    </div>
  )
}

