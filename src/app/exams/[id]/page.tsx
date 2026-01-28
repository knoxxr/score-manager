
import { getExam } from '@/app/actions/exams'
import { prisma } from '@/lib/prisma'
import ScoreInputGrid from '@/components/ScoreInputGrid'
import AnswerStatistics from '@/components/AnswerStatistics'
import { notFound } from 'next/navigation'

export default async function ExamDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const id = parseInt(params.id)
    const exam = await getExam(id)

    if (!exam) return notFound()

    // Get all students to allow flexible adding by Grade/Class
    const students = await prisma.student.findMany({
        orderBy: { name: 'asc' }
    })

    // Parse subject info
    let questions = []
    try {
        questions = JSON.parse(exam.subjectInfo)
    } catch (e) {
        questions = []
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>{exam.name}</h1>
                    <a href={`/exams/${exam.id}/edit`} className="btn" style={{ background: '#334155', color: 'white' }}>
                        수정
                    </a>
                </div>
                <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8' }}>
                    <span>학년: {exam.grade}</span>
                    <p style={{ color: '#94a3b8' }}>날짜: {new Date(exam.date).toLocaleDateString('ko-KR')} | 대상: {exam.grade}학년</p>
                    <span>문항 수: {questions.length}</span>
                </div>
            </div>

            <AnswerStatistics
                questions={questions}
                records={exam.records}
            />

            <ScoreInputGrid
                examId={exam.id}
                students={students}
                questions={questions}
                records={exam.records}
            />
        </div>
    )
}
