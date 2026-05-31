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

type PathsResponse = { paths: CareerPath[] }

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

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateCareerPaths(input: PathInput): Promise<CareerPath[]> {
  const prompt = buildPathPrompt(input)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1400,  // 3 path objects on Edge — kept tight so Haiku completes in <20s
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  // Guard against empty content (safety refusal, API hiccup)
  const firstBlock = response.content[0]
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error('Claude returned no text content — try again')
  }

  const raw = firstBlock.text.trim()

  // Strip any accidental markdown fences
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  let parsed: PathsResponse
  try {
    const result = JSON.parse(json) as unknown
    // Validate shape — Claude might return a top-level array or missing `paths` key
    if (typeof result !== 'object' || result === null || !Array.isArray((result as PathsResponse).paths)) {
      throw new Error('Unexpected response shape from Claude')
    }
    parsed = result as PathsResponse
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${err instanceof Error ? err.message : String(err)}`)
  }

  return parsed.paths
}
