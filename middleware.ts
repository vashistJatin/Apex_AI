import { NextRequest, NextResponse } from 'next/server'

// Pages that require authentication (enforced server-side for direct URL access)
// The client-side store handles the SPA routing
const PROTECTED_API_ROUTES = ['/api/trades', '/api/portfolio']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect API routes that need auth
  if (PROTECTED_API_ROUTES.some(r => pathname.startsWith(r))) {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
  }

  // Security headers on all responses
  const res = NextResponse.next()
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
