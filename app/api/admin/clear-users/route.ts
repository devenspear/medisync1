import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Delete all users (cascades to sessions and subscriptions)
    const result = await sql`DELETE FROM users`;

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.rowCount} users`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await sql`SELECT email, created_at FROM users ORDER BY created_at DESC`;

    return NextResponse.json({
      count: result.rowCount,
      users: result.rows
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
