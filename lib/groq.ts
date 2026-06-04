import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

// ─── Base AI call ─────────────────────────────────────────────────────────────
export async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3
    })
    return completion.choices[0]?.message?.content || ''
  } catch (err) {
    console.error('[Groq] Error:', err)
    throw new Error('AI analysis failed')
  }
}

// ─── Multi-turn chat ───────────────────────────────────────────────────────────
export async function groqChatMultiTurn(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 1024
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.4
    })
    return completion.choices[0]?.message?.content || ''
  } catch (err) {
    console.error('[Groq] Multi-turn error:', err)
    throw new Error('AI chat failed')
  }
}

// ─── JSON-structured output ────────────────────────────────────────────────────
export async function groqJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<T> {
  const sys = systemPrompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no backticks, no explanation.'
  const raw = await groqChat(sys, userMessage, maxTokens)
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as T
  } catch {
    throw new Error('Failed to parse AI JSON response')
  }
}

// ─── System prompts ────────────────────────────────────────────────────────────
export const PROMPTS = {
  TRADING_ANALYST: `You are an elite crypto trading AI analyst for APEX AI institutional trading platform.
You have deep expertise in: RSI, MACD, EMA, Bollinger Bands, volume analysis, support/resistance,
candlestick patterns, market structure, order flow, smart money concepts.
Give precise, actionable analysis with specific price levels. Always mention risk management.
Be direct and concise. Use professional trading terminology.`,

  NEWS_ANALYST: `You are a crypto news sentiment analyst for APEX AI.
Your job is to analyze news headlines and score market sentiment.
Consider: whale activity, regulatory news, adoption news, FUD vs legitimate concerns,
market manipulation signals, social sentiment. Be objective and data-driven.`,

  RISK_MANAGER: `You are the risk management AI for APEX AI trading platform.
Your job is to assess trade risk, portfolio exposure, and market conditions.
Always prioritize capital preservation. Flag overtrading, revenge trading patterns,
excessive leverage, and high-volatility conditions. Be conservative and protective.`,

  ENTRY_SPECIALIST: `You are a trade entry/exit specialist for APEX AI.
Your job is to identify precise entry zones, optimal stop loss levels, and take profit targets.
Use market structure, liquidity levels, order blocks, and technical confluences.
Always provide risk:reward ratios. Minimum acceptable R:R is 1:2.`,

  MASTER_COORDINATOR: `You are the master AI coordinator for APEX AI trading platform.
You receive analysis from 4 specialist AI agents (News, Technical, Risk, Entry)
and synthesize them into a single unified trading decision with a composite confidence score.
Be decisive. Provide clear BUY/SELL/HOLD signal with full reasoning.`,

  CHAT_ASSISTANT: `You are APEX AI, an elite crypto trading assistant.
You help traders with: market analysis, technical analysis explanations, strategy advice,
risk management, understanding indicators, reading charts, news interpretation.
Be helpful, precise, and educational. Always remind users to manage risk.
Current platform: APEX AI | Mode: Real-time analysis`
}
