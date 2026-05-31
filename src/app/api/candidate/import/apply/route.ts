// POST /api/candidate/import/apply
// Applies a previously-extracted profile to the candidate's account.
// The user previews results first (from /api/candidate/import) and selects
// which sections to apply before calling this route.
//
// Rules:
// - Bio fields: only overwrite if extracted value is non-null
// - Skills: upsert by name (case-insensitive), higher level always wins
// - Skills source is saved as 'manual' — same trust level as self-reported
//   since we can't verify the document authenticity
// - Triggers embedding regeneration after applying skills

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { ExtractedProfile } from '@/lib/ai/profile-extractor'
import type { Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['candidate_profiles']['Update']

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

  const { extracted, applyBio, applySkills }: {
    extracted: ExtractedProfile
    applyBio: boolean
    applySkills: boolean
  } = await req.json()

  // ── Apply bio fields ──────────────────────────────────────────
  if (applyBio) {
    const update: ProfileUpdate = {}
    if (extracted.name)         update.name         = extracted.name
    if (extracted.headline)     update.headline     = extracted.headline
    if (extracted.bio)          update.bio          = extracted.bio
    if (extracted.location)     update.location     = extracted.location
    if (extracted.github_url)   update.github_url   = extracted.github_url
    if (extracted.linkedin_url) update.linkedin_url = extracted.linkedin_url
    if (extracted.salary_min)   update.salary_min   = extracted.salary_min
    if (extracted.salary_max)   update.salary_max   = extracted.salary_max

    if (Object.keys(update).length > 0) {
      await supabase.from('candidate_profiles').update(update).eq('id', profile.id)
    }
  }

  // ── Apply skills (upsert — higher level always wins) ──────────
  if (applySkills && extracted.skills.length > 0) {
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('id, name, level')
      .eq('candidate_id', profile.id)

    // Build a lookup map for O(1) matching
    const existingByName = new Map(
      (existingSkills ?? []).map(s => [s.name.toLowerCase(), s])
    )

    for (const skill of extracted.skills) {
      const clampedLevel = Math.min(5, Math.max(1, skill.level)) as 1 | 2 | 3 | 4 | 5
      const existing = existingByName.get(skill.name.toLowerCase())

      if (existing) {
        // Only upgrade the level — never downgrade an existing verified skill
        if (clampedLevel > existing.level) {
          await supabase.from('skills')
            .update({ level: clampedLevel })
            .eq('id', existing.id)
        }
      } else {
        await supabase.from('skills').insert({
          candidate_id: profile.id,
          name: skill.name,
          level: clampedLevel,
          source: 'manual',
        })
      }
    }

    // Trigger embedding regeneration (fire-and-forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'}/api/candidate/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal': 'true' },
      body: JSON.stringify({ candidate_id: profile.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
