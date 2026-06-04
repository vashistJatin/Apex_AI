'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store'

// Layout
import Sidebar from '@/components/layout/Sidebar'
import { Header, TickerBar } from '@/components/layout/Header'

// Pages
import LandingPage    from '@/app/landing/page'
import DashboardPage  from '@/app/dashboard/page'
import TerminalPage   from '@/app/terminal/page'
import SignalsPage    from '@/app/signals/page'
import StrategyPage   from '@/app/strategy/page'
import PortfolioPage  from '@/app/portfolio/page'
import BacktestPage   from '@/app/backtest/page'
import InsightsPage   from '@/app/insights/page'
import SettingsPage   from '@/app/settings/page'
import LoginPage      from '@/app/auth/login/page'
import RegisterPage   from '@/app/auth/register/page'

// Pages that use the full dashboard shell
const SHELL_PAGES = ['dashboard','terminal','signals','strategy','portfolio','backtest','insights','settings']

// NAV label map (also used in sidebar)
const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', terminal: 'Trade Terminal', signals: 'AI Signals',
  strategy: 'Strategy Lab', portfolio: 'Portfolio Analytics', backtest: 'Backtesting Engine',
  insights: 'AI Insights', settings: 'Settings'
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-0">
      <TickerBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />
    case 'terminal':  return <TerminalPage />
    case 'signals':   return <SignalsPage />
    case 'strategy':  return <StrategyPage />
    case 'portfolio': return <PortfolioPage />
    case 'backtest':  return <BacktestPage />
    case 'insights':  return <InsightsPage />
    case 'settings':  return <SettingsPage />
    default:          return <DashboardPage />
  }
}

export default function RootPage() {
  const { activePage, setActivePage } = useAppStore()

  // Handle direct URL-like navigation
  useEffect(() => {
    // If no saved page, show landing
    if (!activePage) setActivePage('landing')
  }, [])

  // Full-screen pages (no shell)
  if (activePage === 'landing' || !activePage) return <LandingPage />
  if (activePage === 'login')    return <LoginPage />
  if (activePage === 'register') return <RegisterPage />

  // Dashboard shell pages
  if (SHELL_PAGES.includes(activePage)) {
    return (
      <AppShell>
        <PageContent page={activePage} />
      </AppShell>
    )
  }

  // Fallback to dashboard
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}
