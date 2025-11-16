/**
 * Environment variable validation and helper utilities
 * Validates required environment variables on app startup
 */

export interface EnvironmentConfig {
  // Required
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;

  // Optional - OpenAI
  OPENAI_API_KEY?: string;

  // Optional - ElevenLabs
  ELEVENLABS_API_KEY?: string;
  NEXT_PUBLIC_ELEVENLABS_API_KEY?: string;

  // Optional - Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;

  // Optional - Vercel Postgres
  POSTGRES_URL?: string;
}

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export function validateEnv(): EnvironmentConfig {
  const required = {
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }

  return {
    JWT_SECRET: required.JWT_SECRET!,
    NEXT_PUBLIC_APP_URL: required.NEXT_PUBLIC_APP_URL!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    NEXT_PUBLIC_ELEVENLABS_API_KEY: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };
}

/**
 * Get feature flags based on available API keys
 */
export function getFeatureFlags() {
  return {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
    hasStripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    hasDatabase: !!process.env.POSTGRES_URL,
    isDemoMode: !process.env.OPENAI_API_KEY || !process.env.ELEVENLABS_API_KEY,
  };
}

/**
 * Log feature availability on startup (safe for production)
 */
export function logFeatureStatus() {
  const flags = getFeatureFlags();

  console.log('🚀 StillCaster Feature Status:');
  console.log(`  ✓ JWT Authentication: enabled`);
  console.log(`  ${flags.hasOpenAI ? '✓' : '○'} OpenAI Script Generation: ${flags.hasOpenAI ? 'enabled' : 'disabled (demo mode)'}`);
  console.log(`  ${flags.hasElevenLabs ? '✓' : '○'} ElevenLabs Voice/Music: ${flags.hasElevenLabs ? 'enabled' : 'disabled (fallback mode)'}`);
  console.log(`  ${flags.hasStripe ? '✓' : '○'} Stripe Payments: ${flags.hasStripe ? 'enabled' : 'disabled'}`);
  console.log(`  ${flags.hasDatabase ? '✓' : '○'} Database: ${flags.hasDatabase ? 'connected' : 'not configured'}`);

  if (flags.isDemoMode) {
    console.log('⚠️  Running in DEMO MODE - some features will use fallbacks');
  }
}
