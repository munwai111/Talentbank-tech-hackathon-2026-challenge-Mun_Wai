// Career Identity Synthesiser
// ─────────────────────────────────────────────────────────────────────────────
// Takes structured form answers and returns a compelling narrative paragraph.
// This is the "AI craft" layer — what makes the profile feel human, not form-like.
//
// Two functions:
//   synthesizeCareerIdentity()  — candidate version
//   synthesizeEmployerIdentity() — employer version
//
// Both use prompt caching on the system prompt (static across all calls).

import Anthropic from '@anthropic-ai/sdk'
import type { CareerData, CultureData } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CANDIDATE_SYSTEM = `You are a career narrative specialist for Career OS, a skills-first hiring platform in APAC.

Your job is to read a candidate's raw form answers and write a compelling, honest "Career Identity" —
a 3-4 sentence paragraph that captures who this person is professionally, what drives them,
and what kind of opportunity would be right for them.

Rules:
- Write in third person ("This candidate..." or use their situation as the subject)
- Be specific and concrete. Do not use vague phrases like "passionate" or "team player" unless there is real evidence
- Reflect their actual values and goals, not generic career advice
- If their situation is unusual (career changer, self-taught, fresh grad from a non-traditional background),
  name it clearly — that is a strength, not something to hide
- Keep it honest. Do not over-promise or inflate
- End with one sentence about the type of role or company that would be a strong fit for them

Output: ONLY the paragraph text. No headers, no bullet points, no other text.`

const EMPLOYER_SYSTEM = `You are an employer branding specialist for Career OS, a skills-first hiring platform in APAC.

Your job is to read a company's culture answers and write a compelling "Employer Identity" —
a 3-4 sentence paragraph that helps candidates understand what it is genuinely like to work there
and what type of person would thrive in this environment.

Rules:
- Be specific and concrete. "We move fast" means nothing. "Teams ship to production every two weeks" means something.
- If the culture data mentions specific values or criteria, name them explicitly
- Be honest about the type of company (startup, corporate, mission-driven, etc.)
- End with one sentence about the type of candidate who would genuinely thrive there

Output: ONLY the paragraph text. No headers, no bullet points, no other text.`

// ─────────────────────────────────────────────────────────────────────────────
// Candidate synthesis
// ─────────────────────────────────────────────────────────────────────────────
export async function synthesizeCareerIdentity(data: CareerData): Promise<string> {
  const prompt = `Here are the candidate's answers:

SITUATION
- Current situation: ${data.current_situation ?? 'not specified'}
- Education: ${data.education_level ?? 'not specified'} in ${data.education_field ?? 'unspecified field'} from ${data.education_institution ?? 'unspecified institution'}
- Graduation year: ${data.graduation_year ?? 'not specified'}
- Years of experience: ${data.years_experience ?? 0}
- Current/last role: ${data.current_or_last_role ?? 'not specified'} at ${data.current_or_last_company ?? 'unspecified company'}
- Key achievements: ${data.key_achievements ?? 'none provided'}

JOB PREFERENCES
- Industries they want to work in: ${data.preferred_industries?.join(', ') || 'not specified'}
- Job functions they want: ${data.preferred_job_functions?.join(', ') || 'not specified'}
- Company types they prefer: ${data.preferred_company_types?.join(', ') || 'not specified'}
- Work arrangement: ${data.preferred_work_arrangement ?? 'flexible'}
- Open to relocate: ${data.open_to_relocation ? 'yes' : 'no'}
- Preferred locations: ${data.preferred_locations?.join(', ') || 'not specified'}

VALUES & WORK STYLE
- What matters most (ranked): ${data.values_priorities?.join(' > ') || 'not specified'}
- Work style: ${data.work_style?.join(', ') || 'not specified'}
- What drew them to their field: ${data.why_this_field ?? 'not specified'}

GOALS
- 1-year goal: ${data.goal_1_year ?? 'not specified'}
- 5-year goal: ${data.goal_5_year ?? 'not specified'}
- Dream role: ${data.dream_role ?? 'not specified'}
- Deal-breakers: ${data.deal_breakers ?? 'none stated'}

Write the Career Identity paragraph now.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',  // Haiku is sufficient for synthesis — fast and cheap
    max_tokens: 300,
    system: [{ type: 'text', text: CANDIDATE_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { text: string }).text.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Employer synthesis
// ─────────────────────────────────────────────────────────────────────────────
export async function synthesizeEmployerIdentity(data: CultureData): Promise<string> {
  const prompt = `Here is the company's culture information:

CULTURE
- Culture descriptors: ${data.culture_tags?.join(', ') || 'not specified'}
- Work arrangements offered: ${data.work_arrangements?.join(', ') || 'not specified'}

EMPLOYER VALUE PROP
- Why work here: ${data.why_work_here ?? 'not specified'}
- How employees grow and progress: ${data.employee_growth_path ?? 'not specified'}

HIRING CRITERIA
- What they look for beyond skills: ${data.cultural_fit_criteria?.join(', ') || 'not specified'}
- Benefits offered: ${data.benefits?.join(', ') || 'not specified'}
- Types of roles they hire: ${data.typical_roles?.join(', ') || 'not specified'}

Write the Employer Identity paragraph now.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    system: [{ type: 'text', text: EMPLOYER_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { text: string }).text.trim()
}
