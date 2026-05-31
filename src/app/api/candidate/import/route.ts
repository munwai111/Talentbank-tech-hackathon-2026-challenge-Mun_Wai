// POST /api/candidate/import
// Accepts three input modes:
//   1. multipart/form-data with "file" field (PDF resume upload)
//   2. application/json with { url: string } (Seek profile, personal website)
//   3. application/json with { text: string, sourceType?: string } (pasted text)
//
// Returns ExtractedProfile — a preview the user confirms before applying.
// The apply step is a separate call to /api/candidate/import/apply.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { createServerClient } from '@/lib/supabase/server'
import { extractProfileFromText, extractTextFromUrl } from '@/lib/ai/profile-extractor'

// App Router route segment config
export const dynamic = 'force-dynamic'
export const maxDuration = 60  // seconds — AI extraction can take a while

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

  // ── Mode 1: PDF upload ─────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    // unpdf is ESM-native (built on PDF.js) — no CJS interop issues with Turbopack
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true })
    rawText = Array.isArray(pages) ? pages.join('\n') : (pages as string)
    sourceHint = 'resume'

  } else {
    const body = await req.json()

    // ── Mode 2: URL fetch ────────────────────────────────────────
    if (body.url) {
      const result = await extractTextFromUrl(body.url)
      if (result.blocked) {
        return NextResponse.json({
          error: 'blocked',
          message:
            'Could not access that URL — the site may require login or block automated access. ' +
            'Try copying the page text and using the "Paste Text" option instead.',
        }, { status: 422 })
      }
      rawText = result.text
      sourceHint = result.sourceType

    // ── Mode 3: Pasted text ──────────────────────────────────────
    } else if (body.text) {
      rawText = body.text
      sourceHint = body.sourceType ?? 'unknown'

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
    console.error('Profile extraction failed:', err)
    return NextResponse.json({ error: 'AI extraction failed — please try again' }, { status: 500 })
  }
}
