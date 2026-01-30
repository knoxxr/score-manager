
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import DetailedReportCard from '@/components/DetailedReportCard'
import { processExamReport } from '@/lib/report-utils'

export default async function ExamReportDetailPage(props: { params: Promise<{ studentId: string, examId: string }> }) {
    const params = await props.params
    const studentId = params.studentId
    const examId = parseInt(params.examId)

    // 1. Fetch current exam record
    const record = await prisma.examRecord.findUnique({
        where: {
            examId_studentId: {
                examId,
                studentId
            }
        },
        include: {
            exam: true,
            student: true
        }
    })

    if (!record) return notFound()

    // 2. Fetch history for performance chart
    const history = await prisma.examRecord.findMany({
        where: { studentId },
        include: { exam: true },
        orderBy: { exam: { date: 'asc' } }
    })

    const processedData = processExamReport(record, history)

    return (
        <div>
            <DetailedReportCard data={processedData} />
        </div>
    )
}
