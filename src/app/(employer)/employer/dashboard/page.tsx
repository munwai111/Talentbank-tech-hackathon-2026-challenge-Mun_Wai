// Employer Dashboard — server component
// Shows: company overview, active job count, total matched candidates.
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Users, ClipboardList, Building2, ArrowRight, type LucideIcon } from 'lucide-react'
import { DemoSetupButton } from './DemoSetupButton'

export default async function EmployerDashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', user.id).single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role !== 'employer') redirect('/dashboard')

  const { data: company } = await supabase
    .from('companies').select('id, name, industry, size').eq('user_id', dbUser.id).single()

  const { data: jobs } = await supabase
    .from('jobs').select('id, title, status, created_at')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  const activeJobs = jobs?.filter(j => j.status === 'open') ?? []
  const firstName = user.firstName ?? 'there'

  return (
    <div className="p-8 max-w-4xl">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div className="mb-8 animate-fade-up">
        <p className="section-label !text-teal-400 mb-1.5">Scout base</p>
        <h1 className="text-2xl font-bold">Hey {firstName}</h1>
        <p className="text-zinc-500 mt-1">
          {company?.name ?? 'Your company'} · Employer portal
        </p>
      </div>

      {/* ── Status cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5 animate-fade-up animate-delay-1">
          <p className="text-sm text-zinc-500 mb-1">Active jobs</p>
          <span className="text-3xl font-bold">{activeJobs.length}</span>
          <p className="text-xs text-zinc-400 mt-1">
            {activeJobs.length === 0 ? 'Post your first role' : 'open for applications'}
          </p>
        </Card>

        <Card className="p-5 animate-fade-up animate-delay-2">
          <p className="text-sm text-zinc-500 mb-1">Total posted</p>
          <span className="text-3xl font-bold">{jobs?.length ?? 0}</span>
          <p className="text-xs text-zinc-400 mt-1">across all time</p>
        </Card>

        <Card className="p-5 animate-fade-up animate-delay-3">
          <p className="text-sm text-zinc-500 mb-1">Matching status</p>
          <Badge variant={activeJobs.length > 0 ? 'default' : 'secondary'} className="mt-1">
            {activeJobs.length > 0 ? 'Active' : 'No active jobs'}
          </Badge>
          <p className="text-xs text-zinc-400 mt-1">
            {activeJobs.length > 0 ? 'Candidates are being ranked' : 'Post a role to start matching'}
          </p>
        </Card>
      </div>

      {/* ── CTA if no jobs yet ────────────────────────────────── */}
      {activeJobs.length === 0 && (
        <Card className="p-6 border-indigo-500/20 bg-indigo-500/8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-indigo-200">Post your first job</h3>
              <p className="text-sm text-indigo-300/70 mt-1">
                Skills-based matching starts the moment you post. Candidates are ranked
                by what they can actually do — not their university name.
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <DemoSetupButton />
              <Link href="/employer/jobs/new">
                <Button size="sm">Post a job <ArrowRight size={13} /></Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Recent jobs ───────────────────────────────────────── */}
      {jobs && jobs.length > 0 && (
        <>
          <h2 className="font-semibold mb-4 text-zinc-300">Your jobs</h2>
          <div className="space-y-3 mb-8">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id}
                className="flex items-center justify-between p-4 bg-white/4 border border-white/8 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Posted {new Date(job.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                    {job.status === 'open' ? 'Open' : job.status}
                  </Badge>
                  <Link href={`/employer/candidates/${job.id}`}>
                    <Button size="sm" variant="outline">See matches <ArrowRight size={13} /></Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Quick actions ─────────────────────────────────────── */}
      <h2 className="section-label mb-4">Quick actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {([
          { href: '/employer/jobs/new',   Icon: PlusCircle,    title: 'Post a new role',        desc: 'Define skills, salary, and location',         delay: 'animate-delay-1' },
          { href: '/employer/candidates', Icon: Users,         title: 'Browse talent pool',     desc: 'Find candidates across all your open roles',  delay: 'animate-delay-2' },
          { href: '/employer/jobs',       Icon: ClipboardList, title: 'Manage jobs',            desc: 'Edit, close, or reopen existing listings',    delay: 'animate-delay-2' },
          { href: '/employer/company',    Icon: Building2,     title: 'Update company profile', desc: 'Make your brand visible to candidates',       delay: 'animate-delay-3' },
        ] as { href: string; Icon: LucideIcon; title: string; desc: string; delay: string }[]).map(item => (
          <Link key={item.href} href={item.href} className={`animate-fade-up ${item.delay}`}>
            <Card className="p-5 hover:border-teal-500/30 hover:bg-teal-500/6 transition cursor-pointer h-full group">
              <span className="w-9 h-9 rounded-full border border-teal-500/25 bg-teal-500/8 flex items-center justify-center">
                <item.Icon size={16} className="text-teal-400" strokeWidth={1.75} />
              </span>
              <h3 className="font-medium mt-3">{item.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
