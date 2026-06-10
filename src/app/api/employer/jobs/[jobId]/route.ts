// PATCH /api/employer/jobs/[jobId] — close or reopen a job
// GET   /api/employer/jobs/[jobId]/applications — list applicants (handled separately)

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await params
  const { status } = await req.json() as { status: 'open' | 'closed' }

  if (!['open', 'closed'].includes(status)) {
    return NextResponse.json({ error: 'status must be "open" or "closed"' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: dbUser } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()
  if (!dbUser || dbUser.role !== 'employer') {
    return NextResponse.json({ error: 'Not an employer account' }, { status: 403 })
  }

  const { data: company } = await supabase
    .from('companies').select('id').eq('user_id', dbUser.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  // Only update if this job belongs to this employer's company
  const { data: job, error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)
    .eq('company_id', company.id)
    .select('id, title, status')
    .single()

  if (error || !job) {
    console.error('[employer/jobs/PATCH] update failed:', error)
    return NextResponse.json({ error: 'Job not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ job })
}
