import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/api/auth', '/api/leaderboard']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isPublic) return NextResponse.next()

  // Better Auth stores session in a cookie; validate via the session API
  try {
    const res = await fetch(new URL('/api/auth/get-session', request.nextUrl.origin), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
    const session = await res.json()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
