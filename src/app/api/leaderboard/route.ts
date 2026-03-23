import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  // TODO: fetch top candidates ranked by XP
  return Response.json({ leaderboard: [] })
}
