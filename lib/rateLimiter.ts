// Enterprise-grade rate limiting for API endpoints
import { NextRequest } from 'next/server';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Simple in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitInfo>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limiting configurations by endpoint
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/scripts': { maxRequests: 10, windowMs: 60000 }, // 10 script generations per minute
  '/api/auth/signin': { maxRequests: 5, windowMs: 60000 }, // 5 login attempts per minute
  '/api/auth/signup': { maxRequests: 3, windowMs: 60000 }, // 3 signups per minute
  '/api/voice/preview': { maxRequests: 20, windowMs: 60000 }, // 20 voice previews per minute
  default: { maxRequests: 30, windowMs: 60000 } // 30 requests per minute for other endpoints
};

export function getRateLimitKey(request: NextRequest, identifier?: string): string {
  // Use IP address as default identifier
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // If user is authenticated, use user ID for more accurate limiting
  if (identifier) {
    return `${identifier}:${request.nextUrl.pathname}`;
  }

  return `${ip}:${request.nextUrl.pathname}`;
}

export function checkRateLimit(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  // Clean up expired entries
  if (limit && now > limit.resetTime) {
    rateLimitStore.delete(key);
  }

  const currentLimit = rateLimitStore.get(key);

  if (!currentLimit) {
    // First request in window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  if (currentLimit.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentLimit.resetTime
    };
  }

  // Increment count
  currentLimit.count++;
  rateLimitStore.set(key, currentLimit);

  return {
    allowed: true,
    remaining: config.maxRequests - currentLimit.count,
    resetTime: currentLimit.resetTime
  };
}

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  return RATE_LIMITS[pathname] || RATE_LIMITS.default;
}