
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/dashboard', '/teachers', '/students', '/exams', '/reports', '/classes']
const publicRoutes = ['/']

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
    const isPublicRoute = publicRoutes.includes(path)

    const cookie = req.cookies.get('session')?.value
    const session = await decrypt(cookie)

    // For debugging: console.log(`Middleware: path=${path}, isProtected=${isProtectedRoute}, hasSession=${!!session}`)

    if (isProtectedRoute && !session) {
        // If it's a protected route and no session, redirect to login
        return NextResponse.redirect(new URL('/', req.nextUrl))
    }

    if (isPublicRoute && session && path === '/') {
        // If at login page but already has session, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
