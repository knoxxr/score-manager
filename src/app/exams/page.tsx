
import { getExams, deleteExam } from '@/app/actions/exams'
import { formatGrade } from '@/lib/grades'
import ExamForm from '@/components/ExamForm'
import Link from 'next/link'

export default async function ExamsPage() {
    const exams = await getExams()

    return (
        <div>
            <h1>시험 관리</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
                <div>
                    <ExamForm />
                </div>

                <div>
                    <div className="card">
                        <h3>최근 시험 목록</h3>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>시험 날짜</th>
                                    <th>시험 이름</th>
                                    <th>대상 학년</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map((e) => (
                                    <tr key={e.id}>
                                        <td>{e.date.toLocaleDateString('ko-KR')}</td>
                                        <td><Link href={`/exams/${e.id}`} style={{ textDecoration: 'underline', color: 'var(--primary)' }}>{e.name}</Link></td>
                                        <td>{formatGrade(e.grade)}</td>
                                        <td>
                                            <form action={deleteExam.bind(null, e.id)}>
                                                <button type="submit" className="btn" style={{ color: 'var(--error)' }}>삭제</button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
