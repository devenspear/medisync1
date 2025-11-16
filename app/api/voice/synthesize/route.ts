import { NextRequest, NextResponse } from 'next/server'
import { createVoiceSynthesis, VoiceSynthesis } from '@/lib/voiceSynthesis'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log('🎙️ [Voice Synthesis] Starting request...')
    const { text, voiceId, speed = 0.85 } = await request.json()

    console.log('🎙️ [Voice Synthesis] Request params:', {
      textLength: text?.length || 0,
      textPreview: text?.substring(0, 100) + '...',
      voiceId,
      speed,
      hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY
    })

    if (!text || !voiceId) {
      console.error('❌ [Voice Synthesis] Missing required params')
      return NextResponse.json(
        { error: 'Text and voiceId are required' },
        { status: 400 }
      )
    }

    const voiceSynthesis = createVoiceSynthesis()

    // Check if we have ElevenLabs API available
    if (!(voiceSynthesis instanceof VoiceSynthesis)) {
      console.warn('⚠️ [Voice Synthesis] ElevenLabs API not available, falling back')
      return NextResponse.json(
        { error: 'ElevenLabs API not available', fallback: true },
        { status: 503 }
      )
    }

    console.log('🎙️ [Voice Synthesis] Calling ElevenLabs API with speed:', speed)

    // Generate voice audio with configurable speed
    const audioBuffer = await voiceSynthesis.synthesizeText(text, voiceId, speed)

    const duration = Date.now() - startTime
    console.log('✅ [Voice Synthesis] Success!', {
      audioSize: audioBuffer.byteLength,
      durationMs: duration,
      sizeKB: Math.round(audioBuffer.byteLength / 1024)
    })

    // Return the audio as a response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Synthesis-Duration': duration.toString(),
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [Voice Synthesis] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      durationMs: duration
    })

    return NextResponse.json(
      {
        error: 'Failed to synthesize voice',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}