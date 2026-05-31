// GET /api/candidate/matches
// Returns ranked job matches for the logged-in candidate.
//
// ── How the matching works (skill-overlap algorithm) ─────────────────────────
// We compare the candidate's skill names against each job's required_skills
// and nice_to_have_skills arrays.
//
// Score formula:
//   score = (matched_required / total_required) × 0.75
//         + (matched_nice    / total_nice)      × 0.25
//
// The 75/25 weighting reflects that required skills are non-negotiable,
// nice-to-have skills are a bonus.
//
// Matching is case-insensitive. "React" matches "react" matches "REACT".
//
// 🔴 DEBT FLAG — Exact name matching only
// What this is: "React" won't match "ReactJS" unless normalised first.
// Why it's a problem: Candidates who say "ReactJS" miss React jobs.
// Fix when: When OpenAI key is active — swap to vector cosine similarity,
//           which handles semantic equivalence automatically.
// Recommended solution: src/app/api/candidate/embed + job embeddings + pgvector.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
  score: number              // 0.0–1.0
  score_pct: number          // 0–100 for display
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
    .from('candidate_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ matches: [] })

  const { data: skills } = await supabase
    .from('skills').select('name').eq('candidate_id', profile.id)

  if (!skills || skills.length === 0) {
    return NextResponse.json({ matches: [], reason: 'no_skills' })
  }

  // Build a lowercase set for fast O(1) lookup
  const candidateSkills = new Set(skills.map(s => s.name.toLowerCase()))

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

    const matchedRequired  = required.filter(s => candidateSkills.has(s.toLowerCase()))
    const missingRequired  = required.filter(s => !candidateSkills.has(s.toLowerCase()))
    const matchedNice      = nice.filter(s => candidateSkills.has(s.toLowerCase()))
    const missingNice      = nice.filter(s => !candidateSkills.has(s.toLowerCase()))

    const requiredScore = required.length > 0 ? matchedRequired.length / required.length : 1
    const niceScore     = nice.length     > 0 ? matchedNice.length     / nice.length     : 0

    const score = requiredScore * 0.75 + niceScore * 0.25

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
      score,
      score_pct: Math.round(score * 100),
      matched_skills: [...matchedRequired, ...matchedNice],
      missing_required: missingRequired,
      missing_nice: missingNice,
    }
  })

  // Sort by score descending — best match first
  matches.sort((a, b) => b.score - a.score)

  return NextResponse.json({ matches })
}
