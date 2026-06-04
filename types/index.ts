// ─── Market Types ──────────────────────────────────────────────────────────────
export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Ticker {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
  marketCap?: number
}

export interface OrderBookEntry {
  price: number
  quantity: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  lastUpdateId: number
}

// ─── Trading Types ─────────────────────────────────────────────────────────────
export type TradeSide = 'BUY' | 'SELL'
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT'
export type TradeStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'PARTIAL'
export type PositionSide = 'LONG' | 'SHORT'
export type TradingMode = 'SIM' | 'LIVE'

export interface Trade {
  id: string
  userId: string
  symbol: string
  side: TradeSide
  orderType: OrderType
  quantity: number
  price: number
  total: number
  status: TradeStatus
  mode: TradingMode
  pnl?: number
  fee?: number
  createdAt: string
  filledAt?: string
}

export interface Position {
  id: string
  userId: string
  symbol: string
  side: PositionSide
  size: number
  entryPrice: number
  currentPrice: number
  liquidationPrice: number
  leverage: number
  pnl: number
  pnlPercent: number
  margin: number
  mode: TradingMode
  openedAt: string
}

export interface OrderRequest {
  symbol: string
  side: TradeSide
  orderType: OrderType
  quantity: number
  price?: number
  stopLoss?: number
  takeProfit?: number
  leverage?: number
  mode: TradingMode
}

// ─── Signal Types ──────────────────────────────────────────────────────────────
export type SignalType = 'BUY' | 'SELL' | 'HOLD'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export interface TradeSignal {
  id: string
  symbol: string
  type: SignalType
  entryPrice: number
  stopLoss: number
  takeProfitTargets: number[]
  riskRewardRatio: string
  confidenceScore: number
  reasoning: string
  indicators: IndicatorSnapshot
  timeframe: Timeframe
  expiresAt: string
  createdAt: string
}

export interface IndicatorSnapshot {
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  ema20: number
  ema50: number
  ema200: number
  volume: number
  volumeAvg: number
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
}

export interface MultiTimeframeAnalysis {
  symbol: string
  timeframes: Record<Timeframe, { trend: string; strength: number; rsi: number }>
  overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  confluenceScore: number
}

// ─── AI Agent Types ────────────────────────────────────────────────────────────
export interface AgentResult {
  agentName: string
  score: number
  summary: string
  details: string
  timestamp: string
}

export interface MasterAgentResult {
  compositeScore: number
  signal: SignalType
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  agents: AgentResult[]
  finalReasoning: string
  riskLevel: RiskLevel
}

// ─── News / Sentiment Types ────────────────────────────────────────────────────
export type SentimentTag = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'WHALE' | 'MANIPULATION'

export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  sentimentScore: number
  sentimentTag: SentimentTag
  relatedCoins: string[]
}

export interface MarketSentiment {
  overall: number
  fearGreedIndex: number
  fearGreedLabel: string
  dominance: { btc: number; eth: number; others: number }
  trending: string[]
}

// ─── Portfolio Types ───────────────────────────────────────────────────────────
export interface Portfolio {
  userId: string
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  dailyPnl: number
  dailyPnlPercent: number
  weeklyPnl: number
  allocations: Allocation[]
  equityCurve: EquityPoint[]
}

export interface Allocation {
  symbol: string
  value: number
  percent: number
  pnl: number
  color: string
}

export interface EquityPoint {
  date: string
  value: number
}

// ─── Strategy / Backtest Types ─────────────────────────────────────────────────
export interface Strategy {
  id: string
  userId: string
  name: string
  description?: string
  indicators: StrategyIndicators
  riskProfile: 'conservative' | 'balanced' | 'aggressive'
  riskSettings: RiskSettings
  isActive: boolean
  performance?: StrategyPerformance
  createdAt: string
}

export interface StrategyIndicators {
  rsi: boolean; rsiPeriod: number; rsiOverbought: number; rsiOversold: number
  macd: boolean; macdFast: number; macdSlow: number; macdSignal: number
  ema: boolean; emaPeriods: number[]
  bollingerBands: boolean; bbPeriod: number; bbDeviation: number
  vwap: boolean
  volumeAnalysis: boolean
}

export interface RiskSettings {
  maxPositionSize: number
  dailyLossLimit: number
  maxOpenTrades: number
  trailingStop: number
  partialTakeProfit: boolean
  antiRevengeTrade: boolean
  pauseAfterLosses: number
}

export interface StrategyPerformance {
  winRate: number
  totalTrades: number
  netProfit: number
  maxDrawdown: number
  sharpeRatio: number
  profitFactor: number
  avgWin: number
  avgLoss: number
}

export interface BacktestResult {
  strategyId: string
  symbol: string
  startDate: string
  endDate: string
  initialCapital: number
  finalCapital: number
  performance: StrategyPerformance
  trades: BacktestTrade[]
  equityCurve: EquityPoint[]
  monthlyReturns: Record<string, number>
}

export interface BacktestTrade {
  entryDate: string
  exitDate: string
  side: TradeSide
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  pnlPercent: number
  exitReason: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'SIGNAL'
}

// ─── User / Auth Types ─────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username: string
  binanceApiKey?: string
  binanceSecretKey?: string
  telegramChatId?: string
  defaultMode: TradingMode
  createdAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  status: number
}
