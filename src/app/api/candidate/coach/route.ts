// POST /api/candidate/coach
// Streams a coaching response from Claude using the candidate's live profile.
//
// Request body: { messages: CoachMessage[] }
// Response: text/plain stream (Server-Sent Events via ReadableStream)

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamCoachResponse } from '@/lib/ai/coach'
import type { CoachMessage, CoachContext } from '@/lib/ai/coach'
import { LANGUAGE_NAMES, type Locale } from '@/lib/i18n/translations'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type RequestBody = {
  messages: CoachMessage[]
  language?: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const body = await req.json() as RequestBody
    const messages = body.messages ?? []

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id, name, location, career_data, work_experience, education, saq_data')
      .eq('user_id', user.id)
      .single()

    const { data: skillsData } = profile
      ? await supabase
          .from('skills')
          .select('name, level')
          .eq('candidate_id', profile.id)
      : { data: [] }

    const langName = body.language && body.language in LANGUAGE_NAMES
      ? LANGUAGE_NAMES[body.language as Locale]
      : undefined

    const ctx: CoachContext = {
      name: profile?.name ?? 'there',
      languageName: langName,
      location: profile?.location ?? null,
      skills: skillsData ?? [],
      currentRole: profile?.career_data?.current_or_last_role ?? null,
      yearsExperience: profile?.career_data?.years_experience ?? null,
      situation: profile?.career_data?.current_situation ?? null,
      goal1Year: profile?.career_data?.goal_1_year ?? profile?.saq_data?.goal_1_year ?? null,
      goal5Year: profile?.career_data?.goal_5_year ?? profile?.saq_data?.goal_5_year ?? null,
      dreamRole: profile?.career_data?.dream_role ?? profile?.saq_data?.dream_role ?? null,
      preferredIndustries: profile?.career_data?.preferred_industries ?? [],
      workExperience: (profile?.work_experience ?? []) as CoachContext['workExperience'],
      education: (profile?.education ?? []) as CoachContext['education'],
      lifeChapterContext: profile?.career_data?.life_chapter_context ?? null,
      characterResponses: profile?.saq_data?.character_responses ?? undefined,
      platformIntention: profile?.saq_data?.platform_intention ?? null,
      personalHobbies: profile?.saq_data?.personal_hobbies ?? [],
      professionalInterests: profile?.saq_data?.professional_interests ?? [],
      strengthResponse: profile?.saq_data?.strength_scenario ?? null,
      weaknessResponse: profile?.saq_data?.weakness_scenario ?? null,
    }

    const stream = streamCoachResponse(messages, ctx)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[coach] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Coach unavailable' },
      { status: 500 },
    )
  }
}
