import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // TODO: fetch user profile from DB
  return Response.json({ user: session.user })
}
