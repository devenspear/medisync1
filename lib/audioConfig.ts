/**
 * Audio Configuration for Meditation Sessions
 * Centralized settings for voice synthesis and music timing
 */

export interface AudioTimingConfig {
  // Voice narration delay after music starts (in seconds)
  voiceStartDelay: number

  // Music fade out duration after voice ends (in seconds)
  musicFadeAfterVoice: number

  // Music fade out duration at end of session (in seconds)
  musicEndFadeDuration: number
}

export interface VoiceConfig {
  // Speaking rate: 0.25 (slowest) to 4.0 (fastest), 1.0 is normal
  speed: number

  // Voice stability: 0.0 to 1.0 (higher = more consistent)
  stability: number

  // Similarity boost: 0.0 to 1.0 (higher = more like original voice)
  similarity_boost: number

  // Style exaggeration: 0.0 to 1.0
  style: number

  // Use speaker boost for clarity
  use_speaker_boost: boolean
}

// Default audio timing configuration
export const DEFAULT_AUDIO_TIMING: AudioTimingConfig = {
  voiceStartDelay: 10,        // Voice starts 10 seconds after music
  musicFadeAfterVoice: 10,    // Music continues 10 seconds after voice ends
  musicEndFadeDuration: 5     // Final fade out duration
}

// Default voice configuration for meditation
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  speed: 0.85,                // Slightly slower for meditation (was too fast at 1.0)
  stability: 0.75,            // Consistent, calm delivery
  similarity_boost: 0.8,      // Close to the trained voice
  style: 0.2,                 // Subtle style variation
  use_speaker_boost: true     // Enhanced clarity
}

// Preset voice speeds for user selection
export const VOICE_SPEED_PRESETS = {
  'very-slow': 0.65,
  'slow': 0.75,
  'normal': 0.85,
  'medium': 1.0,
  'fast': 1.15
} as const

export type VoiceSpeedPreset = keyof typeof VOICE_SPEED_PRESETS
