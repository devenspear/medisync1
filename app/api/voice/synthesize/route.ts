import { NextRequest, NextResponse } from 'next/server'
import { createVoiceSynthesis, VoiceSynthesis } from '@/lib/voiceSynthesis'

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      )
    }

    const voiceSynthesis = createVoiceSynthesis()

    // Check if we have ElevenLabs API available
    if (!(voiceSynthesis instanceof VoiceSynthesis)) {
      return NextResponse.json(
        { error: 'ElevenLabs API not available', fallback: true },
        { status: 503 }
      )
    }

    // Generate voice audio
    const audioBuffer = await voiceSynthesis.synthesizeText(text, voiceId)

    // Return the audio as a response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Voice synthesis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to synthesize voice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}