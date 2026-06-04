import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/middleware'
import { createAdminClient } from '@/lib/supabase'
import { getBinanceMultiTickers } from '@/lib/binance'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 30, 60000)
  if (limited) return limited

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const supabase = createAdminClient()

  // Get all user trades
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', auth.userId)
    .eq('status', 'FILLED')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calculate PnL per symbol
  const symbolMap: Record<string, { buyCost: number; sellRevenue: number; qty: number }> = {}
  let totalPnl = 0

  for (const t of trades || []) {
    if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { buyCost: 0, sellRevenue: 0, qty: 0 }
    if (t.side === 'BUY') {
      symbolMap[t.symbol].buyCost += t.total
      symbolMap[t.symbol].qty += t.quantity
    } else {
      symbolMap[t.symbol].sellRevenue += t.total
      symbolMap[t.symbol].qty -= t.quantity
    }
  }

  // Get live prices for open positions
  const openSymbols = Object.keys(symbolMap).filter(s => symbolMap[s].qty > 0)
  let currentPrices: Record<string, number> = {}

  if (openSymbols.length > 0) {
    try {
      const tickers = await getBinanceMultiTickers(openSymbols)
      tickers.forEach(t => { currentPrices[t.symbol] = t.price })
    } catch {}
  }

  // Build equity curve from trades (daily snapshots)
  const dailyPnl: Record<string, number> = {}
  let runningPnl = 0

  for (const t of trades || []) {
    const day = t.filled_at?.split('T')[0] || t.created_at?.split('T')[0]
    if (!day) continue
    const tradePnl = t.pnl || 0
    runningPnl += tradePnl
    dailyPnl[day] = runningPnl
  }

  const equityCurve = Object.entries(dailyPnl)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: 10000 + value }))

  // Calculate total stats
  const allPnls = (trades || []).map(t => t.pnl || 0)
  totalPnl = allPnls.reduce((a, b) => a + b, 0)
  const wins = allPnls.filter(p => p > 0)
  const losses = allPnls.filter(p => p < 0)
  const winRate = allPnls.length > 0 ? (wins.length / allPnls.length) * 100 : 0
  const maxDrawdown = losses.length > 0 ? Math.min(...losses) : 0
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0

  const portfolio = {
    totalValue: 10000 + totalPnl,
    totalPnl,
    totalPnlPercent: (totalPnl / 10000) * 100,
    dailyPnl: allPnls.slice(-1)[0] || 0,
    totalTrades: allPnls.length,
    winRate: parseFloat(winRate.toFixed(1)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    equityCurve: equityCurve.slice(-90),
    recentTrades: (trades || []).slice(-20).reverse()
  }

  return NextResponse.json({ data: portfolio })
}
