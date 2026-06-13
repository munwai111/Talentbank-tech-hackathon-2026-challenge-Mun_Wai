'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function DemoSetupButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function setup() {
    setLoading(true)
    try {
      const res = await fetch('/api/employer/demo-setup', { method: 'POST' })
      const data = await res.json() as { success?: boolean; alreadySetUp?: boolean }
      if (data.success || data.alreadySetUp) {
        setDone(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <Button
      size="sm"
      variant="outline"
      className="shrink-0 ml-4 border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
      disabled={loading}
      onClick={setup}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          Setting up…
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <Sparkles size={14} />
          Quick Demo Setup
        </span>
      )}
    </Button>
  )
}
