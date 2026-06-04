'use client'
import { useEffect, useState } from 'react'
import { Badge, ConfArc, LiveDot, Skeleton, StatCard } from '@/components/ui'
import { fetchSignal, fetchNews, sendChatMessage } from '@/hooks/useApi'
import { useAppStore } from '@/store'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','AVAXUSDT']

const FALLBACK_SIGNALS = SYMBOLS.map((s, i) => ({
  symbol: s,
  type: ['BUY','BUY','SELL','BUY'][i],
  entryPrice: [67200, 3480, 190, 41.5][i],
  stopLoss: [65100, 3340, 198, 39.2][i],
  takeProfitTargets: [[68800,70200,72500],[3650,3820,4100],[182,175,165],[44.8,48,52]][i],
  riskRewardRatio: ['1:3.2','1:2.8','1:2.1','1:3.5'][i],
  confidenceScore: [87,79,72,83][i],
  reasoning: [
    'Golden cross on 4H + RSI bullish divergence + strong volume inflows from institutional wallets.',
    'EMA 50 bounce + MACD histogram turning positive + Fear & Greed at 62 — risk-on mode.',
    'Rejection at key resistance + declining volume + bearish engulfing candle on 4H.',
    'Breakout from 3-week consolidation + whale accumulation detected on-chain.',
  ][i],
  indicators: { rsi: [58,54,68,61][i], trend: ['BULLISH','BULLISH','BEARISH','BULLISH'][i] }
}))

