import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/env';

/**
 * Health check endpoint
 * GET /api/health
 *
 * Returns system health and feature availability status
 */
export async function GET() {
  try {
    const features = getFeatureFlags();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      features: {
        authentication: true,
        scriptGeneration: features.hasOpenAI ? 'available' : 'demo_mode',
        voiceSynthesis: features.hasElevenLabs ? 'available' : 'fallback_mode',
        musicGeneration: features.hasElevenLabs ? 'available' : 'fallback_mode',
        payments: features.hasStripe ? 'available' : 'disabled',
        database: features.hasDatabase ? 'connected' : 'not_configured'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
