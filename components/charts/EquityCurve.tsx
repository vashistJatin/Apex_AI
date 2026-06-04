'use client'
import { useRef, useEffect, useState } from 'react'

interface EquityPoint { date: string; value: number }

export default function EquityCurve({ data, height = 160, color = '#38bdf8' }: {
  data: EquityPoint[]; height?: number; color?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(500)

  useEffect(() => {
    const ro = new ResizeObserver(e => setWidth(e[0].contentRect.width))
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  if (!data.length) return <div ref={containerRef} style={{ height }} className="flex items-center justify-center text-slate-500 text-xs font-mono">No data</div>

  const pad = { t: 8, r: 8, b: 24, l: 60 }
  const W = Math.max(100, width - pad.l - pad.r)
  const H = height - pad.t - pad.b
  const vals = data.map(d => d.value)
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const toY = (v: number) => H - ((v - min) / range) * H
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * W},${toY(d.value)}`).join(' ')
  const yTicks = [min, min + range * 0.5, max]
  const isProfit = vals[vals.length - 1] > vals[0]

  return (
    <div ref={containerRef} className="w-full">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`eq-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={pad.t + toY(v)} x2={pad.l + W} y2={pad.t + toY(v)}
              stroke="rgba(56,189,248,0.06)" strokeDasharray="4,4" />
            <text x={pad.l - 4} y={pad.t + toY(v) + 4} textAnchor="end" fontSize={9}
              fill="#475569" fontFamily="var(--font-mono)">${v.toLocaleString('en', { maximumFractionDigits: 0 })}</text>
          </g>
        ))}
        <g transform={`translate(${pad.l},${pad.t})`}>
          <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#eq-fill-${color.replace('#','')})`} />
          <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          {/* Start/end dots */}
          <circle cx={0} cy={toY(vals[0])} r={3} fill={color} opacity={0.5} />
          <circle cx={W} cy={toY(vals[vals.length - 1])} r={4} fill={color} />
        </g>
        {/* X axis labels */}
        {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
          data[i] && <text key={i} x={pad.l + (i / (data.length - 1)) * W} y={height - 4}
            textAnchor="middle" fontSize={8} fill="#374151" fontFamily="var(--font-mono)">
            {data[i].date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}
