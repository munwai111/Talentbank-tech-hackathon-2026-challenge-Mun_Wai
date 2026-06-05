// DELETE /api/account
// Soft-deletes the authenticated user's account.
//
// What happens immediately:
//   1. DB: email anonymised (frees it for re-registration), deleted_at set,
//          feedback stored, PII cleared from candidate_profiles
//   2. Clerk: user deleted (session dies; user can re-register fresh)
//
// What happens after 6 months:
//   A scheduled job queries WHERE deleted_at IS NOT NULL AND scheduled_purge_at < NOW()
//   and hard-deletes the rows. Cascades to all child tables.
//
// The user can re-register with the same email address immediately —
// the original email is released as soon as deletion is processed.

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type DeleteBody = {
  reasons: string[]       // selected reason keys, e.g. ['privacy', 'not_looking']
  feedback: string        // optional free-text detail
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  try {
    const body = await req.json() as DeleteBody
    const reasons = (body.reasons ?? []).join(', ')
    const feedback = (body.feedback ?? '').trim()

    // ── 1. Get the user record ─────────────────────────────────────────────
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    const purgeAt = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) // +6 months
    const anonEmail = `deleted_${user.id}@removed.career-os.local`

    // ── 2. Soft-delete the user row (anonymise email, record feedback) ─────
    await supabase.from('users').update({
      deleted_at: now.toISOString(),
      email: anonEmail,              // frees original email for re-registration
      deletion_reason: reasons || 'not_provided',
      deletion_feedback: feedback || null,
      scheduled_purge_at: purgeAt.toISOString(),
    }).eq('id', user.id)

    // ── 3. Anonymise PII in candidate_profiles ────────────────────────────
    // Skills, portfolio, and match history stay — they're de-identified and
    // used only for aggregate analytics until the 6-month hard purge.
    await supabase.from('candidate_profiles').update({
      name: 'Deleted User',
      first_name: null,
      middle_name: null,
      last_name: null,
      date_of_birth: null,
      bio: null,
      location: null,
      headline: null,
      github_url: null,
      linkedin_url: null,
      career_data: null,
      saq_data: null,
      embedding: null,
    }).eq('user_id', user.id)

    // ── 4. Hard-delete the Clerk account ─────────────────────────────────
    // This invalidates all sessions. The user must create a new Clerk account
    // to re-register — they can reuse the same email address immediately.
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)

    return NextResponse.json({
      ok: true,
      message: 'Account deleted. Your data will be permanently removed in 6 months.',
      purgeDate: purgeAt.toISOString(),
    })
  } catch (err) {
    console.error('[account/delete] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Deletion failed — please try again' },
      { status: 500 },
    )
  }
}
