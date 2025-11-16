import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      script,
      voiceId,
      pauseAfterPeriod,
      pauseAfterComma,
      pauseAfterColon,
      pauseAfterSemicolon,
      speed,
      stability,
      similarityBoost,
      style,
      useSpeakerBoost,
      addBreathing,
      emphasisLevel
    } = await request.json();

    if (!script || !voiceId) {
      return NextResponse.json(
        { error: 'Script and voice ID are required' },
        { status: 400 }
      );
    }

    console.log('🎙️ [Admin Voice Test] Generating audio with custom parameters');

    // Process script to add SSML tags based on pause settings
    let processedScript = script.trim();

    // Remove any existing SSML tags first
    processedScript = processedScript.replace(/<[^>]*>/g, '');

    // Add pauses based on punctuation
    processedScript = processedScript.replace(/\./g, `.<break time="${pauseAfterPeriod}s"/>`);
    processedScript = processedScript.replace(/,/g, addBreathing
      ? `,<break time="${pauseAfterComma}s"/>[breath]`
      : `,<break time="${pauseAfterComma}s"/>`
    );
    processedScript = processedScript.replace(/:/g, `:<break time="${pauseAfterColon}s"/>`);
    processedScript = processedScript.replace(/;/g, `;<break time="${pauseAfterSemicolon}s"/>`);

    // Add emphasis on meditation keywords if enabled
    if (emphasisLevel !== 'none') {
      const keywords = ['breathe', 'breath', 'relax', 'release', 'peace', 'calm', 'stillness', 'presence', 'awareness'];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        processedScript = processedScript.replace(
          regex,
          `<emphasis level="${emphasisLevel}">$1</emphasis>`
        );
      });
    }

    // Wrap in SSML speak tags
    const ssml = `<speak>${processedScript}</speak>`;

    console.log('📝 [Admin Voice Test] Generated SSML length:', ssml.length);

    // Call ElevenLabs API with custom voice settings
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const voiceSettings = {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost
    };

    console.log('🎛️ [Admin Voice Test] Voice settings:', voiceSettings);

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: ssml,
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceSettings
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('❌ [Admin Voice Test] ElevenLabs error:', errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${elevenLabsResponse.statusText}` },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Estimate duration (very rough)
    const wordCount = script.split(/\s+/).length;
    const wordsPerMinute = 150; // Average speaking rate
    const baseDuration = (wordCount / wordsPerMinute) * 60;

    // Add pause time
    const periodCount = (script.match(/\./g) || []).length;
    const commaCount = (script.match(/,/g) || []).length;
    const colonCount = (script.match(/:/g) || []).length;
    const semicolonCount = (script.match(/;/g) || []).length;

    const totalPauseTime =
      (periodCount * pauseAfterPeriod) +
      (commaCount * pauseAfterComma) +
      (colonCount * pauseAfterColon) +
      (semicolonCount * pauseAfterSemicolon);

    const estimatedDuration = (baseDuration + totalPauseTime) / speed;

    console.log('✅ [Admin Voice Test] Audio generated successfully');
    console.log(`📊 [Admin Voice Test] Words: ${wordCount}, Est. duration: ${estimatedDuration.toFixed(1)}s`);

    return NextResponse.json({
      audioBase64: base64Audio,
      ssml,
      duration: estimatedDuration,
      settings: {
        voiceId,
        pauseAfterPeriod,
        pauseAfterComma,
        pauseAfterColon,
        pauseAfterSemicolon,
        speed,
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
        addBreathing,
        emphasisLevel
      }
    });

  } catch (error) {
    console.error('❌ [Admin Voice Test] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice audio' },
      { status: 500 }
    );
  }
}
