'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'

const FEATURES = [
  { icon: '⬡', title: 'Multi-Agent AI',      desc: '5 specialized AI agents analyze news, technicals, risk, entries, and synthesize into one confidence score.' },
  { icon: '◈', title: 'Real-Time Signals',    desc: 'Live BUY/SELL signals with entry, stop loss, take profit, and risk:reward ratio powered by Groq AI.' },
  { icon: '◎', title: 'Smart Risk Engine',    desc: 'Anti-revenge trading, position sizing, daily loss limits, trailing stops, and volatility detection.' },
  { icon: '◷', title: 'Backtesting Engine',   desc: 'Test any strategy on historical Binance data with full analytics: win rate, Sharpe ratio, drawdown.' },
  { icon: '⊕', title: 'AI Chat Assistant',    desc: 'Ask anything about the market. Get instant expert analysis from the APEX AI trading assistant.' },
  { icon: '⬟', title: 'Strategy Builder',     desc: 'Configure indicators, risk profiles, and automated rules. Save and activate strategies with one click.' },
]

const STATS = [
  { v: '73.2%', l: 'Avg Win Rate'   },
  { v: '5',     l: 'AI Agents'      },
  { v: '1.84',  l: 'Sharpe Ratio'   },
  { v: '$0/mo', l: 'To Start'       },
]

const TECH = ['Next.js 14', 'Groq AI', 'Supabase', 'Binance WS', 'TypeScript', 'Tailwind CSS']

