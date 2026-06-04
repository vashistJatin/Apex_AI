import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (use Upstash Redis for production scale)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(req: NextRequest, maxRequests = 60, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const key = `${ip}:${req.nextUrl.pathname}`
  const record = requestCounts.get(key)

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (record.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((record.resetAt - now) / 1000)) } }
    )
  }

  record.count++
  return null
}

// Auth middleware helper
export async function requireAuth(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = auth.slice(7)
  try {
    const { createAdminClient } = await import('./supabase')
    const supabase = createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    return { userId: user.id }
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 })
  }
}
