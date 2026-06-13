// AI Persona Profiler
// ─────────────────────────────────────────────────────────────────────────────
// Builds a full qualitative persona from a candidate's resume/CV and profile
// data: tangible achievements, professional engagements, MBTI-style read,
// Big Five (OCEAN) estimates, a Korn Ferry Four Dimensions-style assessment
// (competencies / drivers / traits / experiences), field-of-expertise fit,
// interests, drive & goals, life priorities, and behavioural-emotional profile.
//
// IMPORTANT FRAMING: outputs are *indicative*, derived from written materials —
// not a clinical or validated psychometric instrument. The system prompt forces
// evidence-grounded estimates with confidence + caveats, and the UI shows a
// permanent disclaimer.
//
// Two input paths (mirrors profile-extractor.ts):
//   streamPersonaAnalysis(rawText, profileContext)      — text path
//   streamPersonaAnalysisFromDocument(base64, mediaType, profileContext)
//                                                        — native PDF/image path
//
// Model: claude-haiku-4-5, max_tokens 4096 (25s Vercel Hobby streaming window).

import Anthropic from '@anthropic-ai/sdk'
import type { PersonaAnalysis } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type { PersonaAnalysis }

// ── System prompt (prompt-cached — static across all calls) ───────────────────

const SYSTEM_PROMPT = `You are a senior organisational psychologist and executive assessor for Career OS, a skills-first hiring platform in APAC. You synthesise whole-person professional personas from resumes, CVs, and profile data.

You apply three established lenses — always grounded in the actual evidence provided, never generic:

1. MBTI-style type indication — estimate the most likely 4-letter type from how the person writes, what they choose to highlight, their career decisions, and work patterns. Give per-dichotomy confidence (50-100). Confidence 50 = no signal either way.

2. Big Five (OCEAN) — estimate each trait 0-100 from behavioural evidence in the materials. 50 = population average / no signal. For Neuroticism, report it as "Emotional Stability" (higher = more stable) so the output reads constructively.

3. Korn Ferry Four Dimensions-style read (KF4D):
   - Competencies: observable skills like strategic vision, collaboration, influence, execution
   - Drivers: what motivates them — challenge, power, autonomy, collaboration, structure, balance
   - Traits: dispositions — assertiveness, risk-taking, persistence, adaptability, curiosity
   - Experiences: a short narrative on the depth/breadth of formative experiences

4. Workplace behavioural read (for hiring managers — how this person actually WORKS):
   - Rate 8 validated behavioural spectrums, each 0-100 (50 = balanced). Use these poles:
     Communication (Direct ↔ Diplomatic), Pace (Deliberate ↔ Fast-moving),
     Structure (Improvisational ↔ Process-driven), Focus (Big-picture ↔ Detail-oriented),
     Social energy (Independent ↔ Collaborative), Decisions (Data-driven ↔ Intuition-led),
     Conflict (Accommodating ↔ Assertive), Change (Steady ↔ Adaptive).
   - collaboration / communication / conflict / decision / stress-response styles: one concrete sentence each, grounded in evidence.
   - motivation_drivers, ideal_environment: what conditions bring out their best.
   - working_with_guide: 3-5 PRACTICAL tips for a manager to get the best from this person.
   - watch_outs: 2-3 honest friction points, phrased constructively (development framing, never a red flag list).
   This section is workplace-relevant ONLY. Do NOT infer or report anything about health, disability, family status, age, religion, or any protected characteristic.

## Hard rules

- EVIDENCE-GROUNDED: every insight must trace to something in the materials. Quote or paraphrase the signal in rationale/insight fields. If evidence is thin, say so in evidence_notes and lower confidence.
- NO FLATTERY INFLATION: a fresh graduate is not a "visionary leader". Calibrate to actual seniority and scale.
- TANGIBLE ACHIEVEMENTS: extract concrete, ideally quantified wins (numbers, scale, scope). Do not invent numbers.
- FIELD FIT: rank 3-5 fields of expertise this person fits, scored 0-100, each with a one-line rationale tying interest + evidence + trajectory together.
- LIFE PRIORITIES: infer from career choices (e.g. relocations, employer types, stated goals) — flag inferences as such.
- BEHAVIOUR & EMOTION: describe observable working style and likely emotional patterns under pressure, hedged appropriately.
- GROWTH AREAS: 2-4 honest development areas phrased constructively. Every strong profile still has them.
- This is an indicative reading of written materials, NOT a psychometric test result. Reflect genuine uncertainty in the confidence field and evidence_notes.

## Output budget (HARD LIMITS — the response is cut off if exceeded)
- persona_summary: 3-4 sentences
- tangible_achievements: max 5 items, each ≤ 18 words
- professional_engagements: max 4 items, each ≤ 14 words
- mbti.dichotomies: exactly 4; rationale ≤ 15 words each; mbti.summary ≤ 40 words
- big_five: exactly 5; insight ≤ 18 words each
- kf4d: max 4 per group; insight ≤ 14 words each; experiences ≤ 50 words
- field_fit: 3-4 items; rationale ≤ 18 words each
- interests: max 6 short phrases; life_priorities: max 5 short phrases
- drive_and_goals ≤ 60 words; behaviour_and_emotion ≤ 70 words
- strengths / growth_areas: max 4 each, ≤ 12 words per item
- workplace_behaviour.spectrums: exactly 8 (the listed poles); insight ≤ 14 words each
- workplace_behaviour style fields: 1 sentence each, ≤ 22 words
- working_with_guide: 3-5 items ≤ 16 words; watch_outs: 2-3 items ≤ 16 words
- motivation_drivers: max 5 short phrases; ideal_environment ≤ 30 words
- evidence_notes: max 3 items

## Output
Return ONLY valid JSON matching the schema in the user message. No markdown fences, no commentary. Stay within the output budget — completeness of the JSON matters more than verbosity.`

