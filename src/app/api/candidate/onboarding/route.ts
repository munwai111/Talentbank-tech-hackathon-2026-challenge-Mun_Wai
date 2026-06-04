// PATCH /api/candidate/onboarding
// Saves guided registration phase data progressively.
// Called after each phase is completed. Safe to call multiple times —
// each call merges into the existing profile record.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { SaqData, WorkExperienceEntry, EducationEntry, Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['candidate_profiles']['Update']

export const dynamic = 'force-dynamic'

type PhasePayload =
  | { phase: 1; firstName: string; middleName?: string; lastName: string; dateOfBirth: string }
  | { phase: 2; education: EducationEntry[] }
  | { phase: 3; workExperience: WorkExperienceEntry[] }
  | { phase: 4; bio?: string }
  | { phase: 5; saqData: SaqData; complete: true }

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const body = await req.json() as PhasePayload

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id, name, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let updatePayload: ProfileUpdate

    switch (body.phase) {
      case 1:
        updatePayload = {
          first_name: body.firstName.trim(),
          middle_name: body.middleName?.trim() || null,
          last_name: body.lastName.trim(),
          date_of_birth: body.dateOfBirth,
          name: [body.firstName.trim(), body.middleName?.trim(), body.lastName.trim()]
            .filter(Boolean).join(' '),
        }
        break

      case 2:
        updatePayload = { education: body.education }
        break

      case 3:
        updatePayload = {
          work_experience: body.workExperience,
          verified_candidate: body.workExperience.some(
            e => e.verification_status === 'verified' || e.verification_status === 'document_uploaded'
          ),
        }
        break

      case 4:
        updatePayload = body.bio ? { bio: body.bio } : {}
        break

      case 5:
        updatePayload = {
          saq_data: body.saqData,
          onboarding_completed: body.complete,
        }
        break

      default:
        updatePayload = {}
    }

    const { error } = await supabase
      .from('candidate_profiles')
      .update(updatePayload)
      .eq('id', profile.id)

    if (error) throw error

    return NextResponse.json({ ok: true, phase: body.phase })
  } catch (err) {
    console.error('[onboarding] save failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    )
  }
}

// GET /api/candidate/onboarding — fetch current onboarding progress
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const { data: user } = await supabase
      .from('users').select('id').eq('clerk_id', userId).single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('first_name, middle_name, last_name, date_of_birth, education, work_experience, bio, saq_data, onboarding_completed, verified_candidate')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ profile: profile ?? null })
  } catch (err) {
    console.error('[onboarding] fetch failed:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
