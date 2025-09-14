'use client'

import { AuthUser } from './auth';

export class AuthClient {
  private token: string | null = null;
  private user: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('medisync_token');
      const userStr = localStorage.getItem('medisync_user');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('medisync_user');
        }
      }

      // Verify token on startup
      if (this.token) {
        this.verifyToken();
      }
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.user);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.user));
  }

  // Store auth data
  private storeAuth(user: AuthUser, token: string) {
    this.user = user;
    this.token = token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('medisync_token', token);
      localStorage.setItem('medisync_user', JSON.stringify(user));
    }

    this.notifyListeners();
  }

  // Clear auth data
  private clearAuth() {
    this.user = null;
    this.token = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('medisync_token');
      localStorage.removeItem('medisync_user');
    }

    this.notifyListeners();
  }

  // Sign up
  async signUp(email: string, password: string): Promise<{ error?: string }> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Sign up failed' };
      }

      this.storeAuth(data.user, data.token);
      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Network error' };
    }
  }

  // Sign in
  async signInWithPassword(email: string, password: string): Promise<{ error?: string }> {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Sign in failed' };
      }

      this.storeAuth(data.user, data.token);
      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Network error' };
    }
  }

  // Sign out
  async signOut(): Promise<{ error?: string }> {
    this.clearAuth();
    return {};
  }

  // Get current user
  getUser(): AuthUser | null {
    return this.user;
  }

  // Get auth token
  getToken(): string | null {
    return this.token;
  }

  // Verify current token
  private async verifyToken() {
    if (!this.token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearAuth();
        return;
      }

      const data = await response.json();
      this.user = data.user;

      if (typeof window !== 'undefined') {
        localStorage.setItem('medisync_user', JSON.stringify(this.user));
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuth();
    }
  }

  // Make authenticated API calls
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`,
    };

    return fetch(url, { ...options, headers });
  }
}

// Create singleton instance
export const authClient = new AuthClient();

// Export auth object for compatibility with existing code
export const auth = {
  signUp: authClient.signUp.bind(authClient),
  signInWithPassword: authClient.signInWithPassword.bind(authClient),
  signOut: authClient.signOut.bind(authClient),
  onAuthStateChange: authClient.onAuthStateChange.bind(authClient),
  getUser: authClient.getUser.bind(authClient),
  getToken: authClient.getToken.bind(authClient),
};