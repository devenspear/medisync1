import { NextResponse } from 'next/server';
import { createVoiceSynthesis, VoiceSynthesis } from '@/lib/voiceSynthesis';

/**
 * Test endpoint for voice synthesis
 * GET /api/voice/test
 *
 * Tests ElevenLabs voice synthesis with a simple test message
 */
export async function GET() {
  try {
    console.log('🧪 [Voice Test] Starting test...');

    const testText = "Welcome to your meditation session. This is a test of the voice synthesis system.";
    const testVoiceId = 'female-1';

    // Check if ElevenLabs is configured
    const hasKey = !!process.env.ELEVENLABS_API_KEY;
    console.log('🧪 [Voice Test] Has ElevenLabs key:', hasKey);

    if (!hasKey) {
      return NextResponse.json({
        success: false,
        error: 'ELEVENLABS_API_KEY not configured',
        message: 'Please add your ElevenLabs API key to environment variables'
      }, { status: 503 });
    }

    const voiceSynthesis = createVoiceSynthesis();

    if (!(voiceSynthesis instanceof VoiceSynthesis)) {
      return NextResponse.json({
        success: false,
        error: 'VoiceSynthesis instance failed',
        message: 'Could not create VoiceSynthesis instance'
      }, { status: 503 });
    }

    console.log('🧪 [Voice Test] Synthesizing test audio...');
    const startTime = Date.now();

    const audioBuffer = await voiceSynthesis.synthesizeText(testText, testVoiceId);

    const duration = Date.now() - startTime;

    console.log('✅ [Voice Test] Success!', {
      audioSize: audioBuffer.byteLength,
      durationMs: duration,
      sizeKB: Math.round(audioBuffer.byteLength / 1024)
    });

    return NextResponse.json({
      success: true,
      audioSize: audioBuffer.byteLength,
      sizeKB: Math.round(audioBuffer.byteLength / 1024),
      durationMs: duration,
      testText,
      voiceId: testVoiceId,
      message: 'Voice synthesis test successful!'
    });

  } catch (error) {
    console.error('❌ [Voice Test] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      message: 'Voice synthesis test failed'
    }, { status: 500 });
  }
}
