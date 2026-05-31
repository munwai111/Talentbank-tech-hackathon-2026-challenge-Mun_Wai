// /employer/jobs — Employer's posted job listings (server component)
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const REMOTE_LABELS = { remote: '🌐 Remote', hybrid: '🏠 Hybrid', onsite: '🏢 On-site' }

export default async function EmployerJobsPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', user.id).single()
  if (!dbUser || dbUser.role !== 'employer') redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', dbUser.id).single()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, location, remote, required_skills, created_at')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Jobs 📋</h1>
          <p className="text-zinc-500 mt-1">
            {jobs?.length ?? 0} role{jobs?.length !== 1 ? 's' : ''} posted
          </p>
        </div>
        <Link href="/employer/jobs/new">
          <Button>+ Post a role</Button>
        </Link>
      </div>

      {(!jobs || jobs.length === 0) ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-3xl mb-3">📋</p>
          <h3 className="font-semibold mb-1">No jobs posted yet</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Post your first role and candidates will be matched to it immediately.
          </p>
          <Link href="/employer/jobs/new">
            <Button>Post your first job →</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{job.title}</h3>
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                      {job.status === 'open' ? '🟢 Open' : '⚫ Closed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Posted {new Date(job.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {job.location && ` · ${job.location}`}
                    {' · '}{REMOTE_LABELS[job.remote]}
                  </p>
                  {/* Required skills preview */}
                  {job.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.required_skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="text-xs text-zinc-400">+{job.required_skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/employer/candidates/${job.id}`}>
                    <Button size="sm" variant="outline">See matches →</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
