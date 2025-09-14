'use client'

import { isDemoMode } from '@/lib/demoMode'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Debug Console</h1>
            <p className="text-gray-400">Database debugging disabled - using Vercel Postgres</p>
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
              <span className="text-gray-400">Database:</span>{' '}
              <span className="text-green-400">Vercel Postgres</span>
            </div>
            <div>
              <span className="text-gray-400">Environment:</span>{' '}
              <span className="text-green-400">Development</span>
            </div>
            <div>
              <span className="text-gray-400">Auth:</span>{' '}
              <span className="text-blue-400">Custom JWT</span>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-blue-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notice</h2>
          <p className="text-blue-100">
            Debug functionality has been simplified since migrating from Supabase to Vercel Postgres.
            The app now uses custom JWT authentication and Vercel's database services.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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