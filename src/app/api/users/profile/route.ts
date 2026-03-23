import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { firstName, lastName, username, role, isVerifiedRecruiter, companyName, designation, employmentStatus, skills } = body

  console.log('[USER_PROFILE] Modifying:', { email: session.user.email, role, username })

  try {
    const name = `${firstName} ${lastName}`.trim()
    
    // Check username collision
    if (username) {
        const taken = await prisma.user.findUnique({ where: { username } })
        if (taken && taken.email !== session.user.email) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Update User
        const user = await tx.user.update({
            where: { email: session.user.email },
            data: {
                name,
                username,
                role,
                designation,
                companyName,
                onboarded: true, // Marking as onboarded now since we collected everything in sign-up
            }
        })

        // 2. If Candidate, upsert Profile
        if (role === 'candidate') {
            await tx.candidateProfile.upsert({
                where: { userId: user.id },
                update: {
                    designation,
                    employmentStatus: employmentStatus || 'OPEN_TO_WORK',
                    skills: skills || []
                },
                create: {
                    userId: user.id,
                    designation,
                    employmentStatus: employmentStatus || 'OPEN_TO_WORK',
                    skills: skills || []
                }
            })
        }

        return user
    })

    console.log('[USER_PROFILE] Success:', result.email)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[USER_PROFILE] CRITICAL ERROR:', error)
    return NextResponse.json({ 
        error: 'Failed to save profile', 
        details: error?.message || String(error)
    }, { status: 500 })
  }
}
