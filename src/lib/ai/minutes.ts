import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ConversationMinutes = {
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

export async function generateConversationMinutes(
  conversation: string,
  contactName: string,
): Promise<ConversationMinutes> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Summarize this career conversation between a job seeker and ${contactName}. Return JSON only, no markdown.

${conversation}

Return exactly this shape: {"summary":"one sentence","keyPoints":["..."],"actionItems":["..."]}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
  return JSON.parse(raw) as ConversationMinutes
}
