import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database } from '@/lib/database';

// GET /api/user/stats - Get user statistics
async function GET(request: NextRequest & { user: any }) {
  try {
    const user = await Database.findUserById(request.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get session history for additional stats
    const sessions = await Database.getUserSessionConfigs(request.user.id);

    // Calculate additional stats
    const totalSavedSessions = sessions.length;
    const averageSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
      : 0;

    // Get most used frequency
    const frequencyCount = sessions.reduce((acc, session) => {
      acc[session.frequency] = (acc[session.frequency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedFrequency = Object.entries(frequencyCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'alpha';

    // Get subscription status
    const subscription = await Database.findSubscriptionByUserId(request.user.id);

    const stats = {
      total_minutes: user.total_minutes,
      current_streak: user.current_streak,
      total_saved_sessions: totalSavedSessions,
      average_session_duration: Math.round(averageSessionDuration),
      most_used_frequency: mostUsedFrequency,
      subscription_status: subscription ? subscription.status : 'none',
      is_premium: subscription && subscription.status === 'active',
      created_at: user.created_at,
      preferences: user.preferences
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get user stats' },
      { status: 500 }
    );
  }
}

// POST /api/user/stats - Update user statistics
async function POST(request: NextRequest & { user: any }) {
  try {
    const { minutes_completed, session_completed } = await request.json();

    const user = await Database.findUserById(request.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate new streak
    const lastUpdate = new Date(user.updated_at);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    let newStreak = user.current_streak;
    if (session_completed) {
      if (lastUpdate.toDateString() === yesterday.toDateString()) {
        // Continue streak
        newStreak = user.current_streak + 1;
      } else if (lastUpdate.toDateString() !== today.toDateString()) {
        // Reset streak if more than a day gap
        newStreak = 1;
      }
      // If updated today already, don't change streak
    }

    const updatedUser = await Database.updateUser(request.user.id, {
      total_minutes: user.total_minutes + (minutes_completed || 0),
      current_streak: newStreak
    });

    return NextResponse.json({
      success: true,
      stats: {
        total_minutes: updatedUser.total_minutes,
        current_streak: updatedUser.current_streak
      }
    });
  } catch (error) {
    console.error('Update user stats error:', error);
    return NextResponse.json(
      { error: 'Failed to update user stats' },
      { status: 500 }
    );
  }
}

const authenticatedGET = withAuth(GET);
const authenticatedPOST = withAuth(POST);

export { authenticatedGET as GET, authenticatedPOST as POST };