'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Ticker, TradeSignal, TradingMode } from '@/types'

interface AppState {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User | null, token?: string) => void
  logout: () => void

  // Market
  tickers: Record<string, Ticker>
  selectedSymbol: string
  selectedTimeframe: string
  tradingMode: TradingMode
  setTickers: (tickers: Ticker[]) => void
  setSelectedSymbol: (symbol: string) => void
  setSelectedTimeframe: (tf: string) => void
  setTradingMode: (mode: TradingMode) => void

  // Signals
  signals: TradeSignal[]
  addSignal: (signal: TradeSignal) => void
  clearSignals: () => void

  // UI
  sidebarOpen: boolean
  activePage: string
  setSidebarOpen: (open: boolean) => void
  setActivePage: (page: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token: token || get().token, isAuthenticated: !!user }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      // Market
      tickers: {},
      selectedSymbol: 'BTCUSDT',
      selectedTimeframe: '1h',
      tradingMode: 'SIM',
      setTickers: (tickers) => set({
        tickers: tickers.reduce((acc, t) => ({ ...acc, [t.symbol]: t }), {})
      }),
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),
      setTradingMode: (mode) => set({ tradingMode: mode }),

      // Signals
      signals: [],
      addSignal: (signal) => set(s => ({ signals: [signal, ...s.signals].slice(0, 20) })),
      clearSignals: () => set({ signals: [] }),

      // UI
      sidebarOpen: false,
      activePage: 'dashboard',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActivePage: (page) => set({ activePage: page })
    }),
    {
      name: 'apex-ai-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        selectedSymbol: state.selectedSymbol,
        selectedTimeframe: state.selectedTimeframe,
        tradingMode: state.tradingMode,
        activePage: state.activePage
      })
    }
  )
)
