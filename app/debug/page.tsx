'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { isDemoMode } from '@/lib/demoMode'

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, status: 'success' | 'error', data?: any) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setResults([])
    setLoading(true)

    // Test 1: Check demo mode
    addResult('Demo Mode Check', 'success', { isDemoMode: isDemoMode() })

    // Test 2: Check environment variables
    addResult('Environment Variables', 'success', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    })

    if (isDemoMode()) {
      addResult('Supabase Connection', 'error', 'Running in demo mode - Supabase tests skipped')
      setLoading(false)
      return
    }

    try {
      // Test 3: Check Supabase connection
      const { data: healthCheck, error: healthError } = await supabase.from('profiles').select('count').limit(0)
      if (healthError) {
        addResult('Supabase Connection', 'error', healthError.message)
      } else {
        addResult('Supabase Connection', 'success', 'Connected successfully')
      }

      // Test 4: Check tables exist
      const tables = ['profiles', 'session_configs', 'meditation_scripts']
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1)
          if (error) {
            addResult(`Table: ${table}`, 'error', error.message)
          } else {
            addResult(`Table: ${table}`, 'success', `Exists (${data?.length || 0} records sampled)`)
          }
        } catch (err: any) {
          addResult(`Table: ${table}`, 'error', err.message)
        }
      }

      // Test 5: Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError) {
        addResult('Auth Session', 'error', authError.message)
      } else {
        addResult('Auth Session', 'success', {
          hasSession: !!authData.session,
          user: authData.session?.user?.email || 'No user'
        })
      }

      // Test 6: Test user signup (with cleanup)
      const testEmail = `test+${Date.now()}@example.com`
      const testPassword = 'testpass123'

      try {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword
        })

        if (signupError) {
          addResult('Test Signup', 'error', {
            message: signupError.message,
            code: signupError.code,
            status: signupError.status,
            details: 'This error suggests the handle_new_user() trigger is missing or failing. Check if the SQL from SETUP_INSTRUCTIONS.md was run.'
          })
        } else {
          addResult('Test Signup', 'success', {
            message: 'Signup successful',
            needsConfirmation: !signupData.session,
            userId: signupData.user?.id
          })

          // Clean up - sign out the test user
          await supabase.auth.signOut()
        }
      } catch (err: any) {
        addResult('Test Signup', 'error', {
          message: err.message,
          name: err.name,
          details: 'Unexpected error during signup test'
        })
      }

      // Test 7: Check if trigger function exists
      try {
        const { data: functions, error: funcError } = await supabase.rpc('ping')
        addResult('Database Functions', funcError ? 'error' : 'success',
          funcError ? 'Cannot test functions - RPC disabled' : 'RPC accessible')
      } catch (err: any) {
        addResult('Database Functions', 'error', 'Cannot access database functions')
      }

    } catch (err: any) {
      addResult('General Error', 'error', err.message)
    }

    setLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Supabase Debug Console</h1>
            <p className="text-gray-400">Test Supabase connectivity and configuration</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={runTests}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Running Tests...' : 'Run Tests'}
            </button>
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-700 rounded-lg font-semibold"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Demo Mode:</span>{' '}
              <span className={isDemoMode() ? 'text-orange-400' : 'text-green-400'}>
                {isDemoMode() ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Supabase URL:</span>{' '}
              <span className="text-blue-400 font-mono text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
              </span>
            </div>
            <div>
              <span className="text-gray-400">Environment:</span>{' '}
              <span className="text-green-400">Development</span>
            </div>
            <div>
              <span className="text-gray-400">Anon Key:</span>{' '}
              <span className="text-purple-400">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>

          {results.length === 0 && !loading && (
            <p className="text-gray-500 italic">No tests run yet. Click "Run Tests" to start.</p>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-blue-400 mb-4">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Running diagnostics...</span>
            </div>
          )}

          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{result.test}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === 'success'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {result.status === 'success' ? '✓ Success' : '✗ Error'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {result.data && (
                  <div className="bg-gray-800 rounded p-3 mt-2">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {typeof result.data === 'string'
                        ? result.data
                        : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-green-900 hover:bg-green-800 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-semibold">Supabase Dashboard</div>
              <div className="text-sm text-green-300">Manage your project</div>
            </a>

            <a
              href="/"
              className="block p-4 bg-blue-900 hover:bg-blue-800 rounded-lg text-center transition-colors"
            >
              <div className="text-2xl mb-2">🏠</div>
              <div className="font-semibold">Back to App</div>
              <div className="text-sm text-blue-300">Return to MediSync</div>
            </a>

            <button
              onClick={() => window.location.reload()}
              className="block p-4 bg-purple-900 hover:bg-purple-800 rounded-lg text-center transition-colors w-full"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-semibold">Reload Page</div>
              <div className="text-sm text-purple-300">Fresh start</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}