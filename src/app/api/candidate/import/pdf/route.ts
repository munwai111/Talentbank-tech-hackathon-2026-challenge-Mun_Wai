// POST /api/candidate/import/pdf
// PDF resume upload handler — Node.js runtime (unpdf requires it).
//
// unpdf bundles pdfjs-dist which uses process.release.name (Node.js-only global).
// Vercel's Edge bundler rejects this, so PDF processing lives here on Node.js.
//
// Node.js Hobby plan limit: 10 seconds.
// Haiku at ~150 tok/s with 1400 max_tokens completes in ~9s — within the window.
// Very large PDFs or slow API responses may still timeout; users should retry
// or use the Paste Text option for more reliable results.
//
// See DECISIONS.md ADR-001 for the model choice rationale.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import { createServerClient } from '@/lib/supabase/server'
import { extractProfileFromText } from '@/lib/ai/profile-extractor'

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

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF must be under 5 MB' }, { status: 400 })
  }

  // Extract text from PDF using unpdf (Node.js only — uses pdfjs-dist internally)
  const arrayBuffer = await file.arrayBuffer()
  const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
  const rawText = Array.isArray(pages) ? pages.join('\n') : (pages as string)

  if (!rawText || rawText.trim().length < 50) {
    return NextResponse.json({
      error: 'insufficient_content',
      message: 'Could not extract readable text from this PDF. The file may be scanned/image-based. Try copying the text manually and using Paste Text instead.',
    }, { status: 422 })
  }

  try {
    const extracted = await extractProfileFromText(
      rawText,
      'resume',
      existingProfile
        ? { name: existingProfile.name, location: existingProfile.location ?? undefined }
        : undefined,
    )
    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('[import/pdf] extraction failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI extraction failed — please try again' },
      { status: 500 }
    )
  }
}
