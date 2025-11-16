import { NextResponse } from 'next/server';
import packageJson from '@/package.json';

export async function GET() {
  const version = packageJson.version;
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev';
  const buildTime = process.env.VERCEL_GIT_COMMIT_DATE || new Date().toISOString();
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';

  return NextResponse.json({
    version,
    commit: commitSha,
    buildTime,
    env,
    fullVersion: `v${version}-${commitSha}`
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }
  });
}
