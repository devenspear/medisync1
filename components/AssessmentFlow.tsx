'use client'

import { useState } from 'react'
import { type SessionConfig, type AssessmentData } from '@/lib/store'
import { createVoiceSynthesis } from '@/lib/voiceSynthesis'
// Import only the data structures, not the template manager
import { WISDOM_SOURCES, FEELING_OPTIONS, GOAL_OPTIONS } from '@/lib/promptConstants'

const VOICES = [
  { id: 'female-1', name: 'Kelli', description: 'Warm & comforting meditation voice', icon: '🎙️' },
  { id: 'female-2', name: 'Sarah', description: 'Professional & reassuring', icon: '🎙️' },
  { id: 'male-1', name: 'Thomas', description: 'Soft & subdued for meditations', icon: '🎙️' },
  { id: 'male-2', name: 'George', description: 'Warm British resonance', icon: '🎙️' },
]

const SURVEY_QUESTIONS = [
  {
    id: 'currentState',
    question: 'How are you feeling right now?',
    options: [
      { id: 'stressed', label: 'Stressed or Anxious', icon: '😰' },
      { id: 'tired', label: 'Tired or Fatigued', icon: '😴' },
      { id: 'restless', label: 'Restless or Distracted', icon: '🌪️' },
      { id: 'neutral', label: 'Neutral or Calm', icon: '😌' },
      { id: 'energetic', label: 'Energetic but Need Focus', icon: '⚡' },
    ]
  },
  {
    id: 'experience',
    question: 'What\'s your meditation experience?',
    options: [
      { id: 'beginner', label: 'New to Meditation', icon: '🌱' },
      { id: 'some', label: 'Some Experience', icon: '🌿' },
      { id: 'regular', label: 'Regular Practice', icon: '🌳' },
      { id: 'advanced', label: 'Very Experienced', icon: '🧘‍♂️' },
    ]
  },
  {
    id: 'environment',
    question: 'Where will you be meditating?',
    options: [
      { id: 'quiet', label: 'Quiet Private Space', icon: '🏠' },
      { id: 'busy', label: 'Busy Environment', icon: '🏢' },
      { id: 'nature', label: 'Outdoors/Nature', icon: '🌲' },
      { id: 'travel', label: 'Traveling/Transit', icon: '✈️' },
    ]
  }
]

const DURATIONS = [
  { id: 1, label: 'Under 1 minute', description: 'Quick reset' },
  { id: 3, label: 'Under 3 minutes', description: 'Brief session' },
  { id: 5, label: 'Under 5 minutes', description: 'Short practice' },
]

interface Props {
  onComplete: (sessionConfig: SessionConfig) => void
  onCancel: () => void
}

