// /api/candidate/coach/sessions/[sessionId]
//   GET    — load this conversation's messages (ownership-scoped)
//   POST   — append a message (used for the assistant reply); on an assistant
//            message, refresh the candidate's coach memory (off the chat's hot path)
//   PATCH  — rename the conversation
//   DELETE — delete the conversation (cascades to messages)
//
// Every handler verifies the session belongs to the authenticated user and
// degrades gracefully if the coach tables are absent.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateCoachMemory, type MemoryMessage } from '@/lib/ai/coach-memory'
import type { CareerData } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function resolveUserId(clerkId: string): Promise<string | null> {
  const supabase = createServerClient()
  const { data } = await supabase.from('users').select('id').eq('clerk_id', clerkId).single()
  return data?.id ?? null
}

async function ownsSession(sessionId: string, userId: string): Promise<boolean> {
  const supabase = createServerClient()
  try {
    const { data } = await supabase
      .from('coach_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await resolveUserId(clerkId)
  if (!userId || !(await ownsSession(sessionId, userId))) {
    return NextResponse.json({ messages: [] })
  }
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase
      .from('coach_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) return NextResponse.json({ messages: [], unavailable: true })
    return NextResponse.json({ messages: data ?? [] })
  } catch {
    return NextResponse.json({ messages: [], unavailable: true })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await resolveUserId(clerkId)
  if (!userId || !(await ownsSession(sessionId, userId))) {
    return NextResponse.json({ ok: false, unavailable: true })
  }

  const body = await req.json().catch(() => ({})) as { role?: string; content?: string }
  const role = body.role === 'assistant' ? 'assistant' : 'user'
  const content = (body.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const supabase = createServerClient()
  try {
    await supabase.from('coach_messages').insert({ session_id: sessionId, role, content })
    await supabase.from('coach_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
  } catch {
    return NextResponse.json({ ok: false, unavailable: true })
  }

  // Refresh coach memory after an assistant reply. This runs off the chat's
  // streaming hot path (the reply already reached the user), so its latency
  // doesn't affect the conversation. Bounded to Haiku + recent messages.
  if (role === 'assistant') {
    try {
      await refreshMemory(sessionId, userId)
    } catch (err) {
      console.error('[coach memory] refresh skipped:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

async function refreshMemory(sessionId: string, userId: string): Promise<void> {
  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id, name, career_data')
    .eq('user_id', userId)
    .single()
  if (!profile) return

  const { data: recent } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(12)

  const messages = ((recent ?? []) as MemoryMessage[]).reverse()
  if (messages.length === 0) return

  const careerData = (profile.career_data ?? {}) as CareerData
  const prior = typeof careerData.coach_memory === 'string' ? careerData.coach_memory : ''
  const updated = await updateCoachMemory(prior, messages, profile.name ?? 'the candidate')

  await supabase
    .from('candidate_profiles')
    .update({ career_data: { ...careerData, coach_memory: updated } })
    .eq('id', profile.id)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await resolveUserId(clerkId)
  if (!userId || !(await ownsSession(sessionId, userId))) {
    return NextResponse.json({ ok: false })
  }
  const body = await req.json().catch(() => ({})) as { title?: string }
  const title = body.title?.trim().slice(0, 80)
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const supabase = createServerClient()
  try {
    await supabase.from('coach_sessions').update({ title }).eq('id', sessionId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = await resolveUserId(clerkId)
  if (!userId || !(await ownsSession(sessionId, userId))) {
    return NextResponse.json({ ok: false })
  }
  const supabase = createServerClient()
  try {
    await supabase.from('coach_sessions').delete().eq('id', sessionId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