export default function SignalsPage() {
  const { token } = useAppStore()
  const [selected, setSelected] = useState(0)
  const [signals, setSignals] = useState<any[]>(FALLBACK_SIGNALS)
  const [loadingSignal, setLoadingSignal] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [news, setNews] = useState<any[]>([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [masterResult, setMasterResult] = useState<any>(null)

  useEffect(() => {
    // Load news
    setLoadingNews(true)
    fetchNews('BTC').then(r => {
      if (r.data) setNews(r.data.news?.slice(0, 6) || [])
      setLoadingNews(false)
    })
  }, [])

  const runSignalAnalysis = async (symbolIdx: number) => {
    setLoadingSignal(true); setAiAnalysis(''); setMasterResult(null)
    const sym = SYMBOLS[symbolIdx]
    const { data, error } = await fetchSignal(sym)
    if (data) {
      setSignals(prev => {
        const updated = [...prev]
        updated[symbolIdx] = { ...updated[symbolIdx], ...data.signal }
        return updated
      })
      setMasterResult(data.master)
    }
    setLoadingSignal(false)
  }

  const runAIAnalysis = async () => {
    const sig = signals[selected]
    setLoadingAI(true); setAiAnalysis('')
    const { data } = await sendChatMessage([{
      role: 'user',
      content: `Deep analysis for ${sig.symbol} ${sig.type} signal. Entry: $${sig.entryPrice}, SL: $${sig.stopLoss}, TP targets: ${sig.takeProfitTargets?.join(', ')}. Confidence: ${sig.confidenceScore}%. RSI: ${sig.indicators?.rsi}. Trend: ${sig.indicators?.trend}. Provide: 1) Technical setup 2) Key price levels 3) Risk factors 4) Entry timing 5) Final verdict.`
    }])
    if (data) setAiAnalysis(data.reply)
    setLoadingAI(false)
  }

  const sig = signals[selected]

  return (
    <div className="flex flex-col gap-4">
      {/* Signal cards */}
      <div className="flex gap-3 flex-wrap">
        {signals.map((s, i) => (
          <div key={s.symbol} onClick={() => setSelected(i)}
            className={`glass rounded-xl p-4 cursor-pointer flex-1 min-w-[180px] transition-all duration-200 border
              ${selected === i ? 'border-cyan/40 bg-cyan/5' : 'border-border hover:border-cyan/20'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-display text-[13px] font-bold">{s.symbol.replace('USDT','')}</div>
                <div className="text-[9px] text-slate-500 font-mono">USDT PERP</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge color={s.type === 'BUY' ? 'green' : s.type === 'SELL' ? 'red' : 'amber'}>{s.type}</Badge>
                <ConfArc value={s.confidenceScore} size={44} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[['Entry', `$${s.entryPrice?.toLocaleString('en',{maximumFractionDigits:2})}`],
                ['Stop Loss', `$${s.stopLoss?.toLocaleString('en',{maximumFractionDigits:2})}`],
                ['R:R', s.riskRewardRatio],
                ['RSI', s.indicators?.rsi || '—']].map(([k, v]) => (
                <div key={String(k)}>
                  <div className="text-[8px] text-slate-500 font-mono">{k}</div>
                  <div className="text-[11px] font-mono font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-slate-400 leading-relaxed line-clamp-2">{s.reasoning}</div>
          </div>
        ))}
      </div>

      {/* Analysis panel */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] font-semibold">AI Deep Analysis — {sig?.symbol?.replace('USDT','')}</div>
            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5">
              <LiveDot color="cyan" /><span>Multi-Agent System · Groq AI</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => runSignalAnalysis(selected)} disabled={loadingSignal}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold glass border border-border hover:border-cyan/30 transition-all text-cyan disabled:opacity-50">
              {loadingSignal ? '◷ Generating...' : '⬡ Fresh Signal'}
            </button>
            <button onClick={runAIAnalysis} disabled={loadingAI}
              className="btn-primary text-[11px] disabled:opacity-50">
              {loadingAI ? '◷ Analyzing...' : '◈ AI Analysis'}
            </button>
          </div>
        </div>

        <div className="p-5">
          {loadingSignal || loadingAI ? (
            <div className="flex flex-col gap-2">
              {[100,85,90,75,80].map((w,i) => <Skeleton key={i} className={`h-4`} style={{ width: `${w}%` }} />)}
              <div className="text-[10px] text-cyan font-mono mt-2 animate-blink">◈ AI agents analyzing market data...</div>
            </div>
          ) : aiAnalysis ? (
            <div className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex gap-6 flex-wrap">
                {/* TP targets */}
                <div className="flex-1 min-w-[200px]">
                  <div className="section-label mb-3">TAKE PROFIT TARGETS</div>
                  {sig?.takeProfitTargets?.map((tp: number, i: number) => (
                    <div key={i} className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] text-slate-500 font-mono w-6">TP{i+1}</span>
                      <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full" style={{ width:`${33*(i+1)}%`, opacity: 1-i*0.2 }} />
                      </div>
                      <span className="text-[11px] font-mono text-green w-20 text-right">
                        ${tp?.toLocaleString('en', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Multi-TF consensus */}
                <div className="flex-1 min-w-[200px]">
                  <div className="section-label mb-3">MULTI-TIMEFRAME CONSENSUS</div>
                  {[['1H','BULLISH','green'],['4H','BULLISH','green'],['1D','NEUTRAL','amber'],['15M','BULLISH','green']].map(([tf, s, c]) => (
                    <div key={tf} className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-slate-500 font-mono w-6">{tf}</span>
                      <div className="flex-1 h-1 bg-bg-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-${c}`} style={{ width: s === 'BULLISH' ? '75%' : '50%' }} />
                      </div>
                      <Badge color={c as any} small>{s}</Badge>
                    </div>
                  ))}
                </div>

                {/* Master agent */}
                {masterResult && (
                  <div className="flex-1 min-w-[200px]">
                    <div className="section-label mb-3">MASTER AI VERDICT</div>
                    <div className="bg-cyan-dim border border-cyan/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ConfArc value={masterResult.compositeScore} size={40} />
                        <div>
                          <div className="text-[11px] font-bold text-cyan">Composite: {masterResult.compositeScore}/100</div>
                          <Badge color={masterResult.confidence === 'HIGH' ? 'green' : masterResult.confidence === 'MEDIUM' ? 'amber' : 'red'} small>
                            {masterResult.confidence} CONFIDENCE
                          </Badge>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 leading-relaxed">{masterResult.finalReasoning}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-bg-2 rounded-lg px-4 py-3 text-[11px] text-slate-400 leading-relaxed border border-border">
                <strong className="text-cyan">Signal Rationale: </strong>{sig?.reasoning}
              </div>
              <div className="text-[10px] text-slate-600">
                Click "Fresh Signal" to run the multi-agent AI system on live market data. Click "AI Analysis" for a detailed written breakdown.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* News Sentiment */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border section-label">NEWS SENTIMENT ENGINE</div>
        {loadingNews
          ? Array.from({length:4}).map((_,i) => <div key={i} className="flex gap-4 px-4 py-3 border-b border-border"><Skeleton className="flex-1 h-8" /><Skeleton className="w-8 h-8 rounded" /></div>)
          : (news.length ? news : [
              { title:'BlackRock Bitcoin ETF sees record $1.2B inflows', sentimentScore:88, sentimentTag:'BULLISH', source:'Reuters',   publishedAt: new Date().toISOString() },
              { title:'Fed signals potential rate cut — risk assets rally',sentimentScore:74, sentimentTag:'BULLISH', source:'Bloomberg',time:'15m' },
              { title:'Whale alert: 12,000 BTC moved to Coinbase',        sentimentScore:38, sentimentTag:'BEARISH', source:'WhaleAlert',publishedAt: new Date().toISOString() },
              { title:'SEC delays decision on spot Ethereum ETF again',    sentimentScore:29, sentimentTag:'BEARISH', source:'CoinTelegraph',publishedAt: new Date().toISOString() },
            ]).map((n: any, i: number) => {
              const tag = n.sentimentTag || 'NEUTRAL'
              const score = n.sentimentScore || 50
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-white/5 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-200 mb-1 truncate">{n.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-mono">{n.source || n.src}</span>
                      <Badge color={tag === 'BULLISH' ? 'green' : tag === 'BEARISH' ? 'red' : 'amber'} small>{tag}</Badge>
                    </div>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className={`text-[16px] font-bold font-mono ${score >= 60 ? 'text-green' : score >= 40 ? 'text-amber' : 'text-red'}`}>{score}</div>
                    <div className="text-[8px] text-slate-600">score</div>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
