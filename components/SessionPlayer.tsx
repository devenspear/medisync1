'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore, type SessionConfig, type AssessmentData } from '@/lib/store'
import { getAudioEngine } from '@/lib/audioEngineV2'
import { type MeditationScript } from '@/lib/scriptGenerator'
import { createVoiceSynthesis, FallbackVoiceSynthesis } from '@/lib/voiceSynthesis'
import { createMusicSynthesis, type MusicGenerationOptions } from '@/lib/musicSynthesis'

interface SessionPlayerProps {
  session: SessionConfig
  onClose: () => void
}

type SessionPhase = 'loading' | 'ready' | 'playing' | 'paused' | 'completed'

export default function SessionPlayer({ session, onClose }: SessionPlayerProps) {
  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime] = useState(session.duration * 60) // Convert to seconds
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  const [volumes, setVolumes] = useState(session.layers)

  const audioEngine = useRef(getAudioEngine())
  const musicSynthesis = useRef(createMusicSynthesis())
  // Helper function to generate scripts with authentication
  const generateScript = async (assessmentData: AssessmentData, promptPrimer?: string): Promise<MeditationScript> => {
    // Always use authenticated production endpoint
    const { authClient } = await import('@/lib/authClient')
    const authToken = authClient.getToken()

    if (!authToken) {
      throw new Error('Authentication required. Please log in.')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }

    const response = await fetch('/api/scripts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assessment: assessmentData,
        promptPrimer: promptPrimer || assessmentData.userPrimer
      })
    })

    if (!response.ok) {
      const data = await response.json()

      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.')
      }

      throw new Error(`HTTP ${response.status}: ${data.error || 'Script generation failed'}`)
    }

    const { script } = await response.json()
    return script
  }
  const voiceSynthesis = useRef(createVoiceSynthesis())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementsRef = useRef<{
    intro?: HTMLAudioElement
    main?: HTMLAudioElement
    closing?: HTMLAudioElement
  }>({})

  const { saveSession, updateUserStats } = useAppStore()

  useEffect(() => {
    initializeSession()
    return () => {
      cleanup()
    }
  }, [])

  const initializeSession = async () => {
    try {
      setLoadingMessage('🤖 Generating personalized script with AI...')
      setLoadingProgress(0.1)

      // Generate the meditation script via API
      const script = await generateScript(session.assessment_data)

      setLoadingMessage('🎵 Generating background music...')
      setLoadingProgress(0.2)

      // Generate background music if assessment data is available
      if (session.assessment_data.selectedPrimaryTheme) {
        try {
          console.log('🎵 Starting music generation with options:', {
            duration: session.duration,
            primaryTheme: session.assessment_data.selectedPrimaryTheme?.displayName,
            atmosphericElements: session.assessment_data.selectedAtmosphericElements?.length || 0,
            soundscapeJourney: session.assessment_data.selectedSoundscapeJourney?.displayName
          })

          const musicOptions = {
            duration: session.duration,
            primaryTheme: session.assessment_data.selectedPrimaryTheme,
            atmosphericElements: session.assessment_data.selectedAtmosphericElements || [],
            soundscapeJourney: session.assessment_data.selectedSoundscapeJourney || {
              displayName: 'Gentle Emergence',
              structure: 'Starting with soft, ambient tones that gradually build in complexity'
            }
          }

          const musicResult = await musicSynthesis.current.generateMusicWithFallback(musicOptions)
          console.log('🎵 Music generation result:', musicResult ? 'Success' : 'Failed/Fallback')

          if (musicResult?.audioUrl) {
            console.log('🎵 Loading music audio into engine...')
            const musicAudio = await audioEngine.current.playMusic(musicResult.audioUrl, session.layers.music_volume)
            musicAudio.pause() // Don't start playing yet
            console.log('🎵 Music audio loaded and paused, ready to play')
          } else {
            console.log('🎵 No music audio URL generated - continuing without background music')
          }
        } catch (musicError) {
          console.error('🎵 Music generation failed:', musicError)
          setLoadingMessage('⚠️ Music generation failed, continuing with voice only...')
        }
      } else {
        console.log('🎵 No primary theme selected, skipping music generation')
      }

      setLoadingMessage('🎙️ Creating voice audio with ElevenLabs...')
      setLoadingProgress(0.4)

      // Generate voice audio (if using ElevenLabs)
      if (!(voiceSynthesis.current instanceof FallbackVoiceSynthesis)) {
        setLoadingMessage('🎙️ Synthesizing intro narration...')

        const audioBuffers = await voiceSynthesis.current.synthesizeScript(
          script.intro_text,
          script.main_content,
          script.closing_text,
          session.voice_id,
          (progress) => {
            const overallProgress = 0.4 + progress * 0.4
            setLoadingProgress(overallProgress)

            if (progress < 0.4) {
              setLoadingMessage('🎙️ Synthesizing intro narration...')
            } else if (progress < 0.8) {
              setLoadingMessage('🎙️ Synthesizing main meditation...')
            } else {
              setLoadingMessage('🎙️ Synthesizing closing guidance...')
            }
          }
        )

        // Create audio elements
        const introUrl = voiceSynthesis.current.createAudioUrl(audioBuffers.intro)
        const mainUrl = voiceSynthesis.current.createAudioUrl(audioBuffers.main)
        const closingUrl = voiceSynthesis.current.createAudioUrl(audioBuffers.closing)

        audioElementsRef.current.intro = new Audio(introUrl)
        audioElementsRef.current.main = new Audio(mainUrl)
        audioElementsRef.current.closing = new Audio(closingUrl)
      } else {
        setLoadingMessage('🔊 Using browser speech synthesis...')
      }

      setLoadingMessage('🔊 Setting up audio playback...')
      setLoadingProgress(0.8)

      // Initialize audio engine
      await audioEngine.current.resumeAudioContext()

      setLoadingProgress(1.0)
      setLoadingMessage('✅ Session ready!')
      setTimeout(() => setPhase('ready'), 500)

    } catch (error) {
      console.error('Session initialization failed:', error)
      setLoadingMessage('⚠️ ElevenLabs unavailable. Using fallback audio.')
      setTimeout(() => setPhase('ready'), 1000)
    }
  }

  const startSession = async () => {
    try {
      setPhase('playing')

      // Resume music if it was set up during initialization
      const musicAudio = audioEngine.current.getMusicAudio()
      if (musicAudio) {
        await musicAudio.play()
      }

      // Start voice guidance (either ElevenLabs audio or fallback TTS)
      if (audioElementsRef.current.intro) {
        audioElementsRef.current.intro.volume = volumes.voice_volume
        audioElementsRef.current.intro.play()
      } else if (voiceSynthesis.current instanceof FallbackVoiceSynthesis) {
        // Use browser TTS for fallback - generate script via API
        try {
          const script = await generateScript(session.assessment_data)
          setTimeout(() => {
            voiceSynthesis.current.synthesizeText(script.intro_text, session.voice_id)
          }, 1000)
        } catch (error) {
          console.error('Failed to generate script for fallback TTS:', error)
        }
      }

      // Start timer
      startTimer()

    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const pauseSession = () => {
    setPhase('paused')
    audioEngine.current.pauseAll()

    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio) audio.pause()
    })

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resumeSession = () => {
    setPhase('playing')
    startSession()
  }

  const stopSession = () => {
    setPhase('completed')
    audioEngine.current.stopAll()

    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Update user stats
    updateUserStats(Math.floor(currentTime / 60))
  }

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1
        if (newTime >= totalTime) {
          stopSession()
          return totalTime
        }
        return newTime
      })
    }, 1000)
  }

  const cleanup = () => {
    audioEngine.current.stopAll()
    musicSynthesis.current.cleanupAll()

    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio) {
        audio.pause()
        URL.revokeObjectURL(audio.src)
      }
    })

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleVolumeChange = (layer: keyof typeof volumes, value: number) => {
    const newVolumes = { ...volumes, [layer]: value }
    setVolumes(newVolumes)

    // Apply volume changes in real-time
    if (phase === 'playing') {
      if (layer === 'music_volume') {
        audioEngine.current.setMusicVolume(value)
      } else if (layer === 'voice_volume') {
        Object.values(audioElementsRef.current).forEach(audio => {
          if (audio) audio.volume = value
        })
      }
    }
  }

  const handleSaveSession = () => {
    const updatedSession = {
      ...session,
      layers: volumes
    }
    saveSession(updatedSession)
    // Sessions are saved locally only
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (currentTime / totalTime) * 100

  if (phase === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {/* Enhanced breathing animation circle to match AppleProgress */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">Preparing Your Session</h2>

          {/* Enhanced loading message with engaging text */}
          <p className="text-white text-lg font-medium mb-2">{loadingMessage}</p>

          {/* Engaging sub-text to keep user focused */}
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            {loadingProgress < 0.3 ? "✨ Crafting your personalized journey..." :
             loadingProgress < 0.6 ? "🎙️ Preparing soothing guidance..." :
             loadingProgress < 0.8 ? "🎵 Setting the perfect atmosphere..." :
             "🧘‍♀️ Almost ready for your meditation..."}
          </p>

          {/* Progress bar matching AppleProgress */}
          <div className="w-full bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress * 100}%` }}
            />
          </div>

          {/* Percentage */}
          <p className="text-gray-400 text-sm">{Math.round(loadingProgress * 100)}%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-800/50 rounded-full flex items-center justify-center text-gray-400 no-select"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">{session.name}</h1>
            <p className="text-xs text-gray-400">{session.layers.music_type} • {session.duration} min</p>
          </div>
          <div className="w-9 h-9"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        {/* Breathing Animation */}
        <div className={`w-80 h-80 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl ${phase === 'playing' ? 'breathing-animation' : ''}`}>
          <div className="w-40 h-40 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-3xl font-mono font-bold text-white mb-4">
            {formatTime(currentTime)}
          </div>
          <div className="w-64 bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">{formatTime(totalTime)} total</p>

          {phase === 'ready' && !(voiceSynthesis.current instanceof FallbackVoiceSynthesis) && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <span className="text-xs text-blue-400 font-semibold">ElevenLabs AI</span>
              <span className="text-xs">🎙️</span>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="w-full max-w-xs">
          {phase === 'ready' && (
            <button
              onClick={startSession}
              className="ios-button mb-4"
            >
              <span className="text-lg mr-2">▶</span>
              Start Session
            </button>
          )}

          {phase === 'playing' && (
            <button
              onClick={pauseSession}
              className="ios-button mb-4"
            >
              <span className="text-lg mr-2">⏸</span>
              Pause
            </button>
          )}

          {phase === 'paused' && (
            <div className="space-y-3 mb-4">
              <button
                onClick={resumeSession}
                className="ios-button"
              >
                <span className="text-lg mr-2">▶</span>
                Resume
              </button>
              <button
                onClick={stopSession}
                className="w-full py-3 bg-red-600 rounded-2xl text-white font-semibold active:scale-98 transition-transform"
              >
                <span className="text-lg mr-2">⏹</span>
                Stop Session
              </button>
            </div>
          )}

          {phase === 'completed' && (
            <div className="text-center mb-4">
              <p className="text-lg text-white mb-4">🧘‍♀️ Session Complete!</p>
              <button
                onClick={onClose}
                className="ios-button bg-green-600"
              >
                Finish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Volume Controls - Bottom Sheet Style */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-6">
        <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6"></div>

        <h3 className="text-lg font-bold text-white mb-4 text-center">Audio Mix</h3>

        <div className="space-y-6 max-w-sm mx-auto">
          {/* Music Volume */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-medium">🎼 Background Music</label>
              <span className="text-gray-400 text-sm">{Math.round(volumes.music_volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes.music_volume}
              onChange={(e) => handleVolumeChange('music_volume', parseFloat(e.target.value))}
              className="ios-slider"
            />
          </div>

          {/* Voice Volume */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-medium">🎙️ Voice Guidance</label>
              <span className="text-gray-400 text-sm">{Math.round(volumes.voice_volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes.voice_volume}
              onChange={(e) => handleVolumeChange('voice_volume', parseFloat(e.target.value))}
              className="ios-slider"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSession}
            className="w-full py-3 bg-purple-600 rounded-2xl text-white font-semibold active:scale-98 transition-transform mt-6"
          >
            💾 Save Configuration
          </button>
        </div>

        {/* Safe Area Bottom */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}