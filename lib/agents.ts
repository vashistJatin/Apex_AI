import { groqJSON, groqChat, PROMPTS } from './groq'
import { getIndicatorSnapshot, formatIndicatorsForAI, detectCandlestickPatterns, findSupportResistance } from './indicators'
import type { Candle, AgentResult, MasterAgentResult, TradeSignal, Timeframe } from '@/types'
import { nanoid } from 'nanoid' // optional, or use crypto.randomUUID()

// ─── Agent 1: News Sentiment ──────────────────────────────────────────────────
export async function runNewsAgent(
  symbol: string,
  headlines: string[]
): Promise<AgentResult> {
  const prompt = `
Analyze these crypto news headlines for ${symbol.replace('USDT', '')} and provide sentiment analysis.

Headlines:
${headlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond with JSON: {
  "score": <0-100, where 0=extremely bearish, 50=neutral, 100=extremely bullish>,
  "summary": "<one sentence>",
  "details": "<2-3 sentences of analysis>",
  "signals": ["<signal1>", "<signal2>"],
  "whaleActivity": <true|false>,
  "manipulationRisk": <"LOW"|"MEDIUM"|"HIGH">
}`

  try {
    const result = await groqJSON<any>(PROMPTS.NEWS_ANALYST, prompt)
    return {
      agentName: 'News AI',
      score: result.score ?? 50,
      summary: result.summary ?? 'Neutral sentiment',
      details: result.details ?? '',
      timestamp: new Date().toISOString()
    }
  } catch {
    return { agentName: 'News AI', score: 50, summary: 'Unable to analyze news', details: '', timestamp: new Date().toISOString() }
  }
}

// ─── Agent 2: Technical Analysis ─────────────────────────────────────────────
export async function runTechnicalAgent(
  symbol: string,
  candles: Record<string, Candle[]>
): Promise<AgentResult> {
  const analyses: string[] = []

  for (const [tf, cdls] of Object.entries(candles)) {
    if (cdls.length < 20) continue
    const snap = getIndicatorSnapshot(cdls)
    const patterns = detectCandlestickPatterns(cdls)
    const { supports, resistances } = findSupportResistance(cdls)
    analyses.push(`
${tf.toUpperCase()} Timeframe:
${formatIndicatorsForAI(snap, symbol)}
Patterns: ${patterns.join(', ') || 'None'}
Support: ${supports.join(', ') || 'N/A'}
Resistance: ${resistances.join(', ') || 'N/A'}`)
  }

  const prompt = `
Analyze these technical indicators for ${symbol} across multiple timeframes:
${analyses.join('\n---\n')}

Respond with JSON: {
  "score": <0-100, technical bullishness>,
  "summary": "<one sentence>",
  "details": "<key technical observations, 2-3 sentences>",
  "keyLevels": { "support": <number>, "resistance": <number> },
  "trend": "<BULLISH|BEARISH|NEUTRAL>",
  "rsiSignal": "<OVERBOUGHT|OVERSOLD|NEUTRAL>",
  "macdSignal": "<BULLISH_CROSS|BEARISH_CROSS|NEUTRAL>"
}`

  try {
    const result = await groqJSON<any>(PROMPTS.TRADING_ANALYST, prompt)
    return {
      agentName: 'Technical AI',
      score: result.score ?? 50,
      summary: result.summary ?? 'Neutral technical picture',
      details: result.details ?? '',
      timestamp: new Date().toISOString()
    }
  } catch {
    return { agentName: 'Technical AI', score: 50, summary: 'Technical analysis unavailable', details: '', timestamp: new Date().toISOString() }
  }
}

