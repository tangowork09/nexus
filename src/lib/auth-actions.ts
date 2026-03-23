'use server'

import { prisma } from '@/lib/prisma'

export async function checkUserEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { role: true }
        })
        return { exists: !!user, role: user?.role }
    } catch (e) {
        return { exists: false, error: 'Database check failed' }
    }
}
