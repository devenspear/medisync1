'use client'

import { useState } from 'react'
import { createVoiceSynthesis } from '@/lib/voiceSynthesis'

export default function SessionDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logMessage])
    console.log(logMessage)
  }

  const testCompleteSessionFlow = async () => {
    setIsProcessing(true)
    setLogs([])

    try {
      addLog('🔍 Starting comprehensive session debug...')

      // Step 1: Test voice synthesis creation
      addLog('📋 Step 1: Testing voice synthesis creation...')
      const voiceSynthesis = createVoiceSynthesis()
      addLog(`Voice synthesis type: ${voiceSynthesis.constructor.name}`)

      // Step 2: Check API environment
      addLog('📋 Step 2: Checking API environment...')
      const hasPublicKey = !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      addLog(`Client-side API key present: ${hasPublicKey}`)

      // Step 3: Test script generation
      addLog('📋 Step 3: Testing script generation...')
      const testAssessment = {
        goal: 'relaxation',
        currentState: 'stressed',
        duration: 3,
        experience: 'some',
        environment: 'quiet',
        wisdomSource: 'Default/Universal',
        selectedFeelings: ['anxiety'],
        userPrimer: 'Test session for debugging'
      }

      try {
        const { authClient } = await import('@/lib/authClient')
        const authToken = authClient.getToken()

        if (!authToken) {
          addLog('❌ No auth token found - user not logged in')
          return
        }

        addLog('✅ Auth token found, testing script generation...')

        const scriptResponse = await fetch('/api/scripts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            assessment: testAssessment,
            promptPrimer: testAssessment.userPrimer
          })
        })

        if (!scriptResponse.ok) {
          const errorData = await scriptResponse.json()
          addLog(`❌ Script generation failed: ${scriptResponse.status} - ${errorData.error}`)
          return
        }

        const scriptData = await scriptResponse.json()
        addLog('✅ Script generated successfully')
        addLog(`Script intro length: ${scriptData.script.intro_text.length} chars`)
        addLog(`Script intro preview: "${scriptData.script.intro_text.substring(0, 50)}..."`)

        // Step 4: Test ElevenLabs voice synthesis directly
        addLog('📋 Step 4: Testing ElevenLabs voice synthesis...')

        if (voiceSynthesis.constructor.name === 'VoiceSynthesis') {
          addLog('✅ ElevenLabs VoiceSynthesis detected')

          try {
            addLog('🎙️ Testing voice synthesis with intro text...')
            const audioBuffer = await voiceSynthesis.synthesizeText(
              scriptData.script.intro_text,
              'female-1'
            )

            addLog(`✅ Voice synthesis successful! Audio buffer size: ${audioBuffer.byteLength} bytes`)

            // Test audio playback
            addLog('🔊 Testing audio playback...')
            const audioUrl = voiceSynthesis.createAudioUrl(audioBuffer)
            const audio = new Audio(audioUrl)

            audio.onloadeddata = () => addLog('✅ Audio loaded successfully')
            audio.oncanplay = () => addLog('✅ Audio can play')
            audio.onplay = () => addLog('▶️ Audio started playing')
            audio.onended = () => {
              addLog('⏹️ Audio playback completed')
              voiceSynthesis.revokeAudioUrl(audioUrl)
            }
            audio.onerror = (e) => addLog(`❌ Audio playback error: ${e}`)

            await audio.play()

          } catch (voiceError) {
            addLog(`❌ Voice synthesis failed: ${voiceError.message}`)

            // Test the preview API endpoint as backup
            addLog('🔄 Testing voice preview API endpoint...')
            try {
              const previewResponse = await fetch('/api/voice/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceId: 'female-1' })
              })

              if (previewResponse.ok) {
                addLog('✅ Voice preview API works - issue might be with session integration')
                const audioBlob = await previewResponse.blob()
                const audioUrl = URL.createObjectURL(audioBlob)
                const audio = new Audio(audioUrl)
                await audio.play()
                audio.onended = () => URL.revokeObjectURL(audioUrl)
              } else {
                const errorData = await previewResponse.json()
                addLog(`❌ Voice preview API failed: ${previewResponse.status} - ${errorData.error}`)
              }
            } catch (previewError) {
              addLog(`❌ Voice preview API error: ${previewError.message}`)
            }
          }

        } else {
          addLog('❌ Using FallbackVoiceSynthesis - ElevenLabs not available')
          addLog('This explains why browser voice is being used instead')
        }

        // Step 5: Test session config creation
        addLog('📋 Step 5: Testing session config...')
        const mockSessionConfig = {
          name: 'Debug Session',
          description: 'Test session for debugging',
          duration: 3,
          voice_id: 'female-1',
          layers: {
            music_volume: 0.4,
            voice_volume: 0.8,
            music_type: 'mp3',
            music_file: '/MusicBed5min.mp3'
          },
          assessment_data: testAssessment
        }

        addLog(`Session config created with music_type: ${mockSessionConfig.layers.music_type}`)
        addLog(`Music file: ${mockSessionConfig.layers.music_file}`)

        addLog('🎯 Debug completed! Check logs above for the root cause.')

      } catch (scriptError) {
        addLog(`❌ Script generation error: ${scriptError.message}`)
      }

    } catch (error) {
      addLog(`❌ Debug error: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testDirectElevenLabs = async () => {
    setLogs([])
    addLog('🔍 Testing direct ElevenLabs API call...')

    try {
      // Test server-side API call
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: 'female-1' })
      })

      if (response.ok) {
        addLog('✅ ElevenLabs API works via server')
        const audioBlob = await response.blob()
        addLog(`Audio blob size: ${audioBlob.size} bytes`)

        const audio = new Audio(URL.createObjectURL(audioBlob))
        await audio.play()
        addLog('🔊 Playing ElevenLabs audio directly')
      } else {
        const errorData = await response.json()
        addLog(`❌ Server API failed: ${response.status}`)
        addLog(`Error details: ${JSON.stringify(errorData, null, 2)}`)
      }
    } catch (error) {
      addLog(`❌ Direct API test failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Session Debug Console</h1>

        {/* Debug Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testCompleteSessionFlow}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isProcessing ? '🔄 Running...' : '🔍 Run Complete Session Debug'}
            </button>

            <button
              onClick={testDirectElevenLabs}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors ml-4"
            >
              🎙️ Test Direct ElevenLabs API
            </button>

            <button
              onClick={clearLogs}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors ml-4"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a debug test to see detailed output.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('🔄') ? 'text-yellow-400' :
                  log.includes('📋') ? 'text-blue-400' :
                  'text-gray-300'
                }`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🏠 Back to App
            </a>
            <a
              href="/debug-voice"
              className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🎙️ Voice Debug
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}