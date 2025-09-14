import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function POST(request: NextRequest) {
  return initializeDb();
}

export async function GET(request: NextRequest) {
  // Allow GET requests to make it easier to initialize
  return initializeDb();
}

async function initializeDb() {
  try {
    await Database.initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}