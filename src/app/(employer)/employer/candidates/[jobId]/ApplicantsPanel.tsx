'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type Applicant = {
  appId: string
  status: string
  created_at: string
  id: string
  name: string
  headline: string | null
  location: string | null
  skills: { name: string; level: number; source: string }[]
  score_pct: number | null
  matched: string[]
  missing_required: string[]
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  applied:   { label: '📨 Applied',   classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  reviewing: { label: '🔍 Reviewing', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  interview: { label: '🎤 Interview', classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  offer:     { label: '🎉 Offer',     classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected:  { label: '✗ Rejected',  classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

const NEXT_ACTIONS: Record<string, { label: string; next: string }[]> = {
  applied:   [{ label: 'Start review', next: 'reviewing' }, { label: 'Reject', next: 'rejected' }],
  reviewing: [{ label: 'Invite to interview', next: 'interview' }, { label: 'Reject', next: 'rejected' }],
  interview: [{ label: 'Make offer', next: 'offer' }, { label: 'Reject', next: 'rejected' }],
  offer:     [],
  rejected:  [],
}

export function ApplicantsPanel({ applicants: initial }: { applicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)

  if (applicants.length === 0) return null

  async function updateStatus(appId: string, status: string) {
    setUpdating(appId)
    try {
      const res = await fetch(`/api/employer/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setApplicants(prev =>
          prev.map(a => a.appId === appId ? { ...a, status } : a)
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-white">Applied to this role</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          {applicants.length}
        </span>
      </div>

      <div className="space-y-3">
        {applicants.map(a => {
          const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.applied
          const actions = NEXT_ACTIONS[a.status] ?? []
          const appliedDate = new Date(a.created_at).toLocaleDateString('en-MY', {
            day: 'numeric', month: 'short',
          })

          return (
            <Card key={a.appId} className="p-4 border-indigo-500/20 bg-indigo-500/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    {a.score_pct !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        a.score_pct >= 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        a.score_pct >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                            'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        {a.score_pct}% match
                      </span>
                    )}
                  </div>
                  {a.headline && <p className="text-xs text-zinc-400 mt-0.5">{a.headline}</p>}
                  {a.location && <p className="text-xs text-zinc-500 mt-0.5">📍 {a.location}</p>}

                  {/* Matched skills */}
                  {a.matched.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.matched.slice(0, 5).map(s => (
                        <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-normal">
                          ✓ {s}
                        </Badge>
                      ))}
                      {a.missing_required.slice(0, 3).map(s => (
                        <Badge key={s} variant="outline" className="text-red-400 border-red-500/30 text-xs font-normal">
                          ✗ {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-zinc-500">Applied {appliedDate}</span>
                </div>
              </div>

              {/* Action buttons */}
              {actions.length > 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/8">
                  {actions.map(action => (
                    <button
                      key={action.next}
                      disabled={updating === a.appId}
                      onClick={() => updateStatus(a.appId, action.next)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                        ${action.next === 'rejected'
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40'
                          : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40'
                        }`}
                    >
                      {updating === a.appId ? '…' : action.label}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="h-px bg-white/8 mt-6 mb-6" />
    </div>
  )
}
