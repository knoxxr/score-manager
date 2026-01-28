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
    const className = formData.get('class') as string
    const date = new Date(formData.get('date') as string)
    const subjectInfo = formData.get('subjectInfo') as string // JSON string

    if (!name || isNaN(grade) || !subjectInfo) {
        throw new Error('Invalid input')
    }

    await prisma.exam.create({
        data: {
            name,
            grade,
            class: className || '대시',
            date,
            subjectInfo
        }
    })

    revalidatePath('/exams')
}

export async function updateExam(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const className = formData.get('class') as string
    const date = new Date(formData.get('date') as string)
    const subjectInfo = formData.get('subjectInfo') as string // JSON string

    if (!name || isNaN(grade) || !subjectInfo) {
        throw new Error('Invalid input')
    }

    await prisma.exam.update({
        where: { id },
        data: {
            name,
            grade,
            class: className || '대시',
            date,
            subjectInfo
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

export async function saveExamRecords(examId: number, submissions: { studentId: number, answers: Record<string, string> }[]) {
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

        // 3. Upsert Record
        // Check if record exists
        const existing = await prisma.examRecord.findUnique({
            where: {
                examId_studentId: {
                    examId,
                    studentId: sub.studentId
                }
            }
        })

        const data = {
            examId,
            studentId: sub.studentId,
            studentAnswers: JSON.stringify(sub.answers),
            totalScore,
            typeScores: JSON.stringify(typeScores)
        }

        if (existing) {
            await prisma.examRecord.update({
                where: { id: existing.id },
                data
            })
        } else {
            await prisma.examRecord.create({
                data
            })
        }
    }

    revalidatePath(`/exams/${examId}`)
}

export async function deleteExamRecord(examId: number, studentId: number) {
    await prisma.examRecord.deleteMany({
        where: {
            examId,
            studentId
        }
    })
    revalidatePath(`/exams/${examId}`)
}
