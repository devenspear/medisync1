import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { Database, type User } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  subscription_tier: 'free' | 'premium';
  total_minutes: number;
  current_streak: number;
  preferences: {
    default_duration: number;
    preferred_voice: string;
    favorite_frequency: string;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export class Auth {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): { id: string; email: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    } catch (error) {
      return null;
    }
  }

  // Convert User to AuthUser (remove sensitive data)
  static toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      subscription_tier: user.subscription_tier,
      total_minutes: user.total_minutes,
      current_streak: user.current_streak,
      preferences: user.preferences
    };
  }

  // Sign up new user
  static async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Check if user already exists
      const existingUser = await Database.findUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'User already exists with this email' };
      }

      // Hash password and create user
      const passwordHash = await this.hashPassword(password);
      const user = await Database.createUser(email, passwordHash);

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.toAuthUser(user),
        token
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Find user
      const user = await Database.findUserByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check password
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: this.toAuthUser(user),
        token
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  }

  // Get user from token
  static async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) return null;

      const user = await Database.findUserById(decoded.id);
      if (!user) return null;

      return this.toAuthUser(user);
    } catch (error) {
      console.error('Get user from token error:', error);
      return null;
    }
  }
}

// Simple middleware for App Router API routes
export function withAuth(handler: any) {
  return async (request: NextRequest, ...args: any[]) => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      hasAuthHeader: !!request.headers.get('authorization'),
      authHeaderPreview: request.headers.get('authorization')?.substring(0, 20) + '...',
      allHeaders: Object.fromEntries(request.headers.entries()),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
      }
    };

    console.log('🔒 AUTH MIDDLEWARE START:', JSON.stringify(debugInfo, null, 2));

    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('🚨 AUTH FAILED: No valid authorization header');
        console.log('  - Auth header exists:', !!authHeader);
        console.log('  - Auth header value:', authHeader);
        console.log('  - All headers:', Object.fromEntries(request.headers.entries()));

        return NextResponse.json({
          error: 'No token provided',
          debug: {
            authHeaderExists: !!authHeader,
            authHeaderValue: authHeader,
            expectedFormat: 'Bearer <token>'
          }
        }, { status: 401 });
      }

      const token = authHeader.substring(7);
      console.log('🔑 TOKEN EXTRACTED:', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
        fullToken: token // REMOVE THIS IN PRODUCTION
      });

      const user = await Auth.getUserFromToken(token);

      if (!user) {
        console.log('🚨 AUTH FAILED: Invalid token or user not found');
        console.log('  - Token:', token);

        // Try to decode the token to see what's wrong
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          console.log('  - Token decodes successfully:', decoded);
          console.log('  - But user lookup failed');
        } catch (jwtError) {
          console.log('  - Token decode failed:', jwtError instanceof Error ? jwtError.message : jwtError);
        }

        return NextResponse.json({
          error: 'Invalid token',
          debug: {
            tokenLength: token.length,
            tokenPreview: token.substring(0, 20) + '...'
          }
        }, { status: 401 });
      }

      console.log('✅ AUTH SUCCESS:', {
        userId: user.id,
        userEmail: user.email
      });

      // Add user to request
      (request as NextRequest & { user: AuthUser }).user = user;

      return handler(request as NextRequest & { user: AuthUser }, ...args);
    } catch (error) {
      console.error('🚨 AUTH MIDDLEWARE ERROR:', error);
      console.error('🚨 ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');

      return NextResponse.json({
        error: 'Authentication failed',
        debug: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error
        }
      }, { status: 500 });
    }
  };
}