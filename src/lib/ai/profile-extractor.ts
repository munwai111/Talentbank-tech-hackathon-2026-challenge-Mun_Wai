// Profile Extraction Engine
// ─────────────────────────────────────────────────────────────
// One unified AI pipeline that takes raw text from ANY source
// (PDF resume, LinkedIn page, Seek profile, personal website)
// and returns clean, structured, vetted profile data.
//
// Model: claude-haiku-4-5 (fast enough for Edge runtime <25s)
// Schema: only fields we actually save — keeps tokens tight & fast

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Output types ──────────────────────────────────────────────

export type ExtractedProfile = {
  // Bio fields — saved to candidate_profiles
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
  github_url: string | null
  linkedin_url: string | null
  salary_min: number | null
  salary_max: number | null

  // Skills — the most important output, saved to skills table
  skills: {
    name: string             // Normalised: "React" not "ReactJS"
    level: 1 | 2 | 3 | 4 | 5
    evidence: string         // One-line reason for this level
    source_type: 'explicit' | 'inferred'
  }[]

  // Experience — preview only (shown to user to verify extraction accuracy)
  // Not saved to DB, used only for skill level cross-checking
  experience: {
    title: string
    company: string
    duration: string | null  // e.g. "2021–2024" or "2 years"
  }[]

  // Quality signals
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  source_type_detected: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown'
}

// ── System prompt (cached across all calls) ───────────────────

const SYSTEM_PROMPT = `You are a career data analyst for Career OS, a skills-first hiring platform in Southeast Asia.

Extract and intelligently vet profile information from any source: resume PDFs, LinkedIn text, portfolio websites, or plain text.

## Skill Extraction Rules

**Normalise names:**
- ReactJS / React.js → "React"
- NodeJS / Node.js → "Node.js"
- PostgreSQL / Postgres → "PostgreSQL"
- JS → "JavaScript", TS → "TypeScript"
- Always use the well-known canonical name

**Skill level (1–5):**
1 = Beginner: Mentioned once, no project evidence
2 = Elementary: Used in coursework or minor personal projects
3 = Intermediate: Multiple real projects or 1–2 years experience
4 = Advanced: 3+ years, clear technical depth
5 = Expert: Led others in this skill, open source, wrote about it

**Cross-checking (critical):**
- Claim of Expert with <1 year → downgrade to Intermediate, add warning
- Skill only in education (not work) → max level 2
- No evidence of use → level 1, flag as unverified

**Implicit inference:**
- "Built REST APIs" → add "REST API Design" (Intermediate)
- "Deployed on AWS" → add "AWS" (level by description depth)
- "Led a team of 5" → add "Team Leadership"

**Deduplication:** keep only the highest-level instance per skill.

## Salary (APAC context, in MYR by default)
- If not mentioned, estimate conservatively from role/seniority/location
- Malaysia mid-level dev: RM 5,000–9,000/mo → RM 60,000–108,000/yr
- Singapore add ~40%

## Source detection
- resume: CV/resume format
- linkedin: LinkedIn profile text
- seek: Seek job board profile
- website: Personal portfolio or website
- unknown: Can't determine

## Output
Return ONLY valid JSON. No markdown fences, no commentary, nothing before or after the JSON object.
Be thorough on skills. Flag anything uncertain in warnings[].`

// ── Robust JSON extractor ─────────────────────────────────────
// Haiku sometimes adds text before/after JSON despite instructions.
// This finds the outermost { } so we parse correctly regardless.

function extractJSONObject(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('No valid JSON object found in AI response')
  }
  return raw.slice(start, end + 1)
}

// ── Main extraction function ──────────────────────────────────

export async function extractProfileFromText(
  rawText: string,
  sourceHint?: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown',
  existingProfile?: { name?: string; location?: string }
): Promise<ExtractedProfile> {

  const userPrompt = `Extract ALL profile information from this ${sourceHint ?? 'document'}.

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
  "experience": [{ "title": string, "company": string, "duration": string | null }],
  "confidence": "high"|"medium"|"low",
  "warnings": string[],
  "source_type_detected": "resume"|"linkedin"|"seek"|"website"|"unknown"
}

--- SOURCE CONTENT ---
${rawText.slice(0, 12000)}
--- END CONTENT ---`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
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
  } catch (err) {
    console.error('[profile-extractor] JSON parse failed:', firstBlock.text.slice(0, 300))
    throw new Error('AI extraction returned invalid format — please try again')
  }
}

// ── URL fetch helper ──────────────────────────────────────────
// Fetches and strips HTML from a URL.
// LinkedIn and most SPAs will return blocked: true.

export async function extractTextFromUrl(url: string): Promise<{
  text: string
  sourceType: 'linkedin' | 'seek' | 'website'
  blocked: boolean
  reason?: string
}> {
  const sourceType = url.includes('linkedin.com') ? 'linkedin'
    : url.includes('seek.com') ? 'seek'
    : 'website'

  // LinkedIn requires login — no point even trying
  if (sourceType === 'linkedin') {
    return {
      text: '',
      sourceType,
      blocked: true,
      reason: 'linkedin_login_required',
    }
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

    // Strip HTML → readable text
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

    // Detect JavaScript-only sites (SPA) — very little text after stripping
    if (text.length < 300) {
      return {
        text: '',
        sourceType,
        blocked: true,
        reason: 'javascript_rendered',
      }
    }

    return { text, sourceType, blocked: false }
  } catch {
    return { text: '', sourceType, blocked: true, reason: 'network_error' }
  }
}
