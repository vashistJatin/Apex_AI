'use client'
import { useState } from 'react'
import { Badge, Toggle } from '@/components/ui'
import { useAppStore } from '@/store'

export default function SettingsPage() {
  const { user, tradingMode, setTradingMode } = useAppStore()
  const [binanceKey, setBinanceKey] = useState('')
  const [binanceSecret, setBinanceSecret] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [notifications, setNotifications] = useState({
    signals: true, tradeExecuted: true, stopLoss: true, trendReversal: false, aiConfidence: true
  })
  const [saved, setSaved] = useState<string | null>(null)

  const handleSave = (section: string) => {
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border section-label">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  )

  const InputRow = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div className="mb-4 last:mb-0">
      <label className="text-[11px] text-slate-400 block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Account */}
      <Section title="ACCOUNT">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#38bdf8,#a78bfa)' }}>
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="font-semibold text-slate-100">{user?.username || 'Demo User'}</div>
            <div className="text-[12px] text-slate-500">{user?.email || 'demo@apexai.io'}</div>
            <Badge color="cyan" small>FREE PLAN</Badge>
          </div>
        </div>
        <InputRow label="Username" value={user?.username || 'demo'} onChange={() => {}} />
        <InputRow label="Email" value={user?.email || 'demo@apexai.io'} onChange={() => {}} type="email" />
        <button onClick={() => handleSave('account')}
          className={`btn-primary text-[12px] ${saved === 'account' ? '!bg-green-dim !text-green border border-green/30' : ''}`}>
          {saved === 'account' ? '✓ Saved' : 'Save Account'}
        </button>
      </Section>

      {/* Trading Mode */}
      <Section title="TRADING MODE">
        <div className="flex gap-3 mb-4">
          {(['SIM', 'LIVE'] as const).map(mode => (
            <button key={mode} onClick={() => setTradingMode(mode)}
              className={`flex-1 py-3 rounded-xl text-[12px] font-bold font-mono transition-all border ${
                tradingMode === mode
                  ? mode === 'LIVE'
                    ? 'bg-red-dim border-red/30 text-red'
                    : 'bg-cyan-dim border-cyan/30 text-cyan'
                  : 'border-border text-slate-500 hover:text-slate-300'
              }`}>
              {mode === 'LIVE' ? '🔴 LIVE TRADING' : '◈ SIMULATION'}
            </button>
          ))}
        </div>
        {tradingMode === 'LIVE' && (
          <div className="px-3 py-2.5 bg-red-dim border border-red/20 rounded-lg text-[11px] text-red">
            ⚠️ Live mode executes real trades with real money. Ensure your risk settings are configured correctly.
          </div>
        )}
        {tradingMode === 'SIM' && (
          <div className="px-3 py-2.5 bg-cyan-dim border border-cyan/20 rounded-lg text-[11px] text-cyan">
            ◈ Simulation mode — all trades are paper trades. No real money at risk.
          </div>
        )}
      </Section>

      {/* Binance API */}
      <Section title="BINANCE API KEYS">
        <div className="px-3 py-2.5 bg-amber-dim border border-amber/20 rounded-lg text-[11px] text-amber mb-4">
          🔒 Keys are encrypted with AES-256 before storage. Never share your secret key.
          Use <strong>Read Only</strong> + <strong>Spot trading</strong> permissions only.
        </div>
        <InputRow label="API Key" value={binanceKey} onChange={setBinanceKey}
          placeholder="Paste your Binance API key here" type="password" />
        <InputRow label="Secret Key" value={binanceSecret} onChange={setBinanceSecret}
          placeholder="Paste your Binance secret key here" type="password" />
        <div className="flex gap-3 mt-4">
          <button onClick={() => handleSave('binance')}
            className={`btn-primary text-[12px] ${saved === 'binance' ? '!bg-green-dim !text-green border border-green/30' : ''}`}>
            {saved === 'binance' ? '✓ Keys Saved' : 'Save Keys'}
          </button>
          <button className="px-4 py-2 glass rounded-lg border border-border text-slate-400 hover:text-slate-200 text-[12px] transition-all">
            Test Connection
          </button>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="TELEGRAM ALERTS">
        <div className="text-[11px] text-slate-500 mb-4 leading-relaxed">
          1. Open Telegram → search <span className="text-cyan font-mono">@BotFather</span> → <span className="font-mono">/newbot</span><br/>
          2. Get your Chat ID by messaging <span className="text-cyan font-mono">@userinfobot</span>
        </div>
        <InputRow label="Telegram Chat ID" value={telegramId} onChange={setTelegramId}
          placeholder="e.g. 123456789" />
        <div className="flex gap-3 mt-4">
          <button onClick={() => handleSave('telegram')}
            className={`btn-primary text-[12px] ${saved === 'telegram' ? '!bg-green-dim !text-green border border-green/30' : ''}`}>
            {saved === 'telegram' ? '✓ Saved' : 'Save Telegram'}
          </button>
          <button className="px-4 py-2 glass rounded-lg border border-border text-slate-400 hover:text-slate-200 text-[12px] transition-all">
            Send Test Message
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="NOTIFICATION PREFERENCES">
        <div className="flex flex-col gap-4">
          {[
            { key: 'signals',       label: 'New AI Signals',         desc: 'When a new BUY/SELL signal is generated' },
            { key: 'tradeExecuted', label: 'Trade Executed',          desc: 'When a trade is filled or cancelled'      },
            { key: 'stopLoss',      label: 'Stop Loss Triggered',     desc: 'When your stop loss is hit'               },
            { key: 'trendReversal', label: 'Trend Reversals',         desc: 'Major market structure changes'           },
            { key: 'aiConfidence',  label: 'AI Confidence Changes',   desc: 'When signal confidence shifts ±15%'       },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-slate-200">{label}</div>
                <div className="text-[10px] text-slate-600">{desc}</div>
              </div>
              <Toggle on={notifications[key as keyof typeof notifications]}
                onChange={v => setNotifications(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>
        <button onClick={() => handleSave('notif')} className={`mt-4 btn-primary text-[12px] ${saved === 'notif' ? '!bg-green-dim !text-green border border-green/30' : ''}`}>
          {saved === 'notif' ? '✓ Saved' : 'Save Preferences'}
        </button>
      </Section>

      {/* Danger zone */}
      <div className="glass rounded-xl border border-red/20 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-red/20 text-[10px] font-mono tracking-widest text-red">DANGER ZONE</div>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-slate-200">Close All Positions</div>
              <div className="text-[10px] text-slate-600">Immediately close all open trades at market price</div>
            </div>
            <button className="px-4 py-2 bg-red-dim border border-red/30 text-red text-[11px] font-bold rounded-lg hover:bg-red/20 transition-all">
              Close All
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-slate-200">Reset Trading Data</div>
              <div className="text-[10px] text-slate-600">Delete all simulation trades and reset portfolio</div>
            </div>
            <button className="px-4 py-2 bg-red-dim border border-red/30 text-red text-[11px] font-bold rounded-lg hover:bg-red/20 transition-all">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
