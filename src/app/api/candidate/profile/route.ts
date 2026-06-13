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

  // Try full select including extended columns (available after add-profile-extended migration).
  // Fall back to core columns if the extended columns don't exist yet.
  let { data: profile, error } = await supabase
    .from('candidate_profiles')
    .select(`
      id, user_id, name, headline, bio, location, github_url, linkedin_url,
      salary_min, salary_max, availability, embedding, career_data,
      work_experience, education,
      first_name, middle_name, last_name, date_of_birth, saq_data,
      onboarding_completed, verified_candidate,
      phone_number, phone_country_code, gender, ethnicity, country_of_origin,
      disability_disclosure, seek_url, indeed_url, personal_website_url, resume_url,
      facebook_url, instagram_url, tiktok_url,
      address_line1, address_line2, city, state_region, country_name,
      created_at, updated_at,
      skills(id, candidate_id, name, level, source, evidence_url, created_at),
      portfolio_items(id, candidate_id, title, description, url, repo_url, tech_stack, impact, ai_summary, created_at)
    `)
    .eq('user_id', user.id)
    .single()

  if (error && error.message.includes('column')) {
    // Migration not yet run — fall back to core columns
    const fallback = await supabase
      .from('candidate_profiles')
      .select(`
        id, user_id, name, headline, bio, location, github_url, linkedin_url,
        salary_min, salary_max, availability, career_data,
        work_experience, education,
        first_name, middle_name, last_name, date_of_birth, saq_data,
        onboarding_completed, verified_candidate, created_at, updated_at,
        skills(id, candidate_id, name, level, source, evidence_url, created_at),
        portfolio_items(id, candidate_id, title, description, url, repo_url, tech_stack, impact, ai_summary, created_at)
      `)
      .eq('user_id', user.id)
      .single()
    profile = fallback.data as typeof profile
    error = fallback.error
  }

  return NextResponse.json({ profile: error ? null : profile })
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

    // Find or create the user record.
    //
    // We cannot use a simple upsert(onConflict:'clerk_id') here because the users
    // table has TWO unique constraints: clerk_id AND email.
    // If the Clerk webhook already created the row, an insert attempt would
    // conflict on email even though clerk_id also matches.
    //
    // Strategy:
    //   1. Look up by clerk_id (most common — webhook created it already)
    //   2. If not found, look up by email (re-registration after delete, or race)
    //   3. If found by email but not clerk_id, update clerk_id + role on that row
    //   4. If truly new, insert fresh

    let userId_db: string | null = null

    // Step 1: by clerk_id
    const { data: byClerkId } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (byClerkId) {
      userId_db = byClerkId.id
      // Update role in case it changed
      await supabase.from('users').update({ role }).eq('id', userId_db)
    } else {
      // Step 2: by email
      const { data: byEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (byEmail) {
        // Row exists under this email — update it to claim this new clerk_id
        userId_db = byEmail.id
        await supabase.from('users').update({ clerk_id: userId, role }).eq('id', userId_db)
      } else {
        // Step 3: brand new user — insert
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({ clerk_id: userId, email, role })
          .select('id')
          .single()

        if (insertError || !inserted) {
          console.error('[profile/POST] users insert failed:', insertError)
          return NextResponse.json(
            { error: insertError?.message ?? 'Failed to create user record' },
            { status: 500 }
          )
        }
        userId_db = inserted.id
      }
    }

    const user = { id: userId_db }

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
      linkedin_url: body.linkedin_url,
      salary_min: body.salary_min,
      salary_max: body.salary_max,
      first_name: body.first_name,
      middle_name: body.middle_name,
      last_name: body.last_name,
      date_of_birth: body.date_of_birth,
      phone_number: body.phone_number,
      phone_country_code: body.phone_country_code,
      gender: body.gender,
      ethnicity: body.ethnicity,
      country_of_origin: body.country_of_origin,
      disability_disclosure: body.disability_disclosure,
      seek_url: body.seek_url,
      indeed_url: body.indeed_url,
      personal_website_url: body.personal_website_url,
      resume_url: body.resume_url,
      facebook_url: body.facebook_url,
      instagram_url: body.instagram_url,
      tiktok_url: body.tiktok_url,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state_region: body.state_region,
      country_name: body.country_name,
      work_experience: body.work_experience,
      education: body.education,
      career_data: body.career_data,
    })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
