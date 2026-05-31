// POST /api/candidate/portfolio — add a portfolio item + AI summary
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('candidate_profiles').select('id').eq('user_id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { title, description, url, repo_url, tech_stack, impact } = await req.json()

  // ── AI: Generate a concise skill summary for this project ──
  // This tells employers WHAT the project demonstrates about the candidate
  let ai_summary: string | null = null
  try {
    const prompt = `You are reviewing a candidate's portfolio project for a job matching platform.

Project: ${title}
Tech stack: ${(tech_stack ?? []).join(', ')}
Impact: ${impact ?? 'Not specified'}
Description: ${description ?? 'Not specified'}

Write ONE concise sentence (max 25 words) describing what technical skills this project demonstrates.
Focus on the skills proven, not what the project does. Be specific and direct.
Example: "Demonstrates production-grade React architecture, REST API design, and database optimization under real user load."`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',  // Use Haiku for simple summarisation — cheap and fast
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })
    ai_summary = (msg.content[0] as { text: string }).text.trim()
  } catch (err) {
    console.error('AI summary failed:', err)
    // Non-fatal — save the item without AI summary
  }

  const { data: item, error } = await supabase
    .from('portfolio_items')
    .insert({
      candidate_id: profile.id,
      title, description, url, repo_url,
      tech_stack: tech_stack ?? [],
      impact,
      ai_summary,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item })
}
