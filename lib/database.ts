import { sql } from '@vercel/postgres';

// Database types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  subscription_tier: 'free' | 'premium';
  total_minutes: number;
  current_streak: number;
  preferences: {
    default_duration: number;
    preferred_voice: string;
    favorite_frequency: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface SessionConfig {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration: number;
  frequency: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
  voice_id: string;
  layers: {
    binaural_volume: number;
    music_volume: number;
    voice_volume: number;
    music_type: string;
  };
  assessment_data: {
    goal: string;
    currentState: string;
    duration: number;
    experience: string;
    timeOfDay: string;
    challenges?: string;
    meditationStyle?: string;
    environment?: string;
  };
  created_at: Date;
}

export interface MeditationScript {
  id: string;
  session_id: string;
  intro_text: string;
  main_content: string;
  closing_text: string;
  total_words: number;
  estimated_duration: number;
  generated_at: Date;
}

// Database operations
export class Database {
  // User operations
  static async createUser(email: string, passwordHash: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, password_hash, subscription_tier, total_minutes, current_streak, preferences)
      VALUES (${email}, ${passwordHash}, 'free', 0, 0, ${JSON.stringify({
        default_duration: 10,
        preferred_voice: 'female-1',
        favorite_frequency: 'alpha'
      })})
      RETURNING *
    `;
    return result.rows[0] as User;
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result.rows[0] as User || null;
  }

  static async findUserById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result.rows[0] as User || null;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const result = await sql.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0] as User;
  }

  // Session config operations
  static async createSessionConfig(sessionConfig: Omit<SessionConfig, 'id' | 'created_at'>): Promise<SessionConfig> {
    const result = await sql`
      INSERT INTO session_configs (user_id, name, description, duration, frequency, voice_id, layers, assessment_data)
      VALUES (
        ${sessionConfig.user_id},
        ${sessionConfig.name},
        ${sessionConfig.description || null},
        ${sessionConfig.duration},
        ${sessionConfig.frequency},
        ${sessionConfig.voice_id},
        ${JSON.stringify(sessionConfig.layers)},
        ${JSON.stringify(sessionConfig.assessment_data)}
      )
      RETURNING *
    `;
    return result.rows[0] as SessionConfig;
  }

  static async getUserSessionConfigs(userId: string): Promise<SessionConfig[]> {
    const result = await sql`
      SELECT * FROM session_configs
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return result.rows as SessionConfig[];
  }

  static async deleteSessionConfig(id: string, userId: string): Promise<void> {
    await sql`
      DELETE FROM session_configs
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }

  // Meditation script operations
  static async saveScript(script: Omit<MeditationScript, 'id' | 'generated_at'>): Promise<MeditationScript> {
    const result = await sql`
      INSERT INTO meditation_scripts (session_id, intro_text, main_content, closing_text, total_words, estimated_duration)
      VALUES (
        ${script.session_id},
        ${script.intro_text},
        ${script.main_content},
        ${script.closing_text},
        ${script.total_words},
        ${script.estimated_duration}
      )
      RETURNING *
    `;
    return result.rows[0] as MeditationScript;
  }

  static async getScriptBySessionId(sessionId: string): Promise<MeditationScript | null> {
    const result = await sql`
      SELECT * FROM meditation_scripts WHERE session_id = ${sessionId}
    `;
    return result.rows[0] as MeditationScript || null;
  }

  // Database initialization
  static async initializeDatabase(): Promise<void> {
    try {
      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
          total_minutes INTEGER DEFAULT 0,
          current_streak INTEGER DEFAULT 0,
          preferences JSONB DEFAULT '{"default_duration": 10, "preferred_voice": "female-1", "favorite_frequency": "alpha"}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create session_configs table
      await sql`
        CREATE TABLE IF NOT EXISTS session_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          frequency TEXT NOT NULL CHECK (frequency IN ('delta', 'theta', 'alpha', 'beta', 'gamma')),
          voice_id TEXT NOT NULL,
          layers JSONB NOT NULL DEFAULT '{"binaural_volume": 0.6, "music_volume": 0.4, "voice_volume": 0.8, "music_type": "ambient"}'::jsonb,
          assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create meditation_scripts table
      await sql`
        CREATE TABLE IF NOT EXISTS meditation_scripts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES session_configs(id) ON DELETE CASCADE,
          intro_text TEXT NOT NULL,
          main_content TEXT NOT NULL,
          closing_text TEXT NOT NULL,
          total_words INTEGER NOT NULL,
          estimated_duration INTEGER NOT NULL,
          generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_session_configs_user_id ON session_configs(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_session_configs_created_at ON session_configs(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_meditation_scripts_session_id ON meditation_scripts(session_id)`;

      // Create updated_at trigger function
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `;

      // Create trigger for users
      await sql`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      `;
      await sql`
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      // Create session_completions table for tracking
      await sql`
        CREATE TABLE IF NOT EXISTS session_completions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_id UUID REFERENCES session_configs(id) ON DELETE SET NULL,
          duration_completed INTEGER NOT NULL,
          total_duration INTEGER NOT NULL,
          completion_percentage DECIMAL(3,2) NOT NULL,
          frequency_used TEXT NOT NULL,
          voice_used TEXT NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create cached_meditation_scripts table for performance
      await sql`
        CREATE TABLE IF NOT EXISTS cached_meditation_scripts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          cache_key TEXT UNIQUE NOT NULL,
          goal TEXT NOT NULL,
          current_state TEXT NOT NULL,
          duration INTEGER NOT NULL,
          experience TEXT NOT NULL,
          time_of_day TEXT NOT NULL,
          intro_text TEXT NOT NULL,
          main_content TEXT NOT NULL,
          closing_text TEXT NOT NULL,
          total_words INTEGER NOT NULL,
          estimated_duration INTEGER NOT NULL,
          hit_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create additional indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_session_completions_user_id ON session_completions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_session_completions_completed_at ON session_completions(completed_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_cached_scripts_cache_key ON cached_meditation_scripts(cache_key)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_cached_scripts_hit_count ON cached_meditation_scripts(hit_count DESC)`;

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
}

export { sql };