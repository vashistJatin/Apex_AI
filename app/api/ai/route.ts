import { NextRequest, NextResponse } from 'next/server'
import { groqChatMultiTurn, PROMPTS } from '@/lib/groq'
import { rateLimit } from '@/lib/middleware'

// POST /api/ai
// Body: { messages: [{role, content}], context? }
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 30, 60000)
  if (limited) return limited

  try {
    const { messages, context } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    // Build enhanced system prompt with market context if provided
    let systemPrompt = PROMPTS.CHAT_ASSISTANT
    if (context) {
      systemPrompt += `\n\nCurrent Market Context:\n${JSON.stringify(context, null, 2)}`
    }

    const reply = await groqChatMultiTurn(systemPrompt, messages, 1024)

    return NextResponse.json({ data: { reply } })
  } catch (err: any) {
    console.error('[AI Chat API]', err)
    return NextResponse.json(
      { error: 'AI chat failed', detail: err.message },
      { status: 500 }
    )
  }
}
