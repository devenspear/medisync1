import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database } from '@/lib/database';
import { sql } from '@vercel/postgres';

// GET /api/user/limits - Check user's current usage against limits
async function GET(request: NextRequest & { user: any }) {
  try {
    const user = await Database.findUserById(request.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPremium = user.subscription_tier === 'premium';

    // Get today's session count
    const today = new Date().toISOString().split('T')[0];
    const todaySessionsResult = await sql`
      SELECT COUNT(*) as session_count
      FROM session_completions
      WHERE user_id = ${request.user.id}
        AND DATE(completed_at) = ${today}
    `;

    const todaySessions = parseInt(todaySessionsResult.rows[0].session_count);

    // Get saved sessions count
    const savedSessions = await Database.getUserSessionConfigs(request.user.id);
    const savedSessionsCount = savedSessions.length;

    // Define limits based on subscription
    const limits = {
      daily_sessions: isPremium ? null : 3, // null = unlimited
      max_duration: isPremium ? 30 : 5, // minutes
      max_saved_sessions: isPremium ? null : 5, // null = unlimited
      voice_options: isPremium ? 'all' : 'limited', // 2 voices for free
      has_watermark: !isPremium,
      priority_processing: isPremium
    };

    // Calculate current usage
    const usage = {
      daily_sessions_used: todaySessions,
      saved_sessions_used: savedSessionsCount,
      subscription_tier: user.subscription_tier
    };

    // Check if user has hit limits
    const limitations = {
      daily_sessions_exceeded: limits.daily_sessions !== null && todaySessions >= limits.daily_sessions,
      max_saved_sessions_exceeded: limits.max_saved_sessions !== null && savedSessionsCount >= limits.max_saved_sessions,
      can_create_session: limits.daily_sessions === null || todaySessions < limits.daily_sessions,
      can_save_session: limits.max_saved_sessions === null || savedSessionsCount < limits.max_saved_sessions
    };

    return NextResponse.json({
      limits,
      usage,
      limitations,
      is_premium: isPremium
    });
  } catch (error) {
    console.error('Check user limits error:', error);
    return NextResponse.json(
      { error: 'Failed to check user limits' },
      { status: 500 }
    );
  }
}

// POST /api/user/limits/check-session - Check if user can start a session
async function POST(request: NextRequest & { user: any }) {
  try {
    const { duration } = await request.json();

    const user = await Database.findUserById(request.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPremium = user.subscription_tier === 'premium';

    // Get today's session count
    const today = new Date().toISOString().split('T')[0];
    const todaySessionsResult = await sql`
      SELECT COUNT(*) as session_count
      FROM session_completions
      WHERE user_id = ${request.user.id}
        AND DATE(completed_at) = ${today}
    `;

    const todaySessions = parseInt(todaySessionsResult.rows[0].session_count);

    // Check daily limit
    if (!isPremium && todaySessions >= 3) {
      return NextResponse.json({
        allowed: false,
        reason: 'daily_limit_exceeded',
        message: 'You have reached your daily limit of 3 sessions. Upgrade to Premium for unlimited sessions.',
        upgrade_required: true
      });
    }

    // Check duration limit
    if (!isPremium && duration > 5) {
      return NextResponse.json({
        allowed: false,
        reason: 'duration_limit_exceeded',
        message: 'Free accounts are limited to 5-minute sessions. Upgrade to Premium for sessions up to 30 minutes.',
        upgrade_required: true,
        max_duration: 5
      });
    }

    return NextResponse.json({
      allowed: true,
      remaining_sessions: isPremium ? null : (3 - todaySessions),
      max_duration: isPremium ? 30 : 5
    });
  } catch (error) {
    console.error('Check session limits error:', error);
    return NextResponse.json(
      { error: 'Failed to check session limits' },
      { status: 500 }
    );
  }
}

const authenticatedGET = withAuth(GET);
const authenticatedPOST = withAuth(POST);

export { authenticatedGET as GET, authenticatedPOST as POST };