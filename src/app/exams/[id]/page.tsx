
import { getExam } from '@/app/actions/exams'
import { prisma } from '@/lib/prisma'
import { Exam, ExamRecord, Student } from '@prisma/client'
import ScoreInputGrid from '@/components/ScoreInputGrid'
import AnswerStatistics from '@/components/AnswerStatistics'
import Link from 'next/link'
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

    // Fetch exam records to populate initial state
    const records = await prisma.examRecord.findMany({
        where: { examId: exam.id },
        include: { student: true }
    })



    const initialAnswers: Record<string, Record<string, string>> = {}
    const initialVocabScores: Record<string, number> = {}

    records.forEach(record => {
        try {
            initialAnswers[record.studentId.toString()] = JSON.parse(record.studentAnswers)
        } catch (e) {
            initialAnswers[record.studentId.toString()] = {}
        }
        initialVocabScores[record.studentId.toString()] = record.vocabScore
    })

    return (
        <div style={{ maxWidth: '100%', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>{exam.name} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>({exam.date.toLocaleDateString('ko-KR')})</span></h2>
                <Link href="/exams" className="btn">목록으로</Link>
            </div>

            <ScoreInputGrid
                examId={exam.id}
                initialStudents={students.map(s => ({ ...s, id: s.id.toString() }))}
                questions={questions}
                initialAnswers={initialAnswers}
                initialVisibleStudentIds={students.map(s => s.id.toString())}
                defaultGrade={exam.grade}
                defaultClass={exam.class}
                examType={exam.type}
                initialVocabScores={initialVocabScores}
            />
        </div>
    )
}
