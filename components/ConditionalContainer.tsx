'use client'

import { usePathname } from 'next/navigation'

export default function ConditionalContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Admin pages should use full width
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    return <div className="w-full">{children}</div>
  }

  // All other pages use mobile-optimized container
  return (
    <div className="w-full max-w-md mx-auto overflow-x-hidden pb-12 fixed-mobile-container">
      {children}
    </div>
  )
}
