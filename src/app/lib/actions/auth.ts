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

import { deleteSession } from '../../../lib/session'
import { redirect } from 'next/navigation'

export async function logout() {
    await deleteSession()
    redirect('/')
}
