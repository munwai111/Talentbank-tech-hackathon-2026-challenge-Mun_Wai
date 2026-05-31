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

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type RequestBody = {
  messages: CoachMessage[]
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
      .select('id, name, location, career_data')
      .eq('user_id', user.id)
      .single()

    const { data: skillsData } = profile
      ? await supabase
          .from('skills')
          .select('name, level')
          .eq('candidate_id', profile.id)
      : { data: [] }

    const ctx: CoachContext = {
      name: profile?.name ?? 'there',
      location: profile?.location ?? null,
      skills: skillsData ?? [],
      currentRole: profile?.career_data?.current_or_last_role ?? null,
      yearsExperience: profile?.career_data?.years_experience ?? null,
      situation: profile?.career_data?.current_situation ?? null,
      goal1Year: profile?.career_data?.goal_1_year ?? null,
      goal5Year: profile?.career_data?.goal_5_year ?? null,
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
