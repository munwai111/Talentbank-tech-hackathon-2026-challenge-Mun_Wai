// GET  /api/candidate/coach/sessions — list the user's coach conversations
// POST /api/candidate/coach/sessions — create a new conversation
//
// Graceful: if the coach_sessions table doesn't exist yet (migration not run),
// every handler returns { unavailable: true } so the client falls back to
// local (per-device) history instead of erroring.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function resolveUserId(clerkId: string): Promise<string | null> {
  const supabase = createServerClient()
  const { data } = await supabase.from('users').select('id').eq('clerk_id', clerkId).single()
  return data?.id ?? null
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(clerkId)
  if (!userId) return NextResponse.json({ sessions: [] })

  const supabase = createServerClient()
  try {
    const { data, error } = await supabase
      .from('coach_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ sessions: [], unavailable: true })
    return NextResponse.json({ sessions: data ?? [] })
  } catch {
    return NextResponse.json({ sessions: [], unavailable: true })
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(clerkId)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json().catch(() => ({})) as { title?: string }
  const title = body.title?.trim().slice(0, 80) || 'New conversation'

  const supabase = createServerClient()
  try {
    const { data, error } = await supabase
      .from('coach_sessions')
      .insert({ user_id: userId, title })
      .select('id, title, created_at, updated_at')
      .single()
    if (error || !data) return NextResponse.json({ unavailable: true })
    return NextResponse.json({ session: data })
  } catch {
    return NextResponse.json({ unavailable: true })
  }
}
