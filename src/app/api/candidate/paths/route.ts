// GET /api/candidate/paths
// Generates 3 career navigation paths for the authenticated candidate.
// Reads their skills + career_data from Supabase, calls Claude, returns paths.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateCareerPaths } from '@/lib/ai/path-navigator'
import type { PathInput } from '@/lib/ai/path-navigator'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

    // Fetch profile first — we need candidate_profiles.id to query skills correctly.
    // skills.candidate_id → candidate_profiles.id (NOT users.id — different UUID).
    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('id, location, career_data')
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
      .eq('candidate_id', profile.id)  // ← correct FK: candidate_profiles.id

    const input: PathInput = {
      skills: skillsData ?? [],
      career_data: profile.career_data ?? null,
      location: profile.location ?? null,
    }

    const paths = await generateCareerPaths(input)
    return NextResponse.json({ paths })
  } catch (err) {
    console.error('[paths] generation failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Path generation failed' },
      { status: 500 },
    )
  }
}
