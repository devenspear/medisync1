import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database } from '@/lib/database';

// GET /api/sessions - Get user's saved sessions
async function GET(request: NextRequest & { user: any }) {
  try {
    const sessions = await Database.getUserSessionConfigs(request.user.id);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
async function POST(request: NextRequest & { user: any }) {
  try {
    const sessionData = await request.json();

    const session = await Database.createSessionConfig({
      user_id: request.user.id,
      name: sessionData.name,
      description: sessionData.description,
      duration: sessionData.duration,
      frequency: sessionData.frequency,
      voice_id: sessionData.voice_id,
      layers: sessionData.layers,
      assessment_data: sessionData.assessment_data
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Apply auth middleware
const authenticatedGET = withAuth(GET);
const authenticatedPOST = withAuth(POST);

export { authenticatedGET as GET, authenticatedPOST as POST };