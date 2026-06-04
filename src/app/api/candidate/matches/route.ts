// GET /api/candidate/matches
// Returns ranked job matches for the logged-in candidate.
//
// ── How the matching works (E-01 goal-based algorithm) ───────────────────────
// Score = 70% skills overlap + 30% career goal alignment
//
// Skills overlap formula:
//   skill_score = (matched_required / total_required) × 0.75
//               + (matched_nice    / total_nice)      × 0.25
//
// Goal alignment formula:
//   goal_score = keyword intersection between candidate goals/industries
//                and the job title+description (scaled 0–100)
//
// Combined: score = skill_score × 0.7 + goal_score × 0.3
// When career_data is absent: falls back to pure skill_score (goal_score = 0)
//
// Matching is case-insensitive. "React" matches "react" matches "REACT".
//
// ⚠️ DEBT FLAG — Exact name matching only
// What it is: "React" won't match "ReactJS" unless normalised first.
// Why it matters: Candidates who say "ReactJS" miss React jobs.
// Urgency: Before Demo
// Suggested fix: pgvector cosine similarity — embed already wired up in /embed route.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { CareerData } from '@/types/database'
import {
  normaliseSkill,
  scoreGoalAlignment,
  deriveGoalLabel,
  combinedMatchScore,
  candidateHasGoals,
} from '@/lib/matching'

export type MatchResult = {
  job: {
    id: string
    title: string
    description: string
    required_skills: string[]
    nice_to_have_skills: string[]
    salary_min: number | null
    salary_max: number | null
    location: string | null
    remote: 'onsite' | 'hybrid' | 'remote'
    company: {
      id: string
      name: string
      industry: string | null
      size: string | null
    }
  }
  score: number                                       // 0.0–1.0 combined
  score_pct: number                                   // 0–100 for display
  skill_pct: number                                   // skills overlap only (0–100)
  goal_alignment_pct: number                          // goal alignment only (0–100)
  goal_alignment_label: 'goal_match' | 'career_pivot' | null
  matched_skills: string[]
  missing_required: string[]
  missing_nice: string[]
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  // ── 1. Get candidate's skills ──────────────────────────────────────────────
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ matches: [], error: 'User not found' })

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, career_data')
    .eq('user_id', user.id)
    .single()
  if (!profile) return NextResponse.json({ matches: [] })

  const careerData = (profile.career_data ?? null) as CareerData | null

  const { data: skills } = await supabase
    .from('skills').select('name').eq('candidate_id', profile.id)

  if (!skills || skills.length === 0) {
    return NextResponse.json({ matches: [], reason: 'no_skills' })
  }

  // Build a set of normalised candidate skills for O(1) matching
  const candidateSkills = new Set(skills.map(s => normaliseSkill(s.name)))

  // ── 2. Fetch all open jobs with company info ───────────────────────────────
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id, title, description, required_skills, nice_to_have_skills,
      salary_min, salary_max, location, remote,
      companies ( id, name, industry, size )
    `)
    .eq('status', 'open')

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ matches: [], reason: 'no_jobs' })
  }

  // ── 3. Score each job ──────────────────────────────────────────────────────
  const matches: MatchResult[] = jobs.map(job => {
    const required = job.required_skills ?? []
    const nice = job.nice_to_have_skills ?? []

    const matchedRequired  = required.filter(s => candidateSkills.has(normaliseSkill(s)))
    const missingRequired  = required.filter(s => !candidateSkills.has(normaliseSkill(s)))
    const matchedNice      = nice.filter(s => candidateSkills.has(normaliseSkill(s)))
    const missingNice      = nice.filter(s => !candidateSkills.has(normaliseSkill(s)))

    const requiredScore = required.length > 0 ? matchedRequired.length / required.length : 1
    const niceScore     = nice.length     > 0 ? matchedNice.length     / nice.length     : 0

    // Raw skills score (0–1)
    const skillScore = requiredScore * 0.75 + niceScore * 0.25
    const skillPct   = Math.round(skillScore * 100)

    // Goal alignment score (0–100) — E-01 enhancement
    const goalAlignmentPct = scoreGoalAlignment(careerData, {
      title: job.title,
      description: job.description,
    })

    // Combined score: 70% skills, 30% goal alignment (falls back to pure skill when no goals)
    const hasGoals = candidateHasGoals(careerData)
    const combinedScore = combinedMatchScore(skillScore, goalAlignmentPct, hasGoals)

    // Supabase returns the joined company as an array when using select(*)
    // Handle both array and object shapes defensively
    const company = Array.isArray(job.companies) ? job.companies[0] : job.companies

    return {
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        required_skills: required,
        nice_to_have_skills: nice,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        location: job.location,
        remote: job.remote,
        company: {
          id: company?.id ?? '',
          name: company?.name ?? 'Unknown Company',
          industry: company?.industry ?? null,
          size: company?.size ?? null,
        },
      },
      score: combinedScore,
      score_pct: Math.round(combinedScore * 100),
      skill_pct: skillPct,
      goal_alignment_pct: goalAlignmentPct,
      goal_alignment_label: deriveGoalLabel(skillPct, goalAlignmentPct),
      matched_skills: [...matchedRequired, ...matchedNice],
      missing_required: missingRequired,
      missing_nice: missingNice,
    }
  })

  // Sort by score descending — best match first
  matches.sort((a, b) => b.score - a.score)

  return NextResponse.json({ matches })
}
