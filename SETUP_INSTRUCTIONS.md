# 🚀 MediSync Supabase Configuration - FINAL STEPS

## ✅ Completed:
- Environment variables configured
- Supabase connection tested
- App running on http://localhost:3001

## 📋 Next Steps - Complete these 3 steps:

### 1. Create Database Tables
Go to: https://supabase.com/dashboard/project/yvkjfzxxzntbgzflgqxn/sql

1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. **Copy and paste this entire SQL script:**

\`\`\`sql
-- MediSync Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table
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

-- Create session_configs table
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

-- Create meditation_scripts table
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


4. Click **"RUN"** to execute the SQL
5. You should see success messages for table creation

### 2. Configure Authentication
Go to: https://supabase.com/dashboard/project/yvkjfzxxzntbgzflgqxn/auth/settings

1. Scroll to **"Site URL"** section
2. Set **Site URL** to: \`http://localhost:3001\`
3. Scroll to **"Redirect URLs"** section
4. Add: \`http://localhost:3001/**\`
5. Click **"Save"**

### 3. Test the Application
1. Go to http://localhost:3001
2. You should now see a **login form** (not demo mode)
3. Click **"Sign Up"** and create a test account
4. Verify you can log in and access the dashboard

## 🎉 Success Indicators:
- ✅ No more "Demo Mode" banner
- ✅ Login/signup form appears
- ✅ Can create account and log in
- ✅ Dashboard shows your email
- ✅ Can start assessment and create sessions

## 🔧 Troubleshooting:
- If you see demo mode, check environment variables are saved
- If login fails, check authentication redirect URLs
- If database errors, verify SQL script ran successfully

## 🚀 Optional Enhancements:
Add these API keys to `.env.local` for full functionality:
- OpenAI API key for better meditation scripts
- ElevenLabs API key for high-quality voice synthesis

The app works great without these - just uses fallback options!