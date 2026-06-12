// GET  /api/candidate/preferences — fetch (or initialise) stored preferences
// PATCH /api/candidate/preferences — update one or more preference fields
//
// Replaces localStorage for: language, news follows/saves, event tickets,
// and host-request state. All other client-side preferences can be added
// to user_preferences table without touching this contract.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type HostRequest = { title: string; format: string; about: string; submitted_at: number }

type Preferences = {
  language: string
  news_followed: string[]
  news_saved: string[]
  event_tickets: string[]
  host_request: HostRequest | null
}

const ALLOWED_FIELDS = [
  'language',
  'news_followed',
  'news_saved',
  'event_tickets',
  'host_request',
] as const satisfies readonly (keyof Preferences)[]

async function resolveUserId(clerkId: string): Promise<string | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(clerkId)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const supabase = createServerClient()

  try {
    // Ensure the row exists with column defaults, then read it back.
    // ignoreDuplicates: true → ON CONFLICT DO NOTHING (never overwrites).
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

    const { data, error } = await supabase
      .from('user_preferences')
      .select('language, news_followed, news_saved, event_tickets, host_request')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return NextResponse.json({ preferences: data })
  } catch (err) {
    console.error('[preferences/GET] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = await resolveUserId(clerkId)
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body: Partial<Preferences> = await req.json()

  // Accept only known fields — ignore anything else
  const updates: Partial<Preferences> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) updates[key] = body[key] as never
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    // Upsert: inserts (with defaults for omitted columns) or updates only the
    // supplied columns. ON CONFLICT (user_id) DO UPDATE SET …supplied fields…
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[preferences/PATCH] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 },
    )
  }
}
