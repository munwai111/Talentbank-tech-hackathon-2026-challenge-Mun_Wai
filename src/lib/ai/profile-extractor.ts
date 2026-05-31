// Profile Extraction Engine
// ─────────────────────────────────────────────────────────────
// One unified AI pipeline that takes raw text from ANY source
// (PDF resume, LinkedIn page, Seek profile, personal website)
// and returns clean, structured, vetted profile data.
//
// The vetting step is what makes this "intelligent":
// - Normalises skill names (ReactJS → React)
// - Infers implicit skills from experience descriptions
// - Cross-checks claimed levels against evidence
// - Deduplicates across sources
// - Estimates experience years from dates

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// The structured output Claude always returns
export type ExtractedProfile = {
  // Bio fields
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
  email: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null

  // Salary (extracted from "expected salary" mentions or market inference)
  salary_min: number | null
  salary_max: number | null

  // Skills — the most important output
  skills: {
    name: string           // Normalised name e.g. "React", not "ReactJS"
    level: 1 | 2 | 3 | 4 | 5
    evidence: string       // WHY Claude assigned this level
    source_type: 'explicit' | 'inferred'  // Did they state it, or did Claude infer it?
  }[]

  // Work experience
  experience: {
    title: string
    company: string
    start_date: string | null   // "2021-03" format where possible
    end_date: string | null     // null = current
    description: string | null
    duration_months: number | null
  }[]

  // Education
  education: {
    institution: string
    degree: string | null
    field: string | null
    graduation_year: number | null
  }[]

  // AI quality assessment
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]   // e.g. "Claimed Expert level but only 6 months experience"
  source_type_detected: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown'
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — cached across all calls (Anthropic prompt caching)
// This is the "intelligence" behind the vetting.
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert career data analyst and technical recruiter for Career OS,
a skills-first hiring platform for APAC graduates.

Your job is to extract, structure, and INTELLIGENTLY VET profile information from any source
(resumes, LinkedIn pages, Seek profiles, personal websites, plain text).

## Skill Extraction Rules

**Normalisation:**
- ReactJS, React.js → "React"
- NodeJS, Node, Node.js → "Node.js"
- PostgreSQL, Postgres → "PostgreSQL"
- JS → "JavaScript"
- TS → "TypeScript"
- Always use the canonical, commonly-recognised name

**Skill Level Assignment (1-5):**
1 = Beginner: Mentioned once, no evidence of use in real projects
2 = Elementary: Used in coursework or minor personal projects
3 = Intermediate: Used in multiple real projects or 1-2 years experience
4 = Advanced: 3+ years, complex usage, technical depth evident
5 = Expert: Deep expertise, led others, wrote about it, open source contributions

**Cross-checking (CRITICAL):**
- If someone claims "Expert" but has <1 year experience with it → downgrade to Intermediate, add warning
- If a skill appears only in education (not work) → max level 2
- If a skill is listed but no evidence of use → level 1, flag as unverified
- If work description mentions technical depth → infer skill and give credit

**Implicit Skill Inference:**
- "Built REST APIs" → add "REST API Design" (Intermediate)
- "Deployed on AWS" → add "AWS" (skill level based on depth of description)
- "Led a team of 5" → add "Team Leadership"
- "Managed database performance" → add "Database Optimisation"

## Deduplication
- If the same skill appears multiple times (e.g. from multiple job experiences),
  keep only the highest-level instance with combined evidence

## Salary Estimation (APAC context)
- If salary not mentioned, estimate based on: location, years of experience, role level
- Use MYR as default currency for Malaysia, SGD for Singapore, IDR for Indonesia
- Be conservative — give a realistic range, not aspirational

## Source Detection
Identify what type of source this is:
- resume: structured CV/resume format
- linkedin: LinkedIn profile page content
- seek: Seek job board profile
- website: Personal portfolio/website
- unknown: Can't determine

## Output Format
Return ONLY valid JSON matching the ExtractedProfile type. No other text.
Be thorough but honest. Flag anything uncertain in warnings[].`

// ─────────────────────────────────────────────────────────────
// Main extraction function
// ─────────────────────────────────────────────────────────────
export async function extractProfileFromText(
  rawText: string,
  sourceHint?: 'resume' | 'linkedin' | 'seek' | 'website' | 'unknown',
  existingProfile?: { name?: string; location?: string }
): Promise<ExtractedProfile> {

  const userPrompt = `Extract and vet ALL profile information from this ${sourceHint ?? 'document'}.

${existingProfile ? `Context: User's current name is "${existingProfile.name}", located in "${existingProfile.location}". Use this to fill gaps.` : ''}

--- SOURCE CONTENT ---
${rawText.slice(0, 15000)}
--- END CONTENT ---

Return the complete ExtractedProfile JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',  // Use Sonnet for complex extraction — Haiku misses nuance
    max_tokens: 4000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        // Prompt caching: system prompt is static → cached after first call
        // Saves ~80% cost on every subsequent extraction
        cache_control: { type: 'ephemeral' },
      }
    ],
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = (response.content[0] as { text: string }).text.trim()

  // Strip markdown fences if Claude wrapped the JSON
  const cleaned = raw
    .replace(/^```json\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  try {
    return JSON.parse(cleaned) as ExtractedProfile
  } catch {
    // If JSON parse fails, return a minimal safe result rather than crashing
    console.error('Profile extraction JSON parse failed:', cleaned.slice(0, 200))
    throw new Error('AI extraction returned invalid format — please try again')
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch and extract text from a URL (Seek, website, LinkedIn attempt)
// ─────────────────────────────────────────────────────────────
export async function extractTextFromUrl(url: string): Promise<{
  text: string
  sourceType: 'linkedin' | 'seek' | 'website'
  blocked: boolean
}> {
  // Detect source type from URL
  const sourceType = url.includes('linkedin.com') ? 'linkedin'
    : url.includes('seek.com') ? 'seek'
    : 'website'

  try {
    const res = await fetch(url, {
      headers: {
        // Use a real browser user agent to reduce blocking
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(10000),  // 10 second timeout
    })

    if (!res.ok) {
      return { text: '', sourceType, blocked: true }
    }

    const html = await res.text()

    // Strip HTML tags to get readable text
    // This is basic but effective for well-structured profile pages
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')  // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')    // Remove styles
      .replace(/<[^>]+>/g, ' ')                           // Strip all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')                              // Collapse whitespace
      .trim()

    // LinkedIn login wall — they redirect to sign-in
    if (sourceType === 'linkedin' && (
      text.includes('Join LinkedIn') ||
      text.includes('Sign in to LinkedIn') ||
      text.length < 500
    )) {
      return { text: '', sourceType, blocked: true }
    }

    return { text, sourceType, blocked: false }
  } catch {
    return { text: '', sourceType, blocked: true }
  }
}
