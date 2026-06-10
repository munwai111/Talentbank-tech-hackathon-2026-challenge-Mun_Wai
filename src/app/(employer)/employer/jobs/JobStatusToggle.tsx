'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function JobStatusToggle({ jobId, initialStatus }: { jobId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next = status === 'open' ? 'closed' : 'open'
    setLoading(true)
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) setStatus(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={toggle}
      className={status === 'open'
        ? 'border-zinc-600 text-zinc-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5'
        : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
      }
    >
      {loading ? '…' : status === 'open' ? 'Close role' : 'Reopen'}
    </Button>
  )
}
