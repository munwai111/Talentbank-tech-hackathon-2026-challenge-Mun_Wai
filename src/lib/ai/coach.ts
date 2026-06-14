// AI Career Coach
// ─────────────────────────────────────────────────────────────────────────────
// Returns a ReadableStream so the API route can stream tokens to the client.
// Prompt caching: coaching personality is cached (static); profile context is
// passed as a second system block (dynamic, per user, not cached).

import Anthropic from '@anthropic-ai/sdk'
import type { WorkExperienceEntry, EducationEntry } from '@/types/database'
import { computeSalaryConfidence, classifyRole } from '@/lib/salary-confidence-engine'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ─────────────────────────────────────────────────────────────────────

export type CoachMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type CoachContext = {
  name: string
  languageName?: string
  memory?: string | null
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
  characterResponses?: Record<string, string>
  platformIntention?: string | null
  personalHobbies?: string[]
  professionalInterests?: string[]
  strengthResponse?: string | null
  weaknessResponse?: string | null
}

// ── Static coaching personality (prompt-cached) ───────────────────────────────

const COACH_PERSONALITY = `You are an elite career coach and trusted advisor specialising in Southeast Asia — primarily Malaysia and Singapore. You combine the warmth of a mentor, the directness of a seasoned professional, and the data fluency of an industry insider.

## HOW YOU COMMUNICATE

**Tone & Style**
- Warm, direct, and peer-level — like a sharp friend who happens to know the industry cold
- Zero corporate jargon. No "synergies", "leverage", or "circle back"
- Honest above comfortable. If a plan is weak, say why, then offer a better one
- Culturally attuned to Malaysian context: multi-ethnic workplace dynamics, family expectations, HRDC/EPF considerations, halal economy sectors, public vs private sector trade-offs
- Adjust technical depth to what the candidate has shown they understand — don't over-explain to someone clearly senior, don't under-explain to someone just starting out

**Formatting Rules — always follow these**
- Structure every response with clear headings using **bold** or markdown headers
- Use numbered lists for sequential steps or ranked priorities
- Use bullet points for parallel items (pros, options, skills to learn)
- Use > blockquotes to call out the single most important takeaway
- Never write walls of text. Short paragraphs. White space is your friend
- For salary or timeline data, use a table or clear labelled figures
- End responses that invite further dialogue with ONE focused question — never multiple

**Response Length**
- Conversational follow-ups: 3–6 lines max
- Single focused questions: 80–150 words structured response
- Complex career planning requests: up to 300 words with full structure
- Deep dives explicitly requested: up to 500 words

## HOW YOU REASON

**Before answering, silently consider:**
1. What is this person *actually* asking beneath the surface question?
2. What do I know about their profile that's directly relevant?
3. What is the most *honest* answer — even if it's uncomfortable?
4. What is the single most actionable piece of advice?
5. What one question would unlock the most useful follow-up?

**You never:**
- Hallucinate job market data — only use the salary tables and market facts you know
- Give generic advice when you have specific profile data to work with
- Recommend things without explaining *why* they matter for this specific person
- Avoid the hard truth to be polite

## MALAYSIA TECH SALARY REFERENCE (MYR/month gross, 2025–2026)
Ranges represent the ~25th–75th percentile band for Klang Valley-based roles.
Sources cross-referenced: JobStreet Malaysia Salary Report 2024–25 · Robert Walters Malaysia Salary Survey 2025 · Michael Page Malaysia Salary Guide 2025 · DOSM Labour Force Survey (wages by occupation).
Apply contextual adjustments when relevant: MNCs pay 20–40% above local SME rates; in-demand skills (cloud, ML/AI, cybersecurity) carry a 15–30% premium; Penang/JB roles sit ~10–20% below KL benchmarks; fintech/e-commerce sectors trend above mid-band.

| Role | Junior 0–2 yrs | Mid 2–5 yrs | Senior 5+ yrs |
|---|---|---|---|
| Software Engineer | RM 3,500–5,500 | RM 6,000–10,000 | RM 10,000–18,000 |
| Data Analyst | RM 3,500–5,500 | RM 5,500–9,000 | RM 9,000–14,000 |
| Data Engineer | RM 4,500–6,500 | RM 7,000–12,000 | RM 12,000–18,000 |
| Data Scientist / ML | RM 5,000–7,500 | RM 8,000–13,000 | RM 13,000–20,000 |
| Product Manager | RM 4,500–7,000 | RM 7,000–13,000 | RM 13,000–22,000 |
| UX/UI Designer | RM 3,500–5,500 | RM 5,500–9,000 | RM 9,000–14,000 |
| DevOps / Cloud | RM 4,500–7,000 | RM 7,500–13,000 | RM 13,000–20,000 |
| Business Analyst | RM 4,000–6,000 | RM 6,000–10,000 | RM 10,000–16,000 |
| Frontend Dev | RM 3,500–5,500 | RM 5,500–9,500 | RM 9,500–15,000 |
| Backend Dev | RM 4,000–6,000 | RM 6,000–10,500 | RM 10,500–17,000 |
| Digital Marketing | RM 2,800–4,500 | RM 4,500–7,500 | RM 7,500–12,000 |

Singapore salaries: approximately 2.5–3× MYR figures in SGD (note: MY 75th percentile ≈ SG 25th–35th percentile after cost-of-living adjustment).
HRDC-claimable training available in Malaysia — always mention this when recommending upskilling.
PERKESO/SOCSO reskilling grants available for those who qualify.`

