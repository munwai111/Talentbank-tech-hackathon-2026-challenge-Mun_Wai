// Skill Insight generator
// ─────────────────────────────────────────────────────────────────────────────
// For a single skill (name + 1-5 level), produces a comprehensive professional
// read used by the gamified Skills Vault:
//   - what roles require this skill and why
//   - real use cases and the impact it drives at work
//   - where the skill shows up in THIS candidate's own work experience (grounded;
//     empty when there's no evidence — never invented)
//   - a level-appropriate growth tip
//
// Model: claude-haiku-4-5, streamed (client accumulates + parses with the same
// repair-json safety net as the persona profiler).

import Anthropic from '@anthropic-ai/sdk'
import type { WorkExperienceEntry } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SkillInsight = {
  summary: string
  roles: { title: string; reason: string }[]
  use_cases: { scenario: string; impact: string }[]
  evidence: { where: string; detail: string }[]
  has_evidence: boolean
  growth_tip: string
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert',
}

const SYSTEM_PROMPT = `You are a senior career analyst and technical recruiter for Career OS, a skills-first hiring platform in APAC. For ONE skill, you write a tight, recruiter-grade professional read for a candidate's gamified Skills Vault.

Rules:
- Concrete and specific to the skill — never generic filler. A reader should learn something real about how the skill operates in the workplace.
- roles: 3-4 real job titles that genuinely require this skill, each with a one-line reason WHY the skill matters in that role.
- use_cases: 2-3 real scenarios where the skill is applied, each paired with the tangible IMPACT it drives (speed, quality, revenue, risk, scale…).
- evidence: ONLY from the candidate's provided work experience. Cite the company/role and how the skill was demonstrated there. If nothing in their history clearly evidences this skill, return an EMPTY array and set has_evidence=false — never fabricate or stretch.
- Calibrate tone to the stated proficiency level, but do not inflate the candidate's level.
- growth_tip: one practical, level-appropriate way to deepen or evidence this skill next.

Output ONLY valid JSON. No markdown fences, no commentary.`

function buildPrompt(
  name: string,
  level: number,
  context: { headline: string | null; work: WorkExperienceEntry[] },
): string {
  const workText = context.work.length
    ? context.work.map(j =>
        `- ${j.title} at ${j.company}: ${j.description ?? ''} ` +
        `Impacts: ${(j.key_impacts ?? []).join('; ')}. Tech/skills: ${[...j.key_technologies, ...(j.key_skills ?? [])].join(', ')}`
      ).join('\n')
    : 'No work experience on file.'

  return `Skill: "${name}"
Candidate's self-assessed proficiency: ${LEVEL_LABELS[level] ?? 'Intermediate'} (level ${level}/5)
Candidate headline: ${context.headline ?? 'not specified'}

Candidate's work experience (use ONLY this for the evidence field):
${workText}

Return a JSON object exactly matching:
{
  "summary": string,                                  // 1 sentence: what this skill is, professionally
  "roles": [{ "title": string, "reason": string }],   // 3-4 roles needing it + why
  "use_cases": [{ "scenario": string, "impact": string }], // 2-3 applications + impact
  "evidence": [{ "where": string, "detail": string }],     // from THEIR history only; [] if none
  "has_evidence": boolean,
  "growth_tip": string
}`
}

export function streamSkillInsight(
  name: string,
  level: number,
  context: { headline: string | null; work: WorkExperienceEntry[] },
): ReadableStream<Uint8Array> {
  const userPrompt = buildPrompt(name, level, context)
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          max_tokens: 1200,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userPrompt }],
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Skill insight failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}