export default function LandingPage() {
  const { setActivePage } = useAppStore()
  const [tick, setTick] = useState(0)
  const prices = [
    { s: 'BTC', p: 67842 + tick * 2.1, c: 2.34 },
    { s: 'ETH', p: 3521  + tick * 0.8, c: 1.87 },
    { s: 'SOL', p: 185   + tick * 0.1, c: 5.12 },
  ]

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + (Math.random() - 0.45) * 2), 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-bg-0 overflow-x-hidden">
      {/* Background grid + glow */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 25% 25%, rgba(56,189,248,0.07) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(167,139,250,0.07) 0%, transparent 55%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border glass">
        <div className="font-display font-black text-[16px] tracking-widest text-cyan">
          APEX<span className="text-slate-500 font-normal">AI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex gap-1">
            {prices.map(p => (
              <span key={p.s} className="text-[10px] font-mono px-2 py-1 glass rounded border border-border">
                <span className="text-slate-500">{p.s} </span>
                <span className="text-slate-200">${p.p.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                <span className={p.c > 0 ? ' text-green' : ' text-red'}> {p.c > 0 ? '+' : ''}{p.c.toFixed(2)}%</span>
              </span>
            ))}
          </div>
          <button onClick={() => setActivePage('dashboard')}
            className="btn-primary text-[12px]">Launch App →</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full border border-cyan/20 text-[10px] font-mono text-cyan mb-6 animate-fade-up">
          <span className="animate-blink">●</span> LIVE · Multi-Agent AI Trading System
        </div>

        <h1 className="font-display text-[clamp(40px,9vw,88px)] font-black leading-[0.95] mb-6 animate-fade-up"
          style={{ animationDelay: '80ms' }}>
          <span className="text-gradient">APEX</span>
          <br />
          <span className="text-slate-300 text-[0.7em] font-bold tracking-widest">TRADING AI</span>
        </h1>

        <p className="text-[15px] text-slate-400 max-w-xl mx-auto leading-relaxed mb-8 animate-fade-up"
          style={{ animationDelay: '160ms' }}>
          Institutional-grade crypto intelligence. Five AI agents analyze news, technicals,
          risk, and entries — then synthesize into a single confidence score and actionable signal.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
          {['RSI + MACD + EMA', 'News Sentiment', 'Risk Management', 'Backtesting', 'Real-Time Signals'].map(f => (
            <span key={f} className="px-3 py-1.5 glass rounded-full border border-border text-[11px] text-slate-400 font-mono">{f}</span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center animate-fade-up" style={{ animationDelay: '320ms' }}>
          <button onClick={() => setActivePage('dashboard')}
            className="px-8 py-4 rounded-xl text-[14px] font-black font-display tracking-widest text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#0891b2)', boxShadow: '0 8px 32px rgba(56,189,248,0.35)' }}>
            LAUNCH PLATFORM
          </button>
          <button onClick={() => setActivePage('insights')}
            className="px-8 py-4 rounded-xl text-[14px] font-semibold glass border border-border text-slate-300 hover:border-cyan/30 transition-all">
            Try AI Assistant
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 justify-center mt-16 animate-fade-up" style={{ animationDelay: '400ms' }}>
          {STATS.map(s => (
            <div key={s.l} className="text-center">
              <div className="font-display text-[28px] font-black text-cyan">{s.v}</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live demo preview */}
      <section className="relative z-10 px-6 mb-16">
        <div className="max-w-4xl mx-auto glass rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-bg-1">
            <div className="flex gap-1.5">
              {['#f43f5e','#fbbf24','#22d3a5'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
            </div>
            <span className="text-[10px] text-slate-600 font-mono ml-2">apex-ai.vercel.app — Dashboard</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-blink" />
              <span className="text-[9px] text-green font-mono">LIVE</span>
            </div>
          </div>
          {/* Mini dashboard preview */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-0/50 border-b border-border">
            {[['Portfolio','$84,271','cyan'],['Total PnL','+$6,118','green'],['Win Rate','73.2%','green'],['Open Pos.','3','amber']].map(([l,v,c]) => (
              <div key={String(l)} className="glass rounded-lg p-3 border border-border">
                <div className="text-[8px] text-slate-600 font-mono mb-1">{l}</div>
                <div className={`text-[14px] font-bold font-mono text-${c}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="p-4 flex gap-3 flex-wrap bg-bg-0/50">
            {[
              { s:'BTC', sig:'BUY',  conf:87, c:'green' },
              { s:'ETH', sig:'BUY',  conf:79, c:'green' },
              { s:'SOL', sig:'SELL', conf:72, c:'red'   },
              { s:'AVAX',sig:'BUY',  conf:83, c:'green' },
            ].map(x => (
              <div key={x.s} className="glass rounded-lg p-3 flex-1 min-w-[100px] border border-border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold">{x.s}</span>
                  <span className={`text-[9px] font-mono font-bold text-${x.c}`}>{x.sig}</span>
                </div>
                <div className="h-1 bg-bg-3 rounded-full mb-1">
                  <div className={`h-full rounded-full bg-${x.c}`} style={{ width: `${x.conf}%` }} />
                </div>
                <div className={`text-[9px] font-mono text-${x.c}`}>{x.conf}% confidence</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-label mb-2">PLATFORM FEATURES</div>
            <h2 className="font-display text-[24px] font-bold text-gradient">Everything you need to trade smarter</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="glass rounded-xl border border-border p-5 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="text-2xl mb-3 text-cyan">{f.icon}</div>
                <div className="font-semibold text-[13px] mb-1.5">{f.title}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 px-6 pb-16 text-center">
        <div className="section-label mb-4">BUILT WITH</div>
        <div className="flex flex-wrap gap-3 justify-center">
          {TECH.map(t => (
            <span key={t} className="px-3 py-1.5 glass rounded-full border border-border text-[11px] font-mono text-cyan">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-20 text-center">
        <div className="max-w-lg mx-auto glass rounded-2xl border border-cyan/20 p-8"
          style={{ boxShadow: '0 0 60px rgba(56,189,248,0.08)' }}>
          <div className="font-display text-[20px] font-bold text-gradient mb-2">Ready to trade smarter?</div>
          <div className="text-[12px] text-slate-500 mb-6">Free to start. No credit card. Deploy in under 10 minutes.</div>
          <button onClick={() => setActivePage('dashboard')}
            className="px-10 py-3.5 rounded-xl text-[13px] font-black font-display tracking-widest text-white w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#0891b2)', boxShadow: '0 8px 32px rgba(56,189,248,0.3)' }}>
            ENTER PLATFORM →
          </button>
        </div>
      </section>
    </div>
  )
}
