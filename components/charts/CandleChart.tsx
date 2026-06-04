'use client'
import { useMemo, useRef, useEffect, useState } from 'react'
import type { Candle } from '@/types'

interface CandleChartProps {
  candles: Candle[]
  height?: number
  showVolume?: boolean
  showEMA?: boolean
}

function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1)
  return closes.reduce((acc: number[], v, i) => {
    acc.push(i === 0 ? v : v * k + acc[i - 1] * (1 - k))
    return acc
  }, [])
}

export default function CandleChart({ candles, height = 300, showVolume = true, showEMA = true }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; candle: Candle } | null>(null)

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const data = candles.slice(-80) // show last 80 candles
  const pad = { t: 10, r: 8, b: showVolume ? 60 : 24, l: 64 }
  const W = Math.max(200, width - pad.l - pad.r)
  const H = height - pad.t - pad.b
  const volH = showVolume ? 40 : 0

  const { minP, maxP, maxV, ema20, ema50 } = useMemo(() => {
    if (!data.length) return { minP: 0, maxP: 1, maxV: 1, ema20: [], ema50: [] }
    const closes = data.map(c => c.close)
    return {
      minP: Math.min(...data.map(c => c.low)) * 0.9995,
      maxP: Math.max(...data.map(c => c.high)) * 1.0005,
      maxV: Math.max(...data.map(c => c.volume)),
      ema20: calcEMA(closes, 20),
      ema50: calcEMA(closes, 50),
    }
  }, [data])

  const rangeP = maxP - minP || 1
  const cw = Math.max(2, W / data.length - 1)
  const toY = (v: number) => H - ((v - minP) / rangeP) * H

  const ema20Path = showEMA ? ema20.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * (W / data.length) + cw / 2},${toY(v)}`).join(' ') : ''
  const ema50Path = showEMA ? ema50.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * (W / data.length) + cw / 2},${toY(v)}`).join(' ') : ''

  const yTicks = Array.from({ length: 5 }, (_, i) => minP + (rangeP / 4) * i)
  const fmtP = (v: number) => v >= 1000 ? v.toLocaleString('en', { maximumFractionDigits: 0 }) : v.toPrecision(5)

  if (!data.length) return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="text-slate-500 text-sm font-mono">Loading chart data...</div>
    </div>
  )

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="vol-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3a5" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#22d3a5" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="vol-dn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={pad.t + toY(v)} x2={pad.l + W} y2={pad.t + toY(v)}
              stroke="rgba(56,189,248,0.06)" strokeDasharray="4,4" />
            <text x={pad.l - 4} y={pad.t + toY(v) + 4} textAnchor="end" fontSize={9}
              fill="#475569" fontFamily="var(--font-mono)">{fmtP(v)}</text>
          </g>
        ))}

        <g transform={`translate(${pad.l},${pad.t})`}>
          {/* EMA lines */}
          {showEMA && ema20Path && (
            <path d={ema20Path} fill="none" stroke="#fbbf24" strokeWidth={1.2} opacity={0.75} strokeLinejoin="round" />
          )}
          {showEMA && ema50Path && (
            <path d={ema50Path} fill="none" stroke="#a78bfa" strokeWidth={1.2} opacity={0.75} strokeLinejoin="round" />
          )}

          {/* Candles */}
          {data.map((c, i) => {
            const x = i * (W / data.length)
            const isUp = c.close >= c.open
            const col = isUp ? '#22d3a5' : '#f43f5e'
            const bodyTop = toY(Math.max(c.open, c.close))
            const bodyH = Math.max(1, Math.abs(toY(c.open) - toY(c.close)))
            return (
              <g key={i}
                onMouseEnter={() => setTooltip({ x: x + pad.l, y: pad.t, candle: c })}
                onMouseLeave={() => setTooltip(null)}>
                <line x1={x + cw / 2} y1={toY(c.high)} x2={x + cw / 2} y2={toY(c.low)}
                  stroke={col} strokeWidth={0.8} />
                <rect x={x} y={bodyTop} width={cw} height={bodyH}
                  fill={col} opacity={0.92} rx={0.5} />
              </g>
            )
          })}

          {/* Volume bars */}
          {showVolume && data.map((c, i) => {
            const x = i * (W / data.length)
            const isUp = c.close >= c.open
            const vH = (c.volume / maxV) * volH
            return (
              <rect key={i} x={x} y={H + 12 + (volH - vH)} width={cw} height={vH}
                fill={isUp ? 'url(#vol-up)' : 'url(#vol-dn)'} />
            )
          })}
        </g>

        {/* X-axis time labels */}
        {[0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1]
          .filter(i => data[i])
          .map(i => (
            <text key={i}
              x={pad.l + i * (W / data.length) + cw / 2}
              y={height - (showVolume ? 4 : 4)}
              textAnchor="middle" fontSize={8} fill="#374151" fontFamily="var(--font-mono)">
              {new Date(data[i].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          ))}

        {/* EMA legend */}
        {showEMA && (
          <g transform={`translate(${pad.l + 8}, ${pad.t + 12})`}>
            <line x1={0} y1={0} x2={16} y2={0} stroke="#fbbf24" strokeWidth={2} />
            <text x={20} y={4} fontSize={8} fill="#fbbf24" fontFamily="var(--font-mono)">EMA20</text>
            <line x1={60} y1={0} x2={76} y2={0} stroke="#a78bfa" strokeWidth={2} />
            <text x={80} y={4} fontSize={8} fill="#a78bfa" fontFamily="var(--font-mono)">EMA50</text>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute glass rounded-lg p-2 text-[10px] font-mono pointer-events-none z-10"
          style={{ left: Math.min(tooltip.x, width - 140), top: 40 }}>
          <div className="text-slate-400 mb-1">{new Date(tooltip.candle.time).toLocaleString()}</div>
          {[
            ['O', tooltip.candle.open, tooltip.candle.close >= tooltip.candle.open ? '#22d3a5' : '#f43f5e'],
            ['H', tooltip.candle.high, '#22d3a5'],
            ['L', tooltip.candle.low, '#f43f5e'],
            ['C', tooltip.candle.close, tooltip.candle.close >= tooltip.candle.open ? '#22d3a5' : '#f43f5e'],
          ].map(([k, v, c]) => (
            <div key={String(k)} className="flex gap-3 justify-between">
              <span className="text-slate-500">{k}</span>
              <span style={{ color: String(c) }}>{Number(v).toLocaleString('en', { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div className="flex gap-3 justify-between mt-0.5 pt-0.5 border-t border-slate-700">
            <span className="text-slate-500">Vol</span>
            <span className="text-cyan">{(tooltip.candle.volume / 1e6).toFixed(2)}M</span>
          </div>
        </div>
      )}
    </div>
  )
}
