// /employer/candidates — Talent pool overview
// Shows all employer's open jobs with candidate match counts.
// Entry point for browsing matched candidates.

import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'


export default async function TalentPoolPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', user.id).single()
  if (!dbUser || dbUser.role !== 'employer') redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', dbUser.id).single()

  const { data: jobs } = await supabase
    .from('jobs').select('id, title, status, required_skills, location, remote')
    .eq('company_id', company?.id ?? '')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  // Count total candidates on platform with skills
  const { count: totalCandidates } = await supabase
    .from('candidate_profiles')
    .select('id', { count: 'exact', head: true })

  const REMOTE_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <p className="section-label !text-teal-400 mb-1.5">Radar</p>
        <h1 className="text-2xl font-bold">Talent Pool</h1>
        <p className="text-zinc-500 mt-1">
          {totalCandidates ?? 0} candidates on platform · select a role to see ranked matches
        </p>
      </div>

      {(!jobs || jobs.length === 0) ? (
        <Card className="p-10 text-center border-dashed">
          <h3 className="font-semibold mb-1">Post a job to see candidates</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Each role you post is instantly matched against every candidate on the platform.
          </p>
          <Link href="/employer/jobs/new">
            <Button>Post a job</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Card key={job.id} className="p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {job.location && `${job.location} · `}
                    {REMOTE_LABELS[job.remote as keyof typeof REMOTE_LABELS]}
                  </p>
                  {job.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(job.required_skills as string[]).slice(0, 4).map(s => (
                        <span key={s} className="text-xs bg-white/8 text-zinc-400 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {(job.required_skills as string[]).length > 4 && (
                        <span className="text-xs text-zinc-400">+{(job.required_skills as string[]).length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
                <Link href={`/employer/candidates/${job.id}`}>
                  <Button size="sm">See ranked candidates</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-white/4 rounded-xl border border-white/8 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-1">How matching works</p>
        <p>Candidates are ranked by skill overlap against your job&apos;s required and nice-to-have skills.
        Green = matched skill. Red = missing required skill. The higher the score, the stronger the fit.</p>
      </div>
    </div>
  )
}
