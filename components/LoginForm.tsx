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
    <div className="min-h-screen w-full flex flex-col justify-center px-6 py-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* App Logo and Title */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">MediSync</h1>
            <p className="text-gray-400 text-base">AI-Powered Meditation</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="ios-card space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ios-input"
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
                className="ios-input"
                placeholder="Password"
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`ios-button no-select ${loading ? 'opacity-75' : ''}`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-blue-400 text-base py-2 no-select"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Don\'t have an account? Sign Up'
              }
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm text-center ${
              message.includes('error') || message.includes('Error')
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Medical Disclaimer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            This app is for entertainment and wellness purposes only.<br />
            Not intended to diagnose, treat, cure, or prevent any medical condition.
          </p>
        </div>
      </div>
    </div>
  )
}