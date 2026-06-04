'use client'
import { useEffect, useState } from 'react'
import { StatCard, Skeleton, Badge } from '@/components/ui'
import EquityCurve from '@/components/charts/EquityCurve'
import { fetchPortfolio, fetchTrades } from '@/hooks/useApi'
import { useAppStore } from '@/store'

const COIN_COLORS = ['#f7931a','#627eea','#9945ff','#f3ba2f','#00aae4']
const ALLOCS = [
  { symbol:'BTC', pct:42, value:35393, pnl:4120, color:'#f7931a' },
  { symbol:'ETH', pct:28, value:23596, pnl:1840, color:'#627eea' },
  { symbol:'SOL', pct:14, value:11798, pnl:950,  color:'#9945ff' },
  { symbol:'BNB', pct:10, value: 8427, pnl:-240, color:'#f3ba2f' },
  { symbol:'Other',pct:6, value: 5057, pnl:88,   color:'#38bdf8' },
]

// Generate a realistic equity curve
function genEquityCurve(days = 60): { date: string; value: number }[] {
  let v = 10000
  return Array.from({ length: days }, (_, i) => {
    v += (Math.random() - 0.42) * 300 + 50
    const d = new Date(Date.now() - (days - i) * 86400000)
    return { date: d.toISOString().split('T')[0], value: Math.max(7000, v) }
  })
}

