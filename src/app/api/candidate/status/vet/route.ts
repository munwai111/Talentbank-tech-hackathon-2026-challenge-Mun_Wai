// POST /api/candidate/status/vet
// Vets custom status text before it is displayed publicly on a user's profile.
// Rejects: discriminatory, harassing, vulgar, offensive content; emojis;
// culturally/professionally inappropriate language.
// Returns { approved: boolean; reason?: string }

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { text } = await req.json() as { text: string }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ approved: false, reason: 'No text provided.' })
    }

    // Hard client-side checks we enforce before even calling Claude
    if (text.length > 80) {
      return NextResponse.json({ approved: false, reason: 'Status text must be 80 characters or fewer.' })
    }
    // Emoji detection: any character with code point ≥ U+1F300
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text)) {
      return NextResponse.json({ approved: false, reason: 'Emojis are not permitted in status text.' })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 120,
      messages: [{
        role: 'user',
        content: `You are a professional platform safety moderator. Review this status text that a job seeker wants to display publicly on their career profile.

Status text: "${text}"

Reject if it contains ANY of the following:
- Discriminatory language (based on race, gender, religion, nationality, age, disability, sexuality, or any other protected characteristic)
- Harassing, threatening, or hostile language directed at individuals or groups
- Vulgar, obscene, or sexually explicit content
- Profanity or offensive slang
- Culturally or professionally inappropriate content for a workplace hiring platform
- Content that could embarrass or harm a professional platform
- Emojis or emoji-like symbols

Approved examples: "Open to remote roles", "Seeking product management opportunities", "Final year student", "Career changer from finance to tech"

Rejected examples: Any slurs, insults, sexual references, or hate speech.

Respond ONLY with valid JSON: {"approved": true} or {"approved": false, "reason": "brief explanation under 15 words"}`
      }]
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) {
      return NextResponse.json({ approved: false, reason: 'Could not verify text safety. Please try again.' })
    }

    const result = JSON.parse(raw.slice(start, end + 1)) as { approved: boolean; reason?: string }
    return NextResponse.json(result)

  } catch (err) {
    console.error('[status/vet] failed:', err)
    return NextResponse.json({ approved: false, reason: 'Safety check unavailable. Please try again.' }, { status: 500 })
  }
}
