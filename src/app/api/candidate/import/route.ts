// POST /api/candidate/import
// Accepts three input modes:
//   1. multipart/form-data with "file" field (PDF resume upload)
//   2. application/json with { url: string } (Seek profile, personal website)
//   3. application/json with { text: string, sourceType?: string } (pasted text)
//
// Returns ExtractedProfile — a preview the user confirms before applying.
// The apply step is a separate call to /api/candidate/import/apply.
//
// Runtime: Edge — avoids Hobby plan's 10s Node.js limit (Edge allows 25s).
// unpdf is Edge-compatible (no Node.js worker dependency).

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
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

  // Get existing profile to give Claude context for filling gaps
  const { data: existingProfile } = await supabase
    .from('candidate_profiles')
    .select('name, location')
    .eq('user_id', user.id)
    .single()

  const contentType = req.headers.get('content-type') ?? ''
  let rawText = ''
  let sourceHint: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown' = 'unknown'

  // ── Mode 1: PDF upload ──────────────────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF must be under 5 MB' }, { status: 400 })
    }

    // Edge-compatible: use ArrayBuffer directly (no Buffer.from which is Node.js-only)
    const arrayBuffer = await file.arrayBuffer()
    const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
    rawText = Array.isArray(pages) ? pages.join('\n') : (pages as string)
    sourceHint = 'resume'

  } else {
    const body = await req.json() as { url?: string; text?: string; sourceType?: string }

    // ── Mode 2: URL fetch ─────────────────────────────────────────────────────
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

    // ── Mode 3: Pasted text ───────────────────────────────────────────────────
    } else if (body.text) {
      rawText = body.text
      sourceHint = (body.sourceType as typeof sourceHint) ?? 'unknown'

    } else {
      return NextResponse.json({ error: 'Provide file, url, or text' }, { status: 400 })
    }
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
    console.error('[import] profile extraction failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI extraction failed — please try again' },
      { status: 500 }
    )
  }
}
