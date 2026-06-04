// Career Path Navigator
// ─────────────────────────────────────────────────────────────────────────────
// Takes a candidate's skills + career data and returns 3 navigation paths:
//   • strong   — step-in ready (1–6 months)
//   • emerging — focused development needed (6–18 months)
//   • stretch  — ambitious long-term direction (18–36 months)
//
// Uses navigation framing: "people like you typically..." not "you will..."
// Salaries are in MYR, calibrated for Malaysia/Singapore markets.

import Anthropic from '@anthropic-ai/sdk'
import type { CareerData, WorkExperienceEntry, EducationEntry } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Output types ─────────────────────────────────────────────────────────────

export type PathMatchType = 'strong' | 'emerging' | 'stretch'

export type CareerPath = {
  id: PathMatchType
  title: string
  match_label: string
  company_types: string[]
  salary_min_myr: number
  salary_max_myr: number
  timeline_months_min: number
  timeline_months_max: number
  skills_you_have: string[]
  skills_to_develop: string[]
  trade_off: string
  navigation_note: string
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export type PathInput = {
  skills: { name: string; level: number }[]
  career_data: CareerData | null
  location: string | null
  work_experience: WorkExperienceEntry[]
  education: EducationEntry[]
}

// ── System prompt (cached — static across all calls) ─────────────────────────

const SYSTEM_PROMPT = `You are Career OS — a career navigation system for professionals in Southeast Asia (primarily Malaysia and Singapore).

Your job is to look at a candidate's current skills and background, then map out 3 realistic next-move directions:
1. STRONG MATCH — a role they can step into within 1–6 months with minimal additional learning
2. EMERGING MATCH — a natural next step requiring 6–18 months of focused skill development
3. STRETCH GOAL — an ambitious direction aligned with long-term interests, typically 18–36 months away

CRITICAL RULES:
- Use NAVIGATION language, not PREDICTION. Say "professionals with similar profiles in Malaysia typically..." not "you will..."
- Never guarantee outcomes. Show ranges, not single numbers.
- Salaries must be realistic for MALAYSIA in MYR. A mid-level dev earns RM 6,000–10,000/month. Senior: RM 10,000–18,000.
- Be concrete. "develop soft skills" is useless. Name specific, learnable skills.
- Ground suggestions in what's actually in demand in APAC tech markets.
- The trade_off must name a real cost or constraint — not a platitude.
- skills_you_have must only contain skills from the candidate's actual skill list.

OUTPUT: Return ONLY valid JSON — no markdown fences, no commentary, no text before or after:
{
  "paths": [
    {
      "id": "strong",
      "title": "Role Title",
      "match_label": "Strong Match — 4 of 5 core skills aligned",
      "company_types": ["Fintech startup", "E-commerce platform"],
      "salary_min_myr": 8000,
      "salary_max_myr": 13000,
      "timeline_months_min": 1,
      "timeline_months_max": 3,
      "skills_you_have": ["React", "TypeScript"],
      "skills_to_develop": ["System design"],
      "trade_off": "Most openings are in Kuala Lumpur — remote roles in this band are rare.",
      "navigation_note": "Professionals with similar profiles in Malaysia typically land this move within 1–3 months of active searching."
    },
    { "id": "emerging", ... },
    { "id": "stretch", ... }
  ]
}`

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPathPrompt(input: PathInput): string {
  const { skills, career_data: cd, location, work_experience, education } = input

  const skillList = skills.length > 0
    ? skills.map(s => `  • ${s.name} (level ${s.level}/5)`).join('\n')
    : '  (no skills listed yet)'

  const workHistory = work_experience.length > 0
    ? work_experience.map(exp => {
        const period = exp.start_date
          ? `${exp.start_date} → ${exp.end_date ?? 'Present'}`
          : exp.duration_months ? `~${Math.round(exp.duration_months / 12)} yrs` : ''
        const tech = exp.key_technologies.length > 0 ? ` | Tech: ${exp.key_technologies.join(', ')}` : ''
        return `  • ${exp.title} @ ${exp.company}${period ? ` (${period})` : ''}${tech}${exp.description ? `\n    ${exp.description}` : ''}`
      }).join('\n')
    : '  (not provided — using career form data only)'

  const educationHistory = education.length > 0
    ? education.map(edu => {
        const degree = [edu.degree, edu.field].filter(Boolean).join(' in ')
        return `  • ${degree || 'Qualification'} — ${edu.institution}${edu.graduation_year ? ` (${edu.graduation_year})` : ''}`
      }).join('\n')
    : `  ${cd?.education_level ?? 'Not specified'} in ${cd?.education_field ?? 'unspecified field'}`

  const context = [
    `CANDIDATE SNAPSHOT`,
    `Location: ${location ?? 'not specified'}`,
    `Situation: ${cd?.current_situation ?? 'not specified'} | Experience: ${cd?.years_experience ?? 0} years`,
    `Current/last role: ${cd?.current_or_last_role ?? 'not specified'} at ${cd?.current_or_last_company ?? 'unspecified'}`,
    ``,
    `WORK HISTORY (most recent first)`,
    workHistory,
    ``,
    `EDUCATION`,
    educationHistory,
    ``,
    `CURRENT SKILLS`,
    skillList,
    ``,
    `CAREER GOALS`,
    `1-year goal: ${cd?.goal_1_year ?? 'not specified'}`,
    `5-year goal: ${cd?.goal_5_year ?? 'not specified'}`,
    `Dream role: ${cd?.dream_role ?? 'not specified'}`,
    `Preferred industries: ${cd?.preferred_industries?.join(', ') || 'not specified'}`,
    `Preferred job functions: ${cd?.preferred_job_functions?.join(', ') || 'not specified'}`,
    `Values: ${cd?.values_priorities?.join(', ') || 'not specified'}`,
    `Open to relocation: ${cd?.open_to_relocation ? 'yes' : 'no'}`,
    ``,
    `Use the full work history and education context to generate realistic, personalised paths.`,
    `Map out the 3 career navigation paths now.`,
  ].join('\n')

  return context
}

// ── Compact prompt (retry fallback) ──────────────────────────────────────────
// Strips verbose work history to reduce input size, giving Claude more
// output headroom on retry. Used when the full prompt produces truncated JSON.

function buildPathPromptCompact(input: PathInput): string {
  const { skills, career_data: cd, location } = input

  const skillList = skills.length > 0
    ? skills.map(s => `  • ${s.name} (level ${s.level}/5)`).join('\n')
    : '  (no skills listed yet)'

  return [
    `CANDIDATE SNAPSHOT`,
    `Location: ${location ?? 'not specified'}`,
    `Experience: ${cd?.years_experience ?? 0} years | Role: ${cd?.current_or_last_role ?? 'not specified'}`,
    ``,
    `CURRENT SKILLS`,
    skillList,
    ``,
    `GOALS`,
    `1-year: ${cd?.goal_1_year ?? 'not specified'}`,
    `5-year: ${cd?.goal_5_year ?? 'not specified'}`,
    `Dream role: ${cd?.dream_role ?? 'not specified'}`,
    ``,
    `Map out the 3 career navigation paths now.`,
  ].join('\n')
}

// ── Core generation (blocking, with retry) ───────────────────────────────────
// Uses messages.create() (not streaming) so we receive the full response before
// sending anything to the client. This lets us validate JSON completeness and
// retry with a compact prompt if the first attempt produces truncated output.
//
// We still wrap this in a ReadableStream so the route handler returns a streaming
// Response — which keeps the 25s Vercel Hobby timeout (vs 10s for blocking routes).

async function generatePaths(input: PathInput, attempt = 1): Promise<string> {
  const prompt = attempt === 1 ? buildPathPrompt(input) : buildPathPromptCompact(input)

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (msg.content[0] as { type: 'text'; text: string }).text.trim()
  // Strip markdown code fences if Claude wrapped the JSON
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

  let parsed: { paths?: CareerPath[] }
  try {
    parsed = JSON.parse(cleaned) as { paths?: CareerPath[] }
  } catch {
    if (attempt < 2) return generatePaths(input, 2)
    throw new Error('Career path generation failed — please try again')
  }

  // Validate we got all 3 paths
  if (!parsed.paths || parsed.paths.length < 3) {
    if (attempt < 2) return generatePaths(input, 2)
    throw new Error('Incomplete paths generated — please try again')
  }

  return cleaned
}

// ── Public export ─────────────────────────────────────────────────────────────
// Returns a ReadableStream so the route handler stays unchanged.
// The streaming wrapper keeps the 25s Vercel Hobby timeout.

export function streamCareerPaths(input: PathInput): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const json = await generatePaths(input)
        controller.enqueue(encoder.encode(json))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Path generation failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}
