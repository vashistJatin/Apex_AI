'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { LiveDot } from '@/components/ui'
import { fetchTickers } from '@/hooks/useApi'

const WATCHLIST = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','AVAXUSDT','ADAUSDT','DOGEUSDT']

interface TickerItem { symbol: string; price: number; change24h: number }

export function TickerBar() {
  const [tickers, setTickers] = useState<TickerItem[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await fetchTickers()
      if (data) setTickers(data.slice(0, 8))
    }
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [])

  // Fallback static data while loading
  const displayTickers = tickers.length ? tickers : WATCHLIST.map((s, i) => ({
    symbol: s,
    price: [67842, 3521, 185, 612, 0.78, 42, 0.62, 0.18][i],
    change24h: [2.34, 1.87, 5.12, -0.93, 3.41, 7.83, -1.22, -2.11][i]
  }))

  const doubled = [...displayTickers, ...displayTickers]

  return (
    <div className="h-8 border-b border-border bg-bg-1 overflow-hidden flex items-center">
      <div className="flex items-center gap-8 animate-ticker whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-400">{t.symbol.replace('USDT','/USDT')}</span>
            <span className="text-slate-100 font-bold">
              {t.price >= 100
                ? `$${t.price.toLocaleString('en', { maximumFractionDigits: 2 })}`
                : `$${t.price.toPrecision(4)}`}
            </span>
            <span className={t.change24h >= 0 ? 'text-green' : 'text-red'}>
              {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function Header() {
  const { activePage, setSidebarOpen, sidebarOpen, tradingMode, setTradingMode, user } = useAppStore()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(0, 25) + ' UTC')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pageLabels: Record<string, string> = {
    dashboard: 'Dashboard', terminal: 'Trade Terminal', signals: 'AI Signals',
    strategy: 'Strategy Lab', portfolio: 'Portfolio', backtest: 'Backtesting', insights: 'AI Insights'
  }

  return (
    <header className="h-14 bg-bg-1 border-b border-border flex items-center px-4 gap-4 sticky top-0 z-30 flex-shrink-0">
      {/* Mobile menu */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden text-cyan text-xl leading-none">☰</button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-100 truncate">
          {pageLabels[activePage] || activePage}
        </div>
        <div className="text-[9px] text-slate-600 font-mono truncate">{time}</div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* SIM / LIVE toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(['SIM', 'LIVE'] as const).map(mode => (
            <button key={mode} onClick={() => setTradingMode(mode)}
              className={`px-3 py-1 text-[10px] font-mono font-bold transition-all ${
                tradingMode === mode
                  ? mode === 'LIVE'
                    ? 'bg-red-dim text-red border-r border-red/20'
                    : 'bg-cyan-dim text-cyan border-r border-cyan/20'
                  : 'text-slate-500 hover:text-slate-300'
              }`}>
              {mode === 'LIVE' ? '🔴 ' : '◈ '}{mode}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-dim border border-green/25 rounded-full">
          <LiveDot color="green" />
          <span className="text-[10px] text-green font-mono font-bold">LIVE</span>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white cursor-pointer flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #38bdf8, #a78bfa)' }}>
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  )
}
