import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database } from '@/lib/database';

// DELETE /api/sessions/[id] - Delete session
async function DELETE(
  request: NextRequest & { user: any },
  { params }: { params: { id: string } }
) {
  try {
    await Database.deleteSessionConfig(params.id, request.user.id);
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