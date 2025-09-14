# MediSync Supabase Setup Guide

## Step 1: Create New Supabase Project

1. Go to your Supabase dashboard: https://supabase.com/dashboard/org/zvmcuqdxhjwsupgaosxf
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `medisync`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to be created (2-3 minutes)

## Step 2: Configure Database Schema

1. In your new project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire content from `supabase-setup.sql` file
4. Paste it into the query editor
5. Click **"Run"** to execute the schema
6. Verify tables were created in **Database > Tables**

## Step 3: Get API Credentials

1. Go to **Settings > API** (left sidebar)
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxx.supabase.co`)
   - **Project API Keys > anon public** (starts with `eyJhbG...`)

## Step 4: Configure Environment Variables

Replace the placeholder values in `.env.local`:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration (optional - app works without it)
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration (optional - app works without it)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
\`\`\`

## Step 5: Enable Authentication

1. In Supabase dashboard, go to **Authentication > Settings**
2. Under **Site URL**, add: `http://localhost:3001`
3. Under **Redirect URLs**, add: `http://localhost:3001/**`
4. **Email Templates**: Customize if desired (optional)
5. **Auth Providers**: Email is enabled by default, add others if needed

## Step 6: Test the Application

1. Save your `.env.local` file
2. The development server should automatically reload
3. Visit http://localhost:3001
4. You should see the login screen instead of demo mode
5. Create an account and test the functionality

## Optional: Production Setup

For deployment, also configure:

1. **Site URL** in Authentication settings
2. **Redirect URLs** for your production domain
3. **Database > Security** policies if needed
4. **Edge Functions** if using serverless functions

## Database Tables Created

The schema creates these tables:
- `profiles` - User profiles and preferences
- `session_configs` - Saved meditation sessions
- `meditation_scripts` - Generated AI scripts

All tables have Row Level Security enabled for data protection.