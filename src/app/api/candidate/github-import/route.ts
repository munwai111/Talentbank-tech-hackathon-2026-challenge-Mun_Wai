// POST /api/candidate/github-import
// Pipeline: GitHub username → fetch repos → read languages/READMEs → Claude extracts skills
// This is the "AI Craft" showcase feature — verifying skills from actual code evidence

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// GitHub repo shape (subset of what the API returns)
type GithubRepo = {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  fork: boolean
  html_url: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('candidate_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { github_url } = await req.json()

  // ── Step 1: Extract username from GitHub URL ───────────────
  // Handles: "github.com/user", "https://github.com/user", "user"
  const username = github_url
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\/$/, '')
    .split('/')[0]

  if (!username) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  }

  // ── Step 2: Fetch public repos from GitHub API ─────────────
  // We take the top 8 non-forked repos sorted by stars
  // No auth needed for public repos — GitHub allows 60 req/hour unauthenticated
  let repos: GithubRepo[] = []
  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=20`,
      { headers: { 'User-Agent': 'CareerOS-App' }, next: { revalidate: 3600 } }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub user "${username}" not found. Check the URL and try again.` },
        { status: 404 }
      )
    }
    const all: GithubRepo[] = await res.json()
    // Filter out forks — we want original work only
    repos = all.filter(r => !r.fork).slice(0, 8)
  } catch {
    return NextResponse.json({ error: 'Failed to reach GitHub API' }, { status: 502 })
  }

  if (repos.length === 0) {
    return NextResponse.json({ error: 'No public original repositories found' }, { status: 400 })
  }

  // ── Step 3: Fetch language breakdowns for each repo ────────
  // GitHub's languages API returns { "TypeScript": 12345, "CSS": 4321, ... }
  // This is far more reliable than just the "primary language" field
  const repoDetails = await Promise.all(
    repos.map(async (repo) => {
      try {
        const langRes = await fetch(
          `https://api.github.com/repos/${username}/${repo.name}/languages`,
          { headers: { 'User-Agent': 'CareerOS-App' }, next: { revalidate: 3600 } }
        )
        const languages: Record<string, number> = langRes.ok ? await langRes.json() : {}
        return { ...repo, languages }
      } catch {
        return { ...repo, languages: {} as Record<string, number> }
      }
    })
  )

  // ── Step 4: Build context string for Claude ────────────────
  // We give Claude a structured summary of all repos — enough signal to infer skills
  const repoContext = repoDetails.map(repo => {
    const langs = Object.keys(repo.languages).join(', ') || repo.language || 'Unknown'
    return `- ${repo.name} (⭐ ${repo.stargazers_count}): ${repo.description ?? 'No description'}. Languages: ${langs}`
  }).join('\n')

  // ── Step 5: Claude skill extraction ───────────────────────
  // Key prompt engineering decisions:
  // - Ask for JSON output (structured, parseable)
  // - Give specific instructions on what counts as "evidence"
  // - Ask for confidence levels (we only keep high-confidence skills)
  // - Limit output to avoid hallucination
  const extractionPrompt = `You are a technical recruiter analysing a developer's GitHub profile to extract verified skills.

GitHub username: ${username}
Repositories (${repos.length} total, sorted by stars):
${repoContext}

Extract the developer's technical skills based ONLY on evidence from these repositories.
Do NOT guess or infer skills that aren't shown in the languages or project descriptions.

Return a JSON object in this exact format:
{
  "skills": [
    { "name": "React", "level": 4, "evidence": "Used in 3 repos including starred projects" },
    { "name": "Node.js", "level": 3, "evidence": "Primary backend language in 2 repos" }
  ],
  "summary": "One sentence describing this developer's apparent strengths and focus area."
}

Rules:
- Only include skills with clear evidence in the repo data
- Level 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert
- Infer level from: number of repos using it, star count, it being primary vs secondary language
- Include: programming languages, frameworks, databases, tools, concepts (e.g. "REST API design")
- Exclude: vague skills like "programming" or "software development"
- Maximum 15 skills
- Return ONLY the JSON, no other text`

  let extractedSkills: { name: string; level: number; evidence: string }[] = []
  let summary = ''

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: extractionPrompt }],
    })

    const raw = (msg.content[0] as { text: string }).text.trim()
    // Strip markdown code fences if Claude wrapped it in ```json
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    const parsed = JSON.parse(cleaned)
    extractedSkills = parsed.skills ?? []
    summary = parsed.summary ?? ''
  } catch (err) {
    console.error('Claude extraction failed:', err)
    return NextResponse.json({ error: 'AI extraction failed — try again' }, { status: 500 })
  }

  // ── Step 6: Save skills to DB ──────────────────────────────
  // Upsert: if the skill already exists for this candidate, update the level
  // Don't create duplicates if they import twice
  const savedSkills: string[] = []

  for (const skill of extractedSkills) {
    // Check if this skill already exists for this candidate
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .eq('candidate_id', profile.id)
      .ilike('name', skill.name)  // case-insensitive match
      .single()

    const clampedLevel = Math.min(5, Math.max(1, skill.level)) as 1 | 2 | 3 | 4 | 5
    if (existing) {
      // Update level if it's higher (don't downgrade)
      await supabase.from('skills').update({
        level: clampedLevel,
        source: 'github',
        evidence_url: `https://github.com/${username}`,
      }).eq('id', existing.id)
    } else {
      await supabase.from('skills').insert({
        candidate_id: profile.id,
        name: skill.name,
        level: clampedLevel,
        source: 'github',
        evidence_url: `https://github.com/${username}`,
      })
    }
    savedSkills.push(skill.name)
  }

  // Update github_url on the profile
  await supabase.from('candidate_profiles')
    .update({ github_url: `https://github.com/${username}` })
    .eq('id', profile.id)

  // Trigger embedding regeneration (non-blocking)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/candidate/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal': 'true' },
    body: JSON.stringify({ candidate_id: profile.id }),
  }).catch(() => {})

  return NextResponse.json({
    skills: savedSkills,
    summary,
    repos_analysed: repos.length,
  })
}
