export interface VoiceOptions {
  voice_id: string
  text: string
  model_id?: string
  voice_settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

export class VoiceSynthesis {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  // Available voices with their IDs (these are example IDs - replace with actual ElevenLabs voice IDs)
  private voices = {
    'female-1': {
      id: 'EXAVITQu4vr4xnSDxMaL', // Bella - calm female voice
      name: 'Bella',
      description: 'Calm, soothing female voice'
    },
    'female-2': {
      id: 'AZnzlk1XvdvUeBnXmlld', // Domi - gentle female voice
      name: 'Domi',
      description: 'Gentle, nurturing female voice'
    },
    'male-1': {
      id: 'VR6AewLTigWG4xSOukaG', // Arnold - warm male voice
      name: 'Arnold',
      description: 'Warm, reassuring male voice'
    },
    'male-2': {
      id: 'ErXwobaYiN019PkySvjV', // Antoni - calm male voice
      name: 'Antoni',
      description: 'Calm, meditative male voice'
    }
  }

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async synthesizeText(text: string, voiceId: string): Promise<ArrayBuffer> {
    const voice = this.voices[voiceId as keyof typeof this.voices]
    if (!voice) {
      throw new Error(`Voice ID ${voiceId} not found`)
    }

    const options: VoiceOptions = {
      voice_id: voice.id,
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: options.text,
          model_id: options.model_id,
          voice_settings: options.voice_settings
        }),
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
      }

      return await response.arrayBuffer()
    } catch (error) {
      console.error('Voice synthesis failed:', error)
      throw error
    }
  }

  async synthesizeScript(
    intro: string,
    main: string,
    closing: string,
    voiceId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ intro: ArrayBuffer; main: ArrayBuffer; closing: ArrayBuffer }> {
    try {
      onProgress?.(0.1)
      const introAudio = await this.synthesizeText(intro, voiceId)

      onProgress?.(0.4)
      const mainAudio = await this.synthesizeText(main, voiceId)

      onProgress?.(0.8)
      const closingAudio = await this.synthesizeText(closing, voiceId)

      onProgress?.(1.0)

      return {
        intro: introAudio,
        main: mainAudio,
        closing: closingAudio
      }
    } catch (error) {
      console.error('Script synthesis failed:', error)
      throw error
    }
  }

  // Create audio URLs from ArrayBuffers for playback
  createAudioUrl(audioBuffer: ArrayBuffer): string {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }

  // Clean up created URLs to prevent memory leaks
  revokeAudioUrl(url: string) {
    URL.revokeObjectURL(url)
  }

  // Get available voices for UI selection
  getAvailableVoices() {
    return Object.entries(this.voices).map(([key, voice]) => ({
      id: key,
      name: voice.name,
      description: voice.description
    }))
  }

  // Preview a voice with sample text
  async previewVoice(voiceId: string): Promise<ArrayBuffer> {
    const sampleText = "Welcome to your personalized meditation session. Take a deep breath and let yourself relax."
    return await this.synthesizeText(sampleText, voiceId)
  }
}

// Fallback text-to-speech using browser's Speech Synthesis API
export class FallbackVoiceSynthesis {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices() {
    if (!this.synth) return

    this.voices = this.synth.getVoices()

    // If voices aren't loaded yet, wait for the voiceschanged event
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth!.getVoices()
      }
    }
  }

  async synthesizeText(text: string, voiceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)

      // Select voice based on preference
      const preferredVoice = this.voices.find(voice =>
        voice.name.toLowerCase().includes('female') && voice.lang.includes('en')
      ) || this.voices.find(voice => voice.lang.includes('en')) || this.voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      // Set speech parameters for meditation
      utterance.rate = 0.7 // Slower speech
      utterance.pitch = 0.9 // Slightly lower pitch
      utterance.volume = 0.8

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error))

      this.synth.speak(utterance)
    })
  }

  getAvailableVoices() {
    return this.voices
      .filter(voice => voice.lang.includes('en'))
      .map(voice => ({
        id: voice.name,
        name: voice.name,
        description: `${voice.lang} - ${voice.gender || 'Unknown'}`
      }))
  }
}

// Factory function
export const createVoiceSynthesis = (): VoiceSynthesis | FallbackVoiceSynthesis => {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

  if (apiKey) {
    return new VoiceSynthesis(apiKey)
  } else {
    console.warn('ElevenLabs API key not found, using fallback browser speech synthesis')
    return new FallbackVoiceSynthesis()
  }
}