// POST /api/candidate/ai-profile — AI Persona Profiling
//
// Streams a PersonaAnalysis JSON built from the candidate's profile data plus
// an optional source: uploaded file (PDF/DOCX/TXT/MD/JSON/PNG/JPG/WEBP),
// pasted text, or a public URL.
//
// Input forms:
//   multipart/form-data  { file }                          — file upload
//   application/json     { text?: string; url?: string }   — paste / URL
//                        {} (empty)                        — profile data only
//
// The client accumulates the streamed JSON, parses it, and saves the result
// into career_data.ai_persona via PUT /api/candidate/profile.
//
// Runtime: Node.js (mammoth + unpdf). maxDuration 25 = Vercel Hobby window.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import { createServerClient } from '@/lib/supabase/server'
import {
  streamPersonaAnalysis,
  streamPersonaAnalysisFromDocument,
  type PersonaDocumentMediaType,
} from '@/lib/ai/persona-profiler'
import { extractTextFromUrl } from '@/lib/ai/profile-extractor'
import type { CandidateProfile, Skill, WorkExperienceEntry, EducationEntry } from '@/types/database'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

// ── Profile context builder ───────────────────────────────────────────────────

type ProfileRow = Pick<CandidateProfile,
  'name' | 'headline' | 'bio' | 'location' | 'work_experience' | 'education' | 'career_data'
> & { skills: Pick<Skill, 'name' | 'level'>[] }

function describeWork(work: WorkExperienceEntry[]): string {
  return work.map(j =>
    `- ${j.title} at ${j.company} (${j.start_date ?? '?'} – ${j.end_date ?? 'present'}): ${j.description ?? ''} ` +
    `Impacts: ${(j.key_impacts ?? []).join('; ')}. Tech: ${j.key_technologies.join(', ')}`
  ).join('\n')
}

function describeEducation(education: EducationEntry[]): string {
  return education.map(e =>
    `- ${[e.degree, e.field].filter(Boolean).join(' in ')} at ${e.institution} (${e.graduation_year ?? 'ongoing'})`
  ).join('\n')
}

function buildProfileContext(profile: ProfileRow): string {
  const cd = profile.career_data
  const parts = [
    `Name: ${profile.name ?? 'unknown'}`,
    profile.headline && `Headline: ${profile.headline}`,
    profile.bio && `Bio: ${profile.bio}`,
    profile.location && `Location: ${profile.location}`,
    profile.skills.length && `Skills: ${profile.skills.map(s => `${s.name} (L${s.level})`).join(', ')}`,
    Array.isArray(profile.work_experience) && profile.work_experience.length &&
      `Work experience:\n${describeWork(profile.work_experience)}`,
    Array.isArray(profile.education) && profile.education.length &&
      `Education:\n${describeEducation(profile.education)}`,
    cd?.values_priorities?.length && `Stated values (ranked): ${cd.values_priorities.join(' > ')}`,
    cd?.work_style?.length && `Work style: ${cd.work_style.join(', ')}`,
    cd?.why_this_field && `Why this field: ${cd.why_this_field}`,
    cd?.goal_1_year && `1-year goal: ${cd.goal_1_year}`,
    cd?.goal_5_year && `5-year goal: ${cd.goal_5_year}`,
    cd?.dream_role && `Dream role: ${cd.dream_role}`,
    cd?.life_chapter_context && `Life context: ${cd.life_chapter_context}`,
  ]
  return parts.filter(Boolean).join('\n')
}

// ── File source → text or document block ─────────────────────────────────────

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json'])
const IMAGE_MEDIA_TYPES: Record<string, PersonaDocumentMediaType> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
}

type SourceResult =
  | { kind: 'text'; text: string }
  | { kind: 'document'; base64: string; mediaType: PersonaDocumentMediaType }
  | { kind: 'error'; status: number; error: string; message: string }

function cleanPdfText(raw: string): string {
  return raw
    .replace(/\b([A-Z] ){2,}[A-Z]\b/g, m => m.replace(/ /g, ''))
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 10000)
}

async function resolveFileSource(file: File): Promise<SourceResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (file.size > 20 * 1024 * 1024) {
    return { kind: 'error', status: 400, error: 'file_too_large', message: 'File must be under 20 MB.' }
  }
  const arrayBuffer = await file.arrayBuffer()

  if (ext === 'pdf') {
    try {
      const { text: pages } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      const joined = Array.isArray(pages) ? pages.join('\n') : (pages as string)
      const text = cleanPdfText(joined)
      if (text.length < 50) {
        return { kind: 'error', status: 422, error: 'insufficient_content', message: 'Could not read text from this PDF — try a PNG/JPG screenshot instead.' }
      }
      return { kind: 'text', text }
    } catch {
      return { kind: 'error', status: 422, error: 'pdf_parse_error', message: 'Could not read this PDF — it may be password-protected.' }
    }
  }
  if (ext === 'docx' || ext === 'doc') {
    try {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      if (value.trim().length < 50) {
        return { kind: 'error', status: 422, error: 'insufficient_content', message: 'The document appears to be empty.' }
      }
      return { kind: 'text', text: value.trim() }
    } catch {
      return { kind: 'error', status: 422, error: 'docx_parse_error', message: 'Could not read this Word document.' }
    }
  }
  if (IMAGE_MEDIA_TYPES[ext]) {
    return { kind: 'document', base64: Buffer.from(arrayBuffer).toString('base64'), mediaType: IMAGE_MEDIA_TYPES[ext] }
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    const text = new TextDecoder().decode(arrayBuffer).trim()
    if (text.length < 50) {
      return { kind: 'error', status: 422, error: 'insufficient_content', message: 'The file appears to be empty.' }
    }
    return { kind: 'text', text }
  }
  return { kind: 'error', status: 400, error: 'unsupported_file_type', message: `"${ext}" files are not supported. Use PDF, DOCX, TXT, MD, JSON, PNG, JPG, or WEBP.` }
}

// ── JSON-body source (text / url / profile-only) ──────────────────────────────

async function resolveJsonSource(req: Request): Promise<SourceResult | null> {
  const body = await req.json().catch(() => ({})) as { text?: string; url?: string }
  if (body.text && body.text.trim().length >= 50) {
    return { kind: 'text', text: body.text.trim() }
  }
  if (body.url) {
    const { text, blocked, reason } = await extractTextFromUrl(body.url)
    if (blocked) {
      return { kind: 'error', status: 422, error: 'url_blocked', message: `Could not read that URL (${reason}). Paste the content as text instead.` }
    }
    return { kind: 'text', text }
  }
  return null // profile-data-only analysis
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
    const { data: user } = await supabase
      .from('users').select('id').eq('clerk_id', userId).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('name, headline, bio, location, work_experience, education, career_data, skills(name, level)')
      .eq('user_id', user.id)
      .single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const profileContext = buildProfileContext(profile as unknown as ProfileRow)

    const contentType = req.headers.get('content-type') ?? ''
    let source: SourceResult | null = null
    if (contentType.includes('multipart/form-data')) {
      const file = (await req.formData()).get('file') as File | null
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      source = await resolveFileSource(file)
    } else {
      source = await resolveJsonSource(req)
    }

    if (source?.kind === 'error') {
      return NextResponse.json({ error: source.error, message: source.message }, { status: source.status })
    }

    const stream = source?.kind === 'document'
      ? streamPersonaAnalysisFromDocument(source.base64, source.mediaType, profileContext)
      : streamPersonaAnalysis(profileContext, source?.kind === 'text' ? source.text : undefined)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[ai-profile] analysis failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}
