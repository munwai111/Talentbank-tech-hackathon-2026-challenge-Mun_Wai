// PATCH /api/employer/applications/[appId] — update application status

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['reviewing', 'interview', 'offer', 'rejected'] as const
type EmployerStatus = typeof VALID_STATUSES[number]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { appId } = await params
  const { status } = await req.json() as { status: EmployerStatus }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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

  // Verify this application belongs to a job owned by this employer
  const { data: app } = await supabase
    .from('applications')
    .select('id, job_id, jobs!inner(company_id)')
    .eq('id', appId)
    .single()

  const jobCompanyId = (app?.jobs as unknown as { company_id: string } | null)?.company_id
  if (!app || jobCompanyId !== company.id) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId)
    .select('id, status')
    .single()

  if (error) {
    console.error('[employer/applications/PATCH] failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ application: updated })
}
