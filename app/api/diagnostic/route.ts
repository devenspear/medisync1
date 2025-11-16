import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    },
    postgres: {
      postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
      postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 20) || 'not set'
    }
  });
}