// ─── Agent 3: Risk Assessment ─────────────────────────────────────────────────
export async function runRiskAgent(
  symbol: string,
  candles: Candle[],
  portfolioValue: number,
  openPositions: number,
  recentLosses: number
): Promise<AgentResult> {
  const closes = candles.map(c => c.close)
  const returns = closes.slice(-20).map((v, i, arr) => i === 0 ? 0 : (v - arr[i-1]) / arr[i-1])
  const volatility = Math.sqrt(returns.reduce((a, r) => a + r * r, 0) / returns.length) * 100

  const prompt = `
Risk assessment for ${symbol} trade:
- 20-day volatility: ${volatility.toFixed(2)}%
- Portfolio value: $${portfolioValue.toLocaleString()}
- Open positions: ${openPositions}
- Recent consecutive losses: ${recentLosses}
- Market: Crypto (24/7, high volatility)

Respond with JSON: {
  "score": <0-100, where 100=safest>,
  "riskLevel": "<LOW|MEDIUM|HIGH|EXTREME>",
  "summary": "<one sentence>",
  "details": "<risk factors and recommendations, 2-3 sentences>",
  "recommendedPositionSize": <percent of portfolio 1-10>,
  "avoidTrade": <true|false>,
  "reason": "<if avoidTrade true, why>"
}`

  try {
    const result = await groqJSON<any>(PROMPTS.RISK_MANAGER, prompt)
    return {
      agentName: 'Risk AI',
      score: result.score ?? 50,
      summary: result.summary ?? 'Moderate risk',
      details: result.details ?? '',
      timestamp: new Date().toISOString()
    }
  } catch {
    return { agentName: 'Risk AI', score: 50, summary: 'Risk assessment unavailable', details: '', timestamp: new Date().toISOString() }
  }
}

// ─── Agent 4: Entry/Exit Specialist ──────────────────────────────────────────
export async function runEntryAgent(
  symbol: string,
  candles: Candle[],
  currentPrice: number
): Promise<AgentResult> {
  const snap = getIndicatorSnapshot(candles)
  const { supports, resistances } = findSupportResistance(candles)
  const patterns = detectCandlestickPatterns(candles)

  const prompt = `
Identify optimal entry/exit for ${symbol} at current price $${currentPrice}:
${formatIndicatorsForAI(snap, symbol)}
Support levels: ${supports.join(', ')}
Resistance levels: ${resistances.join(', ')}
Candlestick patterns: ${patterns.join(', ') || 'None'}

Respond with JSON: {
  "score": <0-100, entry quality>,
  "signal": "<BUY|SELL|HOLD>",
  "entryZone": { "low": <number>, "high": <number> },
  "stopLoss": <number>,
  "takeProfits": [<tp1>, <tp2>, <tp3>],
  "riskReward": "<e.g. 1:3.2>",
  "summary": "<one sentence>",
  "details": "<entry rationale, 2-3 sentences>"
}`

  try {
    const result = await groqJSON<any>(PROMPTS.ENTRY_SPECIALIST, prompt)
    return {
      agentName: 'Entry AI',
      score: result.score ?? 50,
      summary: result.summary ?? 'No clear entry',
      details: result.details ?? '',
      timestamp: new Date().toISOString()
    }
  } catch {
    return { agentName: 'Entry AI', score: 50, summary: 'Entry analysis unavailable', details: '', timestamp: new Date().toISOString() }
  }
}

