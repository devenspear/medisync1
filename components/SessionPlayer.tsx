'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore, type SessionConfig, type AssessmentData } from '@/lib/store'
import { getAudioEngine } from '@/lib/audioEngine'
import { type MeditationScript } from '@/lib/scriptGenerator'
import { createVoiceSynthesis, FallbackVoiceSynthesis } from '@/lib/voiceSynthesis'
import { isDemoMode } from '@/lib/demoMode'

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
  // Helper function to generate scripts with proper authentication
  const generateScript = async (assessmentData: AssessmentData, promptPrimer?: string): Promise<MeditationScript> => {
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

      setLoadingMessage('🎙️ Creating voice audio with ElevenLabs...')
      setLoadingProgress(0.3)

      // Generate voice audio (if using ElevenLabs)
      if (!(voiceSynthesis.current instanceof FallbackVoiceSynthesis)) {
        setLoadingMessage('🎙️ Synthesizing intro narration...')

        const audioBuffers = await voiceSynthesis.current.synthesizeScript(
          script.intro_text,
          script.main_content,
          script.closing_text,
          session.voice_id,
          (progress) => {
            const overallProgress = 0.3 + progress * 0.4
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

      setLoadingMessage('🎵 Setting up binaural beats & ambient audio...')
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

      // Start binaural beats
      await audioEngine.current.startBinauralBeats(session.frequency, volumes.binaural_volume)

      // Start ambient music
      await audioEngine.current.startAmbientMusic(volumes.music_volume)

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
    audioEngine.current.stopBinauralBeats()
    audioEngine.current.stopAmbientMusic()

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
    audioEngine.current.stopBinauralBeats()
    audioEngine.current.stopAmbientMusic()

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
    audioEngine.current.stopBinauralBeats()
    audioEngine.current.stopAmbientMusic()

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
      if (layer === 'binaural_volume') {
        audioEngine.current.setBinauralVolume(value)
      } else if (layer === 'music_volume') {
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
    // TODO: Also save to Supabase
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
          <div className="breathing-animation w-40 h-40 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-white/20" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Preparing Your Session</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">{loadingMessage}</p>

          <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${loadingProgress * 100}%` }}
            />
          </div>

          <p className="text-sm text-gray-500">{Math.round(loadingProgress * 100)}%</p>
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
            <p className="text-xs text-gray-400">{session.frequency} • {session.duration} min</p>
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
          {/* Binaural Beats Volume */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-white font-medium">🎵 Binaural Beats</label>
              <span className="text-gray-400 text-sm">{Math.round(volumes.binaural_volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volumes.binaural_volume}
              onChange={(e) => handleVolumeChange('binaural_volume', parseFloat(e.target.value))}
              className="ios-slider"
            />
          </div>

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