'use client'
import { ReactNode } from 'react'

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'green' | 'red' | 'cyan' | 'amber' | 'purple'

export function Badge({ children, color = 'cyan', small }: {
  children: ReactNode; color?: BadgeColor; small?: boolean
}) {
  const styles: Record<BadgeColor, string> = {
    green:  'bg-green-dim text-green border-green/25',
    red:    'bg-red-dim text-red border-red/25',
    cyan:   'bg-cyan-dim text-cyan border-cyan/25',
    amber:  'bg-amber-dim text-amber border-amber/25',
    purple: 'bg-purple/15 text-purple border-purple/25',
  }
  return (
    <span className={`inline-flex items-center rounded border font-mono font-bold tracking-wider
      ${small ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]'} ${styles[color]}`}>
      {children}
    </span>
  )
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────
export function LiveDot({ color = 'green' }: { color?: 'green' | 'red' | 'cyan' }) {
  const c = color === 'green' ? '#22d3a5' : color === 'red' ? '#f43f5e' : '#38bdf8'
  return (
    <span className="relative inline-flex w-2 h-2 flex-shrink-0">
      <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: c, animation: 'pulse-ring 1.5s ease-out infinite' }} />
      <span className="relative w-2 h-2 rounded-full" style={{ background: c }} />
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'default', icon, loading }: {
  label: string; value: string; sub?: string
  color?: 'green' | 'red' | 'amber' | 'cyan' | 'default'; icon?: string; loading?: boolean
}) {
  const valueColor = {
    green: 'text-green', red: 'text-red', amber: 'text-amber',
    cyan: 'text-cyan', default: 'text-slate-100'
  }[color]

  return (
    <div className="glass glass-hover rounded-xl p-4 flex-1 min-w-[140px] animate-fade-up">
      <div className="flex justify-between items-start mb-3">
        <div className="section-label">{label}</div>
        {icon && <span className="text-base opacity-50">{icon}</span>}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-6 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </>
      ) : (
        <>
          <div className={`text-xl font-bold font-mono ${valueColor}`}>{value}</div>
          {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        </>
      )}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative w-10 h-5 rounded-full transition-all duration-200 focus:outline-none"
      style={{ background: on ? '#38bdf8' : '#111826', border: '1px solid rgba(56,189,248,0.2)' }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: on ? '18px' : '2px' }} />
    </button>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ animation: 'spin-slow 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Confidence Arc ───────────────────────────────────────────────────────────
export function ConfArc({ value, size = 56 }: { value: number; size?: number }) {
  const color = value >= 80 ? '#22d3a5' : value >= 65 ? '#38bdf8' : value >= 50 ? '#fbbf24' : '#f43f5e'
  const r = size * 0.42
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111826" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold"
        style={{ fontSize: size * 0.18, color }}>{value}%</div>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color, width = 80, height = 28 }: {
  data?: number[]; color: string; width?: number; height?: number
}) {
  const vals = data?.length ? data : Array.from({ length: 20 }, (_, i) => 50 + Math.sin(i * 0.5) * 15 + Math.random() * 8)
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sp-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
export function Gauge({ value, label, size = 110 }: { value: number; label: string; size?: number }) {
  const r = size * 0.38
  const cx = size / 2, cy = size / 2
  const color = value >= 60 ? '#22d3a5' : value >= 40 ? '#fbbf24' : '#f43f5e'
  const toRad = (d: number) => (d * Math.PI) / 180
  const arc = (start: number, end: number) => {
    const s = { x: cx + r * Math.cos(toRad(start - 90)), y: cy + r * Math.sin(toRad(start - 90)) }
    const e = { x: cx + r * Math.cos(toRad(end - 90)), y: cy + r * Math.sin(toRad(end - 90)) }
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }
  const angle = (value / 100) * 180 - 90
  const needle = { x: cx + r * 0.72 * Math.cos(toRad(angle)), y: cy + r * 0.72 * Math.sin(toRad(angle)) }
  const displayH = size * 0.66
  return (
    <svg width={size} height={displayH} viewBox={`0 0 ${size} ${displayH}`}>
      <path d={arc(0, 180)} fill="none" stroke="#111826" strokeWidth={7} strokeLinecap="round" />
      <path d={arc(0, 60)} fill="none" stroke="#f43f5e" strokeWidth={7} strokeLinecap="round" opacity={0.4} />
      <path d={arc(60, 120)} fill="none" stroke="#fbbf24" strokeWidth={7} strokeLinecap="round" opacity={0.4} />
      <path d={arc(120, 180)} fill="none" stroke="#22d3a5" strokeWidth={7} strokeLinecap="round" opacity={0.4} />
      <path d={arc(0, value * 1.8)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={color} />
      <text x={cx} y={cy + r * 0.55} textAnchor="middle" fontSize={size * 0.12} fontWeight="700"
        fill={color} fontFamily="var(--font-mono)">{value}</text>
      <text x={cx} y={cy + r * 0.55 + size * 0.14} textAnchor="middle" fontSize={size * 0.08}
        fill="#475569" fontFamily="var(--font-sans)">{label}</text>
    </svg>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#38bdf8', height = 4 }: {
  value: number; max?: number; color?: string; height?: number
}) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#111826' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  )
}
