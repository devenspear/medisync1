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
    <div className="ios-page">
      <div className="ios-safe-content">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <div className="ios-section">
            <div className="ios-full-width-card bg-orange-500/10 border border-orange-500/30 ios-padding-md">
              <div className="flex items-start space-x-3">
                <span className="text-orange-400 text-lg mt-0.5">⚡</span>
                <div>
                  <p className="ios-headline text-orange-100 mb-1">Demo Mode</p>
                  <p className="ios-subhead text-orange-200/80 leading-relaxed">
                    You're experiencing MediSync with sample data. Add API keys to enable full functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="ios-section">
          <div className="flex items-center justify-between ios-content-inset">
            <div>
              <h1 className="ios-title-2 mb-1" style={{color: 'var(--ios-label)'}}>Good Evening</h1>
              <p className="ios-subhead" style={{color: 'var(--ios-label-secondary)'}}>{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-11 h-11 ios-background-secondary rounded-full flex items-center justify-center no-select"
              style={{color: 'var(--ios-label-secondary)'}}
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ios-section">
          <div className="grid grid-cols-3 gap-3 ios-content-inset">
            <div className="ios-card text-center ios-padding-md">
              <p className="ios-title-2 font-bold text-blue-400 mb-1">{user?.total_minutes || 0}</p>
              <p className="ios-caption uppercase tracking-wide" style={{color: 'var(--ios-label-secondary)'}}>Minutes</p>
            </div>
            <div className="ios-card text-center ios-padding-md">
              <p className="ios-title-2 font-bold text-green-400 mb-1">{user?.current_streak || 0}</p>
              <p className="ios-caption uppercase tracking-wide" style={{color: 'var(--ios-label-secondary)'}}>Day Streak</p>
            </div>
            <div className="ios-card text-center ios-padding-md">
              <p className="ios-title-2 font-bold text-purple-400 mb-1">{savedSessions.length}</p>
              <p className="ios-caption uppercase tracking-wide" style={{color: 'var(--ios-label-secondary)'}}>Sessions</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ios-section">
          <div className="space-y-4 ios-content-inset">
            <button
              onClick={() => setShowAssessment(true)}
              className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-left no-select active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="ios-title-3 text-white">Start New Session</h3>
                <span className="text-2xl">✨</span>
              </div>
              <p className="ios-subhead text-blue-100 leading-relaxed">
                Create a personalized meditation with AI guidance
              </p>
            </button>

            <button className="w-full ios-card text-left ios-padding-lg no-select active:scale-[0.98] transition-transform">
              <div className="flex items-center justify-between mb-2">
                <h3 className="ios-headline" style={{color: 'var(--ios-label)'}}>Quick Meditation</h3>
                <span className="text-xl">🧘‍♀️</span>
              </div>
              <p className="ios-subhead" style={{color: 'var(--ios-label-secondary)'}}>Use your last configuration</p>
            </button>
          </div>
        </div>

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div className="ios-section">
            <div className="flex items-center justify-between ios-content-inset mb-3">
              <h2 className="ios-section-header">Your Sessions</h2>
              {savedSessions.length > 2 && (
                <button className="ios-subhead text-blue-400 font-medium">
                  View All ({savedSessions.length})
                </button>
              )}
            </div>
            <div className="ios-full-width-card">
              <div className="max-h-32 overflow-y-auto">
                <div className="ios-list">
                  {savedSessions.slice(0, 2).map((session, index) => (
                    <div
                      key={index}
                      className="ios-list-item no-select"
                    >
                      <div className="flex items-start justify-between flex-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="ios-headline mb-1 truncate" style={{color: 'var(--ios-label)'}}>{session.name}</h4>
                          <p className="ios-subhead" style={{color: 'var(--ios-label-secondary)'}}>
                            {session.duration} min • {session.frequency}
                          </p>
                          {session.description && (
                            <p className="ios-caption mt-1 line-clamp-2" style={{color: 'var(--ios-label-tertiary)'}}>{session.description}</p>
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
                    <div className="ios-list-item text-center border-t border-gray-800">
                      <button className="w-full py-2 ios-subhead text-blue-400 font-medium">
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
        <div className="ios-spacing-xl"></div>
      </div>
    </div>
  )
}

