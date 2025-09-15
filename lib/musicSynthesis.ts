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
        throw new Error(errorData.error || 'Music generation failed')
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
  async generateMusic(options: MusicGenerationOptions): Promise<null> {
    console.log('Music generation disabled - no ElevenLabs API key configured')
    return null
  }

  async generateMusicWithFallback(options: MusicGenerationOptions): Promise<null> {
    return null
  }

  cleanupAll(): void {
    // No cleanup needed for fallback
  }
}

// Factory function to create appropriate music synthesis instance
export function createMusicSynthesis(): MusicSynthesis | FallbackMusicSynthesis {
  // Check if ElevenLabs API is available (check for API key presence)
  const hasElevenLabsKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
  if (hasElevenLabsKey) {
    return new MusicSynthesis()
  } else {
    console.warn('ElevenLabs API key not found, using fallback music synthesis')
    return new FallbackMusicSynthesis()
  }
}