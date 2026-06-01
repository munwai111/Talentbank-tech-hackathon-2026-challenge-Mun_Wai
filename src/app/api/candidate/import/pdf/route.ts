// POST /api/candidate/import/pdf
// Multi-format resume / CV upload handler.
//
// Supported file types:
//   PDF  (.pdf)               → Claude native PDF document block (no text extraction)
//   DOCX (.docx, .doc)        → mammoth text extraction → text path
//   Text (.txt, .md)          → plain text → text path
//   Image (.png, .jpg, .jpeg, .webp) → Claude native image block
//
// Why native PDF/image blocks instead of text extraction (unpdf/pdfjs)?
//   Text extraction is lossy for styled, two-column, or image-based PDFs.
//   Sending bytes directly to Claude lets it read any layout natively and
//   eliminates the "AI response could not be parsed" error on complex resumes.
//   See DECISIONS.md ADR-002.
//
// Runtime: Node.js (mammoth + Anthropic SDK have Node.js-specific code paths).
// maxDuration = 25 signals the 25s streaming window on Vercel Hobby.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { createServerClient } from '@/lib/supabase/server'
import {
  streamProfileExtraction,
  streamProfileExtractionFromDocument,
  type DocumentMediaType,
} from '@/lib/ai/profile-extractor'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

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

  const maxBytes = 20 * 1024 * 1024   // 20 MB
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
    // ── PDF: send bytes directly to Claude as a native document block ──────────
    // No text extraction — Claude reads any layout, orientation, or design natively.
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    stream = streamProfileExtractionFromDocument(base64, 'application/pdf', profileContext)

  } else if (category === 'image') {
    // ── Image: send as native Claude vision block ─────────────────────────────
    // Handles scanned resumes, photo CVs, and design-heavy image exports.
    const mediaType = IMAGE_MEDIA_TYPES[ext] ?? 'image/jpeg'
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    stream = streamProfileExtractionFromDocument(base64, mediaType, profileContext)

  } else if (category === 'docx') {
    // ── DOCX: mammoth extracts clean markdown-ish text, then text path ────────
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
