import type { Candle, IndicatorSnapshot } from '@/types'

// ─── RSI ──────────────────────────────────────────────────────────────────────
export function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
  }
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2))
}

// ─── EMA ──────────────────────────────────────────────────────────────────────
export function calculateEMA(closes: number[], period: number): number[] {
  const ema: number[] = []
  const k = 2 / (period + 1)
  closes.forEach((price, i) => {
    if (i === 0) { ema.push(price); return }
    ema.push(price * k + ema[i - 1] * (1 - k))
  })
  return ema
}

export function getEMA(closes: number[], period: number): number {
  const emas = calculateEMA(closes, period)
  return parseFloat((emas[emas.length - 1] || 0).toFixed(2))
}

// ─── MACD ─────────────────────────────────────────────────────────────────────
export function calculateMACD(
  closes: number[],
  fast = 12, slow = 26, signal = 9
): { value: number; signal: number; histogram: number } {
  if (closes.length < slow + signal) {
    return { value: 0, signal: 0, histogram: 0 }
  }
  const emaFast = calculateEMA(closes, fast)
  const emaSlow = calculateEMA(closes, slow)
  const macdLine = emaFast.map((v, i) => v - emaSlow[i])
  const signalLine = calculateEMA(macdLine.slice(slow - 1), signal)
  const lastMacd = macdLine[macdLine.length - 1]
  const lastSignal = signalLine[signalLine.length - 1]
  return {
    value: parseFloat(lastMacd.toFixed(4)),
    signal: parseFloat(lastSignal.toFixed(4)),
    histogram: parseFloat((lastMacd - lastSignal).toFixed(4))
  }
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────
export function calculateBB(closes: number[], period = 20, deviation = 2) {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 }
  const slice = closes.slice(-period)
  const middle = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((a, b) => a + (b - middle) ** 2, 0) / period
  const stdDev = Math.sqrt(variance)
  return {
    upper: parseFloat((middle + stdDev * deviation).toFixed(2)),
    middle: parseFloat(middle.toFixed(2)),
    lower: parseFloat((middle - stdDev * deviation).toFixed(2))
  }
}

// ─── Volume Analysis ──────────────────────────────────────────────────────────
export function analyzeVolume(candles: Candle[]): {
  current: number; avg: number; ratio: number; trend: 'HIGH' | 'NORMAL' | 'LOW'
} {
  if (candles.length < 20) return { current: 0, avg: 0, ratio: 1, trend: 'NORMAL' }
  const recent = candles.slice(-20)
  const avg = recent.reduce((a, c) => a + c.volume, 0) / 20
  const current = candles[candles.length - 1].volume
  const ratio = parseFloat((current / avg).toFixed(2))
  return {
    current: parseFloat(current.toFixed(0)),
    avg: parseFloat(avg.toFixed(0)),
    ratio,
    trend: ratio > 1.5 ? 'HIGH' : ratio < 0.7 ? 'LOW' : 'NORMAL'
  }
}

// ─── Support & Resistance ─────────────────────────────────────────────────────
export function findSupportResistance(candles: Candle[], lookback = 20): {
  supports: number[]; resistances: number[]
} {
  const highs = candles.slice(-lookback).map(c => c.high)
  const lows = candles.slice(-lookback).map(c => c.low)
  const pivotHighs: number[] = []
  const pivotLows: number[] = []
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      pivotHighs.push(highs[i])
    }
    if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
      pivotLows.push(lows[i])
    }
  }
  return {
    resistances: pivotHighs.slice(-3).map(v => parseFloat(v.toFixed(2))),
    supports: pivotLows.slice(-3).map(v => parseFloat(v.toFixed(2)))
  }
}

