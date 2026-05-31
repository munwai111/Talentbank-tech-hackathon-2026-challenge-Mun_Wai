// GET  /api/employer/culture-data — fetch company culture identity data
// PUT  /api/employer/culture-data — save answers + trigger AI synthesis

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { synthesizeEmployerIdentity } from '@/lib/ai/career-synthesizer'
import type { CultureData } from '@/types/database'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()
  if (!user || user.role !== 'employer') return NextResponse.json({ culture_data: null })

  const { data: company } = await supabase
    .from('companies')
    .select('culture_data')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ culture_data: company?.culture_data ?? null })
}

export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()
  if (!user || user.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
  }

  const body: CultureData = await req.json()

  let employer_identity_summary: string | null = null
  try {
    employer_identity_summary = await synthesizeEmployerIdentity(body)
  } catch (err) {
    console.error('Employer identity synthesis failed:', err)
  }

  const culture_data: CultureData = {
    ...body,
    employer_identity_summary,
    synthesized_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('companies')
    .update({ culture_data })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, employer_identity_summary })
}
