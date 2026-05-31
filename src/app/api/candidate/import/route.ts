// POST /api/candidate/import — URL and paste-text import modes
// PDF uploads use /api/candidate/import/pdf (separate route, same streaming pattern).
//
// Runtime: Node.js (not Edge — Clerk/Supabase/Anthropic SDK have Node.js-specific
// code paths that Vercel's Edge bundler rejects at deploy time).
//
// Timeout: streaming responses get 25s on Vercel Hobby (vs 10s non-streaming).
// maxDuration = 25 signals this intent. The client accumulates streamed text
// and parses JSON when the stream ends.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamProfileExtraction, extractTextFromUrl } from '@/lib/ai/profile-extractor'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()

  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: existingProfile } = await supabase
    .from('candidate_profiles')
    .select('name, location')
    .eq('user_id', user.id)
    .single()

  const body = await req.json() as { url?: string; text?: string; sourceType?: string }

  let rawText = ''
  let sourceHint: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown' = 'unknown'

  // ── Mode 1: URL fetch ───────────────────────────────────────────────────────
  if (body.url) {
    const result = await extractTextFromUrl(body.url)

    if (result.blocked) {
      const isLinkedIn = result.reason === 'linkedin_login_required'
      const isJSSite = result.reason === 'javascript_rendered'

      const message = isLinkedIn
        ? 'LinkedIn requires you to be logged in — automated access is blocked. To import your LinkedIn profile: go to your LinkedIn page → select all (Ctrl+A / Cmd+A) → copy → use "Paste Text" mode instead.'
        : isJSSite
        ? 'This website loads content with JavaScript, which we cannot read server-side. Copy the text from the page and use "Paste Text" mode instead.'
        : 'Could not access that URL — the site may be private or block automated access. Copy the page content and use "Paste Text" mode instead.'

      return NextResponse.json({ error: 'blocked', message }, { status: 422 })
    }

    rawText = result.text
    sourceHint = result.sourceType

  // ── Mode 2: Pasted text ─────────────────────────────────────────────────────
  } else if (body.text) {
    // Cap input size: the extractor slices to 12,000 chars anyway, but we reject
    // oversized payloads early to protect against memory pressure and API cost abuse.
    if (typeof body.text !== 'string' || body.text.length > 50_000) {
      return NextResponse.json({
        error: 'text_too_long',
        message: 'Pasted text is too long (max 50,000 characters). Try selecting only the key sections of your profile.',
      }, { status: 422 })
    }
    rawText = body.text
    sourceHint = (body.sourceType as typeof sourceHint) ?? 'unknown'

  } else {
    return NextResponse.json(
      { error: 'Provide url or text. For PDF, use /api/candidate/import/pdf' },
      { status: 400 }
    )
  }

  if (!rawText || rawText.trim().length < 50) {
    return NextResponse.json({
      error: 'insufficient_content',
      message: 'Not enough text to extract from. Try pasting the full document text directly.',
    }, { status: 422 })
  }

  const profileContext = existingProfile
    ? { name: existingProfile.name, location: existingProfile.location ?? undefined }
    : undefined

  // Stream Claude's extraction tokens to the client.
  // Client accumulates and parses the complete JSON when stream ends.
  const stream = streamProfileExtraction(rawText, sourceHint, profileContext)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
