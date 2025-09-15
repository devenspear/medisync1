// Music generation constants from MediSync_Music_Gen.md spec

export interface PrimaryTheme {
  displayName: string;
  keywords: string;
}

export interface AtmosphericElement {
  displayName: string;
  description: string;
}

export interface SoundscapeJourney {
  displayName: string;
  structure: string;
}

export const PRIMARY_THEMES: PrimaryTheme[] = [
  {
    displayName: "Celestial & Ethereal",
    keywords: "shimmering pads, ethereal textures, cosmic drone, glass-like bells, floating, vast, expansive"
  },
  {
    displayName: "Deep Earth & Grounding",
    keywords: "deep sub-bass drone, low resonant frequencies, grounding tones, cave-like resonance, stable, solid"
  },
  {
    displayName: "Flowing Water & Cleansing",
    keywords: "gentle flowing stream, soft rain, cleansing water sounds, fluid pads, smooth transitions, washing away"
  },
  {
    displayName: "Sacred Temple & Chants",
    keywords: "distant monastery chants, Himalayan singing bowls, sacred hum, resonant gongs, reverent atmosphere"
  }
];

export const ATMOSPHERIC_ELEMENTS: AtmosphericElement[] = [
  {
    displayName: "Gentle Rain",
    description: "A layer of soft, gentle rainfall is subtly present in the background."
  },
  {
    displayName: "Crystal Chimes",
    description: "Occasional, delicate crystal chimes or glass bells appear and fade."
  },
  {
    displayName: "Singing Bowls",
    description: "A deep, resonant Himalayan singing bowl is struck occasionally, with a long decay."
  },
  {
    displayName: "Subtle Heartbeat",
    description: "A very slow, deep, and subtle heartbeat drum provides a gentle, grounding rhythm."
  }
];

export const SOUNDSCAPE_JOURNEYS: SoundscapeJourney[] = [
  {
    displayName: "Gentle Build",
    structure: "Starts with a very soft, simple intro pad. Gradually introduces the deep drone layer and atmospheric elements, building gently to a fuller soundscape before a slow fade out."
  },
  {
    displayName: "Steady Drone",
    structure: "Begins with the main deep drone layer already present. Atmospheric elements gently fade in and out, but the core sound remains stable and consistent throughout before a quick fade."
  },
  {
    displayName: "Ebbing Flow",
    structure: "The soundscape gently pulses between moments of fullness and moments of near silence. The drone layer swells and recedes like a slow tide, with atmospheric elements appearing in the quiet spaces."
  }
];

// Music prompt template generator
export class MusicPromptGenerator {
  static generatePrompt(
    durationMinutes: number,
    primaryTheme: PrimaryTheme,
    atmosphericElements: AtmosphericElement[],
    soundscapeJourney: SoundscapeJourney
  ): string {
    const atmosphericDescriptions = atmosphericElements
      .map(element => element.description)
      .join('\n');

    // Optimize for ElevenLabs Sound Generation API - shorter, more direct prompts work better
    return `Ambient meditation soundscape with ${primaryTheme.keywords}. Peaceful, calming, ethereal drone suitable for mindfulness. Soft atmospheric textures, gentle harmonics, no percussion.`.trim();
  }
}