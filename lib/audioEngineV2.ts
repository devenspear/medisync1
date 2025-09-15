/**
 * AudioEngine V2 - Simplified audio engine without binaural beats
 * Focuses on voice narration and music playback only
 */

export interface AudioLayer {
  voice_volume: number
  music_volume: number
}

export class AudioEngineV2 {
  private audioContext: AudioContext | null = null
  private voiceAudio: HTMLAudioElement | null = null
  private musicAudio: HTMLAudioElement | null = null
  private voiceGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private masterGain: GainNode | null = null

  constructor() {
    this.initializeAudioContext()
  }

  private async initializeAudioContext() {
    try {
      // Only initialize in browser environment
      if (typeof window === 'undefined') {
        console.warn('AudioContext not available in server environment')
        return
      }

      this.audioContext = new AudioContext()

      // Create gain nodes for volume control
      this.voiceGain = this.audioContext.createGain()
      this.musicGain = this.audioContext.createGain()
      this.masterGain = this.audioContext.createGain()

      // Connect gain nodes
      this.voiceGain.connect(this.masterGain)
      this.musicGain.connect(this.masterGain)
      this.masterGain.connect(this.audioContext.destination)

      console.log('AudioEngine V2 initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async playVoice(audioUrl: string, volume: number = 0.8): Promise<HTMLAudioElement> {
    await this.resumeAudioContext()

    if (this.voiceAudio) {
      this.stopVoice()
    }

    this.voiceAudio = new Audio(audioUrl)
    this.voiceAudio.volume = volume
    this.voiceAudio.preload = 'auto'

    // Connect to Web Audio API for advanced control
    if (this.audioContext && this.voiceGain) {
      try {
        const source = this.audioContext.createMediaElementSource(this.voiceAudio)
        source.connect(this.voiceGain)
        this.voiceGain.gain.value = volume
      } catch (error) {
        console.warn('Could not connect voice to Web Audio API, using basic HTML5 audio:', error)
      }
    }

    return this.voiceAudio
  }

  async playMusic(audioUrl: string, volume: number = 0.4): Promise<HTMLAudioElement> {
    await this.resumeAudioContext()

    if (this.musicAudio) {
      this.stopMusic()
    }

    this.musicAudio = new Audio(audioUrl)
    this.musicAudio.volume = volume
    this.musicAudio.loop = true // Music should loop during meditation
    this.musicAudio.preload = 'auto'

    // Connect to Web Audio API for advanced control
    if (this.audioContext && this.musicGain) {
      try {
        const source = this.audioContext.createMediaElementSource(this.musicAudio)
        source.connect(this.musicGain)
        this.musicGain.gain.value = volume
      } catch (error) {
        console.warn('Could not connect music to Web Audio API, using basic HTML5 audio:', error)
      }
    }

    return this.musicAudio
  }

  setVoiceVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume))

    if (this.voiceAudio) {
      this.voiceAudio.volume = clampedVolume
    }

    if (this.voiceGain && this.audioContext) {
      this.voiceGain.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime)
    }
  }

  setMusicVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume))

    if (this.musicAudio) {
      this.musicAudio.volume = clampedVolume
    }

    if (this.musicGain && this.audioContext) {
      this.musicGain.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime)
    }
  }

  setMasterVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume))

    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime)
    }
  }

  updateLayers(layers: AudioLayer) {
    this.setVoiceVolume(layers.voice_volume)
    this.setMusicVolume(layers.music_volume)
  }

  stopVoice() {
    if (this.voiceAudio) {
      this.voiceAudio.pause()
      this.voiceAudio.currentTime = 0
      this.voiceAudio = null
    }
  }

  stopMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause()
      this.musicAudio.currentTime = 0
      this.musicAudio = null
    }
  }

  stopAll() {
    this.stopVoice()
    this.stopMusic()
  }

  pauseAll() {
    if (this.voiceAudio && !this.voiceAudio.paused) {
      this.voiceAudio.pause()
    }
    if (this.musicAudio && !this.musicAudio.paused) {
      this.musicAudio.pause()
    }
  }

  resumeAll() {
    if (this.voiceAudio && this.voiceAudio.paused) {
      this.voiceAudio.play().catch(console.error)
    }
    if (this.musicAudio && this.musicAudio.paused) {
      this.musicAudio.play().catch(console.error)
    }
  }

  getCurrentTime(): number {
    return this.voiceAudio?.currentTime || 0
  }

  getDuration(): number {
    return this.voiceAudio?.duration || 0
  }

  isPlaying(): boolean {
    return !!(this.voiceAudio && !this.voiceAudio.paused) ||
           !!(this.musicAudio && !this.musicAudio.paused)
  }

  getVoiceAudio(): HTMLAudioElement | null {
    return this.voiceAudio
  }

  getMusicAudio(): HTMLAudioElement | null {
    return this.musicAudio
  }

  dispose() {
    this.stopAll()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    this.audioContext = null
    this.voiceGain = null
    this.musicGain = null
    this.masterGain = null
  }
}

// Singleton instance
let audioEngineV2Instance: AudioEngineV2 | null = null

export const getAudioEngineV2 = (): AudioEngineV2 => {
  if (!audioEngineV2Instance) {
    audioEngineV2Instance = new AudioEngineV2()
  }
  return audioEngineV2Instance
}

// Factory function to get the appropriate audio engine
export const getAudioEngine = (): AudioEngineV2 => {
  // Always return V2 (no binaural beats)
  return getAudioEngineV2()
}