import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Delete all cached scripts
    const result = await sql`DELETE FROM cached_meditation_scripts`;

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.rowCount} cached scripts`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing script cache:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await sql`
      SELECT cache_key, goal, duration, hit_count, created_at, last_accessed,
             LENGTH(intro_text) as intro_length,
             LENGTH(main_content) as main_length,
             LENGTH(closing_text) as closing_length
      FROM cached_meditation_scripts
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      count: result.rowCount,
      scripts: result.rows
    });
  } catch (error) {
    console.error('Error listing cached scripts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
