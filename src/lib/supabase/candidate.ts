// Shared candidate profile resolution used by all candidate API routes.
//
// getOrCreateCandidateProfile does two things in one trip:
//   1. Resolves clerk_id → internal user.id
//   2. Gets the candidate_profiles row, creating it if it doesn't exist yet.
//
// The auto-create handles users who arrive via a direct/bookmarked link before
// onboarding has a chance to run POST /api/candidate/profile. Without it every
// import, skill-add, and GitHub import route returned 404 for brand-new users.

import { createServerClient } from '@/lib/supabase/server'

type CandidateProfileResult = {
  userId: string
  profileId: string
} | null

export async function getOrCreateCandidateProfile(
  clerkUserId: string,
): Promise<CandidateProfileResult> {
  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', clerkUserId).single()
  if (!user) return null

  // Upsert on conflict — creates the row for new users, returns the existing
  // row for everyone else. name='' satisfies the NOT NULL constraint; it gets
  // overwritten the first time the user applies a resume import or saves Profile Info.
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .upsert({ user_id: user.id, name: '' }, { onConflict: 'user_id' })
    .select('id')
    .single()

  if (!profile) return null
  return { userId: user.id, profileId: profile.id }
}
