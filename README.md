# APEX AI — Institutional Crypto Trading Intelligence

A production-ready, full-stack AI crypto trading dashboard built with Next.js 14, Groq AI, Supabase, and Binance WebSocket. Multi-agent AI system with real-time signals, risk management, and automated strategy execution.

## ✨ Features

- **5 AI Agents** — News, Technical, Risk, Entry, Master coordinator
- **Real-Time Signals** — BUY/SELL with entry, SL, TP, R:R, confidence score
- **Live Candlestick Charts** — Binance WebSocket, EMA overlays, volume bars
- **Trade Terminal** — Limit/Market orders, live order book, SIM + LIVE modes
- **Backtesting Engine** — RSI + MACD strategy on real historical Binance data
- **Portfolio Analytics** — Equity curve, allocation, trade history, PnL
- **AI Chat Assistant** — Groq-powered trading Q&A
- **Strategy Builder** — Indicator toggles, risk profiles, saved strategies
- **Smart Risk Management** — Anti-revenge trading, daily loss limits, trailing stops
- **News Sentiment** — CryptoPanic + AI sentiment scoring
- **Telegram Alerts** — Signal and trade notifications
- **Zero-cost stack** — Deploy for \$0/month

---

## 🚀 Quick Start (5 steps)

### 1. Clone and install

```bash
git clone https://github.com/yourname/apex-ai.git
cd apex-ai
npm install
```

### 2. Create your free accounts

| Service | URL | What you get |
|---|---|---|
| Supabase | supabase.com | Free PostgreSQL + Auth |
| Groq | console.groq.com | Free AI (14,400 req/day) |
| Binance | binance.com/en/my/settings/api-management | Free market data |
| Vercel | vercel.com | Free hosting |

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
BINANCE_API_KEY=your_key     # Read-only permissions only
BINANCE_SECRET_KEY=your_secret
CRYPTOPANIC_API_KEY=your_key  # optional, free at cryptopanic.com
TELEGRAM_BOT_TOKEN=123:AAA    # optional
TELEGRAM_CHAT_ID=12345678     # optional
JWT_SECRET=64-char-random-hex
ENCRYPTION_KEY=32-char-random-hex
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set up database

1. Open **Supabase Dashboard** → your project → **SQL Editor**
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🌐 Deploy to Vercel (free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GROQ_API_KEY
vercel env add BINANCE_API_KEY
vercel env add BINANCE_SECRET_KEY
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
# ... add all from .env.example

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 📁 Project Structure

```
apex-ai/
├── app/
│   ├── page.tsx                 ← Root router (SPA)
│   ├── layout.tsx               ← Root layout + fonts
│   ├── globals.css              ← Tailwind + custom styles
│   ├── landing/page.tsx         ← Landing/hero page
│   ├── dashboard/page.tsx       ← Main dashboard
│   ├── terminal/page.tsx        ← Trade terminal
│   ├── signals/page.tsx         ← AI signals
│   ├── strategy/page.tsx        ← Strategy builder
│   ├── portfolio/page.tsx       ← Portfolio analytics
│   ├── backtest/page.tsx        ← Backtesting engine
│   ├── insights/page.tsx        ← AI chat assistant
│   ├── settings/page.tsx        ← Settings
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── api/
│       ├── market/route.ts      ← Binance market data
│       ├── signals/route.ts     ← Multi-agent signal gen
│       ├── ai/route.ts          ← Groq AI chat
│       ├── news/route.ts        ← News + sentiment
│       ├── trades/route.ts      ← Order execution
│       ├── portfolio/route.ts   ← Portfolio analytics
│       ├── backtest/route.ts    ← Strategy backtesting
│       └── auth/route.ts        ← Login / register
│
├── components/
│   ├── ui/index.tsx             ← Badge, StatCard, Toggle, Gauge...
│   ├── charts/
│   │   ├── CandleChart.tsx      ← SVG candlestick chart
│   │   └── EquityCurve.tsx      ← Portfolio equity chart
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx + TickerBar
│
├── lib/
│   ├── groq.ts                  ← Groq AI service
│   ├── binance.ts               ← Binance REST + WS
│   ├── agents.ts                ← Multi-agent system
│   ├── indicators.ts            ← RSI, MACD, EMA, BB
│   ├── supabase.ts              ← DB clients
│   ├── notifications.ts         ← Telegram alerts
│   └── middleware.ts            ← Auth + rate limit
│
├── hooks/
│   ├── useBinanceWS.ts          ← Live WebSocket hooks
│   └── useApi.ts                ← API client functions
│
├── store/index.ts               ← Zustand global state
├── types/index.ts               ← Full TypeScript types
├── middleware.ts                ← Next.js edge middleware
└── supabase/migrations/         ← SQL schema
```

---

## 🔑 API Keys Guide

### Binance (Required for live data)
1. Log into Binance → Profile → API Management
2. Create API Key → **Enable Read Only only**
3. **Restrict to your server IP** for security
4. Never enable withdrawal permissions

### Groq AI (Required for AI features)
1. Go to console.groq.com → Sign up free
2. API Keys → Create New Key
3. Free tier: 14,400 requests/day — enough for active trading

### Supabase (Required for auth + data)
1. supabase.com → New Project
2. Settings → API → copy URL and anon key
3. Settings → API → copy service_role key (keep secret!)
4. Run the SQL migration in SQL Editor

### CryptoPanic (Optional, for news)
1. cryptopanic.com/developers/api → Register
2. Free tier available
3. Without this key, AI generates contextual market analysis

### Telegram Bot (Optional, for alerts)
1. Open Telegram → @BotFather → `/newbot`
2. Copy the bot token
3. Message @userinfobot to get your chat ID

---

## 🛡️ Security Checklist

- [ ] Binance API: Read-only permissions only
- [ ] Binance API: IP whitelist to your Vercel/server IP
- [ ] `.env.local` added to `.gitignore` ✓
- [ ] JWT_SECRET: 64+ char random string
- [ ] ENCRYPTION_KEY: 32 char random string
- [ ] Test in SIM mode for 2+ weeks before LIVE
- [ ] Set daily loss limit in Settings before going LIVE
- [ ] Enable anti-revenge trading in Strategy Lab

---

## 💰 Cost Breakdown

| Service | Free Tier | Notes |
|---|---|---|
| Vercel (hosting) | ✅ Free | 100GB bandwidth/mo |
| Supabase (DB+Auth) | ✅ Free | 500MB, 50K users |
| Groq AI | ✅ Free | 14,400 req/day |
| Binance API | ✅ Free | Public streams free |
| CryptoPanic | ✅ Free | 1000 req/day |
| Telegram | ✅ Free | Unlimited |
| **Total** | **\$0/mo** | |

Upgrade path: $5-20/mo when you need more DB space or API calls.

---

## 🔧 Development

```bash
npm run dev      # Start dev server at :3000
npm run build    # Production build
npm run lint     # Lint check
```

### Adding a new indicator

1. Add calculation in `lib/indicators.ts`
2. Include in `getIndicatorSnapshot()`
3. Add to AI prompt in `lib/agents.ts`
4. Add toggle in `app/strategy/page.tsx`

### Adding a new AI agent

1. Create `runYourAgent()` in `lib/agents.ts`
2. Add to `generateTradeSignal()` parallel call
3. Pass to `runMasterAgent()`
4. Add status dot in `components/layout/Sidebar.tsx`

---

## 📜 License

MIT — free to use, modify, and deploy commercially.

---

Built with ❤️ by APEX AI · Trade Smarter, Not Harder
#   A p e x _ A I  
 