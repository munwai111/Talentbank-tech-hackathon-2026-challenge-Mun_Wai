'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FadeUp } from '@/components/animations/FadeUp'
import { WorkModeMeta, LocationMeta, SalaryMeta } from '@/components/shared/meta'
import { StatusChip } from '@/components/shared/StatusChip'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Inbox, ArrowRight } from 'lucide-react'

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

export default function ApplicationsPage() {
  const { t } = useLanguage()
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
        {t('common.loading')}
      </div>
    )
  }

  const active = applications.filter(a => !['rejected', 'withdrawn'].includes(a.status))
  const closed = applications.filter(a => ['rejected', 'withdrawn'].includes(a.status))

  return (
    <div className="px-8 py-6 max-w-3xl">
      <FadeUp className="mb-8" scrollTrigger={false}>
        <p className="section-label mb-2">{t('apps.eyebrow')}</p>
        <h1 className="text-2xl font-bold text-white">{t('apps.title')}</h1>
        <p className="text-zinc-400 mt-1">
          {t('apps.subtitle')}
        </p>
      </FadeUp>

      {applications.length === 0 && (
        <div className="p-10 text-center surface">
          <Inbox size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-500" />
          <h3 className="font-semibold mb-1 text-white">No applications yet</h3>
          <p className="text-sm text-zinc-400 mb-5">
            Browse your matched jobs and apply — your strongest routes are already ranked.
          </p>
          <Link href="/jobs">
            <Button className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
              Browse job matches
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-8">
          <p className="section-label mb-3">{t('apps.active')} · {active.length}</p>
          <div className="space-y-3">
            {active.map(app => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section>
          <p className="section-label mb-3">{t('apps.closed')} · {closed.length}</p>
          <div className="space-y-3 opacity-60">
            {closed.map(app => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ApplicationCard({ app }: { app: ApplicationRow }) {
  const { t } = useLanguage()
  const job = app.jobs
  const appliedDate = new Date(app.created_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const updatedDate = new Date(app.updated_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short',
  })
  const wasUpdated = app.updated_at !== app.created_at

  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-white">{job.title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            {job.companies.name}
            {job.companies.industry && (
              <span className="text-zinc-500"> · {job.companies.industry}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-zinc-500">
            {job.location && <LocationMeta>{job.location}</LocationMeta>}
            <WorkModeMeta mode={job.remote} />
            {job.salary_min && <SalaryMeta min={job.salary_min} max={job.salary_max} />}
          </div>
        </div>
        <div className="shrink-0">
          <StatusChip status={app.status} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/6">
        <div className="flex gap-3 items-center text-xs text-zinc-500">
          <span>{t('apps.appliedOn')} {appliedDate}</span>
          {wasUpdated && <span>· {t('apps.updated')} {updatedDate}</span>}
          {job.status === 'closed' && (
            <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/25 text-xs font-normal">
              {t('apps.closed')}
            </Badge>
          )}
        </div>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
          {t('apps.seeMatches')}
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}
