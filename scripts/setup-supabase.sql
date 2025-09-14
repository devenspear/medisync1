-- =====================================================
-- MediSync Supabase Database Setup Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  total_minutes INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "default_duration": 10,
    "preferred_voice": "female-1",
    "favorite_frequency": "alpha"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create session_configs table (if not exists)
CREATE TABLE IF NOT EXISTS session_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('delta', 'theta', 'alpha', 'beta', 'gamma')),
  voice_id TEXT NOT NULL,
  layers JSONB NOT NULL DEFAULT '{
    "binaural_volume": 0.6,
    "music_volume": 0.4,
    "voice_volume": 0.8,
    "music_type": "ambient"
  }'::jsonb,
  assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create meditation_scripts table (if not exists)
CREATE TABLE IF NOT EXISTS meditation_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES session_configs(id) ON DELETE CASCADE NOT NULL,
  intro_text TEXT NOT NULL,
  main_content TEXT NOT NULL,
  closing_text TEXT NOT NULL,
  total_words INTEGER NOT NULL,
  estimated_duration INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS session_configs_user_id_idx ON session_configs(user_id);
CREATE INDEX IF NOT EXISTS session_configs_created_at_idx ON session_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS meditation_scripts_session_id_idx ON meditation_scripts(session_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_scripts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own session configs" ON session_configs;
DROP POLICY IF EXISTS "Users can create own session configs" ON session_configs;
DROP POLICY IF EXISTS "Users can update own session configs" ON session_configs;
DROP POLICY IF EXISTS "Users can delete own session configs" ON session_configs;
DROP POLICY IF EXISTS "Users can view scripts for their sessions" ON meditation_scripts;
DROP POLICY IF EXISTS "Users can create scripts for their sessions" ON meditation_scripts;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Session configs policies
CREATE POLICY "Users can view own session configs" ON session_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own session configs" ON session_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session configs" ON session_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session configs" ON session_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Meditation scripts policies
CREATE POLICY "Users can view scripts for their sessions" ON meditation_scripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_configs
      WHERE session_configs.id = meditation_scripts.session_id
      AND session_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scripts for their sessions" ON meditation_scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_configs
      WHERE session_configs.id = meditation_scripts.session_id
      AND session_configs.user_id = auth.uid()
    )
  );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, subscription_tier, total_minutes, current_streak, preferences)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    0,
    0,
    '{
      "default_duration": 10,
      "preferred_voice": "female-1",
      "favorite_frequency": "alpha"
    }'::jsonb
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Error creating profile for user %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Drop existing updated_at function and trigger if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a simple ping function for testing RPC
CREATE OR REPLACE FUNCTION ping()
RETURNS TEXT AS $$
BEGIN
  RETURN 'pong';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ping() TO anon, authenticated;

-- Show setup completion message
DO $$
BEGIN
  RAISE NOTICE '✅ MediSync database setup completed successfully!';
  RAISE NOTICE '📊 Tables created: profiles, session_configs, meditation_scripts';
  RAISE NOTICE '🔐 Row Level Security enabled with proper policies';
  RAISE NOTICE '⚡ Triggers configured for automatic profile creation';
  RAISE NOTICE '🧪 Test functions available for debugging';
END $$;