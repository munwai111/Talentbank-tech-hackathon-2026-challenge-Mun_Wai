// POST /api/candidate/work-experience/restructure
// Takes existing work_experience JSONB entries that lack structured fields
// and uses Claude Haiku to generate key_impacts, key_skills, achievements,
// and role_context for each entry. Saves the enriched entries back to DB.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { WorkExperienceEntry } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a professional career analyst. Given a job title, company, and description from a resume, extract structured information about the role. Return ONLY valid JSON, no markdown.`

async function structureEntry(entry: WorkExperienceEntry): Promise<WorkExperienceEntry> {
  if ((entry.key_impacts?.length ?? 0) > 0) return entry  // already structured

  const prompt = `Analyse this work experience entry and extract structured data.

Role: ${entry.title}
Company: ${entry.company}
Period: ${entry.start_date ?? '?'} – ${entry.end_date ?? 'Present'}
Description: ${entry.description ?? '(no description)'}
Technologies: ${entry.key_technologies.join(', ') || '(none listed)'}

Return JSON:
{
  "key_impacts": [2-4 bullet strings, each starting with an action verb, include numbers/scale where present],
  "key_skills": [3-6 role-specific skills applied/gained here, be precise not generic],
  "achievements": [1-3 notable milestones or firsts — only if clearly implied, else empty array],
  "role_context": "one sentence (max 20 words) on why this role was unique or strategically important"
}`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) return entry

    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      key_impacts?: string[]
      key_skills?: string[]
      achievements?: string[]
      role_context?: string
    }

    return {
      ...entry,
      key_impacts: parsed.key_impacts ?? [],
      key_skills: parsed.key_skills ?? [],
      achievements: parsed.achievements ?? [],
      role_context: parsed.role_context ?? undefined,
    }
  } catch {
    return entry
  }
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const { data: dbUser } = await supabase
      .from('users').select('id').eq('clerk_id', userId).single()
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id, work_experience')
      .eq('user_id', dbUser.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const entries = (profile.work_experience ?? []) as WorkExperienceEntry[]
    if (entries.length === 0) return NextResponse.json({ updated: 0 })

    const structured = await Promise.all(entries.map(structureEntry))

    const { error } = await supabase
      .from('candidate_profiles')
      .update({ work_experience: structured })
      .eq('id', profile.id)

    if (error) throw error

    return NextResponse.json({ updated: structured.length })
  } catch (err) {
    console.error('[work-experience/restructure] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Restructure failed' },
      { status: 500 }
    )
  }
}
