import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthUser } from '@/lib/auth';
import { Database } from '@/lib/database';

async function handler(req: NextRequest & { user: AuthUser }) {
  try {
    const user = await Database.findUserByEmail(req.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = await Database.findSubscriptionByUserId(user.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Error fetching subscription' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
