'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
// Soundscape engine removed - using simple MP3 playback instead
// import { getSoundscapeEngine } from '@/lib/soundscapeEngine'
// import { PRIMARY_THEMES, ATMOSPHERIC_ELEMENTS, SOUNDSCAPE_JOURNEYS } from '@/lib/musicConstants'

// Types removed - using simple MP3 playback
// type Theme = (typeof PRIMARY_THEMES)[number]['displayName']
// type ElementName = (typeof ATMOSPHERIC_ELEMENTS)[number]['displayName']
// type Journey = (typeof SOUNDSCAPE_JOURNEYS)[number]['displayName']

export default function SoundscapeDebugPage() {
  // const engineRef = useRef<ReturnType<typeof getSoundscapeEngine> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [durationMin, setDurationMin] = useState(2)

  // Removed theme/journey/elements - using single MP3 file
  // const [theme, setTheme] = useState<Theme>('Celestial & Ethereal')
  // const [journey, setJourney] = useState<Journey>('Gentle Build')
  // const [elements, setElements] = useState<ElementName[]>(['Gentle Rain'])
  const [selectedTrack] = useState('StillCaster Ambient Music')

  // Removed theme/journey/element options
  // const themeOptions = PRIMARY_THEMES.map(t => t.displayName)
  // const journeyOptions = SOUNDSCAPE_JOURNEYS.map(j => j.displayName)
  // const elementOptions = ATMOSPHERIC_ELEMENTS.map(e => e.displayName)

  // Keep master volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = masterVolume
    }
  }, [masterVolume])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const start = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/MusicBed5min.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = masterVolume
    }
    try {
      await audioRef.current.play()
      setIsRunning(true)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsRunning(false)
  }

  // Removed unused functions - simplified to MP3 playback only
  // const toggleElement = (name: ElementName) => { ... }
  // const sampleStatus = useMemo(() => { ... }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🎧 StillCaster Music Player</h1>
        <p className="text-gray-400 mb-6">Simple MP3 background music player for meditation sessions.</p>

        {/* Simple MP3 Player Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Music Player</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Background Music</label>
              <div className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                {selectedTrack}
              </div>
              <p className="text-sm text-gray-400 mt-1">5-minute ambient meditation music</p>
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Volume</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={masterVolume}
                  onChange={e => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-gray-300 w-16">{(masterVolume * 100) | 0}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={start}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ▶️ Play
            </button>
            <button
              onClick={stop}
              disabled={!isRunning}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ⏹️ Stop
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Player Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Playing:</span>
              <span className={isRunning ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                {isRunning ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Track:</span>
              <span className="ml-2">{selectedTrack}</span>
            </div>
            <div>
              <span className="text-gray-400">Volume:</span>
              <span className="ml-2">{(masterVolume * 100) | 0}%</span>
            </div>
            <div>
              <span className="text-gray-400">File:</span>
              <span className="ml-2">MusicBed5min.mp3</span>
            </div>
          </div>
        </div>

        {/* Assets */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Audio File</h2>
          <p className="text-gray-400 mb-3">Background music for meditation sessions:</p>
          <ul className="font-mono text-sm bg-black rounded-lg p-4 space-y-1">
            <li>✅ /public/MusicBed5min.mp3 - 5-minute ambient background music</li>
            <li>🎵 Voice narration from ElevenLabs will play over this background</li>
            <li>🔄 Music loops automatically for longer sessions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
