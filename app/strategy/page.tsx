'use client'
import { useState } from 'react'
import { Badge, Toggle, ProgressBar } from '@/components/ui'

const DEFAULT_INDICATORS = {
  rsi: true, macd: true, ema: true, bollingerBands: false, vwap: true, volume: true, obv: false
}
const DEFAULT_RISK = {
  maxPositionSize: 5, dailyLossLimit: 500, maxOpenTrades: 4,
  trailingStop: 1.5, antiRevenge: true, pauseAfterLosses: 3
}
const SAVED_STRATEGIES = [
  { name:'Trend Rider',     winRate:71, profit:'+284%', drawdown:'12.4%', trades:142, sharpe:1.84, active:true  },
  { name:'Mean Reversion',  winRate:65, profit:'+148%', drawdown:'8.1%',  trades:98,  sharpe:1.42, active:false },
  { name:'Breakout Hunter', winRate:68, profit:'+213%', drawdown:'16.7%', trades:187, sharpe:1.61, active:false },
]

export default function StrategyPage() {
  const [riskProfile, setRiskProfile] = useState<'conservative'|'balanced'|'aggressive'>('balanced')
  const [indicators, setIndicators] = useState(DEFAULT_INDICATORS)
  const [risk, setRisk] = useState(DEFAULT_RISK)
  const [rsiPeriod, setRsiPeriod] = useState(14)
  const [rsiOB, setRsiOB] = useState(70)
  const [rsiOS, setRsiOS] = useState(30)
  const [saved, setSaved] = useState(false)

  const toggle = (k: keyof typeof indicators) =>
    setIndicators(p => ({ ...p, [k]: !p[k] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap">
        {/* Left column */}
        <div className="flex flex-col gap-4 flex-1 min-w-[280px]">
          {/* Risk Profile */}
          <div className="glass rounded-xl border border-border p-5">
            <div className="section-label mb-4">RISK PROFILE</div>
            <div className="flex gap-3">
              {([
                ['conservative','🛡','Conservative','green'],
                ['balanced','⚖','Balanced','cyan'],
                ['aggressive','⚡','Aggressive','red'],
              ] as const).map(([id, icon, label, color]) => (
                <button key={id} onClick={() => setRiskProfile(id)}
                  className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all border text-[11px] font-semibold
                    ${riskProfile === id
                      ? `bg-${color}-dim border-${color}/30 text-${color}`
                      : 'border-border text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}>
                  <span className="text-2xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {riskProfile === 'conservative' && <div className="mt-3 text-[10px] text-slate-500">Max 2% per trade, 5% daily limit, avoid volatile assets during high VIX.</div>}
            {riskProfile === 'balanced' && <div className="mt-3 text-[10px] text-slate-500">Max 5% per trade, 10% daily limit, standard leverage 1-3x.</div>}
            {riskProfile === 'aggressive' && <div className="mt-3 text-[10px] text-slate-500">Max 10% per trade, 20% daily limit, leverage up to 5x allowed.</div>}
          </div>

          {/* Indicators */}
          <div className="glass rounded-xl border border-border p-5">
            <div className="section-label mb-4">INDICATORS</div>
            <div className="flex flex-col gap-3">
              {Object.entries(indicators).map(([key, on]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-mono text-slate-200 uppercase">{key.replace(/([A-Z])/g,' $1').trim()}</span>
                    <Toggle on={on} onChange={() => toggle(key as keyof typeof indicators)} />
                  </div>
                </div>
              ))}
            </div>

            {/* RSI settings */}
            {indicators.rsi && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="section-label mb-3">RSI SETTINGS</div>
                {[
                  ['Period', rsiPeriod, setRsiPeriod, 5, 50],
                  ['Overbought', rsiOB, setRsiOB, 60, 90],
                  ['Oversold', rsiOS, setRsiOS, 10, 40],
                ].map(([label, val, setter, min, max]) => (
                  <div key={String(label)} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-500 font-mono">{label}</span>
                      <span className="text-[10px] text-cyan font-mono">{val}</span>
                    </div>
                    <input type="range" min={Number(min)} max={Number(max)} value={Number(val)}
                      onChange={e => (setter as Function)(+e.target.value)}
                      className="w-full accent-cyan h-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 flex-1 min-w-[280px]">
          {/* Risk Settings */}
          <div className="glass rounded-xl border border-border p-5">
            <div className="section-label mb-4">SMART RISK MANAGEMENT</div>
            <div className="flex flex-col gap-4">
              {[
                { label:'Daily Loss Limit ($)', key:'dailyLossLimit', min:100, max:5000, step:50 },
                { label:'Max Position Size (%)', key:'maxPositionSize', min:1, max:20, step:0.5 },
                { label:'Max Open Trades', key:'maxOpenTrades', min:1, max:10, step:1 },
                { label:'Trailing Stop (%)', key:'trailingStop', min:0.5, max:5, step:0.1 },
              ].map(({ label, key, min, max, step }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-slate-300">{label}</span>
                    <span className="text-[11px] text-cyan font-mono">{risk[key as keyof typeof risk]}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step}
                    value={Number(risk[key as keyof typeof risk])}
                    onChange={e => setRisk(r => ({ ...r, [key]: +e.target.value }))}
                    className="w-full accent-cyan h-1" />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[11px] text-slate-200">Anti-Revenge Trading</div>
                  <div className="text-[9px] text-slate-500">Pause after {risk.pauseAfterLosses} consecutive losses</div>
                </div>
                <Toggle on={risk.antiRevenge} onChange={v => setRisk(r => ({ ...r, antiRevenge: v }))} />
              </div>
            </div>

            {risk.antiRevenge && (
              <div className="mt-3 px-3 py-2 bg-green-dim border border-green/20 rounded-lg">
                <div className="text-[10px] text-green font-mono font-bold">✓ ANTI-REVENGE ACTIVE</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Bot pauses for 1h after {risk.pauseAfterLosses} losses</div>
              </div>
            )}
          </div>

          {/* Saved Strategies */}
          <div className="glass rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="section-label">SAVED STRATEGIES</div>
              <button className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-dim text-cyan border border-cyan/30 font-semibold">+ New</button>
            </div>
            {SAVED_STRATEGIES.map(s => (
              <div key={s.name} className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-semibold flex-1">{s.name}</span>
                  {s.active && <Badge color="green" small>ACTIVE</Badge>}
                  <button className="text-[9px] text-slate-500 hover:text-cyan transition-colors">Edit</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[['Win Rate', s.winRate+'%', 'green'],['Profit', s.profit,'green'],['Drawdown',s.drawdown,'red'],
                    ['Trades', s.trades, 'cyan'],['Sharpe', s.sharpe, 'cyan'],['Status', s.active?'Live':'Paused', s.active?'green':'amber']
                  ].map(([k,v,c]) => (
                    <div key={String(k)}>
                      <div className="text-[8px] text-slate-600 font-mono">{k}</div>
                      <div className={`text-[11px] font-mono font-semibold text-${c}`}>{v}</div>
                    </div>
                  ))}
                </div>
                <ProgressBar value={s.winRate} color={s.winRate >= 65 ? '#22d3a5' : '#fbbf24'} height={3} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2.5 glass rounded-lg border border-border text-slate-400 hover:text-slate-200 text-[12px] font-semibold transition-all">
          Reset Defaults
        </button>
        <button onClick={handleSave}
          className={`px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all ${saved ? 'bg-green-dim text-green border border-green/30' : 'btn-primary'}`}>
          {saved ? '✓ Strategy Saved' : 'Save Strategy'}
        </button>
      </div>
    </div>
  )
}
