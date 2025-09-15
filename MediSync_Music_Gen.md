Technical Specification: Generative Soundscape System
1. Overview
This document provides the complete data models and prompt templates required to programmatically generate dynamic, personalized soundscapes using the ElevenLabs Music API. The system is designed to translate simple user selections from a mobile app interface into a sophisticated, structured prompt that guides the AI in creating a suitable musical bed for a guided meditation session.

2. Data Models for Mobile App UI
The following JSON object contains the arrays needed to populate the user-facing selection menus in the mobile application. These structures define the user's choices for the soundscape's theme, optional elements, and dynamic journey.

{
  "primaryThemes": [
    {
      "displayName": "Celestial & Ethereal",
      "keywords": "shimmering pads, ethereal textures, cosmic drone, glass-like bells, floating, vast, expansive"
    },
    {
      "displayName": "Deep Earth & Grounding",
      "keywords": "deep sub-bass drone, low resonant frequencies, grounding tones, cave-like resonance, stable, solid"
    },
    {
      "displayName": "Flowing Water & Cleansing",
      "keywords": "gentle flowing stream, soft rain, cleansing water sounds, fluid pads, smooth transitions, washing away"
    },
    {
      "displayName": "Sacred Temple & Chants",
      "keywords": "distant monastery chants, Himalayan singing bowls, sacred hum, resonant gongs, reverent atmosphere"
    }
  ],
  "atmosphericElements": [
    {
      "displayName": "Gentle Rain",
      "description": "A layer of soft, gentle rainfall is subtly present in the background."
    },
    {
      "displayName": "Crystal Chimes",
      "description": "Occasional, delicate crystal chimes or glass bells appear and fade."
    },
    {
      "displayName": "Singing Bowls",
      "description": "A deep, resonant Himalayan singing bowl is struck occasionally, with a long decay."
    },
    {
      "displayName": "Subtle Heartbeat",
      "description": "A very slow, deep, and subtle heartbeat drum provides a gentle, grounding rhythm."
    }
  ],
  "soundscapeJourneys": [
    {
      "displayName": "Gentle Build",
      "structure": "Starts with a very soft, simple intro pad. Gradually introduces the deep drone layer and atmospheric elements, building gently to a fuller soundscape before a slow fade out."
    },
    {
      "displayName": "Steady Drone",
      "structure": "Begins with the main deep drone layer already present. Atmospheric elements gently fade in and out, but the core sound remains stable and consistent throughout before a quick fade."
    },
    {
      "displayName": "Ebbing Flow",
      "structure": "The soundscape gently pulses between moments of fullness and moments of near silence. The drone layer swells and recedes like a slow tide, with atmospheric elements appearing in the quiet spaces."
    }
  ]
}

3. ElevenLabs Master Soundscape Prompt
This is the master template for the prompt that will be sent to the ElevenLabs API. The backend logic will replace the {{placeholder}} variables with the data derived from the user's selections.

Template:
Create a {{Duration_Minutes}}-minute soundscape.

Include styles: ambient, meditative, atmospheric, binaural, ethereal, drone, minimalist, relaxing, {{Primary_Theme_Keywords}}.

Exclude styles: percussive, rhythmic, energetic, vocal-heavy, abrasive, melodic, complex.

The soundscape should follow this structure: {{Soundscape_Journey_Structure}}

{{Atmospheric_Elements_Descriptions}}

Placeholder Definitions:
{{Duration_Minutes}}: The total length of the meditation session in minutes (e.g., 10).

{{Primary_Theme_Keywords}}: The keywords associated with the user's chosen primaryTheme (e.g., deep sub-bass drone, low resonant frequencies...).

{{Soundscape_Journey_Structure}}: The narrative description of the selected soundscapeJourney (e.g., Starts with a very soft, simple intro pad...).

{{Atmospheric_Elements_Descriptions}}: A string containing the descriptions of any selected atmosphericElements, with each description on a new line. If none are selected, this will be an empty string.

4. Example Prompt Assemblies
The following examples illustrate how the backend will translate user selections into a final, complete prompt ready for the API call.

Example 1: Grounding Meditation
User Selections:

Duration: 15 minutes

Primary Theme: Deep Earth & Grounding

Atmospheric Elements: Singing Bowls, Subtle Heartbeat

Soundscape Journey: Steady Drone

Generated ElevenLabs Prompt:

Create a 15-minute soundscape.

Include styles: ambient, meditative, atmospheric, binaural, ethereal, drone, minimalist, relaxing, deep sub-bass drone, low resonant frequencies, grounding tones, cave-like resonance, stable, solid.

Exclude styles: percussive, rhythmic, energetic, vocal-heavy, abrasive, melodic, complex.

The soundscape should follow this structure: Begins with the main deep drone layer already present. Atmospheric elements gently fade in and out, but the core sound remains stable and consistent throughout before a quick fade.

A deep, resonant Himalayan singing bowl is struck occasionally, with a long decay.
A very slow, deep, and subtle heartbeat drum provides a gentle, grounding rhythm.

Example 2: Creative Flow Meditation
User Selections:

Duration: 7 minutes

Primary Theme: Flowing Water & Cleansing

Atmospheric Elements: (None selected)

Soundscape Journey: Ebbing Flow

Generated ElevenLabs Prompt:

Create a 7-minute soundscape.

Include styles: ambient, meditative, atmospheric, binaural, ethereal, drone, minimalist, relaxing, gentle flowing stream, soft rain, cleansing water sounds, fluid pads, smooth transitions, washing away.

Exclude styles: percussive, rhythmic, energetic, vocal-heavy, abrasive, melodic, complex.

The soundscape should follow this structure: The soundscape gently pulses between moments of fullness and moments of near silence. The drone layer swells and recedes like a slow tide, with atmospheric elements appearing in the quiet spaces.

