// Candidate Dashboard — first screen after login
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', user.id)
    .single()

  if (!dbUser) redirect('/onboarding')
  if (dbUser.role === 'employer') redirect('/employer/dashboard')

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('headline, bio, location, github_url, embedding, career_data, skills(id)')
    .eq('user_id', dbUser.id)
    .single()

  const skillCount = profile?.skills?.length ?? 0
  const hasEmbedding = !!profile?.embedding
  const hasCareerIdentity = !!profile?.career_data?.synthesized_at
  const hasLifeChapter = !!profile?.career_data?.life_chapter_context
  const firstName = user.firstName ?? 'there'

  type CoachNudge = { message: string; prompt: string } | null
  const coachNudge: CoachNudge = (() => {
    if (!hasCareerIdentity || skillCount < 3) return null
    if (hasLifeChapter) {
      return {
        message: "Your life context is set — your coach can factor it into salary and role advice.",
        prompt: "Given my life situation, what roles and salary ranges should I be targeting right now?",
      }
    }
    if (skillCount >= 5) {
      return {
        message: `You have ${skillCount} skills in your vault. Your coach can tell you if you're paid what you're worth.`,
        prompt: "Based on my skills, am I being paid what the market says I should be earning in Malaysia?",
      }
    }
    return {
      message: "Your Career Identity is live. Your coach can map your next realistic move.",
      prompt: "What's the most realistic next role I should be targeting given where I am right now?",
    }
  })()

  const completeness = [
    profile?.headline,
    profile?.bio,
    profile?.location,
    skillCount > 0,
    profile?.github_url,
  ].filter(Boolean).length * 20

  return (
    <div className="p-8 max-w-4xl">

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-white">Hey {firstName} 👋</h1>
        <p className="text-zinc-400 mt-1">
          {hasEmbedding
            ? "Your profile is active — employers can find you."
            : "Complete your Skills Vault to start getting matched."}
        </p>
      </div>

      {/* ── Status cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Profile strength */}
        <div className="rounded-xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm animate-fade-up animate-delay-1">
          <p className="text-sm text-zinc-400 mb-1">Profile strength</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{completeness}%</span>
          </div>
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${completeness}%`,
                background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
              }}
            />
          </div>
        </div>

        {/* Skills verified */}
        <div className="rounded-xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm animate-fade-up animate-delay-2">
          <p className="text-sm text-zinc-400 mb-1">Skills verified</p>
          <span className="text-3xl font-bold text-white">{skillCount}</span>
          <p className="text-xs text-zinc-500 mt-1">
            {skillCount === 0 ? 'Add skills to get matched' : 'in your vault'}
          </p>
        </div>

        {/* Matching status */}
        <div className="rounded-xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm animate-fade-up animate-delay-3">
          <p className="text-sm text-zinc-400 mb-1">Matching status</p>
          <div className="mt-1">
            {hasEmbedding ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                Not active
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {hasEmbedding ? 'Employers can match you' : 'Add skills to activate'}
          </p>
        </div>
      </div>

      {/* ── Career Identity nudge ────────────────────────────────────────── */}
      {!hasCareerIdentity && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 p-6 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-violet-200">🧭 Build your Career Identity</h3>
              <p className="text-sm text-violet-300/70 mt-1">
                5 minutes. Tell us what you actually want — values, goals, work style.
                It shapes every match you get and shows employers who you really are.
              </p>
            </div>
            <Link href="/discover">
              <Button size="sm" className="shrink-0 ml-4 bg-violet-600 hover:bg-violet-500 border-0 text-white">
                Start →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Profile completion nudge ─────────────────────────────────────── */}
      {completeness < 100 && (
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/8 p-6 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-indigo-200">
                {skillCount === 0 ? '🗂️ Build your Skills Vault first' : '🎯 Almost there — complete your profile'}
              </h3>
              <p className="text-sm text-indigo-300/70 mt-1">
                {skillCount === 0
                  ? "Add your skills and projects so employers can find you based on what you can do — not where you studied."
                  : `You're ${completeness}% done. Fill in the remaining details to activate full matching.`}
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="shrink-0 ml-4 bg-indigo-600 hover:bg-indigo-500 border-0 text-white">
                {skillCount === 0 ? 'Build vault →' : 'Complete profile →'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Path Navigator nudge ─────────────────────────────────────────── */}
      {skillCount > 0 && hasCareerIdentity && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 p-6 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-blue-200">🗺️ See your Career Path Navigator</h3>
              <p className="text-sm text-blue-300/70 mt-1">
                3 directions mapped from your actual skills — not a prediction, a navigation.
                Where do people like you typically go next?
              </p>
            </div>
            <Link href="/paths">
              <Button size="sm" className="shrink-0 ml-4 bg-blue-600 hover:bg-blue-500 border-0 text-white">
                Navigate →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Proactive coach nudge ────────────────────────────────────────── */}
      {coachNudge && (
        <div className="rounded-xl border border-teal-500/25 bg-teal-500/8 p-6 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-teal-200">🤖 Your coach has something to say</h3>
              <p className="text-sm text-teal-300/70 mt-1">{coachNudge.message}</p>
              <p className="text-xs text-teal-400/60 mt-2 font-medium">
                Suggested: &ldquo;{coachNudge.prompt}&rdquo;
              </p>
            </div>
            <Link href={`/coach?q=${encodeURIComponent(coachNudge.prompt)}`} className="shrink-0">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-500 border-0 text-white whitespace-nowrap">
                Ask coach →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <h2 className="font-semibold mb-4 text-zinc-400 text-sm uppercase tracking-wide mt-8">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/profile',            icon: '🗂️', title: 'Skills Vault',       desc: 'Add skills, projects, and import from GitHub',           delay: 'animate-delay-1' },
          { href: '/paths',              icon: '🗺️', title: 'Path Navigator',     desc: skillCount > 0 ? 'See 3 directions based on your skills' : 'Add skills first to unlock', disabled: skillCount === 0, delay: 'animate-delay-2' },
          { href: '/jobs',               icon: '🎯', title: 'View job matches',   desc: skillCount > 0 ? 'See roles matched to your skills' : 'Add skills first to unlock',    disabled: skillCount === 0, delay: 'animate-delay-2' },
          { href: '/coach',              icon: '🤖', title: 'Talk to AI Coach',   desc: 'Get honest advice on your career path',                  delay: 'animate-delay-3' },
          { href: '/portfolio',          icon: '🗃️', title: 'Living Portfolio',   desc: "Show what you've built — not just what you know",        delay: 'animate-delay-3' },
          { href: '/profile?tab=github', icon: '🐙', title: 'Import from GitHub', desc: 'AI extracts skills from your repos automatically',       delay: 'animate-delay-4' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            className={`animate-fade-up ${item.delay ?? ''} ${item.disabled ? 'pointer-events-none opacity-40' : ''}`}
          >
            <div className="rounded-xl border border-white/7 bg-white/3 p-5
              hover:border-indigo-500/30 hover:bg-indigo-500/8 transition-all duration-200
              cursor-pointer h-full group">
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">{item.icon}</span>
              <h3 className="font-medium mt-2 text-zinc-200">{item.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
