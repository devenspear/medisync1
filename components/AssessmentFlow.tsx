'use client'

import { useState } from 'react'
import { useAppStore, type SessionConfig, type FrequencyType } from '@/lib/store'

interface AssessmentData {
  goal: string
  currentState: string
  duration: number
  experience: string
  timeOfDay: string
  challenges?: string
  meditationStyle?: string
  environment?: string
}

const GOALS = [
  { id: 'relaxation', label: 'Relaxation & Stress Relief', icon: '🧘‍♀️' },
  { id: 'focus', label: 'Focus & Concentration', icon: '🎯' },
  { id: 'sleep', label: 'Better Sleep', icon: '😴' },
  { id: 'anxiety', label: 'Reduce Anxiety', icon: '💚' },
  { id: 'creativity', label: 'Boost Creativity', icon: '💡' },
  { id: 'energy', label: 'Increase Energy', icon: '⚡' },
]

const STATES = [
  { id: 'stressed', label: 'Stressed', color: 'bg-red-500' },
  { id: 'tired', label: 'Tired', color: 'bg-orange-500' },
  { id: 'anxious', label: 'Anxious', color: 'bg-yellow-500' },
  { id: 'neutral', label: 'Neutral', color: 'bg-blue-500' },
  { id: 'energized', label: 'Energized', color: 'bg-green-500' },
]

const FREQUENCIES: { [key: string]: FrequencyType } = {
  'relaxation': 'alpha',
  'focus': 'beta',
  'sleep': 'delta',
  'anxiety': 'theta',
  'creativity': 'theta',
  'energy': 'gamma',
}

interface AssessmentFlowProps {
  onComplete: (sessionConfig: SessionConfig) => void
  onCancel: () => void
}

