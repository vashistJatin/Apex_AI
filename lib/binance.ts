import axios from 'axios'
import crypto from 'crypto'
import type { Candle, Ticker, OrderBook, Timeframe } from '@/types'

const BASE = process.env.BINANCE_BASE_URL || 'https://api.binance.com'
const API_KEY = process.env.BINANCE_API_KEY || ''
const SECRET = process.env.BINANCE_SECRET_KEY || ''

// ─── Signature helper ─────────────────────────────────────────────────────────
function sign(queryString: string): string {
  return crypto.createHmac('sha256', SECRET).update(queryString).digest('hex')
}

// ─── Public endpoints (no API key needed) ────────────────────────────────────
export async function getBinanceTicker(symbol: string): Promise<Ticker> {
  const { data } = await axios.get(`${BASE}/api/v3/ticker/24hr`, {
    params: { symbol: symbol.toUpperCase() },
    timeout: 5000
  })
  return {
    symbol: data.symbol,
    price: parseFloat(data.lastPrice),
    change24h: parseFloat(data.priceChangePercent),
    volume24h: parseFloat(data.quoteVolume),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice)
  }
}

export async function getBinanceMultiTickers(symbols: string[]): Promise<Ticker[]> {
  const { data } = await axios.get(`${BASE}/api/v3/ticker/24hr`, { timeout: 8000 })
  return data
    .filter((t: any) => symbols.includes(t.symbol))
    .map((t: any) => ({
      symbol: t.symbol,
      price: parseFloat(t.lastPrice),
      change24h: parseFloat(t.priceChangePercent),
      volume24h: parseFloat(t.quoteVolume),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice)
    }))
}

export async function getBinanceCandles(
  symbol: string,
  interval: Timeframe = '1h',
  limit = 100
): Promise<Candle[]> {
  const { data } = await axios.get(`${BASE}/api/v3/klines`, {
    params: { symbol: symbol.toUpperCase(), interval, limit },
    timeout: 8000
  })
  return data.map((k: any[]) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5])
  }))
}

export async function getBinanceOrderBook(
  symbol: string,
  limit = 20
): Promise<OrderBook> {
  const { data } = await axios.get(`${BASE}/api/v3/depth`, {
    params: { symbol: symbol.toUpperCase(), limit },
    timeout: 5000
  })
  return {
    lastUpdateId: data.lastUpdateId,
    bids: data.bids.map((b: string[]) => ({ price: parseFloat(b[0]), quantity: parseFloat(b[1]) })),
    asks: data.asks.map((a: string[]) => ({ price: parseFloat(a[0]), quantity: parseFloat(a[1]) }))
  }
}

export async function getBinanceRecentTrades(symbol: string, limit = 20) {
  const { data } = await axios.get(`${BASE}/api/v3/trades`, {
    params: { symbol: symbol.toUpperCase(), limit },
    timeout: 5000
  })
  return data.map((t: any) => ({
    price: parseFloat(t.price),
    qty: parseFloat(t.qty),
    time: t.time,
    isBuyerMaker: t.isBuyerMaker
  }))
}

// ─── Get multiple timeframe candles for AI analysis ───────────────────────────
export async function getMultiTimeframeCandles(symbol: string) {
  const timeframes: Timeframe[] = ['15m', '1h', '4h', '1d']
  const results = await Promise.allSettled(
    timeframes.map(tf => getBinanceCandles(symbol, tf, 50))
  )
  const out: Record<string, Candle[]> = {}
  timeframes.forEach((tf, i) => {
    const r = results[i]
    if (r.status === 'fulfilled') out[tf] = r.value
  })
  return out
}

// ─── Authenticated endpoints (requires API key) ───────────────────────────────
export async function getBinanceAccountInfo() {
  const timestamp = Date.now()
  const query = `timestamp=${timestamp}`
  const signature = sign(query)
  const { data } = await axios.get(`${BASE}/api/v3/account`, {
    params: { timestamp, signature },
    headers: { 'X-MBX-APIKEY': API_KEY },
    timeout: 8000
  })
  return data
}

export async function placeBinanceOrder(params: {
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'LIMIT' | 'MARKET'
  quantity: number
  price?: number
  timeInForce?: string
}) {
  const timestamp = Date.now()
  const queryParams: Record<string, any> = {
    symbol: params.symbol.toUpperCase(),
    side: params.side,
    type: params.type,
    quantity: params.quantity,
    timestamp
  }
  if (params.type === 'LIMIT') {
    queryParams.price = params.price
    queryParams.timeInForce = params.timeInForce || 'GTC'
  }
  const query = new URLSearchParams(queryParams).toString()
  const signature = sign(query)
  const { data } = await axios.post(
    `${BASE}/api/v3/order?${query}&signature=${signature}`,
    null,
    { headers: { 'X-MBX-APIKEY': API_KEY }, timeout: 10000 }
  )
  return data
}

// ─── WebSocket stream URLs (used in client) ───────────────────────────────────
export function getBinanceWSUrl(symbol: string, stream: string): string {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@${stream}`
}

export function getBinanceCombinedWSUrl(streams: string[]): string {
  return `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`
}
