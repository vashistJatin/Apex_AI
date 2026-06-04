'use client'
import { useCallback } from 'react'
import { useAppStore } from '@/store'

const BASE = ''  // Same-origin Next.js API routes

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    const json = await res.json()

    if (!res.ok) return { error: json.error || `HTTP ${res.status}` }
    return { data: json.data }
  } catch (err: any) {
    return { error: err.message || 'Network error' }
  }
}

export function useApi() {
  const token = useAppStore(s => s.token)

  const get = useCallback(<T>(path: string) =>
    apiFetch<T>(path, { method: 'GET' }, token || undefined), [token])

  const post = useCallback(<T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, token || undefined), [token])

  return { get, post }
}

// Market data
export async function fetchTickers() {
  return apiFetch<any[]>('/api/market?type=tickers')
}

export async function fetchCandles(symbol: string, interval: string, limit = 100) {
  return apiFetch<any[]>(`/api/market?type=candles&symbol=${symbol}&interval=${interval}&limit=${limit}`)
}

export async function fetchOrderBook(symbol: string) {
  return apiFetch<any>(`/api/market?type=orderbook&symbol=${symbol}`)
}

// Signals
export async function fetchSignal(symbol: string, token?: string) {
  return apiFetch<any>(`/api/signals?symbol=${symbol}`, { method: 'GET' }, token)
}

export async function generateSignal(params: object, token?: string) {
  return apiFetch<any>('/api/signals', { method: 'POST', body: JSON.stringify(params) }, token)
}

// AI chat
export async function sendChatMessage(messages: any[], context?: any, token?: string) {
  return apiFetch<{ reply: string }>('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ messages, context })
  }, token)
}

// News
export async function fetchNews(symbol: string) {
  return apiFetch<any>(`/api/news?symbol=${symbol}`)
}

// Portfolio
export async function fetchPortfolio(token: string) {
  return apiFetch<any>('/api/portfolio', { method: 'GET' }, token)
}

// Trades
export async function placeTrade(order: any, token: string) {
  return apiFetch<any>('/api/trades', { method: 'POST', body: JSON.stringify(order) }, token)
}

export async function fetchTrades(token: string, limit = 50) {
  return apiFetch<any[]>(`/api/trades?limit=${limit}`, { method: 'GET' }, token)
}

// Backtest
export async function runBacktest(params: object) {
  return apiFetch<any>('/api/backtest', { method: 'POST', body: JSON.stringify(params) })
}