export default function AssessmentFlow({ onComplete, onCancel }: Props) {
  // 1: Goal, 2: Wisdom, 3: Feelings, 4: Survey, 5: Duration, 6: Primer, 7: Generating, 8: Review, 9: Voice
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [selectedWisdom, setSelectedWisdom] = useState('Default/Universal')
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([])
  const [selectedVoice, setSelectedVoice] = useState('female-1')
  const [selectedDuration, setSelectedDuration] = useState(3)
  const [promptPrimer, setPromptPrimer] = useState('')
  const [generatedScript, setGeneratedScript] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [assessment, setAssessment] = useState<AssessmentData>({
    goal: '',
    currentState: '',
    duration: 3,
    experience: '',
    timeOfDay: '',
    environment: '',
    wisdomSource: 'Default/Universal',
    selectedFeelings: [],
    userPrimer: '',
  })

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal)
    setAssessment(prev => ({ ...prev, goal }))
  }

  const handleContinueFromGoal = () => {
    if (selectedGoal) {
      setStep(2)
    }
  }

  const handleWisdomSelect = (wisdom: string) => {
    setSelectedWisdom(wisdom)
    setAssessment(prev => ({ ...prev, wisdomSource: wisdom }))
  }

  const handleContinueFromWisdom = () => {
    setStep(3)
  }

  const handleFeelingToggle = (feeling: string) => {
    const newFeelings = selectedFeelings.includes(feeling)
      ? selectedFeelings.filter(f => f !== feeling)
      : [...selectedFeelings, feeling]

    setSelectedFeelings(newFeelings)
    setAssessment(prev => ({ ...prev, selectedFeelings: newFeelings }))
  }

  const handleContinueFromFeelings = () => {
    setStep(4)
  }

  const handleSurveyAnswer = (questionId: string, answer: string) => {
    setAssessment(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleContinueFromSurvey = () => {
    const requiredAnswers = ['currentState', 'experience', 'environment']
    const hasAllAnswers = requiredAnswers.every(key => assessment[key as keyof AssessmentData])
    if (hasAllAnswers) {
      setStep(5)
    }
  }

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration)
    setAssessment(prev => ({ ...prev, duration }))
    setStep(6)
  }

  const handleContinueFromPrimer = () => {
    setStep(7)
    generateScript()
  }

  const generateScript = async () => {
    setIsGenerating(true)
    try {
      // Import demo mode check and auth client dynamically
      const { isDemoMode } = await import('@/lib/demoMode')
      const isDemo = isDemoMode()

      console.log('Script generation mode:', isDemo ? 'Demo (test endpoint)' : 'Production (authenticated)')

      // For development/testing, use test endpoint without auth
      // For production, always require authentication
      const endpoint = isDemo ? '/api/test-scripts' : '/api/scripts'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add authentication header for production
      if (!isDemo) {
        // Use proper auth token from authClient
        const { authClient } = await import('@/lib/authClient')
        const authToken = authClient.getToken()

        if (!authToken) {
          throw new Error('Authentication required. Please log in.')
        }

        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assessment: {
            ...assessment,
            goal: selectedGoal,
            duration: selectedDuration,
            wisdomSource: selectedWisdom,
            selectedFeelings: selectedFeelings,
            userPrimer: promptPrimer
          },
          promptPrimer
        })
      })

      if (response.ok) {
        const { script } = await response.json()
        let scriptText = ''

        if (script.title) {
          scriptText += script.title + '\\n\\n'
        }
        scriptText += script.intro_text + '\\n\\n' + script.main_content + '\\n\\n' + script.closing_text

        setGeneratedScript(scriptText)
        setStep(8)
      } else {
        const data = await response.json()

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        }

        throw new Error(`HTTP ${response.status}: ${data.error || 'Script generation failed'}`)
      }
    } catch (error) {
      console.error('Script generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate meditation script. Please try again.'
      alert(errorMessage)
      setStep(6)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinueFromReview = () => {
    setStep(9)
  }

  const handleVoicePreview = async (voiceId: string) => {
    if (isPlaying) return

    try {
      setIsPlaying(true)

      // Try server-side ElevenLabs API first
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId })
      })

      if (response.ok) {
        // ElevenLabs API succeeded
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.play()
        audio.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
      } else {
        // Fallback to browser TTS
        const voiceSynthesis = createVoiceSynthesis()
        await voiceSynthesis.previewVoice(voiceId)
        setIsPlaying(false)
      }
    } catch (error) {
      console.error('Voice preview failed:', error)
      // Fallback to browser TTS
      try {
        const voiceSynthesis = createVoiceSynthesis()
        await voiceSynthesis.previewVoice(voiceId)
      } catch (fallbackError) {
        console.error('Fallback TTS also failed:', fallbackError)
      }
      setIsPlaying(false)
    }
  }

  const handleCreateSession = () => {
    const sessionConfig: SessionConfig = {
      name: `${selectedGoal.charAt(0).toUpperCase() + selectedGoal.slice(1)} Session`,
      description: `${selectedDuration} minute ${selectedGoal} session with AI-generated guidance`,
      duration: selectedDuration,
      frequency: 'alpha',
      voice_id: selectedVoice,
      layers: {
        binaural_volume: 0.6,
        music_volume: 0.4,
        voice_volume: 0.8,
        music_type: 'ambient',
      },
      assessment_data: {
        ...assessment,
        goal: selectedGoal,
        wisdomSource: selectedWisdom,
        selectedFeelings: selectedFeelings,
        userPrimer: promptPrimer
      },
    }
    onComplete(sessionConfig)
  }

  return (
    <div className="ios-page">
      <div className="ios-safe-content">
        {/* Header */}
        <div className="ios-nav-bar">
          <button
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            className="ios-nav-button"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <div className="ios-nav-title">
            {step === 1 && 'Choose Goal'}
            {step === 2 && 'Wisdom Source'}
            {step === 3 && 'Feelings'}
            {step === 4 && 'About You'}
            {step === 5 && 'Duration'}
            {step === 6 && 'Customize'}
            {step === 7 && 'Generating...'}
            {step === 8 && 'Review Script'}
            {step === 9 && 'Choose Voice'}
          </div>
          <div className="w-16"></div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  stepNum <= step ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 flex flex-col">
          <div className="ios-card p-6 flex-1">

            {/* Step 1: Goal Selection */}
            {step === 1 && (
              <>
                <div className="text-center ios-section">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    What's your intention?
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Choose your primary focus for this meditation.
                  </p>
                </div>

                <div className="ios-list mb-6">
                  {GOAL_OPTIONS.map((goal) => (
                    <button
                      key={goal.goal}
                      onClick={() => handleGoalSelect(goal.goal)}
                      className={`ios-list-item no-select transition-all border-2 ${
                        selectedGoal === goal.goal
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-transparent hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="text-left flex-1">
                          <div className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                            {goal.goal}
                          </div>
                          <div className="ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                            {goal.coreFocus}
                          </div>
                        </div>
                        {selectedGoal === goal.goal && (
                          <span className="text-blue-400 text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedGoal && (
                  <button
                    onClick={handleContinueFromGoal}
                    className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                  >
                    <span className="ios-title-3 text-white">Continue</span>
                  </button>
                )}
              </>
            )}

            {/* Step 2: Wisdom Source Selection */}
            {step === 2 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Choose Your Wisdom Source
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Select the philosophical foundation for your meditation.
                  </p>
                </div>

                <div className="ios-list mb-6">
                  {WISDOM_SOURCES.map((source) => (
                    <button
                      key={source.internalKeyword}
                      onClick={() => handleWisdomSelect(source.internalKeyword)}
                      className={`ios-list-item no-select transition-all border-2 ${
                        selectedWisdom === source.internalKeyword
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-transparent hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="text-left flex-1">
                          <div className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                            {source.displayName}
                          </div>
                          <div className="ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                            {source.conceptSnippet}
                          </div>
                        </div>
                        {selectedWisdom === source.internalKeyword && (
                          <span className="text-blue-400 text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleContinueFromWisdom}
                  className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                >
                  <span className="ios-title-3 text-white">Continue</span>
                </button>
              </>
            )}

            {/* Step 3: Feelings to Transcend (Checkboxes) */}
            {step === 3 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    What would you like to transform?
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Select any feelings you'd like to transcend. (Optional)
                  </p>
                </div>

                <div className="ios-list mb-6">
                  {FEELING_OPTIONS.map((feeling) => (
                    <button
                      key={feeling.feeling}
                      onClick={() => handleFeelingToggle(feeling.feeling)}
                      className={`ios-list-item no-select transition-all border-2 ${
                        selectedFeelings.includes(feeling.feeling)
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-transparent hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left flex-1">
                          <div className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                            {feeling.feeling}
                          </div>
                          <div className="ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                            Transforms to: {feeling.antidoteThemes}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          selectedFeelings.includes(feeling.feeling)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-400'
                        }`}>
                          {selectedFeelings.includes(feeling.feeling) && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleContinueFromFeelings}
                  className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                >
                  <span className="ios-title-3 text-white">Continue</span>
                </button>
              </>
            )}

            {/* Step 4: Survey Questions */}
            {step === 4 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    About You
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Help us personalize your meditation experience.
                  </p>
                </div>

                <div className="space-y-6">
                  {SURVEY_QUESTIONS.map((question) => (
                    <div key={question.id} className="space-y-3">
                      <h4 className="ios-headline font-medium" style={{color: 'var(--ios-label)'}}>
                        {question.question}
                      </h4>
                      <div className="ios-list">
                        {question.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleSurveyAnswer(question.id, option.id)}
                            className={`ios-list-item no-select transition-all border-2 ${
                              assessment[question.id as keyof typeof assessment] === option.id
                                ? 'border-blue-400 bg-blue-500/10'
                                : 'border-transparent hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-center space-x-4 w-full">
                              <span className="text-2xl">{option.icon}</span>
                              <span className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                                {option.label}
                              </span>
                              {assessment[question.id as keyof typeof assessment] === option.id && (
                                <span className="ml-auto text-blue-400 text-xl">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleContinueFromSurvey}
                    disabled={!['currentState', 'experience', 'environment'].every(key =>
                      assessment[key as keyof typeof assessment]
                    )}
                    className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    <span className="ios-title-3 text-white">Continue</span>
                  </button>
                </div>
              </>
            )}

            {/* Step 5: Duration Selection */}
            {step === 5 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Duration
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    How long would you like to meditate?
                  </p>
                </div>

                <div className="ios-list">
                  {DURATIONS.map((duration) => (
                    <button
                      key={duration.id}
                      onClick={() => handleDurationSelect(duration.id)}
                      className="ios-list-item no-select transition-all border-2 border-transparent hover:border-blue-400"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="ios-headline font-bold text-blue-400">{duration.id}</span>
                          </div>
                          <div className="text-left">
                            <div className="ios-body font-medium" style={{color: 'var(--ios-label)'}}>
                              {duration.label}
                            </div>
                            <div className="ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                              {duration.description}
                            </div>
                          </div>
                        </div>
                        <span className="text-xl">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 6: Prompt Primer */}
            {step === 6 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Personal Touch
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Add any specific details to personalize your meditation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block ios-headline font-medium mb-2" style={{color: 'var(--ios-label)'}}>
                      Custom Instructions (Optional)
                    </label>
                    <textarea
                      value={promptPrimer}
                      onChange={(e) => setPromptPrimer(e.target.value)}
                      placeholder="e.g., Focus on gratitude, include nature imagery, help with work stress..."
                      maxLength={200}
                      className="w-full h-24 p-4 ios-background-secondary rounded-xl ios-body resize-none"
                      style={{
                        color: 'var(--ios-label)',
                        border: '1px solid var(--ios-separator)'
                      }}
                    />
                    <div className="mt-2 text-right">
                      <span className="ios-caption" style={{color: 'var(--ios-label-tertiary)'}}>
                        {promptPrimer.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="ios-card p-4">
                    <h4 className="ios-headline font-medium mb-2" style={{color: 'var(--ios-label)'}}>
                      Your Meditation Summary
                    </h4>
                    <div className="space-y-2 ios-caption" style={{color: 'var(--ios-label-secondary)'}}>
                      <div>Goal: {selectedGoal}</div>
                      <div>Wisdom: {WISDOM_SOURCES.find(w => w.internalKeyword === selectedWisdom)?.displayName}</div>
                      <div>Duration: {selectedDuration} minutes</div>
                      {selectedFeelings.length > 0 && (
                        <div>Transforming: {selectedFeelings.join(', ')}</div>
                      )}
                      <div>Current State: {SURVEY_QUESTIONS[0].options.find(o => o.id === assessment.currentState)?.label}</div>
                      <div>Experience: {SURVEY_QUESTIONS[1].options.find(o => o.id === assessment.experience)?.label}</div>
                      <div>Environment: {SURVEY_QUESTIONS[2].options.find(o => o.id === assessment.environment)?.label}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleContinueFromPrimer}
                    className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-xl">✨</span>
                      <span className="ios-title-3 text-white">Generate Script</span>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Step 7: Generating Script */}
            {step === 7 && (
              <>
                <div className="text-center ios-section">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="ios-title-2 mb-2" style={{color: 'var(--ios-label)'}}>
                    Creating Your Meditation
                  </h3>
                  <p className="ios-subhead" style={{color: 'var(--ios-label-secondary)'}}>
                    Our AI is crafting a personalized script using the master prompt template...
                  </p>
                </div>
              </>
            )}

            {/* Step 8: Review Script */}
            {step === 8 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Review Script
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Your personalized meditation script is ready.
                  </p>
                </div>

                <div className="ios-card p-4 mb-6 max-h-64 overflow-y-auto">
                  <div className="ios-body leading-relaxed whitespace-pre-line" style={{color: 'var(--ios-label)'}}>
                    {generatedScript}
                  </div>
                </div>

                <button
                  onClick={handleContinueFromReview}
                  className="w-full ios-button-prominent ios-padding-lg rounded-2xl text-center no-select active:scale-[0.98] transition-transform"
                >
                  <span className="ios-title-3 text-white">Choose Voice</span>
                </button>
              </>
            )}

            {/* Step 9: Voice Selection */}
            {step === 9 && (
              <>
                <div className="text-center ios-section mb-6">
                  <h3 className="ios-title-2" style={{color: 'var(--ios-label)'}}>
                    Choose Your Guide
                  </h3>
                  <p className="ios-subhead ios-spacing-t-sm" style={{color: 'var(--ios-label-secondary)'}}>
                    Select a voice for your personalized meditation.
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
                    <span className="ios-title-3 text-white">Create Session</span>
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