'use server'

import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/security'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SessionUser } from '@/lib/definitions'

export async function signIn(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            teacher: {
                include: { assignments: true }
            }
        }
    })

    if (!user) {
        throw new Error('Invalid credentials')
    }

    const passwordsMatch = await comparePassword(password, user.password)

    if (!passwordsMatch) {
        throw new Error('Invalid credentials')
    }

    const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        role: user.role as 'ADMIN' | 'TEACHER',
        teacherId: user.teacherId || undefined,
        grade: user.teacher?.assignments[0]?.grade
    }

    await createSession(sessionUser)
    redirect('/dashboard')
}
