// GET  /api/employer/jobs — all jobs for this company
// POST /api/employer/jobs — create a new job

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()

  if (!user || user.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
  }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) return NextResponse.json({ jobs: [] })

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ jobs: jobs ?? [] })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()

  if (!user || user.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
  }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()

  if (!body.title?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id:         company.id,
      title:              body.title.trim(),
      description:        body.description.trim(),
      required_skills:    body.required_skills    ?? [],
      nice_to_have_skills: body.nice_to_have_skills ?? [],
      salary_min:         body.salary_min         ?? null,
      salary_max:         body.salary_max         ?? null,
      location:           body.location?.trim()   ?? null,
      remote:             body.remote             ?? 'hybrid',
      status:             'open',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ job })
}
