// Quick test to simulate the debug page tests
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🔧 Running Supabase Debug Tests...\n');

  // Test 1: Connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(0);
    if (error) {
      console.log('❌ Connection Error:', error.message);
    } else {
      console.log('✅ Supabase Connection: Success');
    }
  } catch (err) {
    console.log('❌ Connection Exception:', err.message);
  }

  // Test 2: Tables
  const tables = ['profiles', 'session_configs', 'meditation_scripts'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Exists`);
      }
    } catch (err) {
      console.log(`❌ Table ${table}: ${err.message}`);
    }
  }

  // Test 3: Test Signup
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'testpass123';

  console.log(`\n🧪 Testing signup with: ${testEmail}`);

  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signupError) {
      console.log('❌ Test Signup Error:', signupError.message);
      console.log('Error details:', JSON.stringify(signupError, null, 2));
    } else {
      console.log('✅ Test Signup: Success');
      console.log('Signup data:', JSON.stringify(signupData, null, 2));

      // Clean up
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log('❌ Test Signup Exception:', err.message);
  }
}

runTests().catch(console.error);