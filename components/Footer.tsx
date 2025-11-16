'use client'

import { useEffect, useState } from 'react'

interface VersionInfo {
  version: string
  commit: string
  buildTime: string
  env: string
  fullVersion: string
}

export default function Footer() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(err => console.error('Failed to fetch version:', err))
  }, [])

  if (!versionInfo) {
    return null
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 py-2 px-4 text-center z-10">
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="font-mono">
          {versionInfo.fullVersion}
        </span>
        {versionInfo.env !== 'production' && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            {versionInfo.env}
          </span>
        )}
        <span className="hidden sm:inline text-gray-500">
          Built {new Date(versionInfo.buildTime).toLocaleDateString()}
        </span>
      </div>
    </footer>
  )
}
