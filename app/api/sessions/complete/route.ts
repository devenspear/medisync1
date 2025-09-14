import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { sql } from '@vercel/postgres';

// POST /api/sessions/complete - Track session completion
async function POST(request: NextRequest & { user: any }) {
  try {
    const {
      session_id,
      duration_completed, // minutes actually completed
      total_duration, // total session duration
      completion_percentage,
      frequency_used,
      voice_used
    } = await request.json();

    // Record session completion
    const result = await sql`
      INSERT INTO session_completions (
        user_id,
        session_id,
        duration_completed,
        total_duration,
        completion_percentage,
        frequency_used,
        voice_used,
        completed_at
      )
      VALUES (
        ${request.user.id},
        ${session_id || null},
        ${duration_completed},
        ${total_duration},
        ${completion_percentage},
        ${frequency_used},
        ${voice_used},
        NOW()
      )
      RETURNING *
    `;

    const completion = result.rows[0];

    // Update user stats if session was substantially completed (>50%)
    if (completion_percentage >= 0.5) {
      // Update total minutes and streak
      await fetch(`${request.url.replace('/sessions/complete', '/user/stats')}`, {
        method: 'POST',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          minutes_completed: Math.round(duration_completed),
          session_completed: completion_percentage >= 0.8 // Only count as "completed" if 80%+
        })
      });
    }

    return NextResponse.json({
      success: true,
      completion_id: completion.id,
      message: completion_percentage >= 0.8 ? 'Session completed!' : 'Session progress saved'
    });
  } catch (error) {
    console.error('Session completion tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track session completion' },
      { status: 500 }
    );
  }
}

// GET /api/sessions/complete - Get user's session history
async function GET(request: NextRequest & { user: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await sql`
      SELECT
        sc.*,
        s.name as session_name
      FROM session_completions sc
      LEFT JOIN session_configs s ON sc.session_id = s.id
      WHERE sc.user_id = ${request.user.id}
      ORDER BY sc.completed_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Calculate summary stats
    const statsResult = await sql`
      SELECT
        COUNT(*) as total_sessions,
        AVG(completion_percentage) as avg_completion_rate,
        SUM(duration_completed) as total_minutes,
        COUNT(CASE WHEN completion_percentage >= 0.8 THEN 1 END) as completed_sessions
      FROM session_completions
      WHERE user_id = ${request.user.id}
    `;

    const stats = statsResult.rows[0];

    return NextResponse.json({
      completions: result.rows,
      stats: {
        total_sessions: parseInt(stats.total_sessions),
        completion_rate: Math.round(parseFloat(stats.avg_completion_rate || '0') * 100),
        total_minutes: Math.round(parseFloat(stats.total_minutes || '0')),
        completed_sessions: parseInt(stats.completed_sessions)
      }
    });
  } catch (error) {
    console.error('Get session history error:', error);
    return NextResponse.json(
      { error: 'Failed to get session history' },
      { status: 500 }
    );
  }
}

const authenticatedPOST = withAuth(POST);
const authenticatedGET = withAuth(GET);

export { authenticatedPOST as POST, authenticatedGET as GET };