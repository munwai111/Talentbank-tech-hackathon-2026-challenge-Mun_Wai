// GET/POST /api/candidate/coach-calibration
// Reads and writes the coach calibration settings stored in
// candidate_profiles.career_data.coach_calibration (JSONB sub-field).

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export type CoachCalibration = {
  communication_style: 'Formal' | 'Balanced' | 'Casual'
  technical_depth: 'Non-technical' | 'Mixed' | 'Technical'
  career_stage: 'Student' | 'Fresh grad' | 'Mid-career' | 'Senior'
  primary_goal: string
  coaching_tone: 'Motivating' | 'Honest' | 'Strategic' | 'Analytical'
}

async function getProfileId(supabase: ReturnType<typeof createServerClient>, userId: string) {
  const { data: dbUser } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!dbUser) return null

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, career_data')
    .eq('user_id', dbUser.id)
    .single()
  return profile
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const profile = await getProfileId(supabase, userId)
    if (!profile) return NextResponse.json({ calibration: null })

    const cd = profile.career_data as Record<string, unknown> | null
    const calibration = (cd?.coach_calibration ?? null) as CoachCalibration | null
    return NextResponse.json({ calibration })
  } catch (err) {
    console.error('[coach-calibration] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load calibration' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const body = await req.json() as CoachCalibration
    const profile = await getProfileId(supabase, userId)
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Merge calibration into existing career_data JSONB
    // We cast via unknown to satisfy the strict CareerData type — the server
    // stores this as JSONB and reads it back with the same cast in GET.
    const existingCd = (profile.career_data as Record<string, unknown> | null) ?? {}
    const updated = { ...existingCd, coach_calibration: body } as unknown as import('@/types/database').CareerData

    const { error } = await supabase
      .from('candidate_profiles')
      .update({ career_data: updated })
      .eq('id', profile.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[coach-calibration] POST failed:', err)
    return NextResponse.json({ error: 'Failed to save calibration' }, { status: 500 })
  }
}
