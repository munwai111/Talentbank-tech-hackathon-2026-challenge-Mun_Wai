// POST /api/candidate/import/pdf
// Multi-format resume / CV upload handler.
//
// Supported file types:
//   PDF  (.pdf)               → unpdf text extraction → text path
//   DOCX (.docx, .doc)        → mammoth text extraction → text path
//   Text (.txt, .md)          → plain text → text path
//   Image (.png, .jpg, .jpeg, .webp) → Claude native vision block
//
// Why text extraction for PDFs (not native document blocks)?
//   Claude's native PDF document block requires Anthropic to read the full PDF
//   server-side before streaming begins — for a complex 335KB resume this adds
//   15-25s of overhead that exhausts Vercel Hobby's 25s streaming window.
//   Text extraction with unpdf is near-instant (<1s), leaving the full window
//   for token generation. cleanPdfText() fixes the letter-spacing artifacts
//   that styled PDFs produce. See DECISIONS.md ADR-002.
//
//   Images use native vision blocks because image processing overhead is much
//   lower (~1-2s vs 15-25s for PDFs), fitting comfortably in 25s.
//
// Runtime: Node.js (mammoth + Anthropic SDK have Node.js-specific code paths).
// maxDuration = 25 signals the 25s streaming window on Vercel Hobby.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import { createServerClient } from '@/lib/supabase/server'
import {
  streamProfileExtraction,
  streamProfileExtractionFromDocument,
  type DocumentMediaType,
} from '@/lib/ai/profile-extractor'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

// ── PDF text cleaning ─────────────────────────────────────────────────────────
// Removes letter-spacing artifacts produced by pdfjs on styled/two-column PDFs.
// e.g. "P R O F E S S I O N A L" → "PROFESSIONAL"
// Capping input at 6000 chars reduces output token pressure (less truncation risk)
// while still covering the full content of a standard 2-page resume.

function cleanPdfText(raw: string): string {
  return raw
    .replace(/\b([A-Z] ){2,}[A-Z]\b/g, m => m.replace(/ /g, ''))
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 6000)
}

// ── File type helpers ─────────────────────────────────────────────────────────

type FileCategory = 'pdf' | 'docx' | 'text' | 'image'

const ALLOWED_EXTENSIONS: Record<string, FileCategory> = {
  pdf:  'pdf',
  docx: 'docx',
  doc:  'docx',
  txt:  'text',
  md:   'text',
  png:  'image',
  jpg:  'image',
  jpeg: 'image',
  webp: 'image',
}

const IMAGE_MEDIA_TYPES: Record<string, DocumentMediaType> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function getCategory(filename: string): FileCategory | null {
  return ALLOWED_EXTENSIONS[getExtension(filename)] ?? null
}

// ── Route handler ─────────────────────────────────────────────────────────────

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

  const ext = getExtension(file.name)
  const category = getCategory(file.name)

  if (!category) {
    return NextResponse.json({
      error: 'unsupported_file_type',
      message: `"${ext}" files are not supported. Please upload a PDF, DOCX, TXT, PNG, JPG, or WEBP file.`,
    }, { status: 400 })
  }

  const maxBytes = 20 * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json({
      error: 'file_too_large',
      message: 'File must be under 20 MB. Try compressing the PDF or splitting it into sections.',
    }, { status: 400 })
  }

  const profileContext = existingProfile
    ? { name: existingProfile.name, location: existingProfile.location ?? undefined }
    : undefined

  const arrayBuffer = await file.arrayBuffer()
  let stream: ReadableStream<Uint8Array>

  if (category === 'pdf') {
    // ── PDF: text extraction → text path (fast, fits in 25s window) ───────────
    let rawText: string
    try {
      const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      const joined = Array.isArray(pages) ? pages.join('\n') : (pages as string)
      rawText = cleanPdfText(joined)
    } catch (err) {
      console.error('[import/pdf] PDF text extraction failed:', err)
      return NextResponse.json({
        error: 'pdf_parse_error',
        message: 'Could not read this PDF — it may be password-protected or corrupted. Try copying the text manually and using Paste Text instead.',
      }, { status: 422 })
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({
        error: 'insufficient_content',
        message: 'Could not extract readable text from this PDF. The file may be scanned or image-based — try uploading it as a PNG/JPG screenshot instead, or use Paste Text mode.',
      }, { status: 422 })
    }

    stream = streamProfileExtraction(rawText, 'resume', profileContext)

  } else if (category === 'image') {
    // ── Image: native Claude vision block ─────────────────────────────────────
    // Image processing overhead (~1-2s) is much lower than PDF (~15-25s),
    // fitting comfortably within the 25s window.
    const mediaType = IMAGE_MEDIA_TYPES[ext] ?? 'image/jpeg'
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    stream = streamProfileExtractionFromDocument(base64, mediaType, profileContext)

  } else if (category === 'docx') {
    // ── DOCX: mammoth extracts clean text → text path ─────────────────────────
    let rawText: string
    try {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      rawText = value.trim()
    } catch (err) {
      console.error('[import/pdf] DOCX extraction failed:', err)
      return NextResponse.json({
        error: 'docx_parse_error',
        message: 'Could not read this Word document — it may be password-protected or corrupted.',
      }, { status: 422 })
    }

    if (rawText.length < 50) {
      return NextResponse.json({
        error: 'insufficient_content',
        message: 'The document appears to be empty or could not be read. Try saving it as PDF and uploading again.',
      }, { status: 422 })
    }

    stream = streamProfileExtraction(rawText, 'resume', profileContext)

  } else {
    // ── Plain text (.txt / .md) ───────────────────────────────────────────────
    const rawText = new TextDecoder().decode(arrayBuffer).trim()

    if (rawText.length < 50) {
      return NextResponse.json({
        error: 'insufficient_content',
        message: 'The file appears to be empty or has too little text to extract a profile from.',
      }, { status: 422 })
    }

    stream = streamProfileExtraction(rawText, 'resume', profileContext)
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
