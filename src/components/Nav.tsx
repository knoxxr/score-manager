
import Link from 'next/link'
import styles from './Nav.module.css'
import { getSession } from '@/lib/session'
import { logout } from '@/app/lib/actions/auth'

export default async function Nav() {
    const session = await getSession()
    if (!session) return null

    return (
        <nav className={styles.nav}>
            <div className={styles.logo}>
                <Link href="/dashboard">ScoreManager</Link>
                <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: '#94a3b8' }}>
                    {session.username} ({session.role})
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ul className={styles.links}>
                    <li><Link href="/dashboard">대시보드</Link></li>
                    <li><Link href="/students">학생 관리</Link></li>
                    {session.role === 'ADMIN' && <li><Link href="/teachers">선생님 관리</Link></li>}
                    <li><Link href="/exams">시험 관리</Link></li>
                    <li><Link href="/reports">리포트</Link></li>
                </ul>
                <form action={logout}>
                    <button type="submit" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#334155' }}>
                        로그아웃
                    </button>
                </form>
            </div>
        </nav>
    )
}
