// POST /api/candidate/profile — called from onboarding to initialize user in DB
// GET  /api/candidate/profile — fetch the current user's profile + skills + portfolio
// PUT  /api/candidate/profile — update bio fields

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET: fetch full profile with skills + portfolio
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('users').select('id, role').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ profile: null })

  // Supabase nested select — like a SQL JOIN but declarative
  // skills(*) and portfolio_items(*) fetch all columns from those tables
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select(`
      id, user_id, name, headline, bio, location, github_url, linkedin_url,
      salary_min, salary_max, availability, embedding, career_data,
      work_experience, education,
      created_at, updated_at,
      skills(id, candidate_id, name, level, source, evidence_url, created_at),
      portfolio_items(id, candidate_id, title, description, url, repo_url, tech_stack, impact, ai_summary, created_at)
    `)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ profile })
}

// POST: create user + profile records (called from onboarding)
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    console.error('[profile/POST] No userId from auth() — session not established yet')
    return NextResponse.json({ error: 'Unauthorized — please try again in a moment' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const body = await req.json() as { role?: string }
    const rawRole = body.role

    if (!rawRole) return NextResponse.json({ error: 'role is required' }, { status: 400 })
    if (rawRole !== 'candidate' && rawRole !== 'employer') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const role = rawRole as 'candidate' | 'employer'

    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'New User'

    // Upsert user — safe to re-run. ON CONFLICT (clerk_id) updates role + email.
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({ clerk_id: userId, email, role }, { onConflict: 'clerk_id' })
      .select('id')
      .single()

    if (userError || !user) {
      console.error('[profile/POST] users upsert failed:', userError)
      return NextResponse.json({ error: userError?.message ?? 'Failed to create user record' }, { status: 500 })
    }

    if (role === 'candidate') {
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .upsert({ user_id: user.id, name }, { onConflict: 'user_id' })
      if (profileError) {
        console.error('[profile/POST] candidate_profiles upsert failed:', profileError)
        // Non-fatal — user record exists, profile can be created on first dashboard load
      }
    }

    if (role === 'employer') {
      const { error: companyError } = await supabase
        .from('companies')
        .upsert({ user_id: user.id, name: `${name}'s Company` }, { onConflict: 'user_id' })
      if (companyError) {
        console.error('[profile/POST] companies upsert failed:', companyError)
      }
    }

    return NextResponse.json({ success: true, role })
  } catch (err) {
    console.error('[profile/POST] unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT: update profile bio fields
export async function PUT(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('candidate_profiles')
    .update({
      name: body.name,
      headline: body.headline,
      location: body.location,
      bio: body.bio,
      github_url: body.github_url,
      salary_min: body.salary_min,
      salary_max: body.salary_max,
    })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
