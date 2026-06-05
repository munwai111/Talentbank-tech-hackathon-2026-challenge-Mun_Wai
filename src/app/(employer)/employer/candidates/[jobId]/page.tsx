// /employer/candidates/[jobId] — Ranked candidates for a specific job
// The employer's "match view": shows every candidate ranked by combined
// skill fit + career goal alignment (E-01). Mirrors the candidate's
// /jobs page but from the employer's perspective.

import { currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  normaliseSkill,
  scoreGoalAlignment,
  deriveGoalLabel,
  combinedMatchScore,
  candidateHasGoals,
} from '@/lib/matching'
import type { CareerData } from '@/types/database'

type SkillRow = { name: string; level: number; source: string }

type RankedCandidate = {
  id: string
  name: string
  headline: string | null
  location: string | null
  skills: SkillRow[]
  score_pct: number
  skill_pct: number
  goal_alignment_label: 'goal_match' | 'career_pivot' | null
  matched: string[]
  missing_required: string[]
  missing_nice: string[]
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert',
}

const SOURCE_COLORS: Record<string, string> = {
  github:     'bg-emerald-500/15 text-emerald-400',
  assessment: 'bg-blue-500/15 text-blue-400',
  manual:     'bg-white/8 text-zinc-400',
}

export default async function CandidatesForJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params

  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', user.id).single()
  if (!dbUser || dbUser.role !== 'employer') redirect('/dashboard')

  // ── Verify this job belongs to this employer ───────────────────────────────
  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', dbUser.id).single()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, description, required_skills, nice_to_have_skills, salary_min, salary_max, location, remote, status')
    .eq('id', jobId)
    .eq('company_id', company?.id ?? '')
    .single()

  if (!job) redirect('/employer/jobs')

  // ── Fetch all candidates with skills + career goals (for E-01 scoring) ───────
  // Note: career_data is used only for scoring — goal text is never shown to employers.
  const { data: allProfiles } = await supabase
    .from('candidate_profiles')
    .select('id, name, headline, location, career_data, skills(*)')

  if (!allProfiles || allProfiles.length === 0) {
    return (
      <div className="p-8 max-w-3xl">
        <BackLink jobTitle={job.title} />
        <Card className="p-10 text-center border-dashed mt-6">
          <p className="text-3xl mb-3">👥</p>
          <h3 className="font-semibold mb-1">No candidates yet</h3>
          <p className="text-sm text-zinc-500">
            Candidates are joining the platform. Check back soon.
          </p>
        </Card>
      </div>
    )
  }

  // ── Rank candidates by combined skill + goal alignment (E-01) ───────────────
  const required = job.required_skills ?? []
  const nice = job.nice_to_have_skills ?? []

  const ranked: RankedCandidate[] = allProfiles
    .map(profile => {
      const skills = (profile.skills as SkillRow[]) ?? []
      const careerData = (profile.career_data ?? null) as CareerData | null
      const candidateSkills = new Set(skills.map(s => normaliseSkill(s.name)))

      const matchedRequired = required.filter((s: string) => candidateSkills.has(normaliseSkill(s)))
      const missingRequired = required.filter((s: string) => !candidateSkills.has(normaliseSkill(s)))
      const matchedNice     = nice.filter((s: string) => candidateSkills.has(normaliseSkill(s)))
      const missingNice     = nice.filter((s: string) => !candidateSkills.has(normaliseSkill(s)))

      const reqScore  = required.length > 0 ? matchedRequired.length / required.length : 1
      const niceScore = nice.length     > 0 ? matchedNice.length     / nice.length     : 0
      const skillScore = reqScore * 0.75 + niceScore * 0.25
      const skillPct   = Math.round(skillScore * 100)

      const goalAlignmentPct = scoreGoalAlignment(careerData, {
        title: job.title,
        description: job.description,
      })
      const hasGoals    = candidateHasGoals(careerData)
      const combined    = combinedMatchScore(skillScore, goalAlignmentPct, hasGoals)

      return {
        id:                   profile.id,
        name:                 profile.name,
        headline:             profile.headline,
        location:             profile.location,
        skills,
        score_pct:            Math.round(combined * 100),
        skill_pct:            skillPct,
        goal_alignment_label: deriveGoalLabel(skillPct, goalAlignmentPct),
        matched:              [...matchedRequired, ...matchedNice],
        missing_required:     missingRequired,
        missing_nice:         missingNice,
      }
    })
    .filter(c => c.skills.length > 0)      // Only candidates who have skills
    .sort((a, b) => b.score_pct - a.score_pct)

  const strongMatches = ranked.filter(c => c.score_pct >= 70).length
  const partialMatches = ranked.filter(c => c.score_pct >= 40 && c.score_pct < 70).length

  return (
    <div className="p-8 max-w-3xl">
      <BackLink jobTitle={job.title} />

      {/* ── Job summary ──────────────────────────────────────── */}
      <Card className="p-5 mb-6 mt-4 bg-zinc-50">
        <div className="flex flex-wrap gap-2 text-sm text-zinc-500 mb-3">
          {job.location && <span>📍 {job.location}</span>}
          {job.salary_min && (
            <span>💰 RM {job.salary_min.toLocaleString()} – {job.salary_max?.toLocaleString()}/mo</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {required.map((s: string) => (
            <span key={s} className="text-xs bg-white/4 border border-white/15 text-zinc-300 px-2 py-0.5 rounded-full">
              {s} <span className="text-red-400">*</span>
            </span>
          ))}
          {nice.map((s: string) => (
            <span key={s} className="text-xs bg-white/4 border border-white/8 text-zinc-500 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
      </Card>

      {/* ── Match summary ─────────────────────────────────────── */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-zinc-500">{ranked.length} candidates</span>
        <span className="text-emerald-400 font-medium">{strongMatches} strong matches</span>
        <span className="text-amber-400">{partialMatches} partial</span>
        <span className="text-zinc-400">{ranked.length - strongMatches - partialMatches} stretch</span>
      </div>

      {/* ── Candidate cards ───────────────────────────────────── */}
      <div className="space-y-4">
        {ranked.map((candidate, idx) => (
          <Card key={candidate.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{candidate.name}</h3>
                  {candidate.headline && (
                    <p className="text-sm text-zinc-500">{candidate.headline}</p>
                  )}
                  {candidate.location && (
                    <p className="text-xs text-zinc-400 mt-0.5">📍 {candidate.location}</p>
                  )}
                </div>
              </div>
              {/* Score + goal label */}
              <div className="flex items-center gap-2 shrink-0">
                {candidate.goal_alignment_label === 'goal_match' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    🎯 Goal match
                  </span>
                )}
                {candidate.goal_alignment_label === 'career_pivot' && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    🔀 Growth hire
                  </span>
                )}
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                  candidate.score_pct >= 70 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                  candidate.score_pct >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                              'bg-red-500/15 text-red-400 border-red-500/30'
                }`}>
                  {candidate.score_pct}% match
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full ${
                  candidate.score_pct >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                  candidate.score_pct >= 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${candidate.score_pct}%` }}
              />
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {candidate.matched.map(s => (
                <Badge key={s} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-normal">
                  ✓ {s}
                </Badge>
              ))}
              {candidate.missing_required.map(s => (
                <Badge key={s} variant="outline" className="text-red-500 border-red-200 text-xs font-normal">
                  ✗ {s}
                </Badge>
              ))}
            </div>

            {/* All candidate skills (trust signals) */}
            <div className="flex flex-wrap gap-1 pt-3 border-t border-white/8">
              <span className="text-xs text-zinc-400 mr-1 self-center">All skills:</span>
              {candidate.skills.slice(0, 8).map(s => (
                <span
                  key={s.name}
                  className={`text-xs px-1.5 py-0.5 rounded ${SOURCE_COLORS[s.source] ?? SOURCE_COLORS.manual}`}
                  title={`${LEVEL_LABELS[s.level]} · ${s.source}`}
                >
                  {s.name}
                </span>
              ))}
              {candidate.skills.length > 8 && (
                <span className="text-xs text-zinc-400">+{candidate.skills.length - 8} more</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {ranked.length === 0 && (
        <Card className="p-10 text-center border-dashed">
          <p className="text-3xl mb-3">👥</p>
          <h3 className="font-semibold mb-1">No candidates with skills yet</h3>
          <p className="text-sm text-zinc-500">
            Candidates need to add skills to their profile before they can be matched.
          </p>
        </Card>
      )}
    </div>
  )
}

function BackLink({ jobTitle }: { jobTitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/employer/jobs">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-600 -ml-2">
          ← My Jobs
        </Button>
      </Link>
      <span className="text-zinc-300">/</span>
      <h1 className="text-xl font-bold">{jobTitle}</h1>
    </div>
  )
}
