
import { Exam, Student, ExamRecord } from '@prisma/client'
import { DEFAULT_GRADE_CUTOFFS } from '@/lib/grades'

export type ProcessedReportData = {
    student: {
        id: string
        name: string
        grade: number
        class: string
        phoneNumber: string
        teacherId: number | null
        schoolName: string | null
    }
    examName: string
    examDate: Date
    examType?: string
    isAdmission?: boolean
    totalScore: number
    maxTotalScore: number
    correctCount: number
    totalQuestionCount: number
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
    studentGrade: number | null
    gradeCutoffs: Record<string, number>
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
    const gradeCutoffsRaw = (record.exam as any).gradeCutoffs ? JSON.parse((record.exam as any).gradeCutoffs) : {}

    // Use fallback if empty
    const gradeCutoffs = Object.keys(gradeCutoffsRaw).length > 0 ? gradeCutoffsRaw : DEFAULT_GRADE_CUTOFFS

    // Calculate Grade
    let studentGrade: number | null = null
    if (Object.keys(gradeCutoffs).length > 0) {
        // Find best grade (lowest number) where totalScore >= cutoff
        // Assuming Grade 1 is highest, Grade 9 is lowest
        for (let g = 1; g <= 9; g++) {
            const cutoff = gradeCutoffs[g.toString()]
            if (cutoff !== undefined && record.totalScore >= cutoff) {
                studentGrade = g
                break
            }
        }
        // If score is lower than Grade 9 cutoff (0), theoretically still Grade 9
        if (studentGrade === null) studentGrade = 9
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

    // Calculate Type Scores Dynamically
    const obtainedTypeScores: Record<string, number> = {}
    gradingData.forEach(q => {
        if (q.isCorrect) {
            obtainedTypeScores[q.type] = (obtainedTypeScores[q.type] || 0) + q.score
        }
    })

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
            const obtained = obtainedTypeScores[t] || 0
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

    // Calculate max total score
    const maxTotalScore = questions.reduce((sum, q) => sum + q.score, 0)
    const totalQuestionCount = questions.length
    const correctCount = gradingData.filter(q => q.isCorrect).length

    return {
        student: {
            id: record.student.id,
            name: record.student.name,
            grade: record.student.grade,
            class: record.student.class,
            phoneNumber: record.student.phoneNumber,
            teacherId: record.student.teacherId,
            schoolName: record.student.schoolName
        },
        examName: record.exam.name,
        examDate: record.exam.date,
        examType: record.exam.type,
        isAdmission: (record.exam as any).isAdmission,
        totalScore: record.totalScore,
        maxTotalScore,
        correctCount,
        totalQuestionCount,
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
        gradingData,
        studentGrade,
        gradeCutoffs
    }
}
