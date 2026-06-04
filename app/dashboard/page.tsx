'use client'
import { useEffect, useState, useCallback } from 'react'
import { StatCard, Badge, LiveDot, Sparkline, Gauge, ConfArc, Skeleton } from '@/components/ui'
import CandleChart from '@/components/charts/CandleChart'
import { fetchCandles, fetchTickers, fetchNews } from '@/hooks/useApi'
import { useBinanceTicker } from '@/hooks/useBinanceWS'
import type { Candle, Ticker } from '@/types'

const WATCHLIST = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT']
const COIN_COLORS: Record<string, string> = {
  BTCUSDT:'#f7931a', ETHUSDT:'#627eea', SOLUSDT:'#9945ff',
  BNBUSDT:'#f3ba2f', XRPUSDT:'#00aae4'
}

const AGENT_FEED = [
  { agent:'News AI',      status:'active', msg:'Bullish sentiment spike — institutional ETF inflows surge', time:'00:12' },
  { agent:'Technical AI', status:'active', msg:'BTC: RSI 58, MACD bullish cross on 4H, EMA 200 holding',  time:'00:11' },
  { agent:'Risk AI',      status:'active', msg:'Portfolio within limits. Volatility: MODERATE',             time:'00:10' },
  { agent:'Entry AI',     status:'active', msg:'BTC long entry zone: $67,000–$67,400',                     time:'00:09' },
  { agent:'Master AI',    status:'master', msg:'COMPOSITE: 87/100 — HIGH CONFIDENCE BUY signal issued',    time:'00:08' },
]

