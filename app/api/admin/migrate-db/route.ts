import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [DB Migration] Starting database migration...');

    // Add first_name and phonetic_pronunciation columns if they don't exist
    await sql`
      DO $$
      BEGIN
        -- Add first_name column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='first_name'
        ) THEN
          ALTER TABLE users ADD COLUMN first_name TEXT;
          RAISE NOTICE 'Added first_name column';
        ELSE
          RAISE NOTICE 'first_name column already exists';
        END IF;

        -- Add phonetic_pronunciation column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='phonetic_pronunciation'
        ) THEN
          ALTER TABLE users ADD COLUMN phonetic_pronunciation TEXT;
          RAISE NOTICE 'Added phonetic_pronunciation column';
        ELSE
          RAISE NOTICE 'phonetic_pronunciation column already exists';
        END IF;
      END $$;
    `;

    console.log('✅ [DB Migration] Database migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    });

  } catch (error) {
    console.error('❌ [DB Migration] Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
