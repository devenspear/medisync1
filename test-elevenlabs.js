const { createVoiceSynthesis } = require('./lib/voiceSynthesis.ts')

// Set the API key in environment
process.env.ELEVENLABS_API_KEY = 'sk_5c809550e2fbf5d2a3805210a157df16681cfb018206bfb9'

async function testElevenLabsAPI() {
  try {
    console.log('Testing ElevenLabs API...')
    const voiceSynthesis = createVoiceSynthesis()

    // Test if we can get available voices
    console.log('Available voices:', voiceSynthesis.getAvailableVoices())

    // Test voice synthesis
    console.log('Testing voice synthesis...')
    const audioBuffer = await voiceSynthesis.synthesizeText(
      'Welcome to your meditation session',
      'female-1'
    )

    console.log('✅ ElevenLabs API is working! Audio buffer size:', audioBuffer.byteLength)

  } catch (error) {
    console.error('❌ ElevenLabs API test failed:', error.message)
  }
}

testElevenLabsAPI()