
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionUser } from '@/lib/definitions'
import { redirect } from 'next/navigation'

// IMPORTANT: Change this to a strong, random secret in production via environment variables!
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: JWT_SECRET is not set. Using a default insecure key. Security is compromised!');
}
const key = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key_change_me')

export async function encrypt(payload: SessionUser) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(key)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        })
        return payload as SessionUser
    } catch (error) {
        return null
    }
}


export async function createSession(user: SessionUser) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt(user)
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: false, // Set to false to support HTTP connections
        expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function updateSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    const payload = await decrypt(session)

    if (!payload) return

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    cookieStore.set('session', session!, {
        httpOnly: true,
        secure: false, // Set to false to support HTTP connections
        expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    return await decrypt(session)
}



