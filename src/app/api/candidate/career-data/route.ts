// GET  /api/candidate/career-data — fetch candidate's career identity data
// PUT  /api/candidate/career-data — save form answers + trigger AI synthesis

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { synthesizeCareerIdentity } from '@/lib/ai/career-synthesizer'
import type { CareerData } from '@/types/database'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ career_data: null })

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('career_data')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ career_data: profile?.career_data ?? null })
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body: CareerData = await req.json()

  // Generate AI career identity narrative
  let career_identity_summary: string | null = null
  try {
    career_identity_summary = await synthesizeCareerIdentity(body)
  } catch (err) {
    // AI synthesis failure is non-fatal — save the form data regardless
    console.error('Career identity synthesis failed:', err)
  }

  const career_data: CareerData = {
    ...body,
    career_identity_summary,
    synthesized_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('candidate_profiles')
    .update({ career_data })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, career_identity_summary })
}
