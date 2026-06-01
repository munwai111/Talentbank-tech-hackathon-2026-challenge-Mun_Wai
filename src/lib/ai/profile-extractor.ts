// Profile Extraction Engine
// ─────────────────────────────────────────────────────────────────────────────
// Two extraction paths:
//
// 1. streamProfileExtraction(text, ...)  — text-based (LinkedIn paste, Seek, URL)
// 2. streamProfileExtractionFromDocument(base64, mediaType, ...) — document-based
//    Sends PDF or image bytes directly to Claude as a native document/image block.
//    Bypasses text extraction entirely — Claude reads ANY layout, orientation,
//    or design natively. Used by the file upload route.
//
// Model: claude-haiku-4-5 (~150 tok/s)
// Token budgets:
//   text path      → 4096 (URL/paste has 25s Vercel streaming window)
//   document path  → 8192 (same 25s window; native PDF is much faster to process
//                    than extracted text and typical resumes finish well under budget)
//
// Decision record: see DECISIONS.md — Haiku chosen for cost efficiency on
// Vercel Hobby plan; upgrade path to Sonnet documented for future consideration.
//
// Schema: captures the full qualitative picture of the candidate —
// skills (saved), work history (saved as JSONB), education (saved as JSONB),
// bio fields (saved). All of this feeds into Path Navigator + AI Coach context.

import Anthropic from '@anthropic-ai/sdk'
import type { WorkExperienceEntry, EducationEntry } from '@/types/database'
import { validateUrl } from '@/lib/validate-url'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Output type ───────────────────────────────────────────────────────────────
// Everything in this type is saved to the database (not just shown in preview).
// Rich qualitative data gives AI Coach and Path Navigator full context about
// the candidate's background, progression, and motivational patterns.

export type ExtractedProfile = {
  // ── Bio fields → saved to candidate_profiles ──────────────────────────────
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
  github_url: string | null
  linkedin_url: string | null
  salary_min: number | null   // MYR/year
  salary_max: number | null

  // ── Skills → saved to skills table (most important output) ────────────────
  skills: {
    name: string             // Normalised: "React" not "ReactJS"
    level: 1 | 2 | 3 | 4 | 5
    evidence: string         // One-line rationale for this level
    source_type: 'explicit' | 'inferred'  // Stated vs AI-inferred
  }[]

  // ── Work experience → saved as candidate_profiles.work_experience (JSONB) ──
  // Captures the candidate's career progression, responsibilities, and
  // technical context of each role — feeds AI Coach and Path Navigator.
  experience: WorkExperienceEntry[]

  // ── Education → saved as candidate_profiles.education (JSONB) ─────────────
  // Institution, degree, field, and year — used for background context
  // and skill level calibration (e.g. CS degree → stronger theoretical base).
  education: EducationEntry[]

  // ── AI quality signals ─────────────────────────────────────────────────────
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]   // e.g. "Claimed Expert but only 6 months experience"
  source_type_detected: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown'
}

// ── System prompt (prompt-cached — static across all extraction calls) ────────

const SYSTEM_PROMPT = `You are a senior career data analyst and technical recruiter for Career OS, a skills-first hiring platform in Southeast Asia.

Extract, structure, and INTELLIGENTLY VET profile information from any source: resumes, LinkedIn text, Seek profiles, personal websites, plain text.

Your goal is to capture the candidate's FULL qualitative picture — not just a skills list, but their career progression, educational background, motivations (inferred from their trajectory), and contextual depth that helps AI systems understand who this person is, where they've come from, and where they're heading.

## Skill Extraction Rules

**Normalise names:**
- ReactJS / React.js → "React"
- NodeJS / Node.js → "Node.js"
- PostgreSQL / Postgres → "PostgreSQL"
- JS → "JavaScript", TS → "TypeScript"
- Always use the well-known canonical name

**Skill level (1–5):**
1 = Beginner: Mentioned once, no real project evidence
2 = Elementary: Coursework or minor personal projects only
3 = Intermediate: Multiple real projects or 1–2 years hands-on
4 = Advanced: 3+ years, technical depth evident, led implementations
5 = Expert: Led teams, open source contributions, wrote about it, deep architecture decisions

**Cross-checking (CRITICAL for calibration):**
- Claimed "Expert" with <1 year experience → downgrade to Intermediate, add warning
- Skill only in education context (not work) → max level 2
- Skill listed but no evidence of actual use → level 1, flag as unverified
- Senior/lead role descriptions → infer higher levels on relevant skills

**Implicit skill inference:**
- "Built REST APIs" → add "REST API Design" (Intermediate)
- "Deployed on AWS" → add "AWS" (level by description depth)
- "Led a team of 5" → add "Team Leadership"
- "Managed database performance" → add "Database Optimisation"
- "Wrote technical specs" → add "Technical Documentation"

**Deduplication:** keep only the highest-level instance per skill with combined evidence.

## Work Experience Extraction

For each role, extract:
- title, company: exact as stated
- start_date / end_date: "YYYY-MM" format where possible, null if unclear, null end_date = current
- duration_months: estimate from dates, null if dates unclear
- description: 2–4 sentence summary of key responsibilities AND achievements. Include numbers/impact if mentioned. This is the qualitative context for AI analysis.
- key_technologies: all tech stack mentioned in the context of THIS role only

## Education Extraction

For each qualification:
- institution, degree, field, graduation_year
- Include incomplete degrees with a note in warnings[]

## Salary (APAC context, in MYR by default)
- If not mentioned, estimate conservatively from role/seniority/location
- Malaysia mid-level dev: RM 60,000–108,000/year
- Singapore: add ~40%
- Express as annual amounts (multiply monthly × 12)

## Source Detection
- resume: structured CV/resume format
- linkedin: LinkedIn profile text
- seek: Seek job board profile
- website: Personal portfolio or website
- unknown: Can't determine

## Confidence Rating
- high: Clear, well-structured source with consistent dates and verifiable claims
- medium: Some gaps, inconsistent dates, or unverifiable claims
- low: Sparse data, contradictions, or very short text

## Output
Return ONLY valid JSON. No markdown fences, no commentary, nothing before or after the JSON object.
Be thorough on both skills AND work history. The richer the experience descriptions, the better the AI coach can give personalised, contextual advice.`

