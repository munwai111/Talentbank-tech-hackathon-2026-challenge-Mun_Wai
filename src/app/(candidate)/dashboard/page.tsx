// Candidate Dashboard — the Navigator's home base.
// Left rail: identity + personal menu. Main: getting-started checklist,
// application progress with recalibrating focus signals, status cards.
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { ProfileRail } from './ProfileRail'
import {
  BrainCircuit, Fingerprint, Waypoints, Check, ArrowRight,
  BadgeCheck, Clock, type LucideIcon,
} from 'lucide-react'

/* ── Focus signal — recalibrates with application age ─────────────────────
   Deterministic coaching heuristic: status × days-since-applied → where the
   candidate's effort is best spent right now. Recomputed on every visit. */
function focusSignal(status: string, days: number): { tone: string; text: string; coachQ: string } {
  if (status === 'offer') return {
    tone: 'text-emerald-400',
    text: 'Offer on the table — respond promptly.',
    coachQ: 'I received a job offer. How should I evaluate and negotiate it?',
  }
  if (status === 'interview') return {
    tone: 'text-sky-400',
    text: 'High priority — prep with your AI Coach.',
    coachQ: 'I have an interview coming up for this role. Help me prepare.',
  }
  if (status === 'reviewing') return days > 10
    ? { tone: 'text-amber-400', text: `In review for ${days} days — a polite follow-up is reasonable.`, coachQ: 'My application has been in review for a while. Should I follow up, and how?' }
    : { tone: 'text-amber-400', text: 'In review — stay ready.', coachQ: 'My application is being reviewed. What should I do while I wait?' }
  if (days > 14) return {
    tone: 'text-zinc-500',
    text: `No movement in ${days} days — consider redirecting effort to stronger matches.`,
    coachQ: 'An application has had no response for over two weeks. Should I move on, and where should I focus instead?',
  }
  if (days > 7) return {
    tone: 'text-zinc-400',
    text: 'A week in — keep applying to stronger matches meanwhile.',
    coachQ: 'I applied a week ago with no response yet. What should my strategy be?',
  }
  return {
    tone: 'text-indigo-300',
    text: 'Recently applied — momentum is on your side.',
    coachQ: 'I just applied for a role. How do I maximise my chances from here?',
  }
}

