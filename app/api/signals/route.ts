import { NextRequest, NextResponse } from 'next/server'
import { getMultiTimeframeCandles } from '@/lib/binance'
import { generateTradeSignal } from '@/lib/agents'
import { rateLimit } from '@/lib/middleware'
import { sendSignalAlert } from '@/lib/notifications'

// POST /api/signals
// Body: { symbol, headlines?, sendAlert? }
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 20, 60000) // 20 signal requests/min
  if (limited) return limited

  try {
    const body = await req.json()
    const symbol = (body.symbol || 'BTCUSDT').toUpperCase()
    const headlines: string[] = body.headlines || []
    const sendAlert: boolean = body.sendAlert || false

    // Fetch multi-timeframe candles
    const multiTFCandles = await getMultiTimeframeCandles(symbol)

    if (!Object.keys(multiTFCandles).length) {
      return NextResponse.json({ error: 'No candle data available' }, { status: 502 })
    }

    // Run full multi-agent analysis
    const { signal, master } = await generateTradeSignal(
      symbol,
      multiTFCandles,
      headlines,
      body.portfolioValue || 10000,
      body.openPositions || 0,
      body.recentLosses || 0
    )

    // Send Telegram alert if requested and high confidence
    if (sendAlert && signal.confidenceScore >= 70 && signal.type !== 'HOLD') {
      await sendSignalAlert({
        symbol,
        type: signal.type,
        entry: signal.entryPrice,
        sl: signal.stopLoss,
        tp: signal.takeProfitTargets,
        confidence: signal.confidenceScore,
        reasoning: signal.reasoning
      })
    }

    return NextResponse.json({ data: { signal, master } })
  } catch (err: any) {
    console.error('[Signals API]', err)
    return NextResponse.json(
      { error: 'Signal generation failed', detail: err.message },
      { status: 500 }
    )
  }
}

// GET /api/signals?symbol=BTCUSDT — quick cached signal
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 30, 60000)
  if (limited) return limited

  const symbol = (req.nextUrl.searchParams.get('symbol') || 'BTCUSDT').toUpperCase()

  try {
    const multiTFCandles = await getMultiTimeframeCandles(symbol)
    const { signal, master } = await generateTradeSignal(symbol, multiTFCandles)
    return NextResponse.json({ data: { signal, master } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
