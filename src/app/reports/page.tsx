
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

    let detailedReports = []
    let students = [] // For backward compatibility / initial view

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

        // 3. For each student, we need history for the chart
        // This might be N+1, but for a single exam batch print it's acceptable or we can optimize
        for (const record of records) {
            const history = await prisma.examRecord.findMany({
                where: { studentId: record.studentId },
                include: { exam: true },
                orderBy: { exam: { date: 'asc' } }
            })

            detailedReports.push(processExamReport(record, history))
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

        students = allStudents.map(s => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            records: s.examRecords.map(r => ({
                examId: r.examId,
                examName: r.exam.name,
                date: r.exam.date,
                totalScore: r.totalScore
            }))
        }))
    }

    return (
        <div>
            <h1>성적 리포트</h1>
            <ReportPrinter
                exams={exams}
                selectedExamId={examId}
                detailedReports={detailedReports}
                students={students}
            />
        </div>
    )
}
