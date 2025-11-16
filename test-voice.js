// Quick test script to verify ElevenLabs voice ID
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const VOICE_ID = 'YRROo374F8CyWnUy6mdE'; // Kelli-2
const API_KEY = process.env.ELEVENLABS_API_KEY;

async function testVoice() {
  console.log('🧪 Testing ElevenLabs voice:', VOICE_ID);
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

  if (!API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not found in .env.local');
    process.exit(1);
  }

  const testText = "Welcome to your meditation session. This is a test of the new Kelli voice.";

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: testText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      process.exit(1);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioSize = arrayBuffer.byteLength;

    console.log('✅ Voice synthesis successful!');
    console.log('Audio size:', audioSize, 'bytes');
    console.log('Audio size:', Math.round(audioSize / 1024), 'KB');

    // Write to file for testing
    const fs = require('fs');
    fs.writeFileSync('/tmp/kelli-2-test.mp3', Buffer.from(arrayBuffer));
    console.log('✅ Audio saved to /tmp/kelli-2-test.mp3');
    console.log('You can play it with: open /tmp/kelli-2-test.mp3');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testVoice();
