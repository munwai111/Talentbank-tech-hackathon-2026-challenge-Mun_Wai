'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { StatusChip } from '@/components/shared/StatusChip'
import { Check, X, MapPin } from 'lucide-react'

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
        <h2 className="section-label !text-teal-400">Applied to this role</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
          {applicants.length}
        </span>
      </div>

      <div className="space-y-3">
        {applicants.map(a => {
          const actions = NEXT_ACTIONS[a.status] ?? []
          const appliedDate = new Date(a.created_at).toLocaleDateString('en-MY', {
            day: 'numeric', month: 'short',
          })

          return (
            <Card key={a.appId} className="p-4 border-teal-500/20 bg-teal-500/4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    {a.score_pct !== null && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        a.score_pct >= 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        a.score_pct >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                            'bg-white/8 text-zinc-400 border-white/15'
                      }`}>
                        {a.score_pct}% match
                      </span>
                    )}
                  </div>
                  {a.headline && <p className="text-xs text-zinc-400 mt-0.5">{a.headline}</p>}
                  {a.location && (
                    <p className="inline-flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                      <MapPin size={11} strokeWidth={1.75} className="opacity-60" />
                      {a.location}
                    </p>
                  )}

                  {a.matched.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.matched.slice(0, 5).map(s => (
                        <Badge key={s} className="gap-1 bg-emerald-500/12 text-emerald-400 border border-emerald-500/25 text-xs font-normal">
                          <Check size={10} strokeWidth={2.5} /> {s}
                        </Badge>
                      ))}
                      {a.missing_required.slice(0, 3).map(s => (
                        <Badge key={s} variant="outline" className="gap-1 text-red-400 border-red-500/30 text-xs font-normal">
                          <X size={10} strokeWidth={2.5} /> {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusChip status={a.status} />
                  <span className="text-xs text-zinc-500">Applied {appliedDate}</span>
                </div>
              </div>

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
                          : 'border-teal-500/30 text-teal-400 hover:bg-teal-500/10 disabled:opacity-40'
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
