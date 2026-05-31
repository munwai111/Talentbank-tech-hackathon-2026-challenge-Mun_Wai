// POST /api/candidate/embed
// Regenerates the candidate's skill embedding vector.
// Called automatically after skills are added/deleted/imported.
//
// ── How vector matching works ────────────────────────────────
// 1. We turn skills into a text string:
//    "React (Advanced), Node.js (Intermediate), PostgreSQL (Advanced)..."
// 2. OpenAI's embedding model converts that text into a 1536-number vector
//    Each number represents a dimension of "meaning" in semantic space
// 3. Stored in candidate_profiles.embedding (pgvector column)
// 4. When matching: cosine similarity between candidate embedding & job embedding
//    Similar skills = vectors point in similar directions = high cosine score

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  // Internal-only route — called server-side from skills / github-import / import-apply.
  // Authentication: compare against INTERNAL_SECRET env var (set in .env.local + Vercel).
  // Falls back to legacy x-internal header when INTERNAL_SECRET is not configured
  // (local dev convenience only — always set INTERNAL_SECRET in production).
  const INTERNAL_SECRET = process.env.INTERNAL_SECRET
  const authorized = INTERNAL_SECRET
    ? req.headers.get('x-internal-secret') === INTERNAL_SECRET
    : req.headers.get('x-internal') === 'true'

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { candidate_id } = await req.json()
  if (!candidate_id) return NextResponse.json({ error: 'Missing candidate_id' }, { status: 400 })

  const supabase = createServerClient()

  // Fetch all skills for this candidate
  const { data: skills } = await supabase
    .from('skills')
    .select('name, level, source')
    .eq('candidate_id', candidate_id)

  if (!skills || skills.length === 0) {
    return NextResponse.json({ message: 'No skills to embed' })
  }

  // Build text representation of skills
  // Format: "React (Advanced, GitHub-verified), Node.js (Intermediate, self-reported)..."
  // Including source adds signal — GitHub-verified skills carry more semantic weight
  const LEVEL_TEXT = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
  const SOURCE_TEXT: Record<string, string> = {
    manual: 'self-reported',
    github: 'GitHub-verified',
    assessment: 'assessed',
  }

  const skillsText = skills
    .map(s => `${s.name} (${LEVEL_TEXT[s.level]}, ${SOURCE_TEXT[s.source] ?? s.source})`)
    .join(', ')

  const textToEmbed = `Technical skills: ${skillsText}`

  // Generate embedding using OpenAI's text-embedding-3-small
  // Dimensions: 1536, Cost: ~$0.00002 per call — essentially free at this scale
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: textToEmbed,
    dimensions: 1536,
  })

  const embedding = embeddingRes.data[0].embedding

  // Store in Postgres — pgvector handles the vector type automatically
  const { error } = await supabase
    .from('candidate_profiles')
    .update({ embedding })
    .eq('id', candidate_id)

  if (error) {
    console.error('Embedding update failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, dimensions: embedding.length })
}
