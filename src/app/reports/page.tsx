
import { prisma } from '@/lib/prisma'
import ReportPrinter from '@/components/ReportPrinter'
import { processExamReport } from '@/lib/report-utils'

export default async function ReportsPage(props: { searchParams: Promise<{ examId: string }> }) {
    const searchParams = await props.searchParams
    const examId = searchParams.examId ? parseInt(searchParams.examId) : undefined

    // 1. Fetch all exams for the selector
    const exams = await prisma.exam.findMany({
        orderBy: { date: 'desc' }
    })

    type ReportStudentData = {
        id: string
        name: string
        grade: number
        class: string
        schoolName?: string
        remarks?: string
        records: {
            examId: number
            examName: string
            date: Date
            totalScore: number
        }[]
    }

    let detailedReports = []
    let students: ReportStudentData[] = [] // For backward compatibility / initial view

    if (examId) {
        // 2. Fetch specific exam data with student records
        const records = await prisma.examRecord.findMany({
            where: { examId },
            include: {
                student: true,
                exam: true
            },
            orderBy: { student: { name: 'asc' } }
        })

        // 2.1 Calculate Correct Answer Rates
        // ... (Logic continues unchanged)

        const exam = records[0]?.exam
        let correctRates: Record<number, number> = {}

        if (exam) {
            const questions = JSON.parse(exam.subjectInfo) as { id: number, answer: string }[]
            const stats: Record<number, { correct: number, total: number }> = {}

            questions.forEach(q => {
                stats[q.id] = { correct: 0, total: 0 }
            })

            records.forEach(r => {
                try {
                    const answers = JSON.parse(r.studentAnswers) as Record<string, string>
                    questions.forEach(q => {
                        const studentAns = answers[q.id.toString()]
                        const isCorrect = studentAns && studentAns.trim() === q.answer.trim()

                        if (stats[q.id]) {
                            if (isCorrect) stats[q.id].correct++
                            stats[q.id].total++
                        }
                    })
                } catch (e) {
                    console.error("Failed to parse answers for rate calc", e)
                }
            })

            questions.forEach(q => {
                if (stats[q.id].total > 0) {
                    correctRates[q.id] = Math.round((stats[q.id].correct / stats[q.id].total) * 100)
                } else {
                    correctRates[q.id] = 0
                }
            })
        }

        // 3. For each student, we need history for the chart
        for (const record of records) {
            const history = await prisma.examRecord.findMany({
                where: { studentId: record.studentId },
                include: { exam: true },
                orderBy: { exam: { date: 'asc' } }
            })

            const reportData = processExamReport(record, history, correctRates)
            // Add remarks to the report data
            detailedReports.push({
                ...reportData,
                remarks: record.remarks || ''
            })
        }
    } else {
        // Fallback: Show all students (old behavior) or just empty
        // Keeping old behavior for "Student List" view
        const allStudents = await prisma.student.findMany({
            include: {
                examRecords: {
                    include: { exam: true },
                    orderBy: { exam: { date: 'asc' } }
                }
            },
            orderBy: { name: 'asc' }
        })

        students = allStudents.map(s => {
            // Get the most recent exam's remarks
            const mostRecentRecord = s.examRecords.length > 0
                ? s.examRecords[s.examRecords.length - 1]
                : null

            return {
                id: s.id,
                name: s.name,
                grade: s.grade,
                class: s.class,
                schoolName: s.schoolName || undefined,
                remarks: mostRecentRecord?.remarks || '',
                records: s.examRecords.map(r => ({
                    examId: r.examId,
                    examName: r.exam.name,
                    date: r.exam.date,
                    totalScore: r.totalScore
                }))
            }
        })
    }

    return (
        <div>
            <h1 className="no-print">성적 리포트</h1>
            <ReportPrinter
                exams={exams}
                selectedExamId={examId}
                detailedReports={detailedReports}
                students={students}
            />
        </div>
    )
}
