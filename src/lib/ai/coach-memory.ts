// Coach memory — a compact, evolving summary of a candidate that the AI Coach
// accumulates across conversations. Stored in candidate_profiles.career_data
// (career_data.coach_memory) and injected into the coach's context so each new
// conversation, and downstream AI features, build on what came before.
//
// Updated throttled & non-blocking after a reply — never on the hot path of the
// chat stream.

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MEMORY_SYSTEM = `You maintain a compact, evolving memory of a job-seeker for their AI career coach in APAC (Malaysia-first).

You receive the EXISTING MEMORY and a NEW CONVERSATION snippet. Return an UPDATED memory that merges them.

Capture only durable, useful signal:
- Their situation (role, experience, location, employment status)
- Stated goals (short and long term) and the dream they're reaching for
- Concerns, blockers, anxieties they've voiced
- Constraints (caregiving, salary needs, relocation, timing, visa)
- Preferences (industries, company types, work style, values)
- Topics already discussed / advice already given (so the coach doesn't repeat)

Rules:
- Merge, don't replace — keep prior facts unless contradicted, then update.
- Drop nothing important; omit small talk and pleasantries.
- Plain text, 6–12 short bullet lines, under 180 words total. No preamble.`

export type MemoryMessage = { role: 'user' | 'assistant'; content: string }

export async function updateCoachMemory(
  prior: string,
  recent: MemoryMessage[],
  candidateName: string,
): Promise<string> {
  const convo = recent
    .slice(-12) // cap input — only the recent tail matters for the update
    .map(m => `${m.role === 'user' ? 'Candidate' : 'Coach'}: ${m.content}`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: [{ type: 'text', text: MEMORY_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `Candidate: ${candidateName}\n\nEXISTING MEMORY:\n${prior || '(none yet)'}\n\nNEW CONVERSATION:\n${convo}\n\nReturn the updated memory.`,
    }],
  })

  const block = message.content.find(b => b.type === 'text')
  const text = block && block.type === 'text' ? block.text : prior
  return text.trim().slice(0, 2000)
}
