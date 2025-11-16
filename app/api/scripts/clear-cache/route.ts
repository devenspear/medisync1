import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';

// DELETE /api/scripts/clear-cache - Clear all cached meditation scripts
export async function DELETE(request: NextRequest) {
  try {
    // Clear all cached scripts
    const result = await sql`
      DELETE FROM cached_meditation_scripts
    `;

    console.log('✅ Cleared meditation script cache');

    return NextResponse.json({
      success: true,
      message: 'Meditation script cache cleared successfully',
      deleted_count: result.rowCount || 0
    });
  } catch (error) {
    console.error('Failed to clear script cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear script cache' },
      { status: 500 }
    );
  }
}
