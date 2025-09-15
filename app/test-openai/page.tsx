'use client'

import { useState } from 'react'

export default function TestOpenAI() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testOpenAI = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      console.log('Testing OpenAI API...')

      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create a brief 2-sentence meditation script about inner peace.'
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      }

      setResult(data.result)
    } catch (err) {
      console.error('Test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testScriptsEndpoint = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      console.log('Testing /api/test-scripts endpoint (no auth)...')

      const response = await fetch('/api/test-scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment: {
            goal: 'Inner Peace & Calm',
            currentState: 'Stressed or Anxious',
            duration: 5,
            experience: 'Regular Practice',
            timeOfDay: 'evening',
            environment: 'quiet',
            wisdomSource: 'Default/Universal',
            selectedFeelings: ['Anxiety', 'Stress'],
            userPrimer: 'I need to know everything will be OK'
          },
          promptPrimer: 'Test meditation with custom instructions'
        })
      })

      console.log('Scripts response status:', response.status)
      const data = await response.json()
      console.log('Scripts response data:', data)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      }

      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error('Scripts test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testAuthScriptsEndpoint = async () => {
    setLoading(true)
    setError('')
    setResult('')

    try {
      console.log('Testing /api/scripts endpoint (with auth required)...')

      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No auth token - should fail with 401
        },
        body: JSON.stringify({
          assessment: {
            goal: 'Inner Peace & Calm',
            currentState: 'Stressed or Anxious',
            duration: 5,
            experience: 'Regular Practice',
            timeOfDay: 'evening',
            environment: 'quiet',
            wisdomSource: 'Default/Universal',
            selectedFeelings: ['Anxiety', 'Stress'],
            userPrimer: 'Test meditation script'
          }
        })
      })

      console.log('Auth Scripts response status:', response.status)
      const data = await response.json()
      console.log('Auth Scripts response data:', data)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`)
      }

      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error('Auth Scripts test failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OpenAI API Test Page</h1>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test 1: Direct OpenAI API (No Auth)</h2>
            <button
              onClick={testOpenAI}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test OpenAI API'}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test 2: Master Prompt Template (No Auth)</h2>
            <button
              onClick={testScriptsEndpoint}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Master Prompt Template'}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test 3: Auth Scripts Endpoint (Should Fail 401)</h2>
            <button
              onClick={testAuthScriptsEndpoint}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Auth Required Endpoint'}
            </button>
          </div>

          {error && (
            <div className="bg-red-800 p-4 rounded-lg">
              <h3 className="font-semibold text-red-200 mb-2">Error:</h3>
              <pre className="text-red-100 text-sm overflow-auto">{error}</pre>
            </div>
          )}

          {result && (
            <div className="bg-green-800 p-4 rounded-lg">
              <h3 className="font-semibold text-green-200 mb-2">Result:</h3>
              <pre className="text-green-100 text-sm overflow-auto whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="text-sm">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server side'}</p>
            <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server side'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}