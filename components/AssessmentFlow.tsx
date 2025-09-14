'use client'

import { useState } from 'react'
import { type SessionConfig, type AssessmentData } from '@/lib/store'

const GOALS = [
  { id: 'relaxation', label: 'Relaxation & Stress Relief', icon: '🧘‍♀️' },
  { id: 'focus', label: 'Focus & Concentration', icon: '🎯' },
  { id: 'sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'anxiety', label: 'Reduce Anxiety', icon: '💚' },
  { id: 'creativity', label: 'Boost Creativity', icon: '💡' },
  { id: 'energy', label: 'Increase Energy', icon: '⚡' },
]

interface Props {
  onComplete: (sessionConfig: SessionConfig) => void
  onCancel: () => void
}

export default function AssessmentFlow({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [assessment, setAssessment] = useState<AssessmentData>({
    goal: '',
    currentState: '',
    duration: 10,
    experience: '',
    timeOfDay: '',
  })

  const handleGoalSelect = (goal: string) => {
    setAssessment(prev => ({ ...prev, goal }))
    // For now, just create a basic session config
    const sessionConfig: SessionConfig = {
      name: `${goal} Session`,
      description: `10 minute ${goal} session`,
      duration: 10,
      frequency: 'alpha',
      voice_id: 'female-1',
      layers: {
        binaural_volume: 0.6,
        music_volume: 0.4,
        voice_volume: 0.8,
        music_type: 'ambient',
      },
      assessment_data: { ...assessment, goal },
    }
    onComplete(sessionConfig)
  }

  return (
    <div className="ios-page">
      <div className="ios-safe-content">
        {/* Header */}
        <div className="ios-nav-bar">
          <button onClick={onCancel} className="ios-nav-button">
            Cancel
          </button>
          <div className="ios-nav-title">New Session</div>
          <div className="w-16"></div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 flex flex-col">
          <div className="ios-card p-6 flex-1">
            <div className="text-center ios-section">
              <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                What's your goal?
              </h3>
              <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                Choose what you'd like to focus on in this session.
              </p>
            </div>

            <div className="ios-list">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal.id)}
                  className="ios-list-item no-select transition-all border-2 border-transparent hover:border-blue-400"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                      {goal.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}