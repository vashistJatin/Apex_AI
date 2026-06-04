import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/middleware'

// POST /api/auth  body: { action: 'login'|'register'|'logout', email, password, username? }
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 10, 60000)
  if (limited) return limited

  const { action, email, password, username } = await req.json()
  const supabase = createAdminClient()

  try {
    if (action === 'register') {
      const { data, error } = await supabase.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { username: username || email.split('@')[0] }
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })

      // Create profile row
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        username: username || email.split('@')[0],
        default_mode: 'SIM'
      })

      // Sign in immediately after register
      const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) return NextResponse.json({ error: signInErr.message }, { status: 400 })

      return NextResponse.json({
        data: {
          user: { id: data.user.id, email, username },
          session: session.session
        }
      })
    }

    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return NextResponse.json({
        data: {
          user: { id: data.user.id, email: data.user.email, ...profile },
          session: data.session
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
