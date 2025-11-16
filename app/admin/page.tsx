'use client'

import { useState } from 'react'

const VOICES = [
  { id: 'female-1', name: 'Kelli-2', voiceId: 'YRROo374F8CyWnUy6mdE' },
  { id: 'female-2', name: 'Sarah', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'male-1', name: 'Bernard-1', voiceId: 'xtwJZRzZhlI4QAgP0tT3' },
  { id: 'male-2', name: 'George', voiceId: 'JBFqnCBsd6RMkjVDRZzb' },
]

export default function AdminPage() {
  // Script input
  const [script, setScript] = useState('')

  // SSML pause controls (in seconds)
  const [pauseAfterPeriod, setPauseAfterPeriod] = useState(1.5)
  const [pauseAfterComma, setPauseAfterComma] = useState(0.8)
  const [pauseAfterColon, setPauseAfterColon] = useState(1.0)
  const [pauseAfterSemicolon, setPauseAfterSemicolon] = useState(1.0)

  // Voice controls
  const [selectedVoice, setSelectedVoice] = useState('female-1')
  const [speed, setSpeed] = useState(1.0) // Playback speed (0.5 to 2.0)

  // ElevenLabs voice settings
  const [stability, setStability] = useState(0.75)
  const [similarityBoost, setSimilarityBoost] = useState(0.8)
  const [style, setStyle] = useState(0.2)
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(true)

  // Breathing/humanization
  const [addBreathing, setAddBreathing] = useState(false)
  const [emphasisLevel, setEmphasisLevel] = useState('moderate')

  // UI state
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [generatedSSML, setGeneratedSSML] = useState('')
  const [error, setError] = useState('')
  const [audioInfo, setAudioInfo] = useState<{ duration?: number; size?: number }>({})

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please enter a script to synthesize')
      return
    }

    setLoading(true)
    setError('')
    setAudioUrl(null)
    setGeneratedSSML('')

    try {
      const voice = VOICES.find(v => v.id === selectedVoice)

      const response = await fetch('/api/admin/voice-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script.trim(),
          voiceId: voice?.voiceId,
          pauseAfterPeriod,
          pauseAfterComma,
          pauseAfterColon,
          pauseAfterSemicolon,
          speed,
          stability,
          similarityBoost,
          style,
          useSpeakerBoost,
          addBreathing,
          emphasisLevel
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Voice synthesis failed')
      }

      const data = await response.json()

      // Create audio URL from base64
      const audioBlob = base64ToBlob(data.audioBase64, 'audio/mpeg')
      const url = URL.createObjectURL(audioBlob)

      setAudioUrl(url)
      setGeneratedSSML(data.ssml)
      setAudioInfo({
        duration: data.duration,
        size: Math.round(audioBlob.size / 1024)
      })

    } catch (err: any) {
      console.error('Voice test error:', err)
      setError(err.message || 'Failed to generate audio')
    } finally {
      setLoading(false)
    }
  }

  const base64ToBlob = (base64: string, contentType: string) => {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-black text-white p-6">
      <div className="w-full max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">StillCaster Admin</h1>
          <p className="text-gray-400">Voice Synthesis Experimentation Lab</p>
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-300">
              🔒 Password authentication will be added in future. Currently open for testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input & Controls */}
          <div className="space-y-6">
            {/* Script Input */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Meditation Script</h2>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your meditation script here..."
                className="w-full h-64 p-4 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm resize-none focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-2 text-xs text-gray-400">
                {script.split(' ').filter(w => w.length > 0).length} words
              </div>
            </div>

            {/* SSML Pause Controls */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Pause Durations (seconds)</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    After Period: {pauseAfterPeriod}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={pauseAfterPeriod}
                    onChange={(e) => setPauseAfterPeriod(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    After Comma: {pauseAfterComma}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pauseAfterComma}
                    onChange={(e) => setPauseAfterComma(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    After Colon: {pauseAfterColon}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pauseAfterColon}
                    onChange={(e) => setPauseAfterColon(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    After Semicolon: {pauseAfterSemicolon}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pauseAfterSemicolon}
                    onChange={(e) => setPauseAfterSemicolon(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* ElevenLabs Voice Settings */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">ElevenLabs Voice Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    {VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Stability: {stability.toFixed(2)} (more consistent ← → more variable)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={stability}
                    onChange={(e) => setStability(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Similarity Boost: {similarityBoost.toFixed(2)} (low fidelity ← → high fidelity)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={similarityBoost}
                    onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Style: {style.toFixed(2)} (neutral ← → expressive)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={style}
                    onChange={(e) => setStyle(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="speakerBoost"
                    checked={useSpeakerBoost}
                    onChange={(e) => setUseSpeakerBoost(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="speakerBoost" className="text-sm text-gray-300">
                    Use Speaker Boost (enhance similarity)
                  </label>
                </div>
              </div>
            </div>

            {/* Humanization Options */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Humanization</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="breathing"
                    checked={addBreathing}
                    onChange={(e) => setAddBreathing(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="breathing" className="text-sm text-gray-300">
                    Add breathing sounds at commas
                  </label>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Emphasis Level
                  </label>
                  <select
                    value={emphasisLevel}
                    onChange={(e) => setEmphasisLevel(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="reduced">Reduced</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Playback Speed: {speed.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Note: This affects playback, not ElevenLabs synthesis
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !script.trim()}
              className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                '🎙️ Generate & Play Audio'
              )}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Audio Player */}
            {audioUrl && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Audio Output</h2>
                <audio
                  src={audioUrl}
                  controls
                  className="w-full mb-4"
                  style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                />
                {audioInfo.duration && (
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Duration: ~{audioInfo.duration.toFixed(1)}s</p>
                    <p>Size: {audioInfo.size}KB</p>
                  </div>
                )}
              </div>
            )}

            {/* Generated SSML */}
            {generatedSSML && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Generated SSML</h2>
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {generatedSSML}
                  </pre>
                </div>
              </div>
            )}

            {/* Current Settings Summary */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Current Settings</h2>
              <div className="text-sm text-gray-300 space-y-2 font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-400">Voice:</span>
                  <span>{VOICES.find(v => v.id === selectedVoice)?.name}</span>

                  <span className="text-gray-400">Period pause:</span>
                  <span>{pauseAfterPeriod}s</span>

                  <span className="text-gray-400">Comma pause:</span>
                  <span>{pauseAfterComma}s</span>

                  <span className="text-gray-400">Colon pause:</span>
                  <span>{pauseAfterColon}s</span>

                  <span className="text-gray-400">Semicolon pause:</span>
                  <span>{pauseAfterSemicolon}s</span>

                  <span className="text-gray-400">Stability:</span>
                  <span>{stability.toFixed(2)}</span>

                  <span className="text-gray-400">Similarity:</span>
                  <span>{similarityBoost.toFixed(2)}</span>

                  <span className="text-gray-400">Style:</span>
                  <span>{style.toFixed(2)}</span>

                  <span className="text-gray-400">Speaker Boost:</span>
                  <span>{useSpeakerBoost ? 'Yes' : 'No'}</span>

                  <span className="text-gray-400">Breathing:</span>
                  <span>{addBreathing ? 'Yes' : 'No'}</span>

                  <span className="text-gray-400">Emphasis:</span>
                  <span>{emphasisLevel}</span>

                  <span className="text-gray-400">Speed:</span>
                  <span>{speed.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
