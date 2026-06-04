// AI Career Coach
// ─────────────────────────────────────────────────────────────────────────────
// Returns a ReadableStream so the API route can stream tokens to the client.
// Prompt caching: coaching personality is cached (static); profile context is
// passed as a second system block (dynamic, per user, not cached).
//
// Context depth: coach now receives full work history + education from the DB,
// in addition to skills and career goals — enabling personalised, contextual
// advice grounded in the candidate's actual career journey.

import Anthropic from '@anthropic-ai/sdk'
import type { WorkExperienceEntry, EducationEntry } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type CoachContext = {
  name: string
  location: string | null
  skills: { name: string; level: number }[]
  currentRole: string | null
  yearsExperience: number | null
  situation: string | null
  goal1Year: string | null
  goal5Year: string | null
  dreamRole: string | null
  preferredIndustries: string[]
  workExperience: WorkExperienceEntry[]
  education: EducationEntry[]
  lifeChapterContext: string | null
}

// ── Static coaching personality (prompt-cached) ───────────────────────────────

const COACH_PERSONALITY = `You are an honest, direct career coach specialising in Southeast Asia tech markets — primarily Malaysia and Singapore.

Your style:
- Specific over vague. "Learn Docker — it appears in 70%+ of KL startup job posts" beats "improve your DevOps skills".
- You know APAC salary bands in MYR, realistic timelines, and which companies are actually hiring.
- Ask one focused follow-up question when needed — never fire 5 at once.
- If a goal is unrealistic given the candidate's stage, say so clearly. Then give a concrete stepping-stone path.
- Keep responses under 200 words unless the user asks for a deep dive.
- Talk like a smart friend in tech, not a HR consultant. No jargon.
- Use the candidate's work history and education to make advice contextual and personal — reference their actual experience.`

// ── Profile context builder ───────────────────────────────────────────────────

function buildProfileContext(ctx: CoachContext): string {
  const skillList = ctx.skills.length > 0
    ? ctx.skills.map(s => `${s.name} (${s.level}/5)`).join(', ')
    : 'none listed yet'

  const workHistory = ctx.workExperience.length > 0
    ? ctx.workExperience.map(exp => {
        const period = exp.start_date
          ? `${exp.start_date} → ${exp.end_date ?? 'Present'}`
          : exp.duration_months ? `~${Math.round(exp.duration_months / 12)} years` : ''
        const tech = exp.key_technologies.length > 0 ? ` | Tech: ${exp.key_technologies.join(', ')}` : ''
        return `  • ${exp.title} at ${exp.company}${period ? ` (${period})` : ''}${tech}${exp.description ? `\n    ${exp.description}` : ''}`
      }).join('\n')
    : '  (not yet provided)'

  const educationHistory = ctx.education.length > 0
    ? ctx.education.map(edu => {
        const degree = [edu.degree, edu.field].filter(Boolean).join(' in ')
        const year = edu.graduation_year ? `, ${edu.graduation_year}` : ''
        return `  • ${degree || 'Qualification'} — ${edu.institution}${year}`
      }).join('\n')
    : '  (not yet provided)'

  return [
    `---`,
    `CANDIDATE: ${ctx.name}`,
    `Location: ${ctx.location ?? 'not specified'}`,
    `Situation: ${ctx.situation ?? 'unknown'} | Experience: ${ctx.yearsExperience ?? 0} years`,
    `Current/last role: ${ctx.currentRole ?? 'not specified'}`,
    ``,
    `SKILLS`,
    skillList,
    ``,
    `WORK HISTORY`,
    workHistory,
    ``,
    `EDUCATION`,
    educationHistory,
    ``,
    `GOALS`,
    `1-year: ${ctx.goal1Year ?? 'not specified'}`,
    `5-year: ${ctx.goal5Year ?? 'not specified'}`,
    `Dream role: ${ctx.dreamRole ?? 'not specified'}`,
    `Preferred industries: ${ctx.preferredIndustries.join(', ') || 'not specified'}`,
    ...(ctx.lifeChapterContext ? [``, `LIFE CONTEXT`, ctx.lifeChapterContext] : []),
    `---`,
    `Reference this profile when giving advice. Be specific and personalised to their actual history.`,
    ...(ctx.lifeChapterContext ? [`When life context is present, factor it naturally into your advice without making it the focus.`] : []),
  ].join('\n')
}

// ── Streaming response ────────────────────────────────────────────────────────

export function streamCoachResponse(
  messages: CoachMessage[],
  ctx: CoachContext,
): ReadableStream<Uint8Array> {
  const profileContext = buildProfileContext(ctx)
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 600,
          system: [
            // Personality block: cached (static across all coaching calls)
            { type: 'text', text: COACH_PERSONALITY, cache_control: { type: 'ephemeral' } },
            // Profile block: dynamic per user, not cached
            { type: 'text', text: profileContext },
          ],
          messages,
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Coach unavailable'
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })
}
