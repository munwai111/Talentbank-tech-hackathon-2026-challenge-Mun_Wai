// POST /api/candidate/skill-insight — comprehensive professional read for one
// skill, grounded in the candidate's own work experience. Streams JSON that the
// gamified Skills Vault accumulates and parses.
//
// Body: { name: string; level: 1|2|3|4|5 }
// Runtime: Node.js. maxDuration 25 = Vercel Hobby streaming window.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamSkillInsight } from '@/lib/ai/skill-insight'
import { LANGUAGE_NAMES, type Locale } from '@/lib/i18n/translations'
import type { WorkExperienceEntry } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { name, level, language } = await req.json() as { name?: string; level?: number; language?: string }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const safeLevel = Math.min(5, Math.max(1, Number(level) || 3))
    const languageName = language && language in LANGUAGE_NAMES
      ? LANGUAGE_NAMES[language as Locale]
      : undefined

    const supabase = createServerClient()
    const { data: user } = await supabase
      .from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('headline, work_experience')
      .eq('user_id', user.id)
      .single()

    const work = (Array.isArray(profile?.work_experience) ? profile.work_experience : []) as WorkExperienceEntry[]
    const stream = streamSkillInsight(name, safeLevel, { headline: profile?.headline ?? null, work }, languageName)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[skill-insight] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
