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

  // ElevenLabs Music API endpoint
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: duration * 60, // Convert minutes to seconds
      prompt_influence: 0.3,
      seed: Math.floor(Math.random() * 1000000),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`)
  }

  return response.arrayBuffer()
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