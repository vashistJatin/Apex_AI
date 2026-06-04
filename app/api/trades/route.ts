import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/middleware'
import { createAdminClient } from '@/lib/supabase'
import { placeBinanceOrder } from '@/lib/binance'
import { sendTradeAlert } from '@/lib/notifications'
import type { OrderRequest } from '@/types'

// POST /api/trades — place order
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 10, 60000)
  if (limited) return limited

  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const order: OrderRequest = await req.json()
    const supabase = createAdminClient()

    // Validate order
    if (!order.symbol || !order.side || !order.quantity || order.quantity <= 0) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 })
    }

    let executedPrice = order.price || 0
    let binanceOrderId: string | null = null

    // LIVE mode — execute on Binance
    if (order.mode === 'LIVE') {
      if (!process.env.BINANCE_API_KEY) {
        return NextResponse.json({ error: 'Binance API not configured' }, { status: 400 })
      }
      const binanceOrder = await placeBinanceOrder({
        symbol: order.symbol,
        side: order.side,
        type: order.orderType === 'MARKET' ? 'MARKET' : 'LIMIT',
        quantity: order.quantity,
        price: order.price
      })
      executedPrice = parseFloat(binanceOrder.price || binanceOrder.fills?.[0]?.price || String(order.price))
      binanceOrderId = binanceOrder.orderId
    } else {
      // SIM mode — use current market price (passed in)
      executedPrice = order.price || 0
    }

    // Save to database
    const { data: trade, error } = await supabase.from('trades').insert({
      user_id: auth.userId,
      symbol: order.symbol,
      side: order.side,
      order_type: order.orderType,
      quantity: order.quantity,
      price: executedPrice,
      total: order.quantity * executedPrice,
      stop_loss: order.stopLoss,
      take_profit: order.takeProfit,
      leverage: order.leverage || 1,
      status: 'FILLED',
      mode: order.mode,
      binance_order_id: binanceOrderId,
      filled_at: new Date().toISOString()
    }).select().single()

    if (error) throw error

    // Telegram alert
    await sendTradeAlert({
      symbol: order.symbol,
      side: order.side,
      qty: order.quantity,
      price: executedPrice,
      mode: order.mode
    })

    return NextResponse.json({ data: trade })
  } catch (err: any) {
    console.error('[Trades API]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/trades?limit=50&mode=SIM
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const supabase = createAdminClient()
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const mode = req.nextUrl.searchParams.get('mode')

  const query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (mode) query.eq('mode', mode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