export default function AssessmentFlow({ onComplete, onCancel }: AssessmentFlowProps) {
  const [step, setStep] = useState(1)
  const [assessment, setAssessment] = useState<AssessmentData>({
    goal: '',
    currentState: '',
    duration: 10,
    experience: '',
    timeOfDay: '',
  })

  const totalSteps = 5

  const updateAssessment = (data: Partial<AssessmentData>) => {
    setAssessment(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      generateSession()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const generateSession = () => {
    const frequency = FREQUENCIES[assessment.goal] || 'alpha'
    const sessionConfig: SessionConfig = {
      name: `${assessment.goal} Session`,
      description: `${assessment.duration} minute ${assessment.goal} session`,
      duration: assessment.duration,
      frequency,
      voice_id: 'female-1',
      layers: {
        binaural_volume: 0.6,
        music_volume: 0.4,
        voice_volume: 0.8,
        music_type: 'ambient',
      },
      assessment_data: assessment,
    }

    onComplete(sessionConfig)
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={step === 1 ? onCancel : prevStep}
            className="w-9 h-9 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-400 no-select"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Assessment</h2>
            <span className="text-sm text-gray-400">{step} of {totalSteps}</span>
          </div>
          <div className="w-9 h-9"></div> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 py-6 flex flex-col">
        <div className="ios-card p-6 flex-1">
          {step === 1 && (
            <StepGoal
              selected={assessment.goal}
              onSelect={(goal) => updateAssessment({ goal })}
            />
          )}

          {step === 2 && (
            <StepCurrentState
              selected={assessment.currentState}
              onSelect={(currentState) => updateAssessment({ currentState })}
            />
          )}

          {step === 3 && (
            <StepDuration
              selected={assessment.duration}
              onSelect={(duration) => updateAssessment({ duration })}
            />
          )}

          {step === 4 && (
            <StepExperience
              selected={assessment.experience}
              onSelect={(experience) => updateAssessment({ experience })}
            />
          )}

          {step === 5 && (
            <StepTimeOfDay
              selected={assessment.timeOfDay}
              onSelect={(timeOfDay) => updateAssessment({ timeOfDay })}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="pt-6">
          <button
            onClick={nextStep}
            disabled={!isStepComplete(step, assessment)}
            className="ios-button"
          >
            {step === totalSteps ? 'Create Session' : 'Continue'}
          </button>
        </div>

        {/* Safe Area Bottom Padding */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}

function StepGoal({ selected, onSelect }: { selected: string; onSelect: (goal: string) => void }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">What's your goal?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">Choose what you'd like to focus on in this session.</p>
      </div>

      <div className="space-y-3">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            className={`w-full p-4 rounded-2xl text-left transition-all no-select flex items-center space-x-4 ${
              selected === goal.id
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-800/50 border-2 border-transparent active:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <span className="text-white font-medium text-base">{goal.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepCurrentState({ selected, onSelect }: { selected: string; onSelect: (state: string) => void }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">How are you feeling?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">This helps us customize the session intensity.</p>
      </div>

      <div className="space-y-3">
        {STATES.map((state) => (
          <button
            key={state.id}
            onClick={() => onSelect(state.id)}
            className={`w-full p-4 rounded-2xl text-left transition-all no-select flex items-center space-x-4 ${
              selected === state.id
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-800/50 border-2 border-transparent active:bg-gray-700/50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full ${state.color}`} />
            <span className="text-white font-medium text-base">{state.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDuration({ selected, onSelect }: { selected: number; onSelect: (duration: number) => void }) {
  const durations = [3, 5, 10, 15, 20, 30]

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Session Duration</h3>
        <p className="text-gray-400 text-sm leading-relaxed">Choose a duration that feels comfortable for you.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {durations.map((duration) => (
          <button
            key={duration}
            onClick={() => onSelect(duration)}
            className={`p-4 rounded-2xl text-center transition-all no-select ${
              selected === duration
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-800/50 border-2 border-transparent active:bg-gray-700/50'
            }`}
          >
            <div className="text-xl font-bold text-white mb-1">{duration}</div>
            <div className="text-xs text-gray-300">min</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepExperience({ selected, onSelect }: { selected: string; onSelect: (experience: string) => void }) {
  const levels = [
    { id: 'beginner', label: 'Beginner', description: 'New to meditation', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate', description: 'Some experience', icon: '🌿' },
    { id: 'advanced', label: 'Advanced', description: 'Regular practitioner', icon: '🌳' },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Experience Level</h3>
        <p className="text-gray-400 text-sm leading-relaxed">This helps us adjust the guidance level.</p>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`w-full p-4 rounded-2xl text-left transition-all no-select flex items-center space-x-4 ${
              selected === level.id
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-800/50 border-2 border-transparent active:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">{level.icon}</span>
            <div>
              <div className="text-white font-medium text-base mb-1">{level.label}</div>
              <div className="text-gray-400 text-sm">{level.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepTimeOfDay({ selected, onSelect }: { selected: string; onSelect: (time: string) => void }) {
  const times = [
    { id: 'morning', label: 'Morning', description: 'Starting the day', icon: '🌅' },
    { id: 'midday', label: 'Midday', description: 'Work break', icon: '☀️' },
    { id: 'evening', label: 'Evening', description: 'Winding down', icon: '🌆' },
    { id: 'bedtime', label: 'Bedtime', description: 'Before sleep', icon: '🌙' },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">When are you meditating?</h3>
        <p className="text-gray-400 text-sm leading-relaxed">This helps us tailor the session content.</p>
      </div>

      <div className="space-y-3">
        {times.map((time) => (
          <button
            key={time.id}
            onClick={() => onSelect(time.id)}
            className={`w-full p-4 rounded-2xl text-left transition-all no-select flex items-center space-x-4 ${
              selected === time.id
                ? 'bg-blue-600 border-2 border-blue-400'
                : 'bg-gray-800/50 border-2 border-transparent active:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">{time.icon}</span>
            <div>
              <div className="text-white font-medium text-base mb-1">{time.label}</div>
              <div className="text-gray-400 text-sm">{time.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function isStepComplete(step: number, assessment: AssessmentData): boolean {
  switch (step) {
    case 1: return !!assessment.goal
    case 2: return !!assessment.currentState
    case 3: return !!assessment.duration
    case 4: return !!assessment.experience
    case 5: return !!assessment.timeOfDay
    default: return false
  }
}