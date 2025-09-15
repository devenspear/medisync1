import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint - NO AUTHENTICATION for testing
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    console.log('🧪 Testing OpenAI API...')
    console.log('Prompt:', prompt)

    const apiKey = process.env.OPENAI_API_KEY
    console.log('API Key exists:', !!apiKey)
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 20) + '...' : 'NONE')

    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not found in environment'
      }, { status: 500 })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    console.log('OpenAI Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API Error:', response.status, errorText)
      return NextResponse.json({
        error: `OpenAI API error: ${response.status} - ${errorText}`
      }, { status: response.status })
    }

    const data = await response.json()
    const result = data.choices[0].message.content

    console.log('✅ OpenAI Success!')
    console.log('Result:', result)

    return NextResponse.json({
      result,
      usage: data.usage,
      model: data.model
    })

  } catch (error) {
    console.error('Test OpenAI Error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}