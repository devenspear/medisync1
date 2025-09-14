# 🗄️ Vercel Postgres Database Setup Guide

## 📋 Prerequisites
- ✅ GitHub repo: https://github.com/devenspear/medisync1
- ✅ Vercel project: `deven-projects/medisync`
- ✅ Vercel CLI connected

## 🚀 Step-by-Step Database Setup

### 1. Create Vercel Postgres Database

**Via Vercel Dashboard:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **`medisync`** project
3. Go to the **"Storage"** tab
4. Click **"Create Database"**
5. Select **"Postgres"**
6. Choose settings:
   - **Name**: `medisync-db`
   - **Region**: `US East 1 (iad1)` (or closest to your users)
7. Click **"Create"**

**⏱️ Time**: ~2-3 minutes to provision

### 2. Connect Database to Project

Once created, Vercel will automatically:
- Generate connection strings
- Add environment variables to your project
- Create the database instance

**Auto-added Environment Variables:**
```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

### 3. Update MediSync Configuration

**Replace Supabase with Vercel Postgres:**

#### A. Install Postgres Client
```bash
npm install pg @types/pg
npm install @vercel/postgres
```

#### B. Create Database Client
Create `lib/database.ts`:
```typescript
import { sql } from '@vercel/postgres';

export { sql };

// For connection info
export const db = {
  url: process.env.POSTGRES_URL,
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
}
```

#### C. Update Environment Variables
In your `.env.local`, add:
```env
# Vercel Postgres (auto-populated on deploy)
POSTGRES_URL="your-connection-string"
POSTGRES_PRISMA_URL="your-prisma-connection-string"
POSTGRES_URL_NON_POOLING="your-non-pooling-connection-string"
```

### 4. Set Up Database Schema

**Option A: Via Vercel Dashboard SQL Editor**
1. In your project's **Storage** tab
2. Click your `medisync-db` database
3. Go to **"Query"** tab
4. Copy and paste this SQL:

```sql
-- MediSync Database Schema for Vercel Postgres

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  total_minutes INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "default_duration": 10,
    "preferred_voice": "female-1",
    "favorite_frequency": "alpha"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_configs table
CREATE TABLE IF NOT EXISTS session_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
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
  }',
  assessment_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Create meditation_scripts table
CREATE TABLE IF NOT EXISTS meditation_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  intro_text TEXT NOT NULL,
  main_content TEXT NOT NULL,
  closing_text TEXT NOT NULL,
  total_words INTEGER NOT NULL,
  estimated_duration INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_session_id FOREIGN KEY (session_id) REFERENCES session_configs(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_session_configs_user_id ON session_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_configs_created_at ON session_configs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meditation_scripts_session_id ON meditation_scripts(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO profiles (user_id, email, subscription_tier)
VALUES ('demo-user', 'demo@medisync.app', 'premium')
ON CONFLICT (user_id) DO NOTHING;
```

5. Click **"Run Query"**

### 5. Update MediSync Code

**Replace Supabase Auth with Custom Auth:**

Since Vercel Postgres doesn't include auth, you'll need to:

#### Option A: Keep Supabase Auth + Vercel Postgres
- Use Supabase only for authentication
- Use Vercel Postgres for data storage
- Best of both worlds!

#### Option B: Implement Custom Auth
- Use NextAuth.js or similar
- Store sessions in Vercel Postgres
- More setup required

**Recommended: Option A (Hybrid)**

### 6. Update Database Queries

Replace Supabase client calls with Vercel Postgres:

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
```

**After (Vercel Postgres):**
```typescript
import { sql } from '@vercel/postgres';

const { rows } = await sql`
  SELECT * FROM profiles
  WHERE user_id = ${userId}
`;
```

### 7. Deploy and Test

```bash
# Deploy to Vercel
vercel --prod

# Test the deployment
curl https://medisync.vercel.app/debug
```

## 🔧 Migration Script

I can create an automated migration script to:
1. Export data from Supabase
2. Import to Vercel Postgres
3. Update all queries
4. Test the migration

## 📊 Database Management

**Via Vercel Dashboard:**
- **Query Editor**: Run SQL directly
- **Tables View**: Browse data
- **Metrics**: Monitor performance
- **Logs**: Debug issues

**Via CLI:**
```bash
# Access database console
vercel env ls
# Copy POSTGRES_URL and use with psql or any Postgres client
```

## 🚀 Next Steps

1. **Create the database** (2 minutes)
2. **Run the SQL schema** (1 minute)
3. **Test with debug console** (1 minute)
4. **Deploy to production** (2 minutes)

**Total setup time: ~6 minutes** ⚡

## ❓ Troubleshooting

**Database not appearing?**
- Check the Storage tab in your Vercel project
- Ensure you're in the correct team/scope

**Connection errors?**
- Verify environment variables are set
- Check if database is fully provisioned (takes 2-3 minutes)

**SQL errors?**
- Use the Vercel dashboard Query editor
- Check syntax for PostgreSQL compatibility

## 🎯 Benefits of Vercel Postgres

✅ **Integrated**: No external service setup
✅ **Auto-scaling**: Handles traffic spikes
✅ **Environment Variables**: Auto-configured
✅ **Dashboard**: Built-in query editor and monitoring
✅ **Edge-optimized**: Fast global access
✅ **Cost-effective**: Pay per usage

---

**🚀 Ready to migrate from Supabase to Vercel Postgres?**
Follow these steps and you'll have a fully operational database in under 10 minutes!