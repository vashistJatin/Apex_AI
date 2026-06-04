'use client'
import { useAppStore } from '@/store'
import { LiveDot } from '@/components/ui'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '⬡', label: 'Dashboard'    },
  { id: 'terminal',   icon: '◈', label: 'Trade Terminal'},
  { id: 'signals',    icon: '◎', label: 'AI Signals'   },
  { id: 'strategy',   icon: '⬟', label: 'Strategy Lab' },
  { id: 'portfolio',  icon: '◑', label: 'Portfolio'    },
  { id: 'backtest',   icon: '◷', label: 'Backtesting'  },
  { id: 'insights',   icon: '⊕', label: 'AI Insights'  },
]

const AGENTS = ['News AI', 'Technical AI', 'Risk AI', 'Entry AI']

export default function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-50 md:z-auto h-screen flex flex-col
        glass border-r border-border w-[220px] transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex-shrink-0">
          <div className="font-display text-[15px] font-black tracking-[0.12em] text-cyan">
            APEX<span className="text-slate-500 font-normal">AI</span>
          </div>
          <div className="text-[8px] text-slate-600 font-mono tracking-[0.18em] mt-0.5">
            TRADING INTELLIGENCE
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <div className="section-label px-2 mb-3">NAVIGATION</div>
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id
            return (
              <button key={item.id}
                onClick={() => { setActivePage(item.id); setSidebarOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-all duration-150 text-[12px] font-medium
                  ${isActive
                    ? 'bg-cyan-dim border border-cyan/30 text-cyan'
                    : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}>
                <span className="text-[14px] opacity-80">{item.icon}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-cyan animate-blink" />}
              </button>
            )
          })}
        </nav>

        {/* AI Agents status */}
        <div className="px-4 py-4 border-t border-border flex-shrink-0">
          <div className="section-label mb-3">AI AGENTS</div>
          <div className="flex flex-col gap-2">
            {AGENTS.map(a => (
              <div key={a} className="flex items-center gap-2">
                <LiveDot color="green" />
                <span className="text-[10px] text-slate-400">{a}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 px-2.5 py-2 rounded-lg bg-cyan-dim border border-cyan/20">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[9px] text-cyan">
              <span className="animate-blink">●</span>
              MASTER AI ACTIVE
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
