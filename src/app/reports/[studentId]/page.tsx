
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function StudentReportPage(props: { params: Promise<{ studentId: string }> }) {
    const params = await props.params
    const studentId = parseInt(params.studentId)

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            examRecords: {
                include: { exam: true },
                orderBy: { exam: { date: 'desc' } }
            }
        }
    })

    if (!student) return notFound()

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1>{student.name} 학생 리포트</h1>
                <p style={{ color: '#94a3b8' }}>학년: {student.grade} | 총 응시 횟수: {student.examRecords.length}회</p>
            </div>

            <div className="card">
                <h3>응시한 시험 목록</h3>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    {student.examRecords.length === 0 ? (
                        <p style={{ color: '#64748b' }}>응시한 시험이 없습니다.</p>
                    ) : (
                        student.examRecords.map(record => (
                            <Link
                                key={record.id}
                                href={`/reports/${studentId}/${record.examId}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--bg)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid var(--card-border)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{record.exam.name}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{record.exam.date.toLocaleDateString('ko-KR')}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>점수</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{record.totalScore}점</div>
                                        </div>
                                        <div style={{ fontSize: '1.5rem', color: '#64748b' }}>&rsaquo;</div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
