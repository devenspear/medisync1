'use client'

import { useState } from 'react'
import { type SessionConfig, type AssessmentData } from '@/lib/store'
import { createVoiceSynthesis } from '@/lib/voiceSynthesis'
import { WISDOM_SOURCES, FEELING_OPTIONS, GOAL_OPTIONS } from '@/lib/promptConstants'
import { PRIMARY_THEMES, ATMOSPHERIC_ELEMENTS, SOUNDSCAPE_JOURNEYS } from '@/lib/musicConstants'
import type { PrimaryTheme, AtmosphericElement, SoundscapeJourney } from '@/lib/musicConstants'
import { AppleToggle, AppleCard, AppleProgress, ApplePillButton } from './AppleUI'

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
  // Steps: 1: Goal, 2: Wisdom, 3: Feelings, 4: Survey, 5: Duration, 6: Music Theme, 7: Atmospheric Elements, 8: Soundscape Journey, 9: Primer, 10: Generating, 11: Review, 12: Voice
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
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('Preparing your meditation...')

  // New music generation state
  const [selectedPrimaryTheme, setSelectedPrimaryTheme] = useState<PrimaryTheme | null>(null)
  const [selectedAtmosphericElements, setSelectedAtmosphericElements] = useState<AtmosphericElement[]>([])
  const [selectedSoundscapeJourney, setSelectedSoundscapeJourney] = useState<SoundscapeJourney | null>(null)
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

  // New music generation handlers
  const handlePrimaryThemeSelect = (theme: PrimaryTheme) => {
    setSelectedPrimaryTheme(theme)
  }

  const handleContinueFromTheme = () => {
    if (selectedPrimaryTheme) {
      setStep(7)
    }
  }

  const handleAtmosphericElementToggle = (element: AtmosphericElement) => {
    const isSelected = selectedAtmosphericElements.some(e => e.displayName === element.displayName)
    if (isSelected) {
      setSelectedAtmosphericElements(prev => prev.filter(e => e.displayName !== element.displayName))
    } else {
      setSelectedAtmosphericElements(prev => [...prev, element])
    }
  }

  const handleContinueFromAtmospheric = () => {
    setStep(8)
  }

  const handleSoundscapeJourneySelect = (journey: SoundscapeJourney) => {
    setSelectedSoundscapeJourney(journey)
  }

  const handleContinueFromJourney = () => {
    if (selectedSoundscapeJourney) {
      setStep(9)
    }
  }

  const handleContinueFromPrimer = () => {
    setStep(10)
    generateScript()
  }

  const generateScript = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationMessage('🤖 Analyzing your preferences...')

    try {
      // Progress updates during generation
      setTimeout(() => {
        setGenerationProgress(0.2)
        setGenerationMessage('🧠 Generating personalized meditation script...')
      }, 500)

      // Always use authenticated production endpoint
      const { authClient } = await import('@/lib/authClient')
      const authToken = authClient.getToken()

      if (!authToken) {
        throw new Error('Authentication required. Please log in.')
      }

      setTimeout(() => {
        setGenerationProgress(0.5)
        setGenerationMessage('✨ Crafting your unique meditation journey...')
      }, 1500)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      const response = await fetch('/api/scripts', {
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

      setGenerationProgress(0.8)
      setGenerationMessage('🎯 Finalizing your meditation...')

      if (response.ok) {
        const { script } = await response.json()
        let scriptText = ''

        if (script.title) {
          scriptText += script.title + '\\n\\n'
        }
        scriptText += script.intro_text + '\\n\\n' + script.main_content + '\\n\\n' + script.closing_text

        setGeneratedScript(scriptText)
        setGenerationProgress(1.0)
        setGenerationMessage('✅ Your meditation is ready!')

        setTimeout(() => {
          setStep(11) // Updated step number for Review
        }, 1000)
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
      setStep(9) // Go back to primer step
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinueFromReview = () => {
    setStep(12) // Updated step number for Voice selection
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
      voice_id: selectedVoice,
      layers: {
        music_volume: 0.4,
        voice_volume: 0.8,
        music_type: 'ambient',
      },
      assessment_data: {
        ...assessment,
        goal: selectedGoal,
        wisdomSource: selectedWisdom,
        selectedFeelings: selectedFeelings,
        userPrimer: promptPrimer,
        selectedPrimaryTheme: selectedPrimaryTheme || undefined,
        selectedAtmosphericElements: selectedAtmosphericElements || undefined,
        selectedSoundscapeJourney: selectedSoundscapeJourney || undefined
      },
    }
    onComplete(sessionConfig)
  }

  const renderFooterButton = () => {
    // Don't show footer button for generation step
    if (step === 10) return null

    if (step === 1) {
      return selectedGoal ? (
        <button
          onClick={handleContinueFromGoal}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      ) : null
    }

    if (step === 2) {
      return (
        <button
          onClick={handleContinueFromWisdom}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      )
    }

    if (step === 3) {
      return (
        <button
          onClick={handleContinueFromFeelings}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      )
    }

    if (step === 4) {
      const hasAllAnswers = ['currentState', 'experience', 'environment'].every(key =>
        assessment[key as keyof typeof assessment]
      )
      return (
        <button
          onClick={handleContinueFromSurvey}
          disabled={!hasAllAnswers}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            hasAllAnswers
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      )
    }

    if (step === 5) {
      // Duration step auto-continues, no button needed
      return null
    }

    if (step === 6) {
      return selectedPrimaryTheme ? (
        <button
          onClick={handleContinueFromTheme}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      ) : (
        <button
          disabled
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-gray-700 text-gray-400 cursor-not-allowed"
        >
          Continue
        </button>
      )
    }

    if (step === 7) {
      return (
        <button
          onClick={handleContinueFromAtmospheric}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      )
    }

    if (step === 8) {
      return selectedSoundscapeJourney ? (
        <button
          onClick={handleContinueFromJourney}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Continue
        </button>
      ) : (
        <button
          disabled
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-gray-700 text-gray-400 cursor-not-allowed"
        >
          Continue
        </button>
      )
    }

    if (step === 9) {
      return (
        <button
          onClick={handleContinueFromPrimer}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xl">✨</span>
            <span>Generate Script</span>
          </div>
        </button>
      )
    }

    if (step === 11) {
      return (
        <button
          onClick={handleContinueFromReview}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Choose Voice
        </button>
      )
    }

    if (step === 12) {
      return (
        <button
          onClick={handleCreateSession}
          className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          Create Session
        </button>
      )
    }

    return null
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-xl border-b border-gray-800/50">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-blue-400 active:scale-95 transition-all"
          >
            {step === 1 ? '✕' : '←'}
          </button>
          <div className="text-lg font-semibold text-white">
            {step === 1 && 'Choose Goal'}
            {step === 2 && 'Wisdom Source'}
            {step === 3 && 'Feelings'}
            {step === 4 && 'About You'}
            {step === 5 && 'Duration'}
            {step === 6 && 'Music Theme'}
            {step === 7 && 'Atmosphere'}
            {step === 8 && 'Journey Style'}
            {step === 9 && 'Customize'}
            {step === 10 && 'Generating...'}
            {step === 11 && 'Review Script'}
            {step === 12 && 'Choose Voice'}
          </div>
          <div className="w-10"></div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pb-4">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  stepNum <= step ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 pb-4">

            {/* Step 1: Goal Selection */}
            {step === 1 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    What's your intention?
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Choose your primary focus for this meditation.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {GOAL_OPTIONS.map((goal, index) => {
                    const gradients = [
                      'from-blue-500 to-cyan-400',
                      'from-green-500 to-emerald-400',
                      'from-purple-500 to-pink-400',
                      'from-orange-500 to-red-400',
                      'from-indigo-500 to-purple-600',
                      'from-teal-500 to-cyan-400',
                      'from-pink-500 to-rose-400',
                      'from-yellow-500 to-orange-400'
                    ];

                    return (
                      <AppleCard
                        key={goal.goal}
                        isSelected={selectedGoal === goal.goal}
                        onChange={() => handleGoalSelect(goal.goal)}
                        title={goal.goal}
                        subtitle={goal.coreFocus}
                        gradient={gradients[index % gradients.length]}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Step 2: Wisdom Source Selection */}
            {step === 2 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Choose Your Wisdom Source
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Select the philosophical foundation for your meditation.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {WISDOM_SOURCES.map((source, index) => {
                    const gradients = [
                      'from-amber-500 to-orange-400',
                      'from-blue-500 to-indigo-400',
                      'from-green-500 to-teal-400',
                      'from-purple-500 to-violet-400',
                      'from-red-500 to-pink-400',
                      'from-cyan-500 to-blue-400'
                    ];

                    return (
                      <AppleCard
                        key={source.internalKeyword}
                        isSelected={selectedWisdom === source.internalKeyword}
                        onChange={() => handleWisdomSelect(source.internalKeyword)}
                        title={source.displayName}
                        subtitle={source.conceptSnippet}
                        gradient={gradients[index % gradients.length]}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Step 3: Feelings to Transcend (Apple-style toggles) */}
            {step === 3 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    What would you like to transform?
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Select any feelings you'd like to transcend. (Optional)
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {FEELING_OPTIONS.map((feeling) => (
                    <AppleToggle
                      key={feeling.feeling}
                      isSelected={selectedFeelings.includes(feeling.feeling)}
                      onChange={() => handleFeelingToggle(feeling.feeling)}
                      description={`Transforms to: ${feeling.antidoteThemes}`}
                    >
                      {feeling.feeling}
                    </AppleToggle>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Survey Questions (Apple-style) */}
            {step === 4 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    About You
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Help us personalize your meditation experience.
                  </p>
                </div>

                <div className="space-y-8">
                  {SURVEY_QUESTIONS.map((question) => (
                    <div key={question.id} className="space-y-4">
                      <h4 className="text-xl font-semibold text-white">
                        {question.question}
                      </h4>
                      <div className="space-y-3">
                        {question.options.map((option) => (
                          <AppleCard
                            key={option.id}
                            isSelected={assessment[question.id as keyof typeof assessment] === option.id}
                            onChange={() => handleSurveyAnswer(question.id, option.id)}
                            title={option.label}
                            icon={option.icon}
                            gradient="from-gray-600 to-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Step 5: Duration Selection (Apple-style) */}
            {step === 5 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Duration
                  </h3>
                  <p className="text-gray-400 text-lg">
                    How long would you like to meditate?
                  </p>
                </div>

                <div className="space-y-4">
                  {DURATIONS.map((duration, index) => {
                    const gradients = [
                      'from-green-500 to-emerald-400',
                      'from-blue-500 to-cyan-400',
                      'from-purple-500 to-pink-400',
                      'from-orange-500 to-red-400',
                      'from-indigo-500 to-purple-500'
                    ];

                    return (
                      <button
                        key={duration.id}
                        onClick={() => handleDurationSelect(duration.id)}
                        className="w-full"
                      >
                        <AppleCard
                          isSelected={false} // Auto-continues on selection
                          onChange={() => handleDurationSelect(duration.id)}
                          title={duration.label}
                          subtitle={duration.description}
                          icon={`${duration.id}min`}
                          gradient={gradients[index % gradients.length]}
                        />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Step 6: Music Theme Selection */}
            {step === 6 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Choose Your Soundscape
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Select the primary theme for your meditation music
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {PRIMARY_THEMES.map((theme, index) => {
                    const gradients = [
                      'from-blue-500 to-cyan-400',
                      'from-green-500 to-emerald-400',
                      'from-blue-400 to-indigo-500',
                      'from-purple-500 to-pink-400'
                    ];

                    return (
                      <AppleCard
                        key={theme.displayName}
                        isSelected={selectedPrimaryTheme?.displayName === theme.displayName}
                        onChange={() => handlePrimaryThemeSelect(theme)}
                        title={theme.displayName}
                        subtitle={theme.keywords.split(',').slice(0, 3).join(', ') + '...'}
                        gradient={gradients[index]}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={handleContinueFromTheme}
                  disabled={!selectedPrimaryTheme}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                    selectedPrimaryTheme
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 7: Atmospheric Elements Selection */}
            {step === 7 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Atmospheric Elements
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Add subtle layers to enhance your meditation (Optional)
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {ATMOSPHERIC_ELEMENTS.map((element) => (
                    <AppleToggle
                      key={element.displayName}
                      isSelected={selectedAtmosphericElements.some(e => e.displayName === element.displayName)}
                      onChange={() => handleAtmosphericElementToggle(element)}
                      description={element.description}
                    >
                      {element.displayName}
                    </AppleToggle>
                  ))}
                </div>

                <button
                  onClick={handleContinueFromAtmospheric}
                  className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 8: Soundscape Journey Selection */}
            {step === 8 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Journey Style
                  </h3>
                  <p className="text-gray-400 text-lg">
                    How should your soundscape evolve over time?
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {SOUNDSCAPE_JOURNEYS.map((journey, index) => {
                    const icons = ['🌅', '🌊', '🌙'];

                    return (
                      <AppleCard
                        key={journey.displayName}
                        isSelected={selectedSoundscapeJourney?.displayName === journey.displayName}
                        onChange={() => handleSoundscapeJourneySelect(journey)}
                        title={journey.displayName}
                        subtitle={journey.structure.substring(0, 80) + '...'}
                        icon={icons[index]}
                        gradient="from-indigo-500 to-purple-600"
                      />
                    );
                  })}
                </div>

                <button
                  onClick={handleContinueFromJourney}
                  disabled={!selectedSoundscapeJourney}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                    selectedSoundscapeJourney
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 9: Prompt Primer */}
            {step === 9 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Personal Touch
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Add any specific details to personalize your meditation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-medium mb-3 text-white">
                      Custom Instructions (Optional)
                    </label>
                    <textarea
                      value={promptPrimer}
                      onChange={(e) => setPromptPrimer(e.target.value)}
                      placeholder="e.g., Focus on gratitude, include nature imagery, help with work stress..."
                      maxLength={200}
                      className="w-full h-24 p-4 bg-gray-800/50 border border-gray-600 rounded-2xl text-white text-base resize-none focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-400">
                        {promptPrimer.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-600 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold mb-4 text-white">
                      Your Meditation Summary
                    </h4>
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Goal:</span>
                        <span>{selectedGoal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wisdom:</span>
                        <span>{WISDOM_SOURCES.find(w => w.internalKeyword === selectedWisdom)?.displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span>{selectedDuration} minutes</span>
                      </div>
                      {selectedFeelings.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transforming:</span>
                          <span>{selectedFeelings.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Current State:</span>
                        <span>{SURVEY_QUESTIONS[0].options.find(o => o.id === assessment.currentState)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Experience:</span>
                        <span>{SURVEY_QUESTIONS[1].options.find(o => o.id === assessment.experience)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Environment:</span>
                        <span>{SURVEY_QUESTIONS[2].options.find(o => o.id === assessment.environment)?.label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleContinueFromPrimer}
                    className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-xl">✨</span>
                      <span>Generate Script</span>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Step 10: Generating Script */}
            {step === 10 && (
              <>
                <div className="text-center">
                  <AppleProgress
                    progress={generationProgress}
                    message={generationMessage}
                  />
                </div>
              </>
            )}

            {/* Step 11: Review Script */}
            {step === 11 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Review Script
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Your personalized meditation script is ready.
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-600 rounded-2xl p-6 mb-8 max-h-64 overflow-y-auto">
                  <div className="text-white leading-relaxed whitespace-pre-line text-base">
                    {generatedScript}
                  </div>
                </div>

                <button
                  onClick={handleContinueFromReview}
                  className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                >
                  Choose Voice
                </button>
              </>
            )}

            {/* Step 12: Voice Selection */}
            {step === 12 && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Choose Your Guide
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Select a voice for your personalized meditation.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`w-full p-4 rounded-2xl border transition-all duration-300 ease-out ${
                        selectedVoice === voice.id
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                          : 'border-gray-300 bg-white/5 hover:border-blue-400 hover:bg-blue-500/5'
                      } active:scale-98 transform`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{voice.icon}</span>
                          <div className="text-left">
                            <div className={`font-semibold text-lg ${selectedVoice === voice.id ? 'text-blue-600' : 'text-white'}`}>
                              {voice.name}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
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
              </>
            )}

        </div>
      </div>

      {/* Fixed Footer with Continue Button */}
      <div className="flex-shrink-0 bg-black/50 backdrop-blur-xl border-t border-gray-800/50 p-6">
        {renderFooterButton()}
      </div>
    </div>
  )
}