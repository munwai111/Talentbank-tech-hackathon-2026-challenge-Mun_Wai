// Candidate Dashboard
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CircularProgress } from '@/components/ui/CircularProgress'
import {
  Vault, Waypoints, Crosshair, BrainCircuit, FolderOpen, GitBranch,
  Fingerprint, type LucideIcon,
} from 'lucide-react'

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
    .select('headline, bio, location, github_url, embedding, career_data, skills(id)')
    .eq('user_id', dbUser.id).single()

  const skillCount = profile?.skills?.length ?? 0
  // Matching is "active" when the candidate has enough skills — not gated on
  // the pgvector embedding (which requires OPENAI_API_KEY and generates async).
  const isMatchingActive = skillCount >= 5
  const hasCareerIdentity = !!profile?.career_data?.synthesized_at
  const hasLifeChapter = !!profile?.career_data?.life_chapter_context
  const firstName = user.firstName ?? 'there'

  type CoachNudge = { message: string; prompt: string } | null
  const coachNudge: CoachNudge = (() => {
    if (!hasCareerIdentity || skillCount < 3) return null
    if (hasLifeChapter) return {
      message: "Your life context is set — your coach can factor it into salary and role advice.",
      prompt: "Given my life situation, what roles and salary ranges should I be targeting right now?",
    }
    if (skillCount >= 5) return {
      message: `You have ${skillCount} skills in your vault. Your coach can tell you if you're paid what you're worth.`,
      prompt: "Based on my skills, am I being paid what the market says I should be earning in Malaysia?",
    }
    return {
      message: "Your Career Identity is live. Your coach can map your next realistic move.",
      prompt: "What's the most realistic next role I should be targeting given where I am right now?",
    }
  })()

  const completeness = [
    profile?.headline, profile?.bio, profile?.location, skillCount > 0, profile?.github_url,
  ].filter(Boolean).length * 20

  const QUICK_ACTIONS: { href: string; Icon: LucideIcon; iconColor: string; label: string; desc: string; gradient: string; border: string; glow: string; disabled: boolean }[] = [
    { href: '/profile',            Icon: Vault,        iconColor: 'text-amber-400',  label: 'Skills Vault',      desc: 'Add skills, import from GitHub',                                        gradient: 'from-amber-500/15 to-yellow-500/8',   border: 'border-amber-500/18',  glow: 'hover:shadow-amber-500/10',  disabled: false },
    { href: '/paths',              Icon: Waypoints,    iconColor: 'text-sky-400',    label: 'Path Navigator',    desc: skillCount > 0 ? 'See 3 directions mapped from your skills' : 'Add skills first', gradient: 'from-sky-500/15 to-indigo-500/8',    border: 'border-sky-500/18',    glow: 'hover:shadow-sky-500/10',    disabled: skillCount === 0 },
    { href: '/jobs',               Icon: Crosshair,    iconColor: 'text-rose-400',   label: 'Job Matches',       desc: skillCount > 0 ? 'Roles ranked by skill fit' : 'Add skills first',    gradient: 'from-rose-500/15 to-pink-500/8',      border: 'border-rose-500/18',   glow: 'hover:shadow-rose-500/10',   disabled: skillCount === 0 },
    { href: '/coach',              Icon: BrainCircuit, iconColor: 'text-indigo-400', label: 'AI Coach',          desc: 'Honest APAC career advice',                                             gradient: 'from-indigo-500/15 to-blue-500/8',    border: 'border-indigo-500/18', glow: 'hover:shadow-indigo-500/10', disabled: false },
    { href: '/portfolio',          Icon: FolderOpen,   iconColor: 'text-teal-400',   label: 'Portfolio',         desc: "Showcase what you've built",                                            gradient: 'from-teal-500/15 to-emerald-500/8',   border: 'border-teal-500/18',   glow: 'hover:shadow-teal-500/10',   disabled: false },
    { href: '/profile?tab=github', Icon: GitBranch,    iconColor: 'text-violet-400', label: 'GitHub Import',     desc: 'AI extracts your real skill stack',                                     gradient: 'from-violet-500/15 to-purple-500/8',  border: 'border-violet-500/18', glow: 'hover:shadow-violet-500/10', disabled: false },
  ]

  return (
    <div className="px-8 py-6 max-w-5xl">

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-600 mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Hey {firstName} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {isMatchingActive ? "Your profile is active — employers can find you." : "Complete your Skills Vault to start getting matched."}
        </p>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">

        {/* Profile Strength */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up animate-delay-1"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.06) 100%)', border: '1px solid rgba(124,58,237,0.22)' }}>
          <div className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.15), transparent 70%)' }} />
          <p className="text-[11px] font-semibold tracking-wider uppercase text-violet-400/70 mb-3">Profile Strength</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <CircularProgress value={completeness} size={64} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">{completeness}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{completeness}<span className="text-base text-violet-400">%</span></p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {completeness === 100 ? 'Complete' : `${5 - Math.round(completeness / 20)} fields left`}
              </p>
            </div>
          </div>
          <div className="mt-3 h-1 bg-white/6 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition duration-1000"
              style={{ width: `${completeness}%`, background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
          </div>
        </div>

        {/* Skills Vault */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up animate-delay-2"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="absolute inset-0 opacity-40"
            style={{ background: 'radial-gradient(ellipse at bottom left, rgba(16,185,129,0.12), transparent 70%)' }} />
          <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400/70 mb-3">Skills in Vault</p>
          <p className="text-4xl font-bold tracking-tight"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {skillCount}
          </p>
          <p className="text-xs text-zinc-500 mt-1.5">
            {skillCount === 0 ? 'No skills added yet' : skillCount < 5 ? 'Add more to unlock matching' : 'Matching-ready'}
          </p>
          {skillCount > 0 && (
            <div className="mt-3 flex gap-0.5">
              {Array.from({ length: Math.min(skillCount, 10) }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full bg-emerald-500/40" />
              ))}
              {skillCount > 10 && <div className="h-1 w-4 rounded-full bg-emerald-500/20" />}
            </div>
          )}
        </div>

        {/* Match Status */}
        <div className="relative rounded-2xl p-5 overflow-hidden animate-fade-up animate-delay-3"
          style={isMatchingActive
            ? { background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(99,102,241,0.06) 100%)', border: '1px solid rgba(6,182,212,0.2)' }
            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-zinc-600 mb-3">Match Status</p>
          {isMatchingActive ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                </span>
                <span className="text-sm font-semibold text-cyan-300">Active</span>
              </div>
              <p className="text-xs text-zinc-500">Visible to employers</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xs text-cyan-400 font-medium">Matching live</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-zinc-400">Inactive</p>
              <p className="text-xs text-zinc-600 mt-1">Add skills to activate</p>
              <Link href="/profile">
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  bg-white/6 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10
                  transition cursor-pointer">
                  <span className="text-xs text-zinc-400 font-medium">Build vault →</span>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Nudge cards ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-8">
        {!hasCareerIdentity && (
          <NudgeCard
            href="/discover" color="violet" Icon={Fingerprint}
            title="Build your Career Identity"
            desc="5 minutes. Tell us what you want — values, goals, work style. Shapes every match."
            cta="Start →"
          />
        )}
        {completeness < 100 && (
          <NudgeCard
            href="/profile" color="indigo" Icon={skillCount === 0 ? Vault : Crosshair}
            title={skillCount === 0 ? 'Build your Skills Vault first' : 'Complete your profile'}
            desc={skillCount === 0
              ? "Add skills so employers can find you on ability — not school name."
              : `You're ${completeness}% done. ${5 - Math.round(completeness / 20)} fields left to activate full matching.`}
            cta={skillCount === 0 ? 'Build vault →' : 'Complete →'}
          />
        )}
        {skillCount > 0 && hasCareerIdentity && (
          <NudgeCard
            href="/paths" color="blue" Icon={Waypoints}
            title="See your Career Path Navigator"
            desc="3 directions from your real skills — strong match today, emerging in 6–18 months, stretch goal."
            cta="Navigate →"
          />
        )}
        {coachNudge && (
          <NudgeCard
            href={`/coach?q=${encodeURIComponent(coachNudge.prompt)}`}
            color="teal" Icon={BrainCircuit}
            title="Your coach has something to say"
            desc={coachNudge.message}
            cta="Ask coach →"
          />
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="mb-2">
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-600 mb-4">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((item, i) => (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={`animate-fade-up animate-delay-${Math.min(i + 1, 6)} ${item.disabled ? 'pointer-events-none opacity-35' : ''}`}
            >
              <div className={`rounded-2xl p-4 border bg-gradient-to-br ${item.gradient} ${item.border}
                hover:shadow-lg ${item.glow} transition duration-200 cursor-pointer h-full group`}>
                <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center mb-3
                  group-hover:scale-110 transition-transform duration-200">
                  <item.Icon size={17} className={item.iconColor} strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-zinc-200 mb-0.5">{item.label}</p>
                <p className="text-xs text-zinc-500 leading-snug">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── NudgeCard component ──────────────────────────────────────────────────────

type NudgeProps = {
  href: string
  color: 'violet' | 'indigo' | 'blue' | 'teal'
  Icon: LucideIcon
  title: string
  desc: string
  cta: string
}

const NUDGE_STYLES: Record<NudgeProps['color'], { border: string; bg: string; titleColor: string; descColor: string; btnClass: string }> = {
  violet: {
    border: 'border-l-violet-500/60 border-violet-500/15',
    bg: 'bg-violet-500/6',
    titleColor: 'text-violet-200',
    descColor: 'text-violet-300/60',
    btnClass: 'bg-violet-600 hover:bg-violet-500 text-white',
  },
  indigo: {
    border: 'border-l-indigo-500/60 border-indigo-500/15',
    bg: 'bg-indigo-500/6',
    titleColor: 'text-indigo-200',
    descColor: 'text-indigo-300/60',
    btnClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
  blue: {
    border: 'border-l-blue-500/60 border-blue-500/15',
    bg: 'bg-blue-500/6',
    titleColor: 'text-blue-200',
    descColor: 'text-blue-300/60',
    btnClass: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
  teal: {
    border: 'border-l-teal-500/60 border-teal-500/15',
    bg: 'bg-teal-500/6',
    titleColor: 'text-teal-200',
    descColor: 'text-teal-300/60',
    btnClass: 'bg-teal-600 hover:bg-teal-500 text-white',
  },
}

function NudgeCard({ href, color, Icon, title, desc, cta }: NudgeProps) {
  const s = NUDGE_STYLES[color]
  return (
    <div className={`rounded-2xl border-l-[3px] border ${s.border} ${s.bg} px-5 py-4 backdrop-blur-sm`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon size={16} className={`shrink-0 mt-0.5 ${s.titleColor}`} strokeWidth={1.75} />
          <div className="min-w-0">
            <h3 className={`font-semibold text-sm ${s.titleColor}`}>{title}</h3>
            <p className={`text-xs mt-0.5 leading-relaxed ${s.descColor}`}>{desc}</p>
          </div>
        </div>
        <Link href={href} className="shrink-0">
          <button className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${s.btnClass}`}>
            {cta}
          </button>
        </Link>
      </div>
    </div>
  )
}