const APP_STAGES = ['applied', 'reviewing', 'interview', 'offer']

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', user.id).single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role === 'employer') redirect('/employer/dashboard')

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, headline, bio, location, github_url, career_data, work_experience, verified_candidate, skills(id)')
    .eq('user_id', dbUser.id).single()

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, created_at, jobs(title, companies(name))')
    .eq('candidate_id', profile?.id ?? '')
    .order('created_at', { ascending: false })

  const skillCount = profile?.skills?.length ?? 0
  const hasCareerIdentity = !!profile?.career_data?.synthesized_at
  const hasLifeChapter = !!profile?.career_data?.life_chapter_context
  const hasImport = !!profile?.github_url || (profile?.work_experience?.length ?? 0) > 0
  const firstName = user.firstName ?? 'there'

  /* ── Getting-started checklist — computed from real account state ──────── */
  const todo: { label: string; desc: string; done: boolean; href: string }[] = [
    { label: 'Add your first 5 skills',        desc: 'Unlocks job matching',                       done: skillCount >= 5,                         href: '/profile?mode=edit&section=skills' },
    { label: 'Import your CV or GitHub',       desc: 'AI verifies and structures your history',    done: hasImport,                               href: '/profile?mode=edit&section=skills' },
    { label: 'Set your headline and location', desc: 'Makes you legible to employers',             done: !!profile?.headline && !!profile?.location, href: '/profile?tab=settings' },
    { label: 'Complete your Career Identity',  desc: 'Goals and values shape every match',         done: hasCareerIdentity,                       href: '/discover' },
    { label: 'Add your life chapter context',  desc: 'Advice grounded in your reality',            done: hasLifeChapter,                          href: '/discover' },
    { label: 'Apply to your first role',       desc: 'Start your application pipeline',            done: (applications?.length ?? 0) > 0,         href: '/jobs' },
  ]
  const doneCount = todo.filter(t => t.done).length
  const setupPct = Math.round((doneCount / todo.length) * 100)
  const isNewAccount = doneCount < todo.length

  const coachNudge = hasCareerIdentity && skillCount >= 3 ? {
    message: hasLifeChapter
      ? 'Your life context is set — your coach can factor it into salary and role advice.'
      : `You have ${skillCount} skills in your vault. Your coach can tell you if you're paid what you're worth.`,
    prompt: hasLifeChapter
      ? 'Given my life situation, what roles and salary ranges should I be targeting right now?'
      : 'Based on my skills, am I being paid what the market says I should be earning in Malaysia?',
  } : null

  return (
    <div className="px-6 py-6 flex gap-6 items-start">
      <ProfileRail />

      <div className="flex-1 min-w-0 max-w-3xl">

        {/* ── Greeting ───────────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-up">
          <p className="section-label mb-1">Home base</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Hey {firstName}</h1>
            {profile?.verified_candidate ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <BadgeCheck size={12} strokeWidth={2} /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/6 text-zinc-500 border border-white/10">
                <Clock size={11} strokeWidth={2} /> Verification pending
              </span>
            )}
          </div>
          <p className="text-zinc-500 mt-1 text-sm">
            {skillCount >= 5 ? 'Your profile is live — employers can find you.' : 'Complete your setup to start getting matched.'}
          </p>
        </div>

        {/* ── Getting started / account completion ──────────────────────── */}
        {isNewAccount && (
          <div className="surface p-5 mb-5 animate-fade-up animate-delay-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label mb-1">Getting started</p>
                <p className="text-sm text-zinc-400">{doneCount} of {todo.length} complete — every item makes your matches sharper.</p>
              </div>
              <div className="relative shrink-0">
                <CircularProgress value={setupPct} size={52} stroke={4} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">{setupPct}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              {todo.map(item => (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group ${
                    item.done ? 'opacity-50' : 'hover:bg-white/5'
                  }`}>
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    item.done
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'border-white/20 text-transparent group-hover:border-indigo-400/50'
                  }`}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span className={`text-sm font-medium ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-xs text-zinc-600 ml-auto hidden sm:inline">{item.desc}</span>
                  {!item.done && <ArrowRight size={13} className="text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Application progress ───────────────────────────────────────── */}
        {applications && applications.length > 0 && (
          <div className="surface p-5 mb-5 animate-fade-up animate-delay-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="section-label mb-1">Your applications</p>
                <p className="text-sm text-zinc-400">Live status — focus signals recalibrate as time passes.</p>
              </div>
              <Link href="/applications" className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-4">
              {applications.slice(0, 4).map(app => {
                const job = app.jobs as unknown as { title: string; companies: { name: string } } | null
                const days = Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86_400_000)
                const signal = focusSignal(app.status, days)
                const stageIdx = APP_STAGES.indexOf(app.status)
                const isDead = app.status === 'rejected' || app.status === 'withdrawn'
                return (
                  <div key={app.id} className={`pb-4 border-b border-white/6 last:border-0 last:pb-0 ${isDead ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{job?.title ?? 'Role'}</p>
                        <p className="text-xs text-zinc-500">{job?.companies?.name} · applied {days === 0 ? 'today' : `${days}d ago`}</p>
                      </div>
                      <span className="text-xs text-zinc-400 capitalize shrink-0">{app.status}</span>
                    </div>
                    {!isDead && (
                      <div className="flex items-center gap-1.5 mb-2">
                        {APP_STAGES.map((stage, i) => (
                          <div key={stage} className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= stageIdx ? 'bg-gradient-to-r from-indigo-500 to-violet-400' : 'bg-white/8'
                          }`} />
                        ))}
                      </div>
                    )}
                    {!isDead && (
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-xs ${signal.tone}`}>{signal.text}</p>
                        <Link href={`/coach?q=${encodeURIComponent(signal.coachQ)}`}
                          className="text-[11px] text-zinc-500 hover:text-indigo-300 transition-colors shrink-0 inline-flex items-center gap-1">
                          <BrainCircuit size={11} /> Consult coach
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Status cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Skills in vault" delay="animate-delay-2">
            <p className="text-3xl font-bold text-white">{skillCount}</p>
            <p className="text-xs text-zinc-500 mt-1">{skillCount >= 5 ? 'Matching-ready' : 'Add more to unlock matching'}</p>
          </StatCard>
          <StatCard label="Match status" delay="animate-delay-3">
            {skillCount >= 5 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                  </span>
                  <span className="text-sm font-semibold text-cyan-300">Live</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Visible to employers</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-400">Inactive</p>
                <p className="text-xs text-zinc-600 mt-1">Add skills to activate</p>
              </>
            )}
          </StatCard>
          <StatCard label="Applications" delay="animate-delay-4">
            <p className="text-3xl font-bold text-white">{applications?.length ?? 0}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {(applications?.length ?? 0) === 0 ? 'None yet — browse matches' : 'In your pipeline'}
            </p>
          </StatCard>
        </div>

        {/* ── Nudges ─────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {!hasCareerIdentity && (
            <NudgeCard
              href="/discover" Icon={Fingerprint}
              title="Build your Career Identity"
              desc="5 minutes. Tell us what you want — values, goals, work style. Shapes every match."
              cta="Start"
            />
          )}
          {skillCount > 0 && hasCareerIdentity && (
            <NudgeCard
              href="/paths" Icon={Waypoints}
              title="See your Career Path Navigator"
              desc="3 directions from your real skills — strong match today, emerging in 6–18 months, stretch goal."
              cta="Navigate"
            />
          )}
          {coachNudge && (
            <NudgeCard
              href={`/coach?q=${encodeURIComponent(coachNudge.prompt)}`}
              Icon={BrainCircuit}
              title="Your coach has something to say"
              desc={coachNudge.message}
              cta="Ask coach"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, delay, children }: { label: string; delay: string; children: React.ReactNode }) {
  return (
    <div className={`surface p-4 animate-fade-up ${delay}`}>
      <p className="section-label mb-2">{label}</p>
      {children}
    </div>
  )
}

function NudgeCard({ href, Icon, title, desc, cta }: {
  href: string
  Icon: LucideIcon
  title: string
  desc: string
  cta: string
}) {
  return (
    <div className="rounded-2xl border-l-[3px] border border-l-indigo-500/60 border-indigo-500/15 bg-indigo-500/6 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={16} className="shrink-0 mt-0.5 text-indigo-200" strokeWidth={1.75} />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-indigo-200">{title}</h3>
            <p className="text-xs mt-0.5 leading-relaxed text-indigo-300/60">{desc}</p>
          </div>
        </div>
        <Link href={href} className="shrink-0">
          <button className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5">
            {cta} <ArrowRight size={12} />
          </button>
        </Link>
      </div>
    </div>
  )
}
