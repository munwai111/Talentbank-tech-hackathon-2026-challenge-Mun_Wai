// DELETE /api/candidate/skills/[skillId] — remove a skill
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ skillId: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { skillId } = await params
  const supabase = createServerClient()

  // Verify ownership: only delete skills belonging to the current user
  // Join through candidate_profiles → users to verify clerk_id
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('candidate_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete only if the skill belongs to this candidate
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', skillId)
    .eq('candidate_id', profile.id)  // ← Security: ensures you can only delete YOUR skills

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
