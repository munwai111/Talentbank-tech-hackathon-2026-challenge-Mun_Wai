// /portfolio — Living Portfolio
// Server Component: fetches portfolio items directly from DB.
// Items are added/edited via the Skills Vault (profile page, portfolio tab).

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PortfolioItem } from '@/types/database'

// ── Portfolio card ────────────────────────────────────────────────────────────

function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-4 hover:border-zinc-300 transition-colors">
      {/* Title + links */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 truncate">{item.title}</h3>
          {item.ai_summary && (
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.ai_summary}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-2.5 py-1 rounded-lg hover:border-zinc-400 transition-colors"
            >
              Live ↗
            </a>
          )}
          {item.repo_url && (
            <a
              href={item.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-2.5 py-1 rounded-lg hover:border-zinc-400 transition-colors"
            >
              🐙 Repo ↗
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-sm text-zinc-600 leading-relaxed">{item.description}</p>
      )}

      {/* Tech stack */}
      {item.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tech_stack.map(tech => (
            <Badge
              key={tech}
              variant="outline"
              className="text-xs text-zinc-600 border-zinc-200"
            >
              {tech}
            </Badge>
          ))}
        </div>
      )}

      {/* Impact */}
      {item.impact && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <span className="text-emerald-600 text-sm">📈</span>
          <p className="text-xs text-emerald-700 font-medium">{item.impact}</p>
        </div>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyPortfolio() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🗃️</p>
      <h2 className="text-lg font-semibold text-zinc-700 mb-2">No projects yet</h2>
      <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
        Add projects from the Skills Vault — or import from GitHub and let AI extract your tech stack automatically.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/profile?tab=portfolio">
          <Button size="sm">Add a project →</Button>
        </Link>
        <Link href="/profile?tab=github">
          <Button size="sm" variant="outline">Import from GitHub</Button>
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PortfolioPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!dbUser) redirect('/onboarding')

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, name')
    .eq('user_id', dbUser.id)
    .single()

  const { data: items } = profile
    ? await supabase
        .from('portfolio_items')
        .select('id, candidate_id, title, description, url, repo_url, tech_stack, impact, ai_summary, created_at')
        .eq('candidate_id', profile.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const portfolio = items ?? []

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Living Portfolio</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {portfolio.length > 0
              ? `${portfolio.length} project${portfolio.length !== 1 ? 's' : ''} — evidence of what you can actually build`
              : 'Show employers what you\'ve built, not just what you know'}
          </p>
        </div>
        <Link href="/profile?tab=portfolio">
          <Button size="sm" variant="outline">
            + Add project
          </Button>
        </Link>
      </div>

      {portfolio.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portfolio.map(item => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {portfolio.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/profile?tab=github">
            <Button variant="outline" size="sm">
              🐙 Import more from GitHub →
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
