import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/lib/auth';
import { Database } from '@/lib/database';

// DELETE /api/sessions/[id] - Delete session
async function DELETE(
  request: NextRequest & { user: AuthUser },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await Database.deleteSessionConfig(id, request.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

const authenticatedDELETE = withAuth(DELETE);
export { authenticatedDELETE as DELETE };