// POST /api/candidate/skills — add a skill to the vault
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function getCandidateProfile(clerkId: string) {
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', clerkId).single()
  if (!user) return null
  const { data: profile } = await supabase
    .from('candidate_profiles').select('id').eq('user_id', user.id).single()
  return profile
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getCandidateProfile(userId)
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { name, level, source, evidence_url } = await req.json()

  const supabase = createServerClient()
  const { data: skill, error } = await supabase
    .from('skills')
    .insert({ candidate_id: profile.id, name, level, source: source ?? 'manual', evidence_url })
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
    body: JSON.stringify({ candidate_id: profile.id }),
  }).catch(() => {})  // Non-blocking

  return NextResponse.json({ skill })
}
