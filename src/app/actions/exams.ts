'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getExams() {
    return await prisma.exam.findMany({
        orderBy: { date: 'desc' }
    })
}

export async function getExam(id: number) {
    return await prisma.exam.findUnique({
        where: { id },
        include: {
            records: { include: { student: true } }
        }
    })
}

export async function createExam(formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const className = '전체' // Default to 'All' as class info is removed
    const date = new Date(formData.get('date') as string)
    const subjectInfo = formData.get('subjectInfo') as string // JSON string
    const isAdmission = formData.get('isAdmission') === 'on'
    const type = 'NORMAL' // Default type, can be extended if needed
    const gradeCutoffs = formData.get('gradeCutoffs') as string || '{}'

    if (!name || isNaN(grade) || !subjectInfo) {
        throw new Error('Invalid input')
    }

    await prisma.exam.create({
        data: {
            name,
            grade,
            class: className,
            date,
            subjectInfo,
            type,
            isAdmission,
            gradeCutoffs
        }
    })

    revalidatePath('/exams')
    redirect('/exams?success=created')
}

export async function updateExam(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const className = '전체' // Default to 'All'
    const date = new Date(formData.get('date') as string)
    const subjectInfo = formData.get('subjectInfo') as string // JSON string
    const isAdmission = formData.get('isAdmission') === 'on'
    const type = 'NORMAL'
    const gradeCutoffs = formData.get('gradeCutoffs') as string || '{}'

    if (!name || isNaN(grade) || !subjectInfo) {
        throw new Error('Invalid input')
    }

    await prisma.exam.update({
        where: { id },
        data: {
            name,
            grade,
            class: className,
            date,
            subjectInfo,
            type,
            isAdmission,
            gradeCutoffs
        }
    })

    revalidatePath(`/exams/${id}`)
    revalidatePath('/exams')
    redirect(`/exams/${id}`)
}

export async function deleteExam(id: number) {
    await prisma.exam.delete({ where: { id } })
    revalidatePath('/exams')
}

export async function saveExamRecords(examId: number, submissions: { studentId: string | number, answers: Record<string, string>, vocabScore: number, remarks?: string }[]) {
    // 1. Fetch Exam to get Subject Info (Correct Answers)
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) throw new Error('Exam not found')

    const questions = JSON.parse(exam.subjectInfo) as { id: number, type: string, score: number, answer: string }[]

    // 2. Process each submission
    for (const sub of submissions) {
        let totalScore = 0
        const typeScores: Record<string, number> = {}

        // Initialize type scores
        questions.forEach(q => {
            if (!typeScores[q.type]) typeScores[q.type] = 0
        })

        // Calculate
        questions.forEach(q => {
            const studentAnswer = sub.answers[q.id.toString()]
            if (studentAnswer && studentAnswer.trim() === q.answer.trim()) {
                totalScore += q.score
                typeScores[q.type] += q.score
            }
        })

        if (sub.vocabScore) {
            totalScore += sub.vocabScore
        }

        // 3. Upsert Record
        const sidStr = sub.studentId.toString()

        const existing = await prisma.examRecord.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId: sidStr
                }
            }
        })

        const updateData = {
            studentAnswers: JSON.stringify(sub.answers),
            totalScore,
            vocabScore: sub.vocabScore || 0,
            typeScores: JSON.stringify(typeScores),
            remarks: sub.remarks || ''
        }

        const createData = {
            examId,
            studentId: sidStr,
            ...updateData
        }

        if (existing) {
            await prisma.examRecord.update({
                where: { id: existing.id },
                data: updateData
            })
        } else {
            await prisma.examRecord.create({
                data: createData
            })
        }
    }

    revalidatePath(`/exams/${examId}`)
}

export async function deleteExamRecord(examId: number, studentId: string) {
    await prisma.examRecord.deleteMany({
        where: {
            examId,
            studentId
        }
    })
    revalidatePath(`/exams/${examId}`)
}

export async function deleteExamRecords(examId: number, studentIds: string[]) {
    await prisma.examRecord.deleteMany({
        where: {
            examId,
            studentId: { in: studentIds }
        }
    })
    revalidatePath(`/exams/${examId}`)
}
