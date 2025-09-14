'use client'

import { useState } from 'react'
import { type SessionConfig, type AssessmentData } from '@/lib/store'
import { createVoiceSynthesis } from '@/lib/voiceSynthesis'

const GOALS = [
  { id: 'relaxation', label: 'Relaxation & Stress Relief', icon: '🧘‍♀️' },
  { id: 'focus', label: 'Focus & Concentration', icon: '🎯' },
  { id: 'sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'anxiety', label: 'Reduce Anxiety', icon: '💚' },
  { id: 'creativity', label: 'Boost Creativity', icon: '💡' },
  { id: 'energy', label: 'Increase Energy', icon: '⚡' },
]

const VOICES = [
  { id: 'female-1', name: 'Kelli', description: 'Warm & comforting meditation voice', icon: '🎙️' },
  { id: 'female-2', name: 'Sarah', description: 'Professional & reassuring', icon: '🎙️' },
  { id: 'male-1', name: 'Thomas', description: 'Soft & subdued for meditations', icon: '🎙️' },
  { id: 'male-2', name: 'George', description: 'Warm British resonance', icon: '🎙️' },
]

interface Props {
  onComplete: (sessionConfig: SessionConfig) => void
  onCancel: () => void
}

export default function AssessmentFlow({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('female-1')
  const [isPlaying, setIsPlaying] = useState(false)
  const [assessment, setAssessment] = useState<AssessmentData>({
    goal: '',
    currentState: '',
    duration: 10,
    experience: '',
    timeOfDay: '',
  })

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal)
    setStep(2)
  }

  const handleVoicePreview = async (voiceId: string) => {
    if (isPlaying) return

    try {
      setIsPlaying(true)
      const voiceSynthesis = createVoiceSynthesis()
      const audioBuffer = await voiceSynthesis.previewVoice(voiceId)
      const audioUrl = voiceSynthesis.createAudioUrl(audioBuffer)
      const audio = new Audio(audioUrl)
      audio.play()
      audio.onended = () => {
        setIsPlaying(false)
        voiceSynthesis.revokeAudioUrl(audioUrl)
      }
    } catch (error) {
      console.error('Voice preview failed:', error)
      setIsPlaying(false)
    }
  }

  const handleCreateSession = () => {
    const sessionConfig: SessionConfig = {
      name: `${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} Session`,
      description: `10 minute ${selectedGoal} session with AI-generated guidance`,
      duration: 10,
      frequency: 'alpha',
      voice_id: selectedVoice,
      layers: {
        binaural_volume: 0.6,
        music_volume: 0.4,
        voice_volume: 0.8,
        music_type: 'ambient',
      },
      assessment_data: { ...assessment, goal: selectedGoal },
    }
    onComplete(sessionConfig)
  }

  return (
    <div className="ios-page">
      <div className="ios-safe-content">
        {/* Header */}
        <div className="ios-nav-bar">
          <button onClick={step === 1 ? onCancel : () => setStep(1)} className="ios-nav-button">
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <div className="ios-nav-title">New Session</div>
          <div className="w-16"></div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 flex flex-col">
          <div className="ios-card p-6 flex-1">

            {/* Step 1: Goal Selection */}
            {step === 1 && (
              <>
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
              </>
            )}

            {/* Step 2: Voice Selection */}
            {step === 2 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Choose your guide
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Select a voice for your personalized meditation with ElevenLabs AI.
                  </p>
                </div>

                <div className="ios-list mb-6">
                  {VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`ios-list-item no-select transition-all border-2 ${
                        selectedVoice === voice.id
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-transparent hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{voice.icon}</span>
                          <div className="text-left">
                            <div className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                              {voice.name}
                            </div>
                            <div className="ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                              {voice.description}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVoicePreview(voice.id)
                          }}
                          disabled={isPlaying}
                          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm shrink-0 active:scale-95 transition-transform disabled:opacity-50"
                        >
                          {isPlaying ? '⏹' : '▶'}
                        </button>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateSession}
                  className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">✨</span>
                    <span className="ios-title-3 text-white">Create AI Session</span>
                  </div>
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}