import { NextRequest, NextResponse } from 'next/server'
import { getBinanceCandles } from '@/lib/binance'
import { calculateRSI, calculateMACD, getEMA } from '@/lib/indicators'
import { rateLimit } from '@/lib/middleware'
import type { BacktestResult, BacktestTrade, Candle } from '@/types'

// Simple RSI + MACD strategy backtester
function runStrategy(candles: Candle[], config: {
  rsiBuy: number; rsiSell: number
  stopLossPercent: number; takeProfitPercent: number
  initialCapital: number
}): BacktestResult {
  const { rsiBuy, rsiSell, stopLossPercent, takeProfitPercent, initialCapital } = config
  let capital = initialCapital
  let position: { entry: number; qty: number; sl: number; tp: number; entryDate: string } | null = null
  const trades: BacktestTrade[] = []
  const equityCurve: { date: string; value: number }[] = []

  for (let i = 50; i < candles.length; i++) {
    const slice = candles.slice(0, i + 1)
    const closes = slice.map(c => c.close)
    const rsi = calculateRSI(closes)
    const macd = calculateMACD(closes)
    const currentPrice = candles[i].close
    const date = new Date(candles[i].time).toISOString().split('T')[0]

    equityCurve.push({ date, value: capital + (position ? position.qty * currentPrice - position.entry * position.qty : 0) })

    if (!position) {
      // Entry signal: RSI oversold + MACD bullish
      if (rsi < rsiBuy && macd.histogram > 0) {
        const qty = (capital * 0.95) / currentPrice
        position = {
          entry: currentPrice,
          qty,
          sl: currentPrice * (1 - stopLossPercent / 100),
          tp: currentPrice * (1 + takeProfitPercent / 100),
          entryDate: date
        }
      }
    } else {
      // Check exit conditions
      let exitPrice: number | null = null
      let exitReason: 'TP1' | 'SL' | 'SIGNAL' = 'SIGNAL'

      if (currentPrice <= position.sl) { exitPrice = position.sl; exitReason = 'SL' }
      else if (currentPrice >= position.tp) { exitPrice = position.tp; exitReason = 'TP1' }
      else if (rsi > rsiSell && macd.histogram < 0) { exitPrice = currentPrice; exitReason = 'SIGNAL' }

      if (exitPrice) {
        const pnl = (exitPrice - position.entry) * position.qty
        const pnlPct = ((exitPrice - position.entry) / position.entry) * 100
        capital += pnl
        trades.push({
          entryDate: position.entryDate,
          exitDate: date,
          side: 'BUY',
          entryPrice: position.entry,
          exitPrice,
          quantity: position.qty,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: parseFloat(pnlPct.toFixed(2)),
          exitReason
        })
        position = null
      }
    }
  }

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl < 0)
  const totalPnl = trades.reduce((a, t) => a + t.pnl, 0)
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length) : 0

  // Max drawdown
  let peak = initialCapital, maxDD = 0
  equityCurve.forEach(p => {
    if (p.value > peak) peak = p.value
    const dd = (peak - p.value) / peak * 100
    if (dd > maxDD) maxDD = dd
  })

  // Sharpe ratio (simplified daily returns)
  const returns = equityCurve.slice(1).map((p, i) => (p.value - equityCurve[i].value) / equityCurve[i].value)
  const avgReturn = returns.reduce((a, r) => a + r, 0) / returns.length
  const stdReturn = Math.sqrt(returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / returns.length)
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0

  return {
    strategyId: 'custom',
    symbol: 'BTCUSDT',
    startDate: candles[50] ? new Date(candles[50].time).toISOString() : '',
    endDate: candles[candles.length - 1] ? new Date(candles[candles.length - 1].time).toISOString() : '',
    initialCapital,
    finalCapital: parseFloat(capital.toFixed(2)),
    performance: {
      winRate: parseFloat(winRate.toFixed(1)),
      totalTrades: trades.length,
      netProfit: parseFloat(totalPnl.toFixed(2)),
      maxDrawdown: parseFloat((-maxDD).toFixed(2)),
      sharpeRatio: parseFloat(sharpe.toFixed(2)),
      profitFactor: avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : 0,
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2))
    },
    trades: trades.slice(-50),
    equityCurve: equityCurve.filter((_, i) => i % 3 === 0),
    monthlyReturns: {}
  }
}

// POST /api/backtest
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 5, 60000)
  if (limited) return limited

  try {
    const body = await req.json()
    const symbol = (body.symbol || 'BTCUSDT').toUpperCase()
    const interval = body.interval || '4h'
    const limit = Math.min(body.limit || 500, 1000)

    const candles = await getBinanceCandles(symbol, interval, limit)

    if (candles.length < 100) {
      return NextResponse.json({ error: 'Insufficient historical data' }, { status: 400 })
    }

    const result = runStrategy(candles, {
      rsiBuy: body.rsiBuy || 35,
      rsiSell: body.rsiSell || 65,
      stopLossPercent: body.stopLossPercent || 3,
      takeProfitPercent: body.takeProfitPercent || 6,
      initialCapital: body.initialCapital || 10000
    })

    result.symbol = symbol
    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error('[Backtest API]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
