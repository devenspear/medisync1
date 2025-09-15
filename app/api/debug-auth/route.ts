import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to trace 401 authentication issues
export async function GET(request: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    headers: Object.fromEntries(request.headers.entries()),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY_SET: !!process.env.ELEVENLABS_API_KEY,
    },
    vercel: {
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
    }
  };

  console.log('🔍 DEBUG AUTH REQUEST:', JSON.stringify(debugInfo, null, 2));

  return NextResponse.json({
    status: 'debug',
    message: 'Authentication debug endpoint - no auth required',
    debug: debugInfo
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
        OPENAI_API_KEY_SET: !!process.env.OPENAI_API_KEY,
        ELEVENLABS_API_KEY_SET: !!process.env.ELEVENLABS_API_KEY,
      }
    };

    console.log('🔍 DEBUG AUTH POST:', JSON.stringify(debugInfo, null, 2));

    // Test JWT token validation if provided
    let tokenValidation = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = await import('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

        const decoded = jwt.verify(token, secret);
        tokenValidation = {
          valid: true,
          decoded: decoded,
          token_length: token.length,
          token_preview: token.substring(0, 20) + '...'
        };
      } catch (error) {
        tokenValidation = {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          token_length: authHeader.substring(7).length
        };
      }
    }

    return NextResponse.json({
      status: 'debug',
      message: 'Authentication debug endpoint POST - no auth required',
      debug: debugInfo,
      token_validation: tokenValidation
    });
  } catch (error) {
    console.error('🚨 DEBUG AUTH ERROR:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}