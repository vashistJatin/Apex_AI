'use client'
import { useEffect, useRef, useState } from 'react'
import { LiveDot, Skeleton, StatCard } from '@/components/ui'
import { sendChatMessage, fetchNews } from '@/hooks/useApi'
import { useAppStore } from '@/store'

interface Message { role: 'user' | 'assistant'; content: string; ts?: number }

const QUICK_PROMPTS = [
  'Analyze BTC market right now',
  'What is the best entry for ETH?',
  'Explain RSI divergence',
  'Risk management tips for crypto',
  'What does MACD crossover mean?',
  'Is now a good time to buy SOL?',
]

const MARKET_STATS = [
  { label: 'BTC Dominance',   value: '54.2%', sub: '▲ +0.8%'        },
  { label: 'Total Market Cap',value: '$2.41T', sub: '▲ +2.1%'        },
  { label: '24H Volume',      value: '$142B',  sub: 'Above avg'       },
  { label: 'Active Addresses',value: '1.2M',   sub: '▲ +15% WoW'     },
]

export default function InsightsPage() {
  const { token } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Hello! I'm your **APEX AI** trading assistant, powered by Groq's lightning-fast LLM.\n\nI can help you with:\n• Real-time market analysis\n• Technical indicator explanations\n• Risk management advice\n• Trade signal reasoning\n• Chart pattern identification\n• Crypto market news interpretation\n\nWhat would you like to know?`,
      ts: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [marketContext, setMarketContext] = useState<any>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load market context for AI
    fetchNews('BTC').then(r => {
      if (r.data) setMarketContext({
        fearGreed: r.data.fearGreed,
        overallSentiment: r.data.overallSentiment,
        topNews: r.data.news?.slice(0, 3).map((n: any) => n.title)
      })
    })
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content: msg, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    const { data, error } = await sendChatMessage(history, marketContext, token || undefined)

    if (data?.reply) {
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, ts: Date.now() }])
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Connection issue: ${error || 'Unable to reach AI'}. Please check your GROQ_API_KEY in .env.local and try again.`,
        ts: Date.now()
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const formatMsg = (text: string) => {
    // Basic markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '&bull;')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[500px]">
      {/* Market Stats */}
      <div className="flex gap-3 flex-wrap flex-shrink-0">
        {MARKET_STATS.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color="cyan" icon="◈" />
        ))}
      </div>

      {/* Chat area */}
      <div className="glass rounded-xl border border-border flex flex-col flex-1 overflow-hidden">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#a78bfa)' }}>⬡</div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-cyan">APEX AI Assistant</div>
            <div className="flex items-center gap-1.5">
              <LiveDot color="green" />
              <span className="text-[9px] text-slate-500 font-mono">Online · Groq LLaMA-3.3-70B · Real-time</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {marketContext?.fearGreed && (
              <div className="text-[10px] font-mono px-2 py-1 rounded bg-amber-dim border border-amber/20 text-amber">
                F&G: {marketContext.fearGreed.value}
              </div>
            )}
            <button onClick={() => setMessages(prev => [prev[0]])}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 animate-fade-up ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              style={{ animationDelay: '0ms' }}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5
                ${m.role === 'user'
                  ? 'bg-gradient-to-br from-purple to-cyan text-white'
                  : 'bg-gradient-to-br from-cyan to-green text-white'
                }`}>
                {m.role === 'user' ? 'U' : '⬡'}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-[12px] leading-relaxed
                ${m.role === 'user'
                  ? 'bg-cyan-dim border border-cyan/20 text-slate-100 rounded-tr-none'
                  : 'bg-bg-2 border border-border text-slate-200 rounded-tl-none'
                }`}
                dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-green flex items-center justify-center text-[11px] font-bold flex-shrink-0">⬡</div>
              <div className="bg-bg-2 border border-border rounded-xl rounded-tl-none px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan"
                      style={{ animation: `blink 1s ease ${i * 0.2}s infinite` }} />
                  ))}
                  <span className="text-[10px] text-slate-500 ml-1 font-mono">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t border-border flex gap-2 flex-wrap flex-shrink-0">
          {QUICK_PROMPTS.map(q => (
            <button key={q} onClick={() => send(q)}
              className="px-2.5 py-1 rounded-full text-[9px] font-mono bg-bg-2 border border-border text-slate-500
                hover:text-cyan hover:border-cyan/30 transition-all truncate max-w-[180px]">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about market conditions, signals, strategy, or any crypto topic..."
            disabled={loading}
            className="flex-1 bg-bg-2 border border-border rounded-xl px-4 py-3 text-[12px]
              text-slate-100 placeholder-slate-600 outline-none transition-all
              focus:border-cyan/40 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.1)]
              disabled:opacity-50" />
          <button onClick={() => send()}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl text-[12px] font-bold text-white transition-all
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#0891b2)', boxShadow: '0 4px 12px rgba(56,189,248,0.25)' }}>
            {loading ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