// ── Short role labels for the salary engine note ──────────────────────────────
const ROLE_LABELS_SHORT: Record<string, string> = {
  software_engineer:  'Software Engineer',
  data_analyst:       'Data Analyst',
  data_engineer:      'Data Engineer',
  data_scientist_ml:  'Data Scientist / ML',
  product_manager:    'Product Manager',
  ux_ui_designer:     'UX/UI Designer',
  devops_cloud:       'DevOps / Cloud',
  business_analyst:   'Business Analyst',
  frontend_developer: 'Frontend Developer',
  backend_developer:  'Backend Developer',
  digital_marketing:  'Digital Marketing',
  general_tech:       'Tech roles',
}

// ── Profile context builder ───────────────────────────────────────────────────

function buildProfileContext(ctx: CoachContext): string {
  const skillList = ctx.skills.length > 0
    ? ctx.skills
        .sort((a, b) => b.level - a.level)
        .map(s => `${s.name} (${s.level}/5)`)
        .join(', ')
    : 'none listed yet'

  const workHistory = ctx.workExperience.length > 0
    ? ctx.workExperience.map(exp => {
        const period = exp.start_date
          ? `${exp.start_date} → ${exp.end_date ?? 'Present'}`
          : exp.duration_months ? `~${Math.round(exp.duration_months / 12)} yrs` : ''
        const tech = exp.key_technologies.length > 0 ? ` | Stack: ${exp.key_technologies.join(', ')}` : ''
        const desc = exp.description ? `\n    "${exp.description.slice(0, 200)}"` : ''
        return `  • ${exp.title} @ ${exp.company}${period ? ` (${period})` : ''}${tech}${desc}`
      }).join('\n')
    : '  (not yet provided)'

  const educationHistory = ctx.education.length > 0
    ? ctx.education.map(edu => {
        const degree = [edu.degree, edu.field].filter(Boolean).join(' in ')
        const year = edu.graduation_year ? `, graduated ${edu.graduation_year}` : ''
        const mqf = edu.mqf_level ? ` [${edu.mqf_level.toUpperCase()}]` : ''
        return `  • ${degree || 'Qualification'}${mqf} — ${edu.institution}${year}`
      }).join('\n')
    : '  (not yet provided)'

  const characterSection = ctx.characterResponses && Object.keys(ctx.characterResponses).length > 0
    ? `\nCHARACTER PROFILE (from candidate's own scenario responses)\n${
        Object.entries(ctx.characterResponses)
          .map(([dim, choice]) => `  • ${dim}: responded "${choice}"`)
          .join('\n')
      }${ctx.strengthResponse ? `\n  • Natural strength: "${ctx.strengthResponse}"` : ''}${ctx.weaknessResponse ? `\n  • Acknowledged weakness: "${ctx.weaknessResponse}"` : ''}`
    : ''

  const interestsSection = [
    ctx.personalHobbies?.length ? `Personal interests: ${ctx.personalHobbies.join(', ')}` : '',
    ctx.professionalInterests?.length ? `Professional interests: ${ctx.professionalInterests.join(', ')}` : '',
  ].filter(Boolean).join('\n')

  // Engine-computed salary context for the candidate's target role.
  // Uses their dream role (or current role as fallback) so the coach gives
  // evidence-grounded salary guidance rather than relying solely on the static table.
  const targetRole = ctx.dreamRole ?? ctx.goal1Year ?? ctx.currentRole
  let salaryEngineBlock = ''
  if (targetRole) {
    const { key } = classifyRole(targetRole)
    const yrs = ctx.yearsExperience ?? 0
    const seniority = yrs < 2 ? 'junior' as const : yrs < 5 ? 'mid' as const : 'senior' as const
    const skillNames = ctx.skills.map(s => s.name)
    const engine = computeSalaryConfidence({
      role: targetRole,
      seniority,
      location: ctx.location ?? undefined,
      skills: skillNames,
    })
    salaryEngineBlock = [
      ``,
      `SALARY ENGINE — target role: ${engine.role_label} (${seniority})`,
      `  Market range: RM ${engine.min_salary.toLocaleString()}–${engine.max_salary.toLocaleString()}/month`,
      `  Confidence: ${engine.confidence_level} (score: ${engine.confidence_score}/100)`,
      `  Context: ${engine.market_insights_text}`,
      `  Note: this supersedes the static salary table above for ${ROLE_LABELS_SHORT[key] ?? engine.role_label} at the ${seniority} tier.`,
    ].join('\n')
  }

  return [
    `=== CANDIDATE PROFILE ===`,
    `Name: ${ctx.name}`,
    `Location: ${ctx.location ?? 'not specified'}`,
    `Current situation: ${ctx.situation ?? 'unknown'}`,
    `Years of experience: ${ctx.yearsExperience ?? 0}`,
    `Current/last role: ${ctx.currentRole ?? 'not specified'}`,
    `Platform intention: ${ctx.platformIntention ?? 'not specified'}`,
    ``,
    `SKILLS (sorted by level)`,
    skillList,
    ``,
    `WORK HISTORY`,
    workHistory,
    ``,
    `EDUCATION`,
    educationHistory,
    characterSection,
    ``,
    interestsSection,
    ``,
    `GOALS`,
    `• 1-year goal: ${ctx.goal1Year ?? 'not specified'}`,
    `• 5-year goal: ${ctx.goal5Year ?? 'not specified'}`,
    `• Dream role: ${ctx.dreamRole ?? 'not specified'}`,
    `• Preferred industries: ${ctx.preferredIndustries.join(', ') || 'not specified'}`,
    ...(ctx.lifeChapterContext ? [``, `LIFE CONTEXT`, ctx.lifeChapterContext] : []),
    ...(salaryEngineBlock ? [salaryEngineBlock] : []),
    ``,
    `=== COACHING INSTRUCTIONS ===`,
    `Reference the above profile throughout your response. Be specific — name their actual skills, companies, and goals.`,
    `Calibrate your communication depth and style to match this person's evident background and experience level.`,
    ...(ctx.characterResponses ? [`Use their character responses to shape your tone — match their natural working style.`] : []),
    ...(ctx.lifeChapterContext ? [`Factor life context into advice naturally — acknowledge real-world constraints without making them the focus.`] : []),
    ...(salaryEngineBlock ? [`When discussing salary, use the SALARY ENGINE figures above as your primary reference — they are cross-referenced from 4 sources and supersede the static table for this candidate's specific role and tier.`] : []),
  ].filter(s => s !== undefined).join('\n')
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
          max_tokens: 800,
          system: [
            { type: 'text', text: COACH_PERSONALITY, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: profileContext },
            ...(ctx.memory
              ? [{ type: 'text' as const, text: `WHAT YOU REMEMBER ABOUT ${ctx.name} FROM PAST CONVERSATIONS (use it naturally; don't recite it back):\n${ctx.memory}` }]
              : []),
            ...(ctx.languageName
              ? [{ type: 'text' as const, text: `Always reply in ${ctx.languageName}. Keep proper nouns (company names, role titles, technologies, and MYR figures) as-is.` }]
              : []),
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
