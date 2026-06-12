// POST /api/candidate/ai-minutes
// Generates AI-powered conversation minutes from a human-to-human chat thread.
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { generateConversationMinutes } from '@/lib/ai/minutes'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

type RequestBody = {
  conversation: string
  contactName: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { conversation, contactName } = await req.json() as RequestBody
    if (!conversation?.trim()) {
      return NextResponse.json({ error: 'No conversation provided' }, { status: 400 })
    }
    const minutes = await generateConversationMinutes(conversation, contactName ?? 'the contact')
    return NextResponse.json({ minutes })
  } catch (err) {
    console.error('[ai-minutes] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate minutes' },
      { status: 500 },
    )
  }
}
