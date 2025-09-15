'use client'

import { useState, useRef } from 'react'
import { createMusicSynthesis } from '@/lib/musicSynthesis'
import { getAudioEngine } from '@/lib/audioEngineV2'
import { PRIMARY_THEMES, ATMOSPHERIC_ELEMENTS, SOUNDSCAPE_JOURNEYS } from '@/lib/musicConstants'

export default function MusicDebugPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const musicSynthesis = useRef(createMusicSynthesis())
  const audioEngine = useRef(getAudioEngine())

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🎵 Music Debug: ${message}`)
  }

  const testMusicGeneration = async () => {
    setIsGenerating(true)
    setError(null)
    setLogs([])

    try {
      addLog('Starting music generation test...')

      // Use first available theme and elements
      const musicOptions = {
        duration: 1, // Short 1-minute test
        primaryTheme: PRIMARY_THEMES[0],
        atmosphericElements: [ATMOSPHERIC_ELEMENTS[0]],
        soundscapeJourney: SOUNDSCAPE_JOURNEYS[0]
      }

      addLog(`Options: ${JSON.stringify({
        duration: musicOptions.duration,
        theme: musicOptions.primaryTheme.displayName,
        elements: musicOptions.atmosphericElements.map(e => e.displayName),
        journey: musicOptions.soundscapeJourney.displayName
      }, null, 2)}`)

      addLog('Calling music synthesis...')
      const result = await musicSynthesis.current.generateMusicWithFallback(musicOptions)

      if (result) {
        addLog('✅ Music generation successful!')
        addLog(`Audio URL: ${result.audioUrl.substring(0, 50)}...`)
        addLog(`Duration: ${result.duration} minutes`)
        addLog(`Prompt: ${result.prompt.substring(0, 100)}...`)

        setMusicUrl(result.audioUrl)
      } else {
        addLog('❌ Music generation returned null (fallback mode)')
        setError('Music generation failed - likely using fallback mode')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`❌ Error: ${errorMessage}`)
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const testAudioPlayback = async () => {
    if (!musicUrl) {
      addLog('❌ No music URL available for playback test')
      return
    }

    try {
      addLog('Testing audio playback...')
      setIsPlaying(true)

      // Test direct audio element playback
      addLog('Creating HTML Audio element...')
      const audio = new Audio(musicUrl)
      audio.volume = 0.5
      audio.loop = true

      addLog('Setting up audio event listeners...')
      audio.onloadstart = () => addLog('🔄 Audio loading started')
      audio.oncanplay = () => addLog('✅ Audio can play')
      audio.onplay = () => addLog('▶️ Audio started playing')
      audio.onerror = (e) => addLog(`❌ Audio error: ${e}`)

      addLog('Attempting to play audio...')
      await audio.play()

      // Test through audio engine
      addLog('Testing through audio engine...')
      const engineAudio = await audioEngine.current.playMusic(musicUrl, 0.5)
      addLog('✅ Audio engine playback initiated')

      // Stop after 5 seconds for testing
      setTimeout(() => {
        audio.pause()
        audioEngine.current.stopMusic()
        setIsPlaying(false)
        addLog('⏹️ Test playback stopped after 5 seconds')
      }, 5000)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      addLog(`❌ Playback error: ${errorMessage}`)
      setIsPlaying(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎵 Music Debug Console</h1>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="space-y-4">
            <button
              onClick={testMusicGeneration}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isGenerating ? '🔄 Generating...' : '🎵 Test Music Generation'}
            </button>

            <button
              onClick={testAudioPlayback}
              disabled={!musicUrl || isPlaying}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors ml-4"
            >
              {isPlaying ? '🔄 Playing...' : '▶️ Test Audio Playback'}
            </button>

            <button
              onClick={clearLogs}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors ml-4"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Music URL:</span>
              <span className={musicUrl ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                {musicUrl ? '✅ Available' : '❌ Not Generated'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Error:</span>
              <span className={error ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                {error || '✅ None'}
              </span>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a test to see debug output.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-400">ElevenLabs API Key:</span>
              <span className="ml-2">
                {process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? '✅ Present' : '❌ Missing'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">User Agent:</span>
              <span className="ml-2 text-xs">{navigator.userAgent}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}