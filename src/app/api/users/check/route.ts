import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    console.log('[USER_CHECK] Checking email...')
    try {
        const body = await req.json().catch(() => ({}))
        const { email } = body
        if (!email) return NextResponse.json({ exists: false })

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true }
        })
        
        console.log('[USER_CHECK] Result:', user ? 'Exists' : 'Not found')
        return NextResponse.json({ 
            exists: !!user, 
            role: user?.role || '' 
        })
    } catch (e: any) {
        console.error('[USER_CHECK] ERROR:', e)
        return NextResponse.json({ 
            error: 'Failed to check user', 
            details: e?.message || String(e) 
        }, { status: 500 })
    }
}
