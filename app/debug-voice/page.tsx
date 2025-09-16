'use client'

import { useState } from 'react'

export default function VoiceDebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const testElevenLabsConnection = async () => {
    setIsLoading(true)
    setError('')
    setResult('')

    try {
      // Test the voice preview API endpoint
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId: 'female-1' // Kelli voice
        })
      })

      if (response.ok) {
        // ElevenLabs API is working - play the audio
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.play()
        setResult('✅ ElevenLabs API is working! Voice preview should be playing.')

        audio.onended = () => URL.revokeObjectURL(audioUrl)
      } else {
        const errorData = await response.json()
        if (response.status === 503 && errorData.fallback) {
          setError('❌ ElevenLabs API not available - falling back to browser speech')
        } else {
          setError(`❌ ElevenLabs API error: ${response.status} - ${errorData.error}`)
        }
      }
    } catch (err) {
      setError(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkEnvironment = () => {
    const hasPublicKey = !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    const hasServerKey = 'ELEVENLABS_API_KEY is checked server-side'

    setResult(`Environment Check:

📋 Client-side API Key: ${hasPublicKey ? '✅ Present' : '❌ Missing'}
📋 Server-side API Key: ${hasServerKey}

Note: For security, server-side keys can't be checked from client.
If ElevenLabs is not working, check your .env.local file for ELEVENLABS_API_KEY`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎙️ ElevenLabs Voice Debug</h1>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Voice API Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testElevenLabsConnection}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? '🔄 Testing...' : '🎙️ Test ElevenLabs Voice Preview'}
            </button>

            <button
              onClick={checkEnvironment}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors ml-4"
            >
              📋 Check Environment Variables
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-green-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-300">✅ Result</h2>
            <pre className="text-green-100 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="bg-red-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-300">❌ Error</h2>
            <pre className="text-red-100 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Voice Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Voices</h2>
          <div className="space-y-3">
            <div className="bg-gray-700 p-3 rounded">
              <div className="font-semibold">Kelli (female-1)</div>
              <div className="text-sm text-gray-300">ID: m24gZfUicC3ekOb7OZfy</div>
              <div className="text-sm text-gray-400">50-year-old female, extremely pleasing and comforting for deep guided meditation</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="font-semibold">Sarah (female-2)</div>
              <div className="text-sm text-gray-300">ID: EXAVITQu4vr4xnSDxMaL</div>
              <div className="text-sm text-gray-400">Young adult woman with confident, warm, and reassuring professional tone</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="font-semibold">Thomas (male-1)</div>
              <div className="text-sm text-gray-300">ID: GBv7mTt0atIp3Br8iCZE</div>
              <div className="text-sm text-gray-400">Soft and subdued male voice, optimal for meditations and narrations</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="font-semibold">George (male-2)</div>
              <div className="text-sm text-gray-300">ID: JBFqnCBsd6RMkjVDRZzb</div>
              <div className="text-sm text-gray-400">Warm British resonance with mature, captivating quality</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a
              href="/"
              className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🏠 Back to App
            </a>
            <a
              href="/debug-soundscape"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🎧 Music Player Debug
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}