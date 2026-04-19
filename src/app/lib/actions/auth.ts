'use server'

import { signIn } from '../../../lib/auth'

// Wrapper for useFormState
export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn(formData)
    } catch (error) {
        if ((error as Error).message.includes('NEXT_REDIRECT')) {
            throw error // Let Next.js handle redirect
        }
        return '로그인 정보가 올바르지 않습니다.'
    }
}

import { deleteSession, getSession } from '../../../lib/session'
import { redirect } from 'next/navigation'

export async function logout() {
    await deleteSession()
    redirect('/')
}

import { prisma } from '@/lib/prisma'
import { hashPassword, comparePassword } from '@/lib/security'

export async function changePassword(formData: FormData) {
    const session = await getSession()
    if (!session) {
        return { success: false, message: '로그인이 필요합니다.' }
    }

    const oldPassword = formData.get('oldPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!oldPassword || !newPassword || !confirmPassword) {
        return { success: false, message: '모든 필드를 입력해주세요.' }
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: '새 비밀번호가 일치하지 않습니다.' }
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) return { success: false, message: '사용자를 찾을 수 없습니다.' }

    const passwordsMatch = await comparePassword(oldPassword, user.password)
    if (!passwordsMatch) {
        return { success: false, message: '현재 비밀번호가 틀립니다.' }
    }

    const newHashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
        where: { id: session.id },
        data: { password: newHashedPassword }
    })

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' }
}
