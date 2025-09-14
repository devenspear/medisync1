import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

// Middleware for API routes
export function withAuth(handler: Function) {
  return async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const user = await Auth.getUserFromToken(token);

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Add user to request
      req.user = user;

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}