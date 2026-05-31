// GET /api/candidate/paths
// Generates 3 career navigation paths for the authenticated candidate.
//
// Runtime: Node.js (not Edge — Clerk/Supabase/Anthropic SDK all bundle Node.js-specific
// code paths that Vercel's Edge bundler rejects at deploy time).
//
// Timeout: streaming responses get 25s on Vercel Hobby (vs 10s for non-streaming).
// This is the same mechanism the AI Coach uses. maxDuration is set to 25 to signal intent.
// The client accumulates the streamed text and parses JSON when the stream ends.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamCareerPaths } from '@/lib/ai/path-navigator'
import type { PathInput } from '@/lib/ai/path-navigator'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('id, location, career_data, work_experience, education')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Complete your profile first.' },
        { status: 404 },
      )
    }

    const { data: skillsData } = await supabase
      .from('skills')
      .select('name, level')
      .eq('candidate_id', profile.id)

    const input: PathInput = {
      skills: skillsData ?? [],
      career_data: profile.career_data ?? null,
      location: profile.location ?? null,
      work_experience: (profile.work_experience ?? []) as PathInput['work_experience'],
      education: (profile.education ?? []) as PathInput['education'],
    }

    // Stream Claude's token output directly to the client.
    // Client accumulates all chunks and parses the JSON at the end.
    const stream = streamCareerPaths(input)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[paths] failed to load profile or stream paths:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong — please try again' },
      { status: 500 },
    )
  }
}