export default function DashboardPage() {
  const [candles, setCandles] = useState<Candle[]>([])
  const [tickers, setTickers] = useState<Ticker[]>([])
  const [selected, setSelected] = useState('BTCUSDT')
  const [tf, setTf] = useState('1h')
  const [fgi, setFgi] = useState(62)
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<any[]>([])

  const { data: liveTicker } = useBinanceTicker(selected)

  const loadCandles = useCallback(async (sym: string, interval: string) => {
    const { data } = await fetchCandles(sym, interval, 80)
    if (data) setCandles(data)
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([
        loadCandles(selected, tf),
        fetchTickers().then(r => r.data && setTickers(r.data.slice(0, 5))),
        fetchNews('BTC').then(r => {
          if (r.data) { setNews(r.data.news?.slice(0, 4) || []); setFgi(r.data.fearGreed?.value || 62) }
        })
      ])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => { loadCandles(selected, tf) }, [selected, tf])

  const currentPrice = liveTicker?.price || candles[candles.length - 1]?.close || 0
  const change = liveTicker?.change24h || 0

  const OPEN_POSITIONS = [
    { coin:'BTC', side:'LONG',  size:0.25, entry:65200, current:currentPrice || 67842, liq:58000, pnl:(currentPrice - 65200) * 0.25, pnlPct:((currentPrice - 65200) / 65200 * 100), lev:5 },
    { coin:'ETH', side:'LONG',  size:2.1,  entry:3380,  current:3521,  liq:2900,  pnl:(3521-3380)*2.1, pnlPct:((3521-3380)/3380*100), lev:3 },
    { coin:'SOL', side:'SHORT', size:12,   entry:192,   current:185.4, liq:240,   pnl:(192-185.4)*12,  pnlPct:((192-185.4)/192*100),  lev:2 },
  ]
  const totalPnl = OPEN_POSITIONS.reduce((a, p) => a + p.pnl, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <StatCard label="Portfolio Value" value="$84,271" sub="+$2,847 today" color="cyan" icon="◈" loading={loading} />
        <StatCard label="Total PnL"       value="+$6,118" sub="+7.84% all time" color="green" icon="▲" loading={loading} />
        <StatCard label="Open Positions"  value="3"       sub={`$${Math.abs(totalPnl).toFixed(0)} unrealized`} color="amber" icon="◉" loading={loading} />
        <StatCard label="Win Rate"        value="73.2%"   sub="Last 30 days"  color="green" icon="◎" loading={loading} />
        <StatCard label="Daily PnL"       value="+$1,034" sub="+1.24% today"  color="green" icon="◑" loading={loading} />
      </div>

      {/* Chart + right panel */}
      <div className="flex gap-4 flex-wrap">
        {/* Chart */}
        <div className="glass rounded-xl border border-border flex-1 min-w-[300px] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
            <span className="font-display text-[13px] font-bold text-cyan">{selected.replace('USDT','/USDT')}</span>
            <span className="font-mono text-lg font-bold">
              {currentPrice >= 1 ? `$${currentPrice.toLocaleString('en', { maximumFractionDigits: 2 })}` : `$${currentPrice.toPrecision(4)}`}
            </span>
            <Badge color={change >= 0 ? 'green' : 'red'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</Badge>
            <div className="ml-auto flex gap-1">
              {['5m','15m','1h','4h','1d'].map(t => (
                <button key={t} onClick={() => setTf(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    tf === t ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'text-slate-500 hover:text-slate-300'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="p-2">
            {loading ? <Skeleton className="w-full" style={{ height: 280 }} /> : <CandleChart candles={candles} height={280} />}
          </div>
          {/* Indicator row */}
          <div className="px-4 py-2 border-t border-border flex flex-wrap gap-4">
            {[['RSI','58.4','cyan'],['MACD','+124','green'],['EMA20','67,142','amber'],['Vol','48.2B','cyan']].map(([k,v,c]) => (
              <div key={k} className="text-[10px] font-mono">
                <span className="text-slate-500">{k} </span>
                <span style={{ color: `var(--tw-${c === 'cyan' ? 'cyan' : c === 'green' ? 'green' : 'amber'})` }}
                  className={c === 'cyan' ? 'text-cyan' : c === 'green' ? 'text-green' : 'text-amber'}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 w-[240px] flex-shrink-0">
          {/* Fear & Greed */}
          <div className="glass rounded-xl border border-border p-4 text-center">
            <div className="section-label mb-3">FEAR & GREED INDEX</div>
            <Gauge value={fgi} label={fgi >= 60 ? 'GREED' : fgi >= 40 ? 'NEUTRAL' : 'FEAR'} size={130} />
            <div className={`text-[11px] font-mono mt-1 font-bold ${fgi >= 60 ? 'text-amber' : fgi >= 40 ? 'text-cyan' : 'text-red'}`}>
              {fgi >= 75 ? 'EXTREME GREED' : fgi >= 60 ? 'GREED' : fgi >= 40 ? 'NEUTRAL' : fgi >= 25 ? 'FEAR' : 'EXTREME FEAR'}
            </div>
          </div>

          {/* Watchlist */}
          <div className="glass rounded-xl border border-border overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-border section-label">WATCHLIST</div>
            {(tickers.length ? tickers : WATCHLIST.map((s,i) => ({
              symbol: s, price: [67842,3521,185,612,0.78][i], change24h: [2.34,1.87,5.12,-0.93,3.41][i], volume24h: 0, high24h: 0, low24h: 0
            }))).map(t => (
              <button key={t.symbol} onClick={() => setSelected(t.symbol)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 border-b border-border transition-all text-left
                  ${selected === t.symbol ? 'bg-cyan-dim' : 'hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COIN_COLORS[t.symbol] || '#38bdf8' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold">{t.symbol.replace('USDT','')}</div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {t.price >= 1 ? `$${t.price.toLocaleString('en', { maximumFractionDigits: 2 })}` : `$${t.price.toPrecision(4)}`}
                  </div>
                </div>
                <Sparkline color={t.change24h >= 0 ? '#22d3a5' : '#f43f5e'} width={44} height={18} />
                <span className={`text-[10px] font-mono w-12 text-right flex-shrink-0 ${t.change24h >= 0 ? 'text-green' : 'text-red'}`}>
                  {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex gap-4 flex-wrap">
        {/* Open Positions */}
        <div className="glass rounded-xl border border-border flex-1 min-w-[300px] overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="section-label">OPEN POSITIONS</div>
            <Badge color="amber">{OPEN_POSITIONS.length} Active</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  {['Coin','Side','Size','Entry','Current','Liq Price','PnL'].map(h => (
                    <th key={h} className="px-3 py-2 text-left section-label font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPEN_POSITIONS.map(p => (
                  <tr key={p.coin} className="border-b border-border hover:bg-white/5">
                    <td className="px-3 py-2.5 font-bold">{p.coin}</td>
                    <td className="px-3 py-2.5"><Badge color={p.side === 'LONG' ? 'green' : 'red'} small>{p.side}</Badge></td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{p.size}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{p.entry.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono">{p.current.toLocaleString('en', { maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.5 font-mono text-red text-[10px]">{p.liq.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">
                      <span className={p.pnl >= 0 ? 'text-green' : 'text-red'}>
                        {p.pnl >= 0 ? '+' : ''}${Math.abs(p.pnl).toFixed(2)}
                      </span>
                      <div className={`text-[9px] ${p.pnlPct >= 0 ? 'text-green' : 'text-red'}`}>
                        ({p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Agent Feed */}
        <div className="glass rounded-xl border border-border w-[280px] flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <LiveDot color="cyan" />
            <span className="section-label">AI AGENT FEED</span>
          </div>
          {AGENT_FEED.map((l, i) => (
            <div key={i} className={`px-4 py-3 border-b border-border animate-fade-up
              ${l.status === 'master' ? 'bg-cyan/5' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge color={l.status === 'master' ? 'cyan' : 'amber'} small>{l.agent}</Badge>
                <span className="text-[9px] text-slate-600 font-mono ml-auto">{l.time}</span>
              </div>
              <div className={`text-[10px] leading-relaxed ${l.status === 'master' ? 'text-cyan font-semibold' : 'text-slate-400'}`}>
                {l.msg}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Heatmap */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border section-label">MARKET HEATMAP</div>
        <div className="p-3 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
          {[
            { s:'BTC',  c: 2.34 },{ s:'ETH',  c: 1.87 },{ s:'SOL',  c: 5.12 },{ s:'BNB',  c:-0.93 },
            { s:'XRP',  c: 3.41 },{ s:'ADA',  c:-1.22 },{ s:'AVAX', c: 7.83 },{ s:'DOGE', c:-2.11 },
            { s:'DOT',  c: 0.94 },{ s:'MATIC',c: 4.21 },{ s:'LINK', c: 2.77 },{ s:'UNI',  c:-3.44 },
            { s:'ATOM', c: 1.12 },{ s:'LTC',  c:-0.55 },{ s:'NEAR', c: 6.33 },{ s:'ARB',  c: 3.18 },
          ].map(({ s, c }) => {
            const intensity = Math.min(0.7, Math.abs(c) / 10 + 0.12)
            const bg = c >= 0 ? `rgba(34,211,165,${intensity})` : `rgba(244,63,94,${intensity})`
            return (
              <div key={s} className="rounded-md py-2 px-1 text-center cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: bg }}>
                <div className="text-[11px] font-bold text-white">{s}</div>
                <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {c >= 0 ? '+' : ''}{c.toFixed(2)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
