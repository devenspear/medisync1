'use client'

import { useAppStore } from '@/lib/store'
import AuthWrapper from '@/components/AuthWrapper'
import LoginForm from '@/components/LoginForm'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <AuthWrapper>
      <MainContent />
    </AuthWrapper>
  )
}

function MainContent() {
  const { user } = useAppStore()

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}
