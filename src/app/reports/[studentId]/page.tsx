
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function StudentReportPage(props: { params: Promise<{ studentId: string }> }) {
    const params = await props.params
    const studentId = params.studentId

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
                            <div key={record.id} style={{
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
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
                                    <Link
                                        href={`/reports/${studentId}/${record.examId}`}
                                        style={{
                                            textDecoration: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '0.3rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            display: 'inline-block',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        리포트 보기
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
