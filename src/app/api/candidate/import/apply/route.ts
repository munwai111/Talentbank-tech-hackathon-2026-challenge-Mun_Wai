// POST /api/candidate/import/apply
// Applies a previously-extracted profile to the candidate's account.
// The user previews results first (from /api/candidate/import) and selects
// which sections to apply before calling this route.
//
// What gets saved:
// - Bio fields → candidate_profiles (name, headline, bio, location, etc.)
// - Skills → skills table (upsert by name, higher level always wins)
// - Work experience → candidate_profiles.work_experience (JSONB)
// - Education → candidate_profiles.education (JSONB)
//
// Work history and education are saved whole (replace not merge) because
// a fresh resume import is expected to be the authoritative source of truth.
// Skills are merged (upsert) because they may have been added from other sources.

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

  // ── Apply bio fields + work history + education ───────────────────────────
  if (applyBio) {
    const update: ProfileUpdate = {}

    // Bio fields — only overwrite if extracted value is non-null
    if (extracted.name)         update.name         = extracted.name
    if (extracted.headline)     update.headline     = extracted.headline
    if (extracted.bio)          update.bio          = extracted.bio
    if (extracted.location)     update.location     = extracted.location
    if (extracted.github_url)   update.github_url   = extracted.github_url
    if (extracted.linkedin_url) update.linkedin_url = extracted.linkedin_url
    if (extracted.salary_min)   update.salary_min   = extracted.salary_min
    if (extracted.salary_max)   update.salary_max   = extracted.salary_max

    // Work history — replace entirely (resume is the authoritative source)
    if (extracted.experience && extracted.experience.length > 0) {
      update.work_experience = extracted.experience
    }

    // Education — replace entirely
    if (extracted.education && extracted.education.length > 0) {
      update.education = extracted.education
    }

    if (Object.keys(update).length > 0) {
      const { error } = await supabase
        .from('candidate_profiles')
        .update(update)
        .eq('id', profile.id)

      if (error) {
        console.error('[import/apply] profile update failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  // ── Apply skills (upsert — higher level always wins, never downgrade) ──────
  if (applySkills && extracted.skills.length > 0) {
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('id, name, level')
      .eq('candidate_id', profile.id)

    const existingByName = new Map(
      (existingSkills ?? []).map(s => [s.name.toLowerCase(), s])
    )

    for (const skill of extracted.skills) {
      const clampedLevel = Math.min(5, Math.max(1, skill.level)) as 1 | 2 | 3 | 4 | 5
      const existing = existingByName.get(skill.name.toLowerCase())

      if (existing) {
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
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/candidate/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal': 'true',                                           // legacy dev fallback
        'x-internal-secret': process.env.INTERNAL_SECRET ?? '',         // production secret
      },
      body: JSON.stringify({ candidate_id: profile.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
