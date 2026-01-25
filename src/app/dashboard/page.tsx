
import Link from 'next/link'
import { getSession } from '@/lib/session'

export default async function DashboardPage() {
    const session = await getSession()

    return (
        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                학생 성적 관리 시스템
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '3rem' }}>
                환영합니다, {session?.username} ({session?.role === 'ADMIN' ? '관리자' : `${session?.grade}학년 담임`})님.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                {session?.role === 'ADMIN' && (
                    <Link href="/teachers" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                        <h3 style={{ color: 'var(--primary)' }}>선생님 관리</h3>
                        <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>선생님 등록 및 담당 학년 배정</p>
                    </Link>
                )}

                <Link href="/students" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                    <h3 style={{ color: 'var(--success)' }}>학생 관리</h3>
                    <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>학생 등록 및 분반 관리</p>
                </Link>

                <Link href="/exams" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                    <h3 style={{ color: '#f59e0b' }}>시험 관리</h3>
                    <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>시험 생성 및 성적 입력</p>
                </Link>

                <Link href="/reports" className="card" style={{ textDecoration: 'none', transition: 'transform 0.2s' }}>
                    <h3 style={{ color: '#ec4899' }}>성적 리포트</h3>
                    <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>성적 분석 및 리포트 출력</p>
                </Link>
            </div>
        </div>
    )
}
