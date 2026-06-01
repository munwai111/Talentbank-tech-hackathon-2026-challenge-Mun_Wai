// POST /api/candidate/skills — add a skill to the vault
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateCandidateProfile } from '@/lib/supabase/candidate'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await getOrCreateCandidateProfile(userId)
  if (!candidate) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { profileId } = candidate

  const { name, level, source, evidence_url } = await req.json()

  const supabase = createServerClient()
  const { data: skill, error } = await supabase
    .from('skills')
    .insert({ candidate_id: profileId, name, level, source: source ?? 'manual', evidence_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // After adding a skill, trigger embedding regeneration
  // (fire and forget — don't block the response)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/candidate/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal': 'true',                                         // legacy dev fallback
      'x-internal-secret': process.env.INTERNAL_SECRET ?? '',       // production secret
    },
    body: JSON.stringify({ candidate_id: profileId }),
  }).catch(() => {})  // Non-blocking

  return NextResponse.json({ skill })
}
