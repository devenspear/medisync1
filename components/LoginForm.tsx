'use client'

import { useState } from 'react'
import { auth } from '@/lib/authClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await auth.signUp(email, password)
        if (error) {
          setMessage(error)
        } else {
          setMessage('Account created successfully!')
        }
      } else {
        const { error } = await auth.signInWithPassword(email, password)
        if (error) {
          setMessage(error)
        } else {
          setMessage('Welcome back!')
        }
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl mb-6">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">MediSync</h1>
            <p className="text-gray-400 text-lg">AI-Powered Meditation</p>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl text-white text-base placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Email"
                required
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-800/50 border border-gray-600 rounded-2xl text-white text-base placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-semibold text-lg bg-blue-500 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-75"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-gray-700 mt-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full py-3 text-blue-400 font-medium text-lg active:scale-95 transition-all"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Don\'t have an account? Sign Up'
              }
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-2xl text-sm text-center bg-red-500/10 text-red-400 border border-red-500/20">
              {message}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 leading-relaxed">
            This app is for entertainment and wellness purposes only.<br />
            Not intended to diagnose, treat, cure, or prevent any medical condition.
          </p>
        </div>
      </div>
    </div>
  )
}