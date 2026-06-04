import { NextRequest, NextResponse } from 'next/server'
import { getBinanceCandles, getBinanceOrderBook, getBinanceTicker, getBinanceMultiTickers } from '@/lib/binance'
import { rateLimit } from '@/lib/middleware'
import type { Timeframe } from '@/types'

// GET /api/market?type=ticker&symbol=BTCUSDT
// GET /api/market?type=candles&symbol=BTCUSDT&interval=1h&limit=100
// GET /api/market?type=orderbook&symbol=BTCUSDT
// GET /api/market?type=tickers (all watchlist)
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 120, 60000)
  if (limited) return limited

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')
  const symbol = (searchParams.get('symbol') || 'BTCUSDT').toUpperCase()

  try {
    switch (type) {
      case 'ticker': {
        const ticker = await getBinanceTicker(symbol)
        return NextResponse.json({ data: ticker })
      }

      case 'tickers': {
        const watchlist = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','AVAXUSDT','DOGEUSDT']
        const tickers = await getBinanceMultiTickers(watchlist)
        return NextResponse.json({ data: tickers })
      }

      case 'candles': {
        const interval = (searchParams.get('interval') || '1h') as Timeframe
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
        const candles = await getBinanceCandles(symbol, interval, limit)
        return NextResponse.json({ data: candles })
      }

      case 'orderbook': {
        const orderBook = await getBinanceOrderBook(symbol, 20)
        return NextResponse.json({ data: orderBook })
      }

      case 'multitf': {
        const { getMultiTimeframeCandles } = await import('@/lib/binance')
        const data = await getMultiTimeframeCandles(symbol)
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[Market API]', err.message)
    return NextResponse.json(
      { error: 'Failed to fetch market data', detail: err.message },
      { status: 502 }
    )
  }
}
