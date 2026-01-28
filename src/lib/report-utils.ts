
import { Exam, Student, ExamRecord } from '@prisma/client'

export type ProcessedReportData = {
    student: {
        id: number
        name: string
        grade: number
        class: string
        phoneNumber: string
        teacherId: number | null
    }
    examName: string
    examDate: Date
    examType?: string
    totalScore: number
    vocabScore?: number
    averageScore: number
    highestScore: number
    rank: number
    totalStudents: number
    typeScores: Record<string, number>
    typeAverages: Record<string, number>
    typeChartData: {
        labels: string[]
        scores: number[]
    }
    historyChartData: {
        labels: string[]
        scores: number[]
        averages: number[]
    }
    weaknessAnalysis: string[]
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

    // Calculate total possible score for each type
    const maxTypeScores: Record<string, number> = {}
    questions.forEach(q => {
        maxTypeScores[q.type] = (maxTypeScores[q.type] || 0) + q.score
    })

    const typeChartData = {
        labels: types,
        scores: types.map(t => {
            const obtained = typeScores[t] || 0
            const max = maxTypeScores[t] || 0
            if (max === 0) return 0
            return Math.round((obtained / max) * 100)
        })
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
        student: {
            id: record.student.id,
            name: record.student.name,
            grade: record.student.grade,
            class: record.student.class,
            phoneNumber: record.student.phoneNumber,
            teacherId: record.student.teacherId
        },
        examName: record.exam.name,
        examDate: record.exam.date,
        examType: record.exam.type,
        totalScore: record.totalScore,
        vocabScore: record.vocabScore,
        averageScore: 0, // Placeholder, usually requires full exam stats
        highestScore: 0, // Placeholder
        rank: 0, // Placeholder
        totalStudents: 0, // Placeholder
        typeScores,
        typeAverages: {}, // Placeholder
        typeChartData,
        historyChartData: {
            labels: historyChartData.labels,
            scores: historyChartData.scores,
            averages: historyChartData.scores.map(() => 0) // Placeholder
        },
        weaknessAnalysis: [],
        gradingData
    }
}
