// Candidate Dashboard — first screen after login
// Server Component: fetches profile + match count directly from DB
import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()

  // Get DB user → candidate profile
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('clerk_id', user.id)
    .single()

  // New user who hasn't finished onboarding
  if (!dbUser) redirect('/onboarding')
  if (dbUser.role === 'employer') redirect('/employer/dashboard')

  // Only fetch what the dashboard renders — counts + completeness fields
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('headline, bio, location, github_url, embedding, career_data, skills(id)')
    .eq('user_id', dbUser.id)
    .single()

  const skillCount = profile?.skills?.length ?? 0
  const hasEmbedding = !!profile?.embedding
  const hasCareerIdentity = !!profile?.career_data?.synthesized_at
  const firstName = user.firstName ?? 'there'

  // Profile completeness score (shown as motivation)
  const completeness = [
    profile?.headline,
    profile?.bio,
    profile?.location,
    skillCount > 0,
    profile?.github_url,
  ].filter(Boolean).length * 20  // 0–100

  return (
    <div className="p-8 max-w-4xl">
      {/* ── Greeting ─────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Hey {firstName} 👋</h1>
        <p className="text-zinc-500 mt-1">
          {hasEmbedding
            ? "Your profile is active — employers can find you."
            : "Complete your Skills Vault to start getting matched."}
        </p>
      </div>

      {/* ── Status cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-sm text-zinc-500 mb-1">Profile strength</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{completeness}%</span>
          </div>
          <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-zinc-500 mb-1">Skills verified</p>
          <span className="text-3xl font-bold">{skillCount}</span>
          <p className="text-xs text-zinc-400 mt-1">
            {skillCount === 0 ? 'Add skills to get matched' : 'in your vault'}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-zinc-500 mb-1">Matching status</p>
          <Badge variant={hasEmbedding ? 'default' : 'secondary'} className="mt-1">
            {hasEmbedding ? '🟢 Active' : '⚪ Not active'}
          </Badge>
          <p className="text-xs text-zinc-400 mt-1">
            {hasEmbedding ? 'Employers can match you' : 'Add skills to activate'}
          </p>
        </Card>
      </div>

      {/* ── Career Identity nudge ────────────────────────────── */}
      {!hasCareerIdentity && (
        <Card className="p-6 border-purple-100 bg-purple-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900">🧭 Build your Career Identity</h3>
              <p className="text-sm text-purple-700 mt-1">
                5 minutes. Tell us what you actually want — values, goals, work style.
                It shapes every match you get and shows employers who you really are.
              </p>
            </div>
            <Link href="/discover">
              <Button size="sm" className="shrink-0 ml-4 bg-purple-600 hover:bg-purple-700">
                Start →
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Next action prompt ────────────────────────────────── */}
      {completeness < 100 && (
        <Card className="p-6 border-blue-100 bg-blue-50 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                {skillCount === 0
                  ? '🗂️ Build your Skills Vault first'
                  : '🎯 Almost there — complete your profile'}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {skillCount === 0
                  ? "Add your skills and projects so employers can find you based on what you can do — not where you studied."
                  : `You're ${completeness}% done. Fill in the remaining details to activate full matching.`}
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="shrink-0 ml-4">
                {skillCount === 0 ? 'Build vault →' : 'Complete profile →'}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Path Navigator nudge (show once profile is reasonably built) ─── */}
      {skillCount > 0 && hasCareerIdentity && (
        <Card className="p-6 border-indigo-100 bg-indigo-50 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-indigo-900">🗺️ See your Career Path Navigator</h3>
              <p className="text-sm text-indigo-700 mt-1">
                3 directions mapped from your actual skills — not a prediction, a navigation.
                Where do people like you typically go next?
              </p>
            </div>
            <Link href="/paths">
              <Button size="sm" className="shrink-0 ml-4 bg-indigo-600 hover:bg-indigo-700">
                Navigate →
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Quick actions ─────────────────────────────────────── */}
      <h2 className="font-semibold mb-4 text-zinc-700">Quick actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            href: '/profile',
            icon: '🗂️',
            title: 'Skills Vault',
            desc: 'Add skills, projects, and import from GitHub',
          },
          {
            href: '/paths',
            icon: '🗺️',
            title: 'Path Navigator',
            desc: skillCount > 0 ? 'See 3 directions based on your skills' : 'Add skills first to unlock',
            disabled: skillCount === 0,
          },
          {
            href: '/jobs',
            icon: '🎯',
            title: 'View job matches',
            desc: skillCount > 0 ? 'See roles matched to your skills' : 'Add skills first to unlock',
            disabled: skillCount === 0,
          },
          {
            href: '/coach',
            icon: '🤖',
            title: 'Talk to AI Coach',
            desc: 'Get honest advice on your career path',
          },
          {
            href: '/portfolio',
            icon: '🗃️',
            title: 'Living Portfolio',
            desc: 'Show what you\'ve built — not just what you know',
          },
          {
            href: '/profile?tab=github',
            icon: '🐙',
            title: 'Import from GitHub',
            desc: 'AI extracts skills from your repos automatically',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            className={item.disabled ? 'pointer-events-none opacity-50' : ''}
          >
            <Card className="p-5 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer h-full">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-medium mt-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