// ── Shared output schema (kept in the user prompt so it streams with context) ──

const OUTPUT_SCHEMA = `{
  "persona_summary": string,            // 3-5 sentence whole-person narrative
  "tangible_achievements": string[],    // concrete, quantified where possible
  "professional_engagements": string[], // roles, communities, leadership, volunteering
  "mbti": {
    "type": string,                     // e.g. "ENTJ"
    "label": string,                    // e.g. "The Commander"
    "dichotomies": [{ "dimension": "Energy"|"Information"|"Decisions"|"Structure", "pole": string, "confidence": number, "rationale": string }],
    "summary": string
  },
  "big_five": [{ "name": "Openness"|"Conscientiousness"|"Extraversion"|"Agreeableness"|"Emotional Stability", "score": number, "insight": string }],
  "kf4d": {
    "competencies": [{ "name": string, "level": "high"|"moderate"|"emerging", "insight": string }],
    "drivers":      [{ "name": string, "level": "high"|"moderate"|"emerging", "insight": string }],
    "traits":       [{ "name": string, "level": "high"|"moderate"|"emerging", "insight": string }],
    "experiences": string
  },
  "field_fit": [{ "field": string, "fit_score": number, "rationale": string }],
  "interests": string[],
  "drive_and_goals": string,
  "life_priorities": string[],
  "behaviour_and_emotion": string,
  "strengths": string[],
  "growth_areas": string[],
  "workplace_behaviour": {
    "spectrums": [{ "name": string, "left": string, "right": string, "position": number, "insight": string }],
    "collaboration_style": string,
    "communication_style": string,
    "conflict_style": string,
    "decision_style": string,
    "stress_response": string,
    "motivation_drivers": string[],
    "ideal_environment": string,
    "working_with_guide": string[],
    "watch_outs": string[]
  },
  "confidence": "high"|"medium"|"low",
  "evidence_notes": string[]
}`

function buildPersonaPrompt(profileContext: string, sourceText?: string): string {
  return `Build the complete persona analysis for this candidate.

## Existing profile data (from their Career OS profile)
${profileContext || 'No structured profile data available.'}
${sourceText ? `\n## Source material (resume / CV / provided text)\n${sourceText.slice(0, 12000)}` : ''}

Return a JSON object matching exactly this schema:
${OUTPUT_SCHEMA}`
}

// ── Streaming core (shared by text + document paths) ─────────────────────────

type UserContent =
  | string
  | ({ type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
   | { type: 'image'; source: { type: 'base64'; media_type: 'image/png' | 'image/jpeg' | 'image/webp'; data: string } }
   | { type: 'text'; text: string })[]

function streamPersona(content: UserContent): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-haiku-4-5',
          // 5500 tokens covers the full persona incl. the workplace-behaviour
          // section. On Vercel Hobby's 25s window a very dense profile may not
          // finish — repairTruncatedJson() on the client closes any open brackets
          // so a partial persona still renders. Raise/lower with the plan's
          // streaming limit (Pro = 60s). See ADR-001.
          max_tokens: 5500,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content }],
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Persona analysis failed'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export function streamPersonaAnalysis(
  profileContext: string,
  sourceText?: string,
): ReadableStream<Uint8Array> {
  return streamPersona(buildPersonaPrompt(profileContext, sourceText))
}

export type PersonaDocumentMediaType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp'

export function streamPersonaAnalysisFromDocument(
  base64Data: string,
  mediaType: PersonaDocumentMediaType,
  profileContext: string,
): ReadableStream<Uint8Array> {
  const docBlock = mediaType === 'application/pdf'
    ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64Data } }
    : { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType, data: base64Data } }
  return streamPersona([docBlock, { type: 'text', text: buildPersonaPrompt(profileContext) }])
}
