import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth, AuthUser } from '@/lib/auth';
import { Database } from '@/lib/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function handler(request: NextRequest & { user: AuthUser }) {
  try {
    const { firstName } = await request.json();

    if (!firstName || firstName.trim().length === 0) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Generating phonetic pronunciation for: ${firstName}`);

    // Use OpenAI to generate phonetic pronunciation
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert phonetic pronunciation assistant. Given a name, provide a simple, clear phonetic spelling that would help a text-to-speech system pronounce it correctly.

Rules:
1. Use simple, common English words and phonetic patterns
2. Separate syllables with hyphens
3. Use ALL CAPS for stressed syllables
4. Keep it short and intuitive
5. Only return the phonetic spelling, nothing else

Examples:
- "John" → "JAHN"
- "Deven" → "DEV-in"
- "Siobhan" → "shi-VAWN"
- "Xavier" → "ZAY-vee-er"
- "Saoirse" → "SER-sha"
- "William" → "WIL-yum"
- "Katherine" → "KATH-rin"
- "Michael" → "MY-kul"`
        },
        {
          role: 'user',
          content: `Generate phonetic pronunciation for the name: ${firstName.trim()}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const phoneticPronunciation = completion.choices[0]?.message?.content?.trim() || firstName;

    console.log(`✅ Generated phonetic: ${phoneticPronunciation}`);

    // Update user's phonetic pronunciation in database
    const userId = request.user.id;
    await Database.updateUser(userId, { phonetic_pronunciation: phoneticPronunciation });

    return NextResponse.json({
      phonetic_pronunciation: phoneticPronunciation
    });

  } catch (error) {
    console.error('Phonetic generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate phonetic pronunciation' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
