import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { MusicPromptGenerator } from '@/lib/musicConstants'

interface MusicGenerationRequest {
  duration: number
  primaryTheme: {
    displayName: string
    keywords: string
  }
  atmosphericElements: Array<{
    displayName: string
    description: string
  }>
  soundscapeJourney: {
    displayName: string
    structure: string
  }
}

async function generateMusicWithElevenLabs(prompt: string, duration: number): Promise<ArrayBuffer> {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured')
  }

  console.log('🎵 ElevenLabs Music API Request:', {
    endpoint: 'https://api.elevenlabs.io/v1/sound-generation',
    prompt: prompt.substring(0, 100) + '...',
    duration_seconds: duration * 60,
    hasApiKey: !!ELEVENLABS_API_KEY
  })

  // ElevenLabs Sound Generation API has max 30 seconds duration
  // For meditation music, we'll generate 30-second ambient loops
  const maxDuration = Math.min(30, duration * 60)

  const requestBody = {
    text: prompt,
    duration_seconds: maxDuration,
    prompt_influence: 0.3,
    loop: true, // Enable looping for seamless ambient sound
    model_id: "eleven_text_to_sound_v2",
    output_format: "mp3_44100_128"
  }

  // ElevenLabs Music API endpoint
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(requestBody),
  })

  console.log('🎵 ElevenLabs API Response:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('🎵 ElevenLabs API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText,
      requestBody: requestBody
    })
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log('🎵 Music generated successfully:', {
    size: arrayBuffer.byteLength,
    duration: duration
  })

  return arrayBuffer
}

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body: MusicGenerationRequest = await request.json()
    const { duration, primaryTheme, atmosphericElements, soundscapeJourney } = body

    // Validate required fields
    if (!duration || !primaryTheme || !soundscapeJourney) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate the music prompt using our template system
    const musicPrompt = MusicPromptGenerator.generatePrompt(
      duration,
      primaryTheme,
      atmosphericElements || [],
      soundscapeJourney
    )

    console.log('Generated music prompt:', musicPrompt)

    // Generate music with ElevenLabs
    const musicBuffer = await generateMusicWithElevenLabs(musicPrompt, duration)

    // Convert ArrayBuffer to base64 for JSON response
    const base64Audio = Buffer.from(musicBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      audio: base64Audio,
      format: 'mp3',
      duration: duration,
      prompt: musicPrompt
    })

  } catch (error) {
    console.error('Music generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Music generation failed' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)