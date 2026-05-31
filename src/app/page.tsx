import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Landing page — first thing judges and new users see.
// Server Component: no interactivity needed, fast load.
export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">Career OS</span>
          <Badge variant="secondary" className="text-xs">APAC</Badge>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="flex flex-col items-center text-center px-6 py-20 max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-6 text-zinc-500">
          Talentbank Tech Hackathon 2026
        </Badge>

        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-4">
          Your career GPS —<br />
          <span className="text-blue-600">not a job board.</span>
        </h1>

        <p className="text-xl text-zinc-500 max-w-2xl mb-4 leading-relaxed">
          Career OS shows you where your skills stand, where people like you
          typically go next, and exactly what to build to get there.
          No keyword games. No school-name filters.
        </p>

        <p className="text-sm text-zinc-400 mb-10">
          Designed for Malaysia &amp; Singapore — salary ranges in MYR, APAC market context.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="px-8">
              Start navigating your career →
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="px-8">
              I&apos;m hiring talent
            </Button>
          </Link>
        </div>
      </main>

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="border-t bg-zinc-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything your career needs in one OS</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Six interconnected modules. Each one makes the next more powerful.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-white rounded-xl p-6 border transition-all ${
                  f.highlight ? 'border-blue-200 ring-1 ring-blue-100' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{f.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.highlight ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Employer strip ───────────────────────────────────────── */}
      <section className="border-t px-6 py-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-3">For employers: hire on ability, not labels</h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              Post jobs with required and nice-to-have skills. Get a ranked shortlist where
              every candidate&apos;s skill fit is visible at a glance — matched skills, gaps, and
              the exact profiles worth interviewing. No more CV keyword roulette.
            </p>
            <Link href="/sign-up">
              <Button variant="outline">Post a role →</Button>
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {EMPLOYER_FEATURES.map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-zinc-50 rounded-lg p-4 border">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-zinc-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────── */}
      <section className="border-t bg-zinc-900 text-white px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stop guessing. Start navigating.</h2>
          <p className="text-zinc-400 mb-8">
            Free to use. No CV required to start. Build your skills profile
            and see your career paths in under 5 minutes.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 px-10">
              Get started free →
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-6 text-center text-xs text-zinc-400">
        Career OS · Skills-first hiring for APAC · Talentbank Tech Hackathon 2026
      </footer>
    </div>
  )
}

// ── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🗂️',
    title: 'Skills Vault',
    desc: 'Add skills with evidence. Import from GitHub — AI reads your repos and extracts your real stack. Upload your resume and Claude structures it in seconds.',
    tag: 'Foundation',
    highlight: false,
  },
  {
    icon: '🧭',
    title: 'Career Identity',
    desc: 'Answer 4 questions about goals, values, and work style. Claude writes a professional narrative that tells employers who you actually are — not just what you\'ve done.',
    tag: 'AI-powered',
    highlight: false,
  },
  {
    icon: '🗺️',
    title: 'Path Navigator',
    desc: '3 career directions mapped from your current skills: a strong match today, an emerging path in 6–18 months, and a stretch goal. Salary ranges in MYR. Real trade-offs named.',
    tag: 'Navigation',
    highlight: true,
  },
  {
    icon: '🎯',
    title: 'Job Matches',
    desc: 'Every open role ranked by skill overlap. Matched skills in green, gaps in red. No black-box scores — you see exactly why you match or don\'t.',
    tag: 'Transparent',
    highlight: false,
  },
  {
    icon: '🤖',
    title: 'AI Coach',
    desc: 'Live streaming career advice from an AI that knows your skills, goals, and the APAC market. Real salary bands in MYR. Honest about what you\'re missing.',
    tag: 'Streaming AI',
    highlight: false,
  },
  {
    icon: '🗃️',
    title: 'Living Portfolio',
    desc: 'Showcase what you\'ve built, not just what you know. Projects with tech stack, impact metrics, and AI-generated summaries that make your work legible.',
    tag: 'Evidence',
    highlight: false,
  },
]

const EMPLOYER_FEATURES = [
  { icon: '📋', label: 'Skills-first job posting' },
  { icon: '📊', label: 'Ranked talent shortlists' },
  { icon: '🔍', label: 'Visible skill gap analysis' },
  { icon: '🏢', label: 'Culture identity synthesis' },
]
