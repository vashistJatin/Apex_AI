'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '@/store'

interface TickerUpdate {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
}

// Live ticker for a single symbol via Binance WebSocket
export function useBinanceTicker(symbol: string) {
  const [data, setData] = useState<TickerUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        setData({
          symbol: d.s,
          price: parseFloat(d.c),
          change24h: parseFloat(d.P),
          volume24h: parseFloat(d.q),
          high24h: parseFloat(d.h),
          low24h: parseFloat(d.l)
        })
      } catch {}
    }

    return () => { ws.close() }
  }, [symbol])

  return { data, connected }
}

// Live candles via Binance kline stream
export function useBinanceKline(symbol: string, interval = '1m') {
  const [lastCandle, setLastCandle] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        const k = d.k
        setLastCandle({
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          closed: k.x
        })
      } catch {}
    }

    return () => { ws.close() }
  }, [symbol, interval])

  return lastCandle
}

// Multiple tickers via combined stream
export function useBinanceMultiTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Record<string, TickerUpdate>>({})
  const [connected, setConnected] = useState(false)
  const setStoreTickers = useAppStore(s => s.setTickers)

  useEffect(() => {
    if (!symbols.length) return
    const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`).join('/')
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`
    const ws = new WebSocket(url)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const { data: d } = JSON.parse(e.data)
        const update: TickerUpdate = {
          symbol: d.s,
          price: parseFloat(d.c),
          change24h: parseFloat(d.P || '0'),
          volume24h: parseFloat(d.q || d.v),
          high24h: parseFloat(d.h),
          low24h: parseFloat(d.l)
        }
        setTickers(prev => ({ ...prev, [d.s]: update }))
      } catch {}
    }

    return () => { ws.close() }
  }, [symbols.join(',')])

  return { tickers, connected }
}

// Order book stream
export function useBinanceOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<{ bids: any[]; asks: any[] }>({ bids: [], asks: [] })

  useEffect(() => {
    const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@1000ms`
    const ws = new WebSocket(url)

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        setOrderBook({
          bids: d.bids.slice(0, 15).map((b: string[]) => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]) })),
          asks: d.asks.slice(0, 15).map((a: string[]) => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]) }))
        })
      } catch {}
    }

    return () => { ws.close() }
  }, [symbol])

  return orderBook
}