// ─── Trend Detection ──────────────────────────────────────────────────────────
export function detectTrend(closes: number[]): {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number
} {
  const ema20 = getEMA(closes, 20)
  const ema50 = getEMA(closes, 50)
  const ema200 = getEMA(closes, 200)
  const current = closes[closes.length - 1]
  let bullishFactors = 0, bearishFactors = 0
  if (current > ema20) bullishFactors++; else bearishFactors++
  if (current > ema50) bullishFactors++; else bearishFactors++
  if (ema20 > ema50) bullishFactors++; else bearishFactors++
  if (closes.length >= 200) {
    if (current > ema200) bullishFactors++; else bearishFactors++
  }
  const total = bullishFactors + bearishFactors
  const strength = Math.round((Math.max(bullishFactors, bearishFactors) / total) * 100)
  if (bullishFactors > bearishFactors) return { trend: 'BULLISH', strength }
  if (bearishFactors > bullishFactors) return { trend: 'BEARISH', strength }
  return { trend: 'NEUTRAL', strength: 50 }
}

// ─── Candlestick Patterns ─────────────────────────────────────────────────────
export function detectCandlestickPatterns(candles: Candle[]): string[] {
  const patterns: string[] = []
  const len = candles.length
  if (len < 3) return patterns
  const [prev2, prev, curr] = candles.slice(-3)
  const body = Math.abs(curr.close - curr.open)
  const range = curr.high - curr.low

  // Doji
  if (body / range < 0.1) patterns.push('DOJI')
  // Hammer
  const lowerWick = Math.min(curr.open, curr.close) - curr.low
  const upperWick = curr.high - Math.max(curr.open, curr.close)
  if (lowerWick > body * 2 && upperWick < body * 0.5 && curr.close > curr.open)
    patterns.push('HAMMER')
  // Shooting Star
  if (upperWick > body * 2 && lowerWick < body * 0.5 && curr.close < curr.open)
    patterns.push('SHOOTING_STAR')
  // Bullish Engulfing
  if (prev.close < prev.open && curr.close > curr.open &&
      curr.open < prev.close && curr.close > prev.open)
    patterns.push('BULLISH_ENGULFING')
  // Bearish Engulfing
  if (prev.close > prev.open && curr.close < curr.open &&
      curr.open > prev.close && curr.close < prev.open)
    patterns.push('BEARISH_ENGULFING')
  // Morning Star
  if (prev2.close < prev2.open && Math.abs(prev.close - prev.open) < (prev.high - prev.low) * 0.3
      && curr.close > prev2.open)
    patterns.push('MORNING_STAR')

  return patterns
}

// ─── Full indicator snapshot ──────────────────────────────────────────────────
export function getIndicatorSnapshot(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map(c => c.close)
  const { trend } = detectTrend(closes)
  const vol = analyzeVolume(candles)
  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    ema20: getEMA(closes, 20),
    ema50: getEMA(closes, 50),
    ema200: getEMA(closes, 200),
    volume: vol.current,
    volumeAvg: vol.avg,
    trend
  }
}

// ─── Format indicators for AI prompt ─────────────────────────────────────────
export function formatIndicatorsForAI(snap: IndicatorSnapshot, symbol: string): string {
  return `
Symbol: ${symbol}
Current Price: $${snap.ema20.toFixed(2)} (approx)
RSI(14): ${snap.rsi} ${snap.rsi > 70 ? '⚠️ OVERBOUGHT' : snap.rsi < 30 ? '⚠️ OVERSOLD' : ''}
MACD: Value=${snap.macd.value}, Signal=${snap.macd.signal}, Histogram=${snap.macd.histogram} (${snap.macd.histogram > 0 ? 'BULLISH' : 'BEARISH'})
EMA 20: $${snap.ema20}
EMA 50: $${snap.ema50}
EMA 200: $${snap.ema200}
Volume: ${snap.volume.toLocaleString()} (${snap.volumeAvg > 0 ? ((snap.volume / snap.volumeAvg * 100).toFixed(0) + '% of avg)') : ''})
Trend: ${snap.trend}
  `.trim()
}
