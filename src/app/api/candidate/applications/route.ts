// GET  /api/candidate/applications — list all applications for this candidate
// POST /api/candidate/applications — apply to a job

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateCandidateProfile } from '@/lib/supabase/candidate'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await getOrCreateCandidateProfile(userId)
  if (!candidate) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      job_id,
      status,
      created_at,
      updated_at,
      jobs (
        id,
        title,
        location,
        remote,
        salary_min,
        salary_max,
        status,
        companies ( name, industry )
      )
    `)
    .eq('candidate_id', candidate.profileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[applications/GET] query failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const candidate = await getOrCreateCandidateProfile(userId)
  if (!candidate) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { job_id } = await req.json()
  if (!job_id) return NextResponse.json({ error: 'job_id is required' }, { status: 400 })

  const supabase = createServerClient()

  // Confirm job is still open
  const { data: job } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', job_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'This role is no longer accepting applications' }, { status: 409 })

  // Insert — the unique(job_id, candidate_id) constraint handles duplicates
  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id, candidate_id: candidate.profileId, status: 'applied' })
    .select('id, status, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 })
    }
    console.error('[applications/POST] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application })
}