// ── Robust JSON extractor ─────────────────────────────────────────────────────
// Haiku occasionally adds explanatory prose before/after the JSON despite
// instructions. This finds the outermost { } so we parse correctly regardless.

function extractJSONObject(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No valid JSON object found in AI response')
  }
  return raw.slice(start, end + 1)
}

// ── Prompt builder (shared by streaming + non-streaming paths) ────────────────

function buildExtractionPrompt(
  rawText: string,
  sourceHint?: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown',
  existingProfile?: { name?: string; location?: string }
): string {
  return `Extract the COMPLETE profile from this ${sourceHint ?? 'document'}. Capture all work experience entries and education entries in full — do not summarise or truncate.

${existingProfile ? `Context: User's current name is "${existingProfile.name ?? 'unknown'}", located in "${existingProfile.location ?? 'unknown'}". Use this to fill any gaps.` : ''}

Return a JSON object matching exactly this schema:
{
  "name": string | null,
  "headline": string | null,
  "bio": string | null,
  "location": string | null,
  "github_url": string | null,
  "linkedin_url": string | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "skills": [{ "name": string, "level": 1|2|3|4|5, "evidence": string, "source_type": "explicit"|"inferred" }],
  "experience": [{
    "title": string,
    "company": string,
    "start_date": string | null,
    "end_date": string | null,
    "duration_months": number | null,
    "description": string | null,
    "key_technologies": string[]
  }],
  "education": [{
    "institution": string,
    "degree": string | null,
    "field": string | null,
    "graduation_year": number | null
  }],
  "confidence": "high"|"medium"|"low",
  "warnings": string[],
  "source_type_detected": "resume"|"linkedin"|"seek"|"website"|"unknown"
}

--- SOURCE CONTENT ---
${rawText.slice(0, 12000)}
--- END CONTENT ---`
}

// ── Streaming extraction ──────────────────────────────────────────────────────
// Returns a ReadableStream of raw text tokens from Claude.
// Route handlers pipe this to the HTTP response; clients accumulate and parse JSON.
// Streaming gives 25s on Vercel Hobby instead of 10s for non-streaming responses.

export function streamProfileExtraction(
  rawText: string,
  sourceHint?: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown',
  existingProfile?: { name?: string; location?: string }
): ReadableStream<Uint8Array> {
  const userPrompt = buildExtractionPrompt(rawText, sourceHint, existingProfile)
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          // 4096 tokens: handles dense 3-page PDFs with 8+ roles and 25+ skills.
          // PDF text preprocessing (cleanPdfText) reduces input tokens ~30% so Claude
          // can spend more of the budget on rich output. Haiku supports up to 8192 output
          // tokens; at ~150 tok/s, 4096 = ~27s which fits within Vercel Hobby's 25s streaming
          // window because most profiles finish well under the ceiling. See DECISIONS.md ADR-001.
          max_tokens: 4096,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userPrompt }],
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Extraction failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}

// ── Document-based streaming extraction (PDF / image native blocks) ───────────
// Sends the raw file bytes to Claude as a native document or image content block.
// Claude handles any layout, orientation, multi-column design, or embedded font
// without intermediate text extraction — resolving the unpdf/pdfjs quality problem.

export type DocumentMediaType =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'

type DocumentUserContent =
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
  | { type: 'image';    source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/webp'; data: string } }

function buildDocumentContent(
  base64Data: string,
  mediaType: DocumentMediaType,
): DocumentUserContent {
  if (mediaType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
  }
  // image/png | image/jpeg | image/webp
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
}

function buildDocumentExtractionPrompt(
  existingProfile?: { name?: string; location?: string },
): string {
  return `Extract the COMPLETE profile from the attached document. Capture all work experience entries and education entries in full — do not summarise or truncate.

${existingProfile ? `Context: User's current name is "${existingProfile.name ?? 'unknown'}", located in "${existingProfile.location ?? 'unknown'}". Use this to fill any gaps.` : ''}

Return a JSON object matching exactly this schema:
{
  "name": string | null,
  "headline": string | null,
  "bio": string | null,
  "location": string | null,
  "github_url": string | null,
  "linkedin_url": string | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "skills": [{ "name": string, "level": 1|2|3|4|5, "evidence": string, "source_type": "explicit"|"inferred" }],
  "experience": [{
    "title": string,
    "company": string,
    "start_date": string | null,
    "end_date": string | null,
    "duration_months": number | null,
    "description": string | null,
    "key_technologies": string[]
  }],
  "education": [{
    "institution": string,
    "degree": string | null,
    "field": string | null,
    "graduation_year": number | null
  }],
  "confidence": "high"|"medium"|"low",
  "warnings": string[],
  "source_type_detected": "resume"|"linkedin"|"seek"|"website"|"unknown"
}`
}

export function streamProfileExtractionFromDocument(
  base64Data: string,
  mediaType: DocumentMediaType,
  existingProfile?: { name?: string; location?: string },
): ReadableStream<Uint8Array> {
  const textPrompt = buildDocumentExtractionPrompt(existingProfile)
  const docContent = buildDocumentContent(base64Data, mediaType)
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          // 8192 tokens: native PDF processing is faster than text extraction and
          // a full 3-page dense resume with rich experience comfortably fits.
          // At ~150 tok/s this is ~55s worst-case; typical resumes finish in ~20s.
          // Vercel Hobby streams up to 25s — large files may truncate, the client
          // applies the same patching fallback as the text path.
          max_tokens: 8192,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: [{
            role: 'user',
            content: [docContent, { type: 'text', text: textPrompt }],
          }],
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Extraction failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}

// ── Non-streaming extraction (kept for internal use / tests) ──────────────────

export async function extractProfileFromText(
  rawText: string,
  sourceHint?: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown',
  existingProfile?: { name?: string; location?: string }
): Promise<ExtractedProfile> {

  const userPrompt = buildExtractionPrompt(rawText, sourceHint, existingProfile)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    // 1800 tokens: PDF route (Node.js 10s limit) completes in ~12s on Haiku — borderline but acceptable.
    // URL/text route (Edge 25s limit) has more headroom.
    // Increase to 2500 when upgrading to Vercel Pro (60s Node.js limit). See DECISIONS.md ADR-001.
    max_tokens: 1800,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const firstBlock = response.content[0]
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error('AI returned no text — please try again')
  }

  try {
    const json = extractJSONObject(firstBlock.text)
    return JSON.parse(json) as ExtractedProfile
  } catch {
    console.error('[profile-extractor] JSON parse failed:', firstBlock.text.slice(0, 300))
    throw new Error('AI extraction returned invalid format — please try again')
  }
}

// ── URL fetch helper ──────────────────────────────────────────────────────────
// Fetches and strips HTML from a public URL.
// LinkedIn: immediately blocked (requires login — see DECISIONS.md for future
// scraping API option that would enable seamless onboarding without manual paste).

export async function extractTextFromUrl(url: string): Promise<{
  text: string
  sourceType: 'linkedin' | 'seek' | 'website'
  blocked: boolean
  reason?: string
}> {
  const sourceType = url.includes('linkedin.com') ? 'linkedin'
    : url.includes('seek.com') ? 'seek'
    : 'website'

  const urlCheck = validateUrl(url)
  if (!urlCheck.valid) {
    return { text: '', sourceType, blocked: true, reason: urlCheck.reason }
  }

  // LinkedIn requires login — no point attempting a fetch
  if (sourceType === 'linkedin') {
    return { text: '', sourceType, blocked: true, reason: 'linkedin_login_required' }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(7000),
    })

    if (!res.ok) {
      return { text: '', sourceType, blocked: true, reason: `HTTP ${res.status}` }
    }

    const html = await res.text()

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()

    // Detect JS-rendered SPAs — very little readable text after HTML stripping
    if (text.length < 300) {
      return { text: '', sourceType, blocked: true, reason: 'javascript_rendered' }
    }

    return { text, sourceType, blocked: false }
  } catch {
    return { text: '', sourceType, blocked: true, reason: 'network_error' }
  }
}
