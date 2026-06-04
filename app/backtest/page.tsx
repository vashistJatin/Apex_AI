'use client'
import { useState } from 'react'
import { StatCard, Skeleton, Badge } from '@/components/ui'
import EquityCurve from '@/components/charts/EquityCurve'
import { runBacktest } from '@/hooks/useApi'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT']
const INTERVALS = [{ v:'1h', l:'1 Hour' },{ v:'4h', l:'4 Hour' },{ v:'1d', l:'Daily' }]

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [interval, setInterval] = useState('4h')
  const [initialCapital, setInitialCapital] = useState('10000')
  const [rsiBuy, setRsiBuy] = useState('35')
  const [rsiSell, setRsiSell] = useState('65')
  const [slPct, setSlPct] = useState('3')
  const [tpPct, setTpPct] = useState('6')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleRun = async () => {
    setRunning(true); setResult(null); setError(''); setProgress(0)
    // Animate progress
    const interval_id = setInterval(() => setProgress(p => Math.min(p + 7, 90)), 300)
    const { data, error: err } = await runBacktest({
      symbol, interval, initialCapital: parseFloat(initialCapital),
      rsiBuy: parseFloat(rsiBuy), rsiSell: parseFloat(rsiSell),
      stopLossPercent: parseFloat(slPct), takeProfitPercent: parseFloat(tpPct),
      limit: 500
    })
    clearInterval(interval_id); setProgress(100)
    setTimeout(() => setRunning(false), 400)
    if (data) setResult(data)
    else setError(err || 'Backtest failed')
  }

  const perf = result?.performance
  const profitable = perf && perf.netProfit >= 0

  return (
    <div className="flex flex-col gap-4">
      {/* Config */}
      <div className="glass rounded-xl border border-border p-5">
        <div className="section-label mb-4">BACKTEST CONFIGURATION</div>
        <div className="flex gap-4 flex-wrap mb-4">
          {/* Symbol */}
          <div className="flex-1 min-w-[140px]">
            <div className="section-label mb-2">ASSET</div>
            <div className="flex flex-wrap gap-1.5">
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                    symbol === s ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'glass border border-border text-slate-400'
                  }`}>{s.replace('USDT','')}</button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="flex-1 min-w-[140px]">
            <div className="section-label mb-2">TIMEFRAME</div>
            <div className="flex gap-1.5">
              {INTERVALS.map(i => (
                <button key={i.v} onClick={() => setInterval(i.v)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                    interval === i.v ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'glass border border-border text-slate-400'
                  }`}>{i.l}</button>
              ))}
            </div>
          </div>

          {/* Capital */}
          <div className="min-w-[160px]">
            <div className="section-label mb-2">INITIAL CAPITAL ($)</div>
            <input value={initialCapital} onChange={e => setInitialCapital(e.target.value)}
              className="input-field" type="number" />
          </div>
        </div>

        {/* Strategy params */}
        <div className="border-t border-border pt-4">
          <div className="section-label mb-3">STRATEGY PARAMETERS (RSI + MACD)</div>
          <div className="flex gap-4 flex-wrap">
            {[
              ['RSI Buy Threshold', rsiBuy, setRsiBuy, 20, 45],
              ['RSI Sell Threshold', rsiSell, setRsiSell, 55, 85],
              ['Stop Loss %', slPct, setSlPct, 1, 10],
              ['Take Profit %', tpPct, setTpPct, 2, 20],
            ].map(([label, val, setter, min, max]) => (
              <div key={String(label)} className="flex-1 min-w-[160px]">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-500">{label}</span>
                  <span className="text-[10px] text-cyan font-mono">{val}</span>
                </div>
                <input type="range" min={Number(min)} max={Number(max)} value={Number(val)}
                  onChange={e => (setter as Function)(e.target.value)}
                  className="w-full accent-cyan h-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <button onClick={handleRun} disabled={running}
            className="px-6 py-2.5 rounded-lg font-bold text-[13px] text-white transition-all disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#a78bfa,#38bdf8)', boxShadow:'0 4px 16px rgba(167,139,250,0.3)' }}>
            {running ? `⏳ Running... ${progress}%` : '▶ Run Backtest'}
          </button>
          {running && (
            <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden max-w-[200px]">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#a78bfa,#38bdf8)' }} />
            </div>
          )}
          {error && <span className="text-[11px] text-red font-mono">{error}</span>}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4 animate-fade-up">
          {/* Metrics */}
          <div className="flex gap-3 flex-wrap">
            <StatCard label="Win Rate" value={`${perf.winRate}%`} color={perf.winRate >= 55 ? 'green' : 'amber'} icon="◎" />
            <StatCard label="Net Profit" value={`${perf.netProfit >= 0 ? '+' : ''}$${perf.netProfit.toLocaleString()}`}
              color={perf.netProfit >= 0 ? 'green' : 'red'} icon="▲" />
            <StatCard label="Max Drawdown" value={`${perf.maxDrawdown}%`} color="red" icon="▼" />
            <StatCard label="Sharpe Ratio" value={String(perf.sharpeRatio)} color={perf.sharpeRatio >= 1.5 ? 'green' : 'amber'} icon="◈" />
            <StatCard label="Total Trades" value={String(perf.totalTrades)} color="cyan" icon="◷" />
            <StatCard label="Profit Factor" value={String(perf.profitFactor)} color={perf.profitFactor >= 1.5 ? 'green' : 'amber'} icon="◑" />
          </div>

          {/* Capital summary */}
          <div className="glass rounded-xl border border-border p-4 flex gap-6 flex-wrap">
            {[
              ['Initial Capital', `$${parseFloat(initialCapital).toLocaleString()}`, 'cyan'],
              ['Final Capital', `$${result.finalCapital.toLocaleString()}`, profitable ? 'green' : 'red'],
              ['Net Return', `${((result.finalCapital - parseFloat(initialCapital)) / parseFloat(initialCapital) * 100).toFixed(1)}%`, profitable ? 'green' : 'red'],
              ['Avg Win', `$${perf.avgWin.toFixed(2)}`, 'green'],
              ['Avg Loss', `$${perf.avgLoss.toFixed(2)}`, 'red'],
            ].map(([k,v,c]) => (
              <div key={String(k)}>
                <div className="section-label mb-1">{k}</div>
                <div className={`text-[16px] font-bold font-mono text-${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          {result.equityCurve?.length > 0 && (
            <div className="glass rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border section-label">EQUITY CURVE</div>
              <div className="p-4">
                <EquityCurve data={result.equityCurve} height={180} color={profitable ? '#a78bfa' : '#f43f5e'} />
              </div>
            </div>
          )}

          {/* Trade log */}
          {result.trades?.length > 0 && (
            <div className="glass rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border section-label">
                RECENT TRADES ({result.trades.length} shown)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border">
                      {['Entry Date','Exit Date','Side','Entry','Exit','Qty','PnL','Exit Reason'].map(h => (
                        <th key={h} className="px-3 py-2 text-left section-label font-normal whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(-15).map((t: any, i: number) => (
                      <tr key={i} className="border-b border-border hover:bg-white/5">
                        <td className="px-3 py-2 font-mono text-slate-500">{t.entryDate?.slice?.(0,10)}</td>
                        <td className="px-3 py-2 font-mono text-slate-500">{t.exitDate?.slice?.(0,10)}</td>
                        <td className="px-3 py-2"><Badge color="green" small>BUY</Badge></td>
                        <td className="px-3 py-2 font-mono">${t.entryPrice?.toLocaleString('en',{maximumFractionDigits:2})}</td>
                        <td className="px-3 py-2 font-mono">${t.exitPrice?.toLocaleString('en',{maximumFractionDigits:2})}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{t.quantity?.toFixed(4)}</td>
                        <td className="px-3 py-2 font-mono font-bold">
                          <span className={t.pnl >= 0 ? 'text-green' : 'text-red'}>{t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge color={t.exitReason === 'SL' ? 'red' : t.exitReason?.startsWith?.('TP') ? 'green' : 'cyan'} small>
                            {t.exitReason}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
