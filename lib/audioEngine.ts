import * as Tone from 'tone'
import { FrequencyType } from './store'

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private binauralOscillatorL: OscillatorNode | null = null
  private binauralOscillatorR: OscillatorNode | null = null
  private gainNodeL: GainNode | null = null
  private gainNodeR: GainNode | null = null
  private merger: ChannelMergerNode | null = null
  private masterGain: GainNode | null = null

  // Tone.js elements for music and effects
  private toneStarted = false
  private ambientSynth: Tone.PolySynth | null = null
  private reverb: Tone.Reverb | null = null
  private filter: Tone.Filter | null = null

  // Frequency ranges for binaural beats (in Hz)
  private readonly frequencies: Record<FrequencyType, { base: number; beat: number }> = {
    delta: { base: 100, beat: 2 },      // 0.5-4 Hz difference
    theta: { base: 150, beat: 6 },      // 4-8 Hz difference
    alpha: { base: 200, beat: 10 },     // 8-14 Hz difference
    beta: { base: 250, beat: 20 },      // 14-30 Hz difference
    gamma: { base: 300, beat: 40 }      // 30-100 Hz difference
  }

  constructor() {
    this.initializeAudioContext()
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new AudioContext()
      await this.setupTone()
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  private async setupTone() {
    if (this.toneStarted) return

    try {
      await Tone.start()
      this.toneStarted = true

      // Setup ambient music synthesis
      this.reverb = new Tone.Reverb({
        decay: 8,
        wet: 0.3
      }).toDestination()

      this.filter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -24
      }).connect(this.reverb)

      this.ambientSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 4,
          decay: 2,
          sustain: 0.6,
          release: 8
        }
      }).connect(this.filter)

    } catch (error) {
      console.error('Failed to setup Tone.js:', error)
    }
  }

  async startBinauralBeats(frequency: FrequencyType, volume: number = 0.3) {
    if (!this.audioContext) {
      await this.initializeAudioContext()
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not available')
    }

    // Stop any existing binaural beats
    this.stopBinauralBeats()

    const { base, beat } = this.frequencies[frequency]

    // Create oscillators for left and right channels
    this.binauralOscillatorL = this.audioContext.createOscillator()
    this.binauralOscillatorR = this.audioContext.createOscillator()

    // Create gain nodes for volume control
    this.gainNodeL = this.audioContext.createGain()
    this.gainNodeR = this.audioContext.createGain()

    // Create channel merger for stereo output
    this.merger = this.audioContext.createChannelMerger(2)
    this.masterGain = this.audioContext.createGain()

    // Set frequencies (left ear gets base frequency, right ear gets base + beat)
    this.binauralOscillatorL.frequency.setValueAtTime(base, this.audioContext.currentTime)
    this.binauralOscillatorR.frequency.setValueAtTime(base + beat, this.audioContext.currentTime)

    // Set oscillator type to sine wave
    this.binauralOscillatorL.type = 'sine'
    this.binauralOscillatorR.type = 'sine'

    // Set volume
    this.gainNodeL.gain.setValueAtTime(volume, this.audioContext.currentTime)
    this.gainNodeR.gain.setValueAtTime(volume, this.audioContext.currentTime)
    this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime)

    // Connect the audio graph
    this.binauralOscillatorL.connect(this.gainNodeL)
    this.binauralOscillatorR.connect(this.gainNodeR)

    this.gainNodeL.connect(this.merger, 0, 0) // Left channel
    this.gainNodeR.connect(this.merger, 0, 1) // Right channel

    this.merger.connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)

    // Start the oscillators
    this.binauralOscillatorL.start()
    this.binauralOscillatorR.start()

    console.log(`Started binaural beats: ${frequency} (${base}Hz + ${base + beat}Hz = ${beat}Hz difference)`)
  }

  stopBinauralBeats() {
    if (this.binauralOscillatorL) {
      this.binauralOscillatorL.stop()
      this.binauralOscillatorL.disconnect()
      this.binauralOscillatorL = null
    }

    if (this.binauralOscillatorR) {
      this.binauralOscillatorR.stop()
      this.binauralOscillatorR.disconnect()
      this.binauralOscillatorR = null
    }

    if (this.gainNodeL) {
      this.gainNodeL.disconnect()
      this.gainNodeL = null
    }

    if (this.gainNodeR) {
      this.gainNodeR.disconnect()
      this.gainNodeR = null
    }

    if (this.merger) {
      this.merger.disconnect()
      this.merger = null
    }

    if (this.masterGain) {
      this.masterGain.disconnect()
      this.masterGain = null
    }
  }

  setBinauralVolume(volume: number) {
    if (this.gainNodeL && this.gainNodeR && this.audioContext) {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      this.gainNodeL.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime)
      this.gainNodeR.gain.setValueAtTime(clampedVolume, this.audioContext.currentTime)
    }
  }

  async startAmbientMusic(volume: number = 0.2) {
    if (!this.toneStarted) {
      await this.setupTone()
    }

    if (!this.ambientSynth) return

    // Set volume
    this.ambientSynth.volume.value = Tone.gainToDb(volume)

    // Play ambient chord progressions
    this.playAmbientSequence()
  }

  private playAmbientSequence() {
    if (!this.ambientSynth) return

    // Ambient chord progressions in C major
    const chords = [
      ['C4', 'E4', 'G4'],
      ['Am3', 'C4', 'E4'],
      ['F3', 'A3', 'C4'],
      ['G3', 'B3', 'D4'],
    ]

    let chordIndex = 0

    const playNextChord = () => {
      if (!this.ambientSynth) return

      const chord = chords[chordIndex % chords.length]

      // Play chord with random slight variations in timing
      chord.forEach((note, index) => {
        const delay = index * 0.1 + Math.random() * 0.2
        setTimeout(() => {
          if (this.ambientSynth) {
            this.ambientSynth.triggerAttackRelease(note, '4n')
          }
        }, delay * 1000)
      })

      chordIndex++

      // Schedule next chord (8-12 seconds)
      setTimeout(playNextChord, (8 + Math.random() * 4) * 1000)
    }

    playNextChord()
  }

  stopAmbientMusic() {
    if (this.ambientSynth) {
      this.ambientSynth.releaseAll()
    }
  }

  setMusicVolume(volume: number) {
    if (this.ambientSynth) {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      this.ambientSynth.volume.value = Tone.gainToDb(clampedVolume)
    }
  }

  // Play nature sounds (simplified version)
  async playNatureSound(type: 'rain' | 'ocean' | 'forest', volume: number = 0.3) {
    if (!this.toneStarted) {
      await this.setupTone()
    }

    // This is a simplified version - in production you'd load actual nature sound files
    const noise = new Tone.Noise({
      type: type === 'rain' ? 'pink' : type === 'ocean' ? 'brown' : 'white',
      volume: Tone.gainToDb(volume)
    }).toDestination()

    noise.start()

    // Auto-stop after a long duration (or until manually stopped)
    setTimeout(() => {
      noise.stop()
      noise.dispose()
    }, 30 * 60 * 1000) // 30 minutes

    return noise
  }

  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    if (!this.toneStarted) {
      await this.setupTone()
    }
  }

  dispose() {
    this.stopBinauralBeats()
    this.stopAmbientMusic()

    if (this.ambientSynth) {
      this.ambientSynth.dispose()
    }
    if (this.reverb) {
      this.reverb.dispose()
    }
    if (this.filter) {
      this.filter.dispose()
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null

export const getAudioEngine = () => {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine()
  }
  return audioEngineInstance
}