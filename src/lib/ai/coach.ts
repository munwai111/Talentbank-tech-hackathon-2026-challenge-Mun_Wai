// AI Career Coach
// ─────────────────────────────────────────────────────────────────────────────
// Returns a ReadableStream so the API route can stream tokens to the client.
// Prompt caching: coaching personality is cached (static); profile context is
// passed as a second system block (dynamic, not cached).

import Anthropic from '@anthropic-ai/sdk'

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
}

// ── Static coaching personality (prompt-cached) ───────────────────────────────

const COACH_PERSONALITY = `You are an honest, direct career coach specialising in Southeast Asia tech markets — primarily Malaysia and Singapore.

Your style:
- Specific over vague. "Learn Docker — it appears in 70%+ of KL startup job posts" beats "improve your DevOps skills".
- You know APAC salary bands in MYR, realistic timelines, and which companies are actually hiring.
- Ask one focused follow-up question when needed — never fire 5 at once.
- If a goal is unrealistic given the candidate's stage, say so clearly. Then give a concrete stepping-stone path.
- Keep responses under 200 words unless the user asks for a deep dive.
- Talk like a smart friend in tech, not a HR consultant. No jargon.`

// ── Profile context builder ───────────────────────────────────────────────────

function buildProfileContext(ctx: CoachContext): string {
  const skillList = ctx.skills.length > 0
    ? ctx.skills.map(s => `${s.name} (${s.level}/5)`).join(', ')
    : 'none listed yet'

  return [
    `---`,
    `CANDIDATE: ${ctx.name}`,
    `Location: ${ctx.location ?? 'not specified'}`,
    `Situation: ${ctx.situation ?? 'unknown'} | Role: ${ctx.currentRole ?? 'not specified'} | Experience: ${ctx.yearsExperience ?? 0} yrs`,
    `Skills: ${skillList}`,
    `1-year goal: ${ctx.goal1Year ?? 'not specified'}`,
    `5-year goal: ${ctx.goal5Year ?? 'not specified'}`,
    `---`,
    `Reference this profile when giving advice. Be personalised.`,
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
