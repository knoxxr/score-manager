
import { Exam, Student, ExamRecord } from '@prisma/client'

export type ProcessedReportData = {
    student: Student
    exam: Exam
    totalScore: number
    typeChartData: {
        labels: string[]
        scores: number[]
    }
    historyChartData: {
        labels: string[]
        scores: number[]
    }
    gradingData: {
        id: number
        type: string
        score: number
        answer: string
        studentAnswer: string
        isCorrect: boolean
        correctRate: number
    }[]
}

export function processExamReport(
    record: ExamRecord & { exam: Exam; student: Student },
    historyRecords: (ExamRecord & { exam: Exam })[],
    correctRates: Record<number, number> = {}
): ProcessedReportData {
    // Parse Data
    const questions = JSON.parse(record.exam.subjectInfo) as { id: number, type: string, score: number, answer: string }[]
    const studentAnswers = JSON.parse(record.studentAnswers) as Record<string, string>
    const typeScores = JSON.parse(record.typeScores) as Record<string, number>

    // Prepare Type Chart Data
    const types = Array.from(new Set(questions.map(q => q.type)))
    const typeChartData = {
        labels: types,
        scores: types.map(t => typeScores[t] || 0)
    }

    // Prepare History Chart Data
    const historyChartData = {
        labels: historyRecords.map(h => h.exam.name),
        scores: historyRecords.map(h => h.totalScore)
    }

    // Prepare Grading Table Data
    const gradingData = questions.map(q => {
        const studentAns = studentAnswers[q.id.toString()] || ''
        const isCorrect = studentAns.trim() === q.answer.trim()
        return {
            ...q,
            studentAnswer: studentAns,
            isCorrect,
            correctRate: correctRates[q.id] || 0
        }
    })

    return {
        student: record.student,
        exam: record.exam,
        totalScore: record.totalScore,
        typeChartData,
        historyChartData,
        gradingData
    }
}
