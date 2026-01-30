
import { getExams, deleteExam } from '@/app/actions/exams'
import { formatGrade } from '@/lib/grades'
import { formatMonthWeek } from '@/lib/date-utils'
import Link from 'next/link'
import DeleteExamButton from '@/components/DeleteExamButton'
import ExamSearch from '@/components/ExamSearch'
import SuccessMessage from '@/components/SuccessMessage'
import ExamList from '@/components/ExamList'

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
                <ExamList exams={exams} />
            </div>
        </div>
    )
}
