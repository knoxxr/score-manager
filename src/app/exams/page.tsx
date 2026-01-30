
import { getExams, deleteExam } from '@/app/actions/exams'
import { formatGrade } from '@/lib/grades'
import { formatMonthWeek } from '@/lib/date-utils'
import Link from 'next/link'
import DeleteExamButton from '@/components/DeleteExamButton'
import ExamSearch from '@/components/ExamSearch'
import SuccessMessage from '@/components/SuccessMessage'

export default async function ExamsPage(props: { searchParams: Promise<{ query?: string, grade?: string, success?: string }> }) {
    const searchParams = await props.searchParams
    const allExams = await getExams()

    // Filter exams based on search criteria
    let exams = allExams

    if (searchParams.query) {
        const query = searchParams.query.toLowerCase()
        exams = exams.filter(e => e.name.toLowerCase().includes(query))
    }

    if (searchParams.grade) {
        const grade = parseInt(searchParams.grade)
        exams = exams.filter(e => e.grade === grade)
    }

    return (
        <div>
            <h1>시험 관리</h1>

            <ExamSearch />

            {searchParams.success === 'created' && (
                <SuccessMessage message="시험이 생성되었습니다" />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                <div style={{ color: '#64748b' }}>
                    {searchParams.query || searchParams.grade ? (
                        <span>검색 결과: {exams.length}개 / 전체 {allExams.length}개</span>
                    ) : (
                        <span>전체 {exams.length}개</span>
                    )}
                </div>
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
                            <th>주차</th>
                            <th>시험 이름</th>
                            <th>대상 학년</th>
                            <th>반</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    {searchParams.query || searchParams.grade ? '검색 결과가 없습니다.' : '시험이 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            exams.map((e) => (
                                <tr key={e.id}>
                                    <td>{e.date.toLocaleDateString('ko-KR')}</td>
                                    <td>{formatMonthWeek(e.date)}</td>
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
