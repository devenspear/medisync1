import { MusicPromptGenerator } from './musicConstants'
import type { PrimaryTheme, AtmosphericElement, SoundscapeJourney } from './musicConstants'

export interface MusicGenerationOptions {
  duration: number
  primaryTheme: PrimaryTheme
  atmosphericElements: AtmosphericElement[]
  soundscapeJourney: SoundscapeJourney
}

export interface MusicGenerationResult {
  audioUrl: string
  duration: number
  prompt: string
  cleanup: () => void
}

export class MusicSynthesis {
  private audioUrls: string[] = []

  async generateMusic(options: MusicGenerationOptions): Promise<MusicGenerationResult> {
    try {
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🎵 Music API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        })
        throw new Error(errorData.error || `Music generation failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Convert base64 audio to blob URL
      const audioBlob = this.base64ToBlob(data.audio, 'audio/mpeg')
      const audioUrl = URL.createObjectURL(audioBlob)

      // Track the URL for cleanup
      this.audioUrls.push(audioUrl)

      return {
        audioUrl,
        duration: data.duration,
        prompt: data.prompt,
        cleanup: () => this.cleanup(audioUrl)
      }
    } catch (error) {
      console.error('Music synthesis error:', error)
      throw error
    }
  }

  async generateMusicWithFallback(options: MusicGenerationOptions): Promise<MusicGenerationResult | null> {
    try {
      return await this.generateMusic(options)
    } catch (error) {
      console.warn('ElevenLabs music generation failed, continuing without music:', error)
      return null
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  private getAuthToken(): string {
    // Get token from localStorage or auth client
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || ''
    }
    return ''
  }

  private cleanup(audioUrl: string): void {
    URL.revokeObjectURL(audioUrl)
    this.audioUrls = this.audioUrls.filter(url => url !== audioUrl)
  }

  // Cleanup all generated audio URLs
  cleanupAll(): void {
    this.audioUrls.forEach(url => URL.revokeObjectURL(url))
    this.audioUrls = []
  }
}

// Singleton instance
export const musicSynthesis = new MusicSynthesis()

// Fallback music synthesis for when ElevenLabs is not available
export class FallbackMusicSynthesis {
  private audioUrls: string[] = []

  async generateMusic(options: MusicGenerationOptions): Promise<MusicGenerationResult | null> {
    console.log('🎵 Using fallback music generation - creating ambient tone')
    console.log('🎵 Fallback options:', {
      duration: options.duration,
      theme: options.primaryTheme.displayName,
      elements: options.atmosphericElements.map(e => e.displayName)
    })

    // Generate a simple ambient tone using Web Audio API
    try {
      const audioUrl = await this.generateAmbientTone(options.duration * 60)

      if (audioUrl) {
        this.audioUrls.push(audioUrl)
        console.log('🎵 Fallback ambient tone generated successfully:', {
          audioUrl: audioUrl.substring(0, 50) + '...',
          duration: options.duration
        })
        return {
          audioUrl,
          duration: options.duration,
          prompt: `Fallback ambient tone for ${options.primaryTheme.displayName}`,
          cleanup: () => this.cleanup(audioUrl)
        }
      } else {
        console.error('🎵 generateAmbientTone returned null')
      }
    } catch (error) {
      console.error('🎵 Fallback music generation failed:', error)
    }

    return null
  }

  async generateMusicWithFallback(options: MusicGenerationOptions): Promise<MusicGenerationResult | null> {
    return this.generateMusic(options)
  }

  private async generateAmbientTone(durationSeconds: number): Promise<string | null> {
    if (typeof window === 'undefined') {
      console.warn('🎵 Cannot generate ambient tone: not in browser environment')
      return null // Can't generate audio on server side
    }

    console.log('🎵 Starting ambient tone generation:', { durationSeconds })

    try {
      const audioContext = new AudioContext()
      const sampleRate = audioContext.sampleRate
      const length = sampleRate * durationSeconds

      console.log('🎵 Audio context created:', { sampleRate, length, channels: 2 })

      const buffer = audioContext.createBuffer(2, length, sampleRate)

      // Generate ambient drone-like tones
      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel)
        for (let i = 0; i < length; i++) {
          const time = i / sampleRate
          // Mix of low frequency tones for ambient effect
          const freq1 = 55 + Math.sin(time * 0.1) * 5  // Low drone
          const freq2 = 110 + Math.sin(time * 0.2) * 10 // Harmonic
          const freq3 = 220 + Math.sin(time * 0.05) * 20 // Higher harmonic

          const sample =
            Math.sin(2 * Math.PI * freq1 * time) * 0.1 +
            Math.sin(2 * Math.PI * freq2 * time) * 0.05 +
            Math.sin(2 * Math.PI * freq3 * time) * 0.02

          // Apply fade in/out
          const fadeTime = Math.min(time, durationSeconds - time, 2)
          const fadeMultiplier = Math.min(fadeTime / 2, 1)

          channelData[i] = sample * fadeMultiplier
        }
      }

      console.log('🎵 Audio buffer generated, converting to WAV...')

      // Convert to audio file
      const audioBlob = await this.bufferToWave(buffer)
      const audioUrl = URL.createObjectURL(audioBlob)

      console.log('🎵 WAV conversion complete:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        audioUrl: audioUrl.substring(0, 50) + '...'
      })

      return audioUrl

    } catch (error) {
      console.error('🎵 Failed to generate ambient tone:', error)
      return null
    }
  }

  private async bufferToWave(buffer: AudioBuffer): Promise<Blob> {
    const length = buffer.length
    const numberOfChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)

    // Convert samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  private cleanup(audioUrl: string): void {
    URL.revokeObjectURL(audioUrl)
    this.audioUrls = this.audioUrls.filter(url => url !== audioUrl)
  }

  cleanupAll(): void {
    this.audioUrls.forEach(url => URL.revokeObjectURL(url))
    this.audioUrls = []
  }
}

// Factory function to create appropriate music synthesis instance
export function createMusicSynthesis(): MusicSynthesis | FallbackMusicSynthesis {
  // Check if ElevenLabs API is available (check for API key presence)
  const hasElevenLabsKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY

  console.log('🎵 Checking ElevenLabs API key availability:', {
    hasPublicKey: !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    hasPrivateKey: !!process.env.ELEVENLABS_API_KEY,
    hasEitherKey: !!hasElevenLabsKey
  })

  if (hasElevenLabsKey) {
    console.log('🎵 Using ElevenLabs Music API')
    return new MusicSynthesis()
  } else {
    console.warn('🎵 ElevenLabs API key not found, using fallback music synthesis')
    return new FallbackMusicSynthesis()
  }
}