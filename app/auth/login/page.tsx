'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'

export default function LoginPage() {
  const { setUser, setActivePage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Login failed')
      setUser(json.data.user, json.data.session?.access_token)
      setActivePage('dashboard')
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleDemo = () => {
    setUser({ id: 'demo', email: 'demo@apexai.io', username: 'DemoTrader', defaultMode: 'SIM', createdAt: new Date().toISOString() }, 'demo-token')
    setActivePage('dashboard')
  }

  return (
    <div className="min-h-screen bg-bg-0 grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display font-black text-[28px] tracking-widest text-cyan mb-1">APEX<span className="text-slate-500 font-normal">AI</span></div>
          <div className="text-[10px] font-mono text-slate-600 tracking-widest">INSTITUTIONAL TRADING INTELLIGENCE</div>
        </div>

        <div className="glass rounded-2xl border border-border p-6">
          <div className="text-[16px] font-bold mb-1">Sign In</div>
          <div className="text-[12px] text-slate-500 mb-6">Access your trading dashboard</div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required className="input-field" />
            </div>

            {error && <div className="text-[11px] text-red bg-red-dim border border-red/20 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary justify-center py-3 text-[13px] font-bold disabled:opacity-50">
              {loading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-slate-600">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleDemo}
            className="w-full py-3 glass rounded-xl border border-cyan/20 text-[12px] font-semibold text-cyan hover:border-cyan/40 transition-all">
            ◈ Continue as Demo User
          </button>

          <div className="text-center mt-4 text-[11px] text-slate-600">
            No account?{' '}
            <button onClick={() => setActivePage('register')} className="text-cyan hover:underline">Create one free</button>
          </div>
        </div>
      </div>
    </div>
  )
}
