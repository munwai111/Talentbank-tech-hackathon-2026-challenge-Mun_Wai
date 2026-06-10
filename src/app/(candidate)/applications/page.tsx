'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeUp } from '@/components/animations/FadeUp'

type ApplicationRow = {
  id: string
  job_id: string
  status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
  jobs: {
    id: string
    title: string
    location: string | null
    remote: 'onsite' | 'hybrid' | 'remote'
    salary_min: number | null
    salary_max: number | null
    status: string
    companies: { name: string; industry: string | null }
  }
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  applied:    { label: '📨 Applied',    classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  reviewing:  { label: '🔍 Reviewing',  classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  interview:  { label: '🎤 Interview',  classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  offer:      { label: '🎉 Offer',      classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected:   { label: '✗ Rejected',   classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
  withdrawn:  { label: '↩ Withdrawn',  classes: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

const REMOTE_LABELS = { remote: '🌐 Remote', hybrid: '🏠 Hybrid', onsite: '🏢 On-site' }

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.applied
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/candidate/applications')
      .then(r => r.json())
      .then(data => {
        setApplications(data.applications ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
        Loading your applications…
      </div>
    )
  }

  const active = applications.filter(a => !['rejected', 'withdrawn'].includes(a.status))
  const closed = applications.filter(a => ['rejected', 'withdrawn'].includes(a.status))

  return (
    <div className="px-8 py-6 max-w-3xl">
      <FadeUp className="mb-6" scrollTrigger={false}>
        <h1 className="text-2xl font-bold text-white">My Applications 📨</h1>
        <p className="text-zinc-400 mt-1">
          Track every role you&apos;ve applied to and where you stand.
        </p>
      </FadeUp>

      {applications.length === 0 && (
        <div className="p-10 text-center rounded-xl border border-white/8 bg-white/3">
          <p className="text-3xl mb-3">📭</p>
          <h3 className="font-semibold mb-1 text-white">No applications yet</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Browse your matched jobs and hit &ldquo;Apply now&rdquo; to get started.
          </p>
          <Link href="/jobs">
            <Button className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Browse job matches →
            </Button>
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Active · {active.length}
          </p>
          <div className="space-y-3">
            {active.map(app => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Closed · {closed.length}
          </p>
          <div className="space-y-3 opacity-60">
            {closed.map(app => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ApplicationCard({ app }: { app: ApplicationRow }) {
  const job = app.jobs
  const appliedDate = new Date(app.created_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const updatedDate = new Date(app.updated_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short',
  })
  const wasUpdated = app.updated_at !== app.created_at

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-white">{job.title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            {job.companies.name}
            {job.companies.industry && (
              <span className="text-zinc-500"> · {job.companies.industry}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
            {job.location && <span>📍 {job.location}</span>}
            <span>{REMOTE_LABELS[job.remote]}</span>
            {job.salary_min && (
              <span>💰 RM {job.salary_min.toLocaleString()} – {job.salary_max?.toLocaleString()}/mo</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <StatusChip status={app.status} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>Applied {appliedDate}</span>
          {wasUpdated && <span>· Updated {updatedDate}</span>}
          {job.status === 'closed' && (
            <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/25 text-xs font-normal">
              Role closed
            </Badge>
          )}
        </div>
        <Link href="/jobs">
          <button className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
            See all matches →
          </button>
        </Link>
      </div>
    </div>
  )
}
