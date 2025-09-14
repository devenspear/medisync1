const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://yvkjfzxxzntbgzflgqxn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2a2pmenh4em50Ymd6ZmxncXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NjczMjksImV4cCI6MjA3MzQ0MzMyOX0.JJZ8Ncbjr1uY9638bZAwqYxVU3W-_DMEgLVyCfdHgqM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  console.log('🔄 Testing Supabase connection...')

  try {
    // Test connection
    const { data, error } = await supabase.from('profiles').select('*').limit(1)

    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️  Database tables not found. Need to run schema setup.')
        console.log('\n📝 Next steps:')
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/yvkjfzxxzntbgzflgqxn')
        console.log('2. Click "SQL Editor" in the left sidebar')
        console.log('3. Click "New query"')
        console.log('4. Copy the entire content from "supabase-setup.sql" file')
        console.log('5. Paste and click "RUN" to create tables')
      } else {
        console.log('❌ Connection error:', error.message)
      }
    } else {
      console.log('✅ Connected to Supabase successfully!')
      console.log('✅ Database tables exist and are accessible')
      console.log(`📊 Found ${data?.length || 0} existing profiles`)
    }

  } catch (err) {
    console.error('❌ Setup failed:', err.message)
  }
}

setupDatabase()