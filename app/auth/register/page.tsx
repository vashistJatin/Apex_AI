'use client'
import { useState } from 'react'
import { useAppStore } from '@/store'

export default function RegisterPage() {
  const { setUser, setActivePage } = useAppStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, username })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      setUser(json.data.user, json.data.session?.access_token)
      setActivePage('dashboard')
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-0 grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display font-black text-[28px] tracking-widest text-cyan mb-1">APEX<span className="text-slate-500 font-normal">AI</span></div>
          <div className="text-[10px] font-mono text-slate-600 tracking-widest">CREATE FREE ACCOUNT</div>
        </div>

        <div className="glass rounded-2xl border border-border p-6">
          <div className="text-[16px] font-bold mb-1">Create Account</div>
          <div className="text-[12px] text-slate-500 mb-6">Free forever. No credit card required.</div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="TradingPro" required className="input-field" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters" required className="input-field" />
            </div>

            {error && <div className="text-[11px] text-red bg-red-dim border border-red/20 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary justify-center py-3 text-[13px] font-bold disabled:opacity-50">
              {loading ? '⏳ Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-4 text-[11px] text-slate-600">
            Already have an account?{' '}
            <button onClick={() => setActivePage('login')} className="text-cyan hover:underline">Sign in</button>
          </div>
        </div>
      </div>
    </div>
  )
}
