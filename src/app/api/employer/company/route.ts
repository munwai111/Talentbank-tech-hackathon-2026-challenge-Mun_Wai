// GET  /api/employer/company — fetch the logged-in employer's company profile
// PUT  /api/employer/company — update company details

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
    .from('companies').select('*').eq('user_id', user.id).single()

  return NextResponse.json({ company })
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

  const body = await req.json()
  const { error } = await supabase
    .from('companies')
    .update({
      name:        body.name,
      industry:    body.industry ?? null,
      size:        body.size     ?? null,
      description: body.description ?? null,
      website:     body.website  ?? null,
    })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