// ─── Master Agent: Combine all ────────────────────────────────────────────────
export async function runMasterAgent(
  symbol: string,
  agents: AgentResult[],
  currentPrice: number
): Promise<MasterAgentResult> {
  const compositeScore = Math.round(
    agents.reduce((a, ag) => a + ag.score, 0) / agents.length
  )

  const agentSummary = agents.map(a =>
    `${a.agentName}: Score=${a.score}/100\nSummary: ${a.summary}\nDetails: ${a.details}`
  ).join('\n\n')

  const prompt = `
You are the master trading AI. Synthesize these specialist agent reports for ${symbol} at $${currentPrice}:

${agentSummary}

Composite score: ${compositeScore}/100

Make a final trading decision. Respond with JSON: {
  "signal": "<BUY|SELL|HOLD>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "finalReasoning": "<comprehensive 3-4 sentence explanation combining all agent insights>",
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "actionable": <true|false>
}`

  try {
    const result = await groqJSON<any>(PROMPTS.MASTER_COORDINATOR, prompt)
    return {
      compositeScore,
      signal: result.signal ?? 'HOLD',
      confidence: result.confidence ?? 'LOW',
      agents,
      finalReasoning: result.finalReasoning ?? 'Analysis inconclusive',
      riskLevel: result.riskLevel ?? 'MEDIUM'
    }
  } catch {
    return {
      compositeScore,
      signal: compositeScore >= 65 ? 'BUY' : compositeScore <= 35 ? 'SELL' : 'HOLD',
      confidence: compositeScore >= 75 || compositeScore <= 25 ? 'HIGH' : compositeScore >= 60 || compositeScore <= 40 ? 'MEDIUM' : 'LOW',
      agents,
      finalReasoning: 'Multi-agent analysis complete. See individual agent scores.',
      riskLevel: 'MEDIUM'
    }
  }
}

// ─── Generate full trade signal ───────────────────────────────────────────────
export async function generateTradeSignal(
  symbol: string,
  multiTFCandles: Record<string, Candle[]>,
  headlines: string[] = [],
  portfolioValue = 10000,
  openPositions = 0,
  recentLosses = 0
): Promise<{ signal: TradeSignal; master: MasterAgentResult }> {
  const primaryCandles = multiTFCandles['1h'] || Object.values(multiTFCandles)[0] || []
  const currentPrice = primaryCandles[primaryCandles.length - 1]?.close || 0

  // Run all agents in parallel
  const [newsAgent, technicalAgent, riskAgent, entryAgent] = await Promise.all([
    runNewsAgent(symbol, headlines),
    runTechnicalAgent(symbol, multiTFCandles),
    runRiskAgent(symbol, primaryCandles, portfolioValue, openPositions, recentLosses),
    runEntryAgent(symbol, primaryCandles, currentPrice)
  ])

  const master = await runMasterAgent(symbol, [newsAgent, technicalAgent, riskAgent, entryAgent], currentPrice)

  // Extract entry details from the entry agent's raw analysis
  const snap = getIndicatorSnapshot(primaryCandles)
  const { supports, resistances } = findSupportResistance(primaryCandles)
  const support = supports[supports.length - 1] || currentPrice * 0.97
  const resistance = resistances[resistances.length - 1] || currentPrice * 1.03

  const isBuy = master.signal === 'BUY'
  const stopLoss = isBuy ? parseFloat((support * 0.998).toFixed(2)) : parseFloat((resistance * 1.002).toFixed(2))
  const risk = Math.abs(currentPrice - stopLoss)
  const tp1 = isBuy ? parseFloat((currentPrice + risk * 1.5).toFixed(2)) : parseFloat((currentPrice - risk * 1.5).toFixed(2))
  const tp2 = isBuy ? parseFloat((currentPrice + risk * 2.5).toFixed(2)) : parseFloat((currentPrice - risk * 2.5).toFixed(2))
  const tp3 = isBuy ? parseFloat((currentPrice + risk * 4).toFixed(2)) : parseFloat((currentPrice - risk * 4).toFixed(2))

  const signal: TradeSignal = {
    id: crypto.randomUUID(),
    symbol,
    type: master.signal === 'HOLD' ? 'HOLD' : master.signal,
    entryPrice: currentPrice,
    stopLoss,
    takeProfitTargets: [tp1, tp2, tp3],
    riskRewardRatio: `1:${(risk > 0 ? (risk * 2.5 / risk).toFixed(1) : '2.5')}`,
    confidenceScore: master.compositeScore,
    reasoning: master.finalReasoning,
    indicators: snap,
    timeframe: '1h',
    expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    createdAt: new Date().toISOString()
  }

  return { signal, master }
}
