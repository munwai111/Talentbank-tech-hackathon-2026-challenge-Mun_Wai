// POST /api/candidate/import
// Handles URL and paste-text import modes only.
// PDF uploads are handled by /api/candidate/import/pdf (Node.js runtime — unpdf is not Edge-compatible).
//
// Runtime: Edge — gives 25s on Vercel Hobby vs 10s for Node.js.
// unpdf uses process.release.name (Node.js global) which Vercel's Edge bundler rejects.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractProfileFromText, extractTextFromUrl } from '@/lib/ai/profile-extractor'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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
    rawText = body.text
    sourceHint = (body.sourceType as typeof sourceHint) ?? 'unknown'

  } else {
    return NextResponse.json(
      { error: 'Use this endpoint for url or text. For PDF upload, use /api/candidate/import/pdf' },
      { status: 400 }
    )
  }

  if (!rawText || rawText.trim().length < 50) {
    return NextResponse.json({
      error: 'insufficient_content',
      message: 'Not enough text to extract from. Try pasting the full document text directly.',
    }, { status: 422 })
  }

  try {
    const extracted = await extractProfileFromText(
      rawText,
      sourceHint,
      existingProfile
        ? { name: existingProfile.name, location: existingProfile.location ?? undefined }
        : undefined,
    )
    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('[import] extraction failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI extraction failed — please try again' },
      { status: 500 }
    )
  }
}
