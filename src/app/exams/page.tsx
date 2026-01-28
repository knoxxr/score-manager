
import { getExams, deleteExam } from '@/app/actions/exams'
import { formatGrade } from '@/lib/grades'
import Link from 'next/link'
import DeleteExamButton from '@/components/DeleteExamButton'

export default async function ExamsPage() {
    const exams = await getExams()

    return (
        <div>
            <h1>시험 관리</h1>

            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1rem 0' }}>
                <Link href="/exams/new" className="btn btn-primary">
                    + 새 시험 생성
                </Link>
            </div>

            <div className="card">
                <h3>최근 시험 목록</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>시험 날짜</th>
                            <th>시험 이름</th>
                            <th>대상 학년</th>
                            <th>반</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((e) => (
                            <tr key={e.id}>
                                <td>{e.date.toLocaleDateString('ko-KR')}</td>
                                <td>
                                    <Link href={`/exams/${e.id}`} style={{ textDecoration: 'underline', color: 'var(--primary)' }}>
                                        {e.name}
                                    </Link>
                                    {e.type === 'VOCAB' && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            fontSize: '0.8rem',
                                            background: '#fef3c7',
                                            color: '#d97706',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '4px',
                                            fontWeight: 'bold'
                                        }}>
                                            어휘
                                        </span>
                                    )}
                                </td>
                                <td>{formatGrade(e.grade)}</td>
                                <td>{e.class}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/exams/${e.id}/edit`} className="btn" style={{ color: 'var(--primary)' }}>
                                            수정
                                        </Link>
                                        <DeleteExamButton id={e.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
