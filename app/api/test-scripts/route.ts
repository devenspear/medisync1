import { NextRequest, NextResponse } from 'next/server'
import { createScriptGenerator } from '@/lib/scriptGenerator'

// Test endpoint for scripts - NO AUTHENTICATION for testing
export async function POST(request: NextRequest) {
  try {
    const { assessment, promptPrimer } = await request.json()

    console.log('🧪 Testing Scripts Generation...')
    console.log('Assessment:', assessment)
    console.log('Prompt Primer:', promptPrimer)

    const apiKey = process.env.OPENAI_API_KEY
    console.log('API Key exists:', !!apiKey)

    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not found in environment'
      }, { status: 500 })
    }

    // Generate script using the same logic as the main endpoint
    console.log('🔄 Generating new meditation script with master prompt template')
    const scriptGenerator = createScriptGenerator()
    const script = await scriptGenerator.generateScript(assessment, promptPrimer)

    console.log('✅ Script generated successfully!')
    console.log('Script preview:', {
      title: script.title,
      intro_length: script.intro_text.length,
      main_length: script.main_content.length,
      closing_length: script.closing_text.length,
      total_words: script.total_words
    })

    return NextResponse.json({
      script,
      cached: false,
      test_mode: true
    })

  } catch (error) {
    console.error('Test Script Generation Error:', error)
    return NextResponse.json(
      { error: `Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}