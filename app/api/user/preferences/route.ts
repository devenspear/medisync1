import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database } from '@/lib/database';

// GET /api/user/preferences - Get user preferences
async function GET(request: NextRequest & { user: any }) {
  try {
    const user = await Database.findUserById(request.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ preferences: user.preferences });
  } catch (error) {
    console.error('Get user preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get user preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user preferences
async function PUT(request: NextRequest & { user: any }) {
  try {
    const preferences = await request.json();

    // Validate preferences structure
    const validPreferences = {
      default_duration: preferences.default_duration || 10,
      preferred_voice: preferences.preferred_voice || 'female-1',
      favorite_frequency: preferences.favorite_frequency || 'alpha'
    };

    const updatedUser = await Database.updateUser(request.user.id, {
      preferences: validPreferences
    });

    return NextResponse.json({
      success: true,
      preferences: updatedUser.preferences
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}

const authenticatedGET = withAuth(GET);
const authenticatedPUT = withAuth(PUT);

export { authenticatedGET as GET, authenticatedPUT as PUT };