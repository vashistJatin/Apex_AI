'use client'
import { useEffect, useState } from 'react'
import { Badge, StatCard } from '@/components/ui'
import CandleChart from '@/components/charts/CandleChart'
import { fetchCandles, fetchTrades, placeTrade } from '@/hooks/useApi'
import { useBinanceTicker, useBinanceOrderBook } from '@/hooks/useBinanceWS'
import { useAppStore } from '@/store'
import type { Candle } from '@/types'

const PAIRS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT']

export default function TerminalPage() {
  const { tradingMode, token } = useAppStore()
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [tf, setTf] = useState('15m')
  const [candles, setCandles] = useState<Candle[]>([])
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT')
  const [qty, setQty] = useState('0.01')
  const [price, setPrice] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [trades, setTrades] = useState<any[]>([])
  const [placing, setPlacing] = useState(false)
  const [msg, setMsg] = useState('')

  const { data: ticker } = useBinanceTicker(symbol)
  const orderBook = useBinanceOrderBook(symbol)

  const currentPrice = ticker?.price || candles[candles.length - 1]?.close || 0

  useEffect(() => {
    fetchCandles(symbol, tf, 80).then(r => r.data && setCandles(r.data))
  }, [symbol, tf])

  useEffect(() => {
    if (currentPrice && !price) {
      setPrice(currentPrice.toFixed(2))
      setSl((currentPrice * 0.97).toFixed(2))
      setTp((currentPrice * 1.06).toFixed(2))
    }
  }, [currentPrice])

  useEffect(() => {
    if (token) fetchTrades(token, 10).then(r => r.data && setTrades(r.data))
  }, [token])

  const handleOrder = async () => {
    if (!qty || (!price && orderType === 'LIMIT')) return
    setPlacing(true); setMsg('')
    const order = {
      symbol, side, orderType, quantity: parseFloat(qty),
      price: parseFloat(price), stopLoss: parseFloat(sl), takeProfit: parseFloat(tp),
      mode: tradingMode
    }
    const { data, error } = await placeTrade(order, token || '')
    if (data) { setMsg(`✓ ${side} order filled at $${parseFloat(price).toLocaleString()}`); fetchTrades(token || '', 10).then(r => r.data && setTrades(r.data)) }
    else setMsg(`✗ ${error || 'Order failed'}`)
    setPlacing(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const riskAmt = Math.abs(parseFloat(price) - parseFloat(sl)) * parseFloat(qty) || 0
  const rewardAmt = Math.abs(parseFloat(tp) - parseFloat(price)) * parseFloat(qty) || 0
  const rr = riskAmt > 0 ? (rewardAmt / riskAmt).toFixed(1) : '—'

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Left: Chart + OrderBook */}
      <div className="flex-1 min-w-[300px] flex flex-col gap-4">
        {/* Pair selector */}
        <div className="flex gap-2 flex-wrap">
          {PAIRS.map(p => (
            <button key={p} onClick={() => setSymbol(p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                symbol === p ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'glass text-slate-400 border border-border hover:text-slate-200'
              }`}>{p.replace('USDT', '/USDT')}</button>
          ))}
        </div>

        {/* Chart */}
        <div className="glass rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
            <span className="font-display text-[13px] font-bold text-cyan">{symbol.replace('USDT','/USDT')}</span>
            <span className="font-mono text-lg font-bold">
              ${currentPrice >= 1 ? currentPrice.toLocaleString('en', { maximumFractionDigits: 2 }) : currentPrice.toPrecision(4)}
            </span>
            <Badge color={ticker && ticker.change24h >= 0 ? 'green' : 'red'}>
              {ticker ? `${ticker.change24h >= 0 ? '+' : ''}${ticker.change24h.toFixed(2)}%` : '—'}
            </Badge>
            <div className="ml-auto flex gap-1">
              {['1m','5m','15m','1h','4h'].map(t => (
                <button key={t} onClick={() => setTf(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    tf === t ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'text-slate-500 hover:text-slate-300'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <CandleChart candles={candles} height={260} />
        </div>

        {/* Order Book */}
        <div className="glass rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border section-label">ORDER BOOK</div>
          <div className="flex">
            {/* Asks */}
            <div className="flex-1 p-2">
              <div className="text-[9px] text-red font-mono mb-1 px-1">ASKS</div>
              {(orderBook.asks.length ? orderBook.asks : Array.from({length:8},(_,i)=>({price:currentPrice+100-i*12,qty:Math.random()*2+0.1}))).slice(0,8).reverse().map((a, i) => {
                const maxQ = Math.max(...orderBook.asks.map(x=>x.qty), 0.1)
                return (
                  <div key={i} className="relative flex justify-between px-1.5 py-0.5 text-[10px] font-mono rounded overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 bg-red-dim" style={{ width: `${(a.qty/maxQ)*60}%` }} />
                    <span className="text-red relative">{a.price.toLocaleString('en',{maximumFractionDigits:2})}</span>
                    <span className="text-slate-500 relative">{a.qty.toFixed(3)}</span>
                  </div>
                )
              })}
            </div>
            <div className="w-px bg-border" />
            {/* Bids */}
            <div className="flex-1 p-2">
              <div className="text-[9px] text-green font-mono mb-1 px-1">BIDS</div>
              {(orderBook.bids.length ? orderBook.bids : Array.from({length:8},(_,i)=>({price:currentPrice-100+i*8,qty:Math.random()*3+0.2}))).slice(0,8).map((b, i) => {
                const maxQ = Math.max(...orderBook.bids.map(x=>x.qty), 0.1)
                return (
                  <div key={i} className="relative flex justify-between px-1.5 py-0.5 text-[10px] font-mono rounded overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-green-dim" style={{ width: `${(b.qty/maxQ)*60}%` }} />
                    <span className="text-green relative">{b.price.toLocaleString('en',{maximumFractionDigits:2})}</span>
                    <span className="text-slate-500 relative">{b.qty.toFixed(3)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Mid price */}
          <div className="px-4 py-1.5 border-t border-border text-center text-[11px] font-mono font-bold text-cyan">
            ${currentPrice >= 1 ? currentPrice.toLocaleString('en',{maximumFractionDigits:2}) : currentPrice.toPrecision(4)}
          </div>
        </div>
      </div>

      {/* Right: Order Panel + History */}
      <div className="flex flex-col gap-4 w-[280px] flex-shrink-0">
        {/* Order Panel */}
        <div className="glass rounded-xl border border-border overflow-hidden">
          {/* Mode */}
          <div className="flex border-b border-border">
            {(['SIM','LIVE'] as const).map(m => {
              const active = tradingMode === m
              return (
                <div key={m} className={`flex-1 py-2 text-center text-[10px] font-mono font-bold cursor-default
                  ${active ? (m==='LIVE' ? 'text-red bg-red-dim' : 'text-cyan bg-cyan-dim') : 'text-slate-600'}`}>
                  {m === 'LIVE' ? '🔴 LIVE' : '◈ SIMULATION'}
                </div>
              )
            })}
          </div>

          {/* Buy/Sell */}
          <div className="flex border-b border-border">
            {(['BUY','SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`flex-1 py-2.5 text-[12px] font-mono font-bold transition-all border-b-2 ${
                  side === s
                    ? s === 'BUY' ? 'text-green bg-green-dim border-green' : 'text-red bg-red-dim border-red'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}>{s}</button>
            ))}
          </div>

          <div className="p-4 flex flex-col gap-3">
            {/* Order type */}
            <div className="flex gap-1">
              {(['LIMIT','MARKET'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className={`flex-1 py-1 rounded text-[9px] font-mono transition-all ${
                    orderType === t ? 'bg-cyan-dim text-cyan border border-cyan/30' : 'bg-bg-2 text-slate-500 border border-border'
                  }`}>{t}</button>
              ))}
            </div>

            {/* Inputs */}
            {[
              ['QUANTITY', qty, setQty, symbol.replace('USDT','')],
              ...(orderType === 'LIMIT' ? [['PRICE (USDT)', price, setPrice, '$']] : []),
              ['STOP LOSS', sl, setSl, '$'],
              ['TAKE PROFIT', tp, setTp, '$'],
            ].map(([label, val, setter, prefix]) => (
              <div key={String(label)}>
                <div className="section-label mb-1">{label as string}</div>
                <div className="flex items-center bg-bg-2 border border-border rounded-lg overflow-hidden">
                  {prefix && <span className="px-2 py-2 text-slate-500 text-[11px] font-mono bg-bg-3 border-r border-border">{prefix}</span>}
                  <input value={String(val)} onChange={e => (setter as Function)(e.target.value)}
                    className="flex-1 bg-transparent text-slate-100 text-[12px] font-mono px-2.5 py-2 outline-none" />
                </div>
              </div>
            ))}

            {/* Risk summary */}
            <div className="bg-bg-2 rounded-lg p-2.5 text-[10px] font-mono flex flex-col gap-1">
              <div className="flex justify-between"><span className="text-slate-500">Risk</span><span className="text-red">${riskAmt.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Reward</span><span className="text-green">${rewardAmt.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-slate-500">R:R</span><span className={parseFloat(rr) >= 2 ? 'text-green' : 'text-amber'}>1:{rr}</span></div>
            </div>

            {msg && (
              <div className={`text-[10px] font-mono px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-green-dim text-green' : 'bg-red-dim text-red'}`}>
                {msg}
              </div>
            )}

            <button onClick={handleOrder} disabled={placing}
              className={`w-full py-3 rounded-lg text-[13px] font-bold font-mono transition-all ${placing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
              style={{ background: side === 'BUY' ? 'linear-gradient(135deg,#22d3a5,#0891b2)' : 'linear-gradient(135deg,#f43f5e,#be185d)', color:'#fff',
                boxShadow: side === 'BUY' ? '0 4px 16px rgba(34,211,165,0.3)' : '0 4px 16px rgba(244,63,94,0.3)' }}>
              {placing ? '⏳ Processing...' : `${side} ${symbol.replace('USDT','')} — ${tradingMode}`}
            </button>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="glass rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border section-label">RECENT TRADES</div>
          {(trades.length ? trades : [
            { id:1, symbol:'BTCUSDT', side:'BUY',  price:64100, quantity:0.15, pnl:412,  created_at: new Date().toISOString() },
            { id:2, symbol:'ETHUSDT', side:'SELL', price:3620,  quantity:1.8,  pnl:-88,  created_at: new Date().toISOString() },
            { id:3, symbol:'SOLUSDT', side:'BUY',  price:174,   quantity:25,   pnl:284,  created_at: new Date().toISOString() },
          ]).slice(0,6).map((t: any) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Badge color={t.side === 'BUY' ? 'green' : 'red'} small>{t.side}</Badge>
              <span className="text-[10px] font-semibold">{(t.symbol||'').replace('USDT','')}</span>
              <span className="text-[9px] text-slate-500 font-mono">${t.price?.toLocaleString?.() || t.price}</span>
              <span className={`ml-auto text-[10px] font-mono font-bold ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl || 0).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
