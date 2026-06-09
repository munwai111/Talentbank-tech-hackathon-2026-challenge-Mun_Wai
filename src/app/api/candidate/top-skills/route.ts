// GET /api/candidate/top-skills
// Returns 5 AI-recommended high-demand skills based on the candidate's
// existing skills and career goals in the APAC/Malaysia market.

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type TopSkill = {
  name: string
  reason: string
  demand: 'High' | 'Very High'
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('id, career_data')
      .eq('user_id', dbUser.id)
      .single()

    const { data: skills } = await supabase
      .from('skills')
      .select('name, level')
      .eq('candidate_id', profile?.id ?? '')
      .limit(40)

    const skillList = (skills ?? []).map(s => s.name).join(', ') || 'no skills listed yet'
    const cd = profile?.career_data as Record<string, unknown> | null
    const goalInfo = cd
      ? `1-year goal: ${cd.goal_1_year ?? 'not specified'}. Field: ${cd.preferred_job_functions ?? 'not specified'}.`
      : 'Goals not specified.'

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: [{ type: 'text', text: 'You are a career market analyst for Malaysia and Southeast Asia. Return only valid JSON — no markdown, no explanation.', cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Candidate has these skills: ${skillList}. ${goalInfo}

List 5 high-demand skills they should develop to boost their career in APAC tech/professional markets. Skills they already have can still appear if they should deepen them.

Return ONLY this JSON:
{"skills":[{"name":"Skill Name","reason":"One sentence on why it's valuable in Malaysia/APAC right now","demand":"High"}]}

demand must be "High" or "Very High". Names must be specific (not "soft skills").`,
      }],
    })

    const raw = (msg.content[0] as { type: 'text'; text: string }).text.trim()
      .replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

    const parsed = JSON.parse(raw) as { skills: TopSkill[] }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[top-skills] failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate skill recommendations' },
      { status: 500 },
    )
  }
}