export default function PortfolioPage() {
  const { token } = useAppStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [equityCurve] = useState(genEquityCurve(60))
  const [equityPeriod, setEquityPeriod] = useState<7|30|60>(30)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (token) {
        const [p, t] = await Promise.all([fetchPortfolio(token), fetchTrades(token, 30)])
        if (p.data) setPortfolio(p.data)
        if (t.data) setTrades(t.data)
      }
      setLoading(false)
    }
    load()
  }, [token])

  const displayTrades = trades.length ? trades : [
    { id:'T001', symbol:'BTCUSDT', side:'BUY',  quantity:0.15, price:64100, total:9615,  created_at: new Date().toISOString(), pnl:+412 },
    { id:'T002', symbol:'ETHUSDT', side:'SELL', quantity:1.8,  price:3620,  total:6516,  created_at: new Date().toISOString(), pnl:-88  },
    { id:'T003', symbol:'SOLUSDT', side:'BUY',  quantity:25,   price:174,   total:4350,  created_at: new Date().toISOString(), pnl:+284 },
    { id:'T004', symbol:'BNBUSDT', side:'BUY',  quantity:5,    price:598,   total:2990,  created_at: new Date().toISOString(), pnl:-64  },
    { id:'T005', symbol:'ADAUSDT', side:'SELL', quantity:2000, price:0.64,  total:1280,  created_at: new Date().toISOString(), pnl:+31  },
  ]

  const stats = portfolio || {
    totalValue: 84271, totalPnl: 6118, totalPnlPercent: 7.84,
    dailyPnl: 1034, winRate: 73.2, maxDrawdown: -8.4, profitFactor: 2.31, totalTrades: 142
  }

  const displayCurve = equityCurve.slice(-equityPeriod)

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Portfolio Value" value={`$${stats.totalValue.toLocaleString('en',{maximumFractionDigits:0})}`}
          sub={`${stats.totalPnl >= 0 ? '+' : ''}$${Math.abs(stats.totalPnl).toLocaleString('en',{maximumFractionDigits:0})} total PnL`}
          color="cyan" icon="◈" loading={loading} />
        <StatCard label="Today's PnL" value={`+$${stats.dailyPnl.toLocaleString()}`} sub="+1.24%" color="green" icon="▲" loading={loading} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.totalTrades} total trades`} color="green" icon="◎" loading={loading} />
        <StatCard label="Max Drawdown" value={`${stats.maxDrawdown}%`} sub="Within risk limit" color="amber" icon="▼" loading={loading} />
        <StatCard label="Profit Factor" value={String(stats.profitFactor)} sub="Avg win / avg loss" color="green" icon="◑" loading={loading} />
      </div>

      {/* Equity Curve */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="section-label">EQUITY CURVE</div>
          <div className="flex gap-1">
            {([7,30,60] as const).map(p => (
              <button key={p} onClick={() => setEquityPeriod(p)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  equityPeriod === p ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'text-slate-500 hover:text-slate-300'
                }`}>{p}D</button>
            ))}
          </div>
        </div>
        <div className="p-4">
          {loading ? <Skeleton className="w-full h-40" /> : <EquityCurve data={displayCurve} height={160} color="#38bdf8" />}
        </div>
      </div>

      {/* Allocation + History */}
      <div className="flex gap-4 flex-wrap">
        {/* Allocation */}
        <div className="glass rounded-xl border border-border p-5 w-[260px] flex-shrink-0">
          <div className="section-label mb-4">ALLOCATION</div>

          {/* Donut chart (SVG) */}
          <div className="flex justify-center mb-4">
            <svg width={120} height={120} viewBox="0 0 120 120">
              {ALLOCS.reduce((acc, a, i) => {
                const prev = acc.offset
                const slice = (a.pct / 100) * 2 * Math.PI
                const x1 = 60 + 45 * Math.cos(prev - Math.PI/2)
                const y1 = 60 + 45 * Math.sin(prev - Math.PI/2)
                const x2 = 60 + 45 * Math.cos(prev + slice - Math.PI/2)
                const y2 = 60 + 45 * Math.sin(prev + slice - Math.PI/2)
                const large = slice > Math.PI ? 1 : 0
                acc.paths.push(
                  <path key={i} d={`M 60 60 L ${x1} ${y1} A 45 45 0 ${large} 1 ${x2} ${y2} Z`}
                    fill={a.color} opacity={0.85} />
                )
                acc.offset += slice
                return acc
              }, { paths: [] as any[], offset: 0 }).paths}
              <circle cx={60} cy={60} r={28} fill="#080c14" />
              <text x={60} y={57} textAnchor="middle" fontSize={10} fill="#94a3b8" fontFamily="var(--font-mono)">Total</text>
              <text x={60} y={70} textAnchor="middle" fontSize={11} fill="#e2e8f0" fontFamily="var(--font-mono)" fontWeight="700">$84.2K</text>
            </svg>
          </div>

          {ALLOCS.map(a => (
            <div key={a.symbol} className="mb-3">
              <div className="flex justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-[11px] font-semibold">{a.symbol}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{a.pct}% · ${a.value.toLocaleString()}</span>
              </div>
              <div className="h-1 bg-bg-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Trade History */}
        <div className="glass rounded-xl border border-border flex-1 min-w-[300px] overflow-hidden">
          <div className="px-4 py-3 border-b border-border section-label">TRADE HISTORY</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  {['#','Pair','Side','Qty','Price','Total','Date','PnL'].map(h => (
                    <th key={h} className="px-3 py-2 text-left section-label font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((t: any, i: number) => (
                  <tr key={t.id || i} className="border-b border-border hover:bg-white/5 transition-all">
                    <td className="px-3 py-2 text-[9px] text-slate-600 font-mono">{t.id?.slice?.(0,5) || `T00${i+1}`}</td>
                    <td className="px-3 py-2 font-semibold">{(t.symbol||'').replace('USDT','/USDT')}</td>
                    <td className="px-3 py-2"><Badge color={t.side==='BUY'?'green':'red'} small>{t.side}</Badge></td>
                    <td className="px-3 py-2 font-mono text-slate-400">{t.quantity}</td>
                    <td className="px-3 py-2 font-mono text-slate-400">${t.price?.toLocaleString?.()}</td>
                    <td className="px-3 py-2 font-mono">${t.total?.toLocaleString?.()}</td>
                    <td className="px-3 py-2 text-[9px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(t.created_at||t.filledAt||Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold whitespace-nowrap">
                      <span className={t.pnl >= 0 ? 'text-green' : 'text-red'}>
                        {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl||0).toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
