#!/bin/bash

# Extract API key from .env.local
ELEVENLABS_API_KEY=$(grep "^ELEVENLABS_API_KEY=" .env.local | cut -d '=' -f2)

echo "🧪 Testing ElevenLabs voice: YRROo374F8CyWnUy6mdE (Kelli-2)"
echo "API Key: ${ELEVENLABS_API_KEY:0:10}..."

curl -X POST 'https://api.elevenlabs.io/v1/text-to-speech/YRROo374F8CyWnUy6mdE' \
  -H 'Accept: audio/mpeg' \
  -H 'Content-Type: application/json' \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -d '{"text":"Welcome to your meditation session. This is a test of the new Kelli voice.","model_id":"eleven_multilingual_v2","voice_settings":{"stability":0.75,"similarity_boost":0.8}}' \
  --output /tmp/kelli-2-test.mp3 \
  -w '\n\nHTTP Status: %{http_code}\nSize: %{size_download} bytes\n'

if [ $? -eq 0 ]; then
  FILE_SIZE=$(stat -f%z /tmp/kelli-2-test.mp3 2>/dev/null || stat -c%s /tmp/kelli-2-test.mp3 2>/dev/null)
  echo "✅ Voice synthesis successful!"
  echo "Audio file: /tmp/kelli-2-test.mp3"
  echo "File size: $FILE_SIZE bytes ($(expr $FILE_SIZE / 1024) KB)"
  echo ""
  echo "Play it with: open /tmp/kelli-2-test.mp3"
else
  echo "❌ Voice synthesis failed"
  exit 1
fi
