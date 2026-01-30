'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const DEFAULT_TYPES = [
    '화법', '작문', '화작', '문법',
    '인문', '사회', '과학', '기술', '예술',
    '현대소설', '현대시', '고전소설', '고전시가',
    '수필', '설명문', '논설문'
]

export async function getQuestionTypes() {
    // Check if types exist, if not seed defaults
    const count = await prisma.questionType.count()
    if (count === 0) {
        console.log('Seeding default question types...')
        for (let i = 0; i < DEFAULT_TYPES.length; i++) {
            await prisma.questionType.create({
                data: {
                    name: DEFAULT_TYPES[i],
                    order: i
                }
            })
        }
    }

    return await prisma.questionType.findMany({
        orderBy: { order: 'asc' }
    })
}

export async function addQuestionType(name: string) {
    if (!name || name.trim() === '') return

    const count = await prisma.questionType.count()
    await prisma.questionType.create({
        data: {
            name: name.trim(),
            order: count
        }
    })
    revalidatePath('/exams')
}

export async function updateQuestionType(id: number, name: string) {
    if (!name || name.trim() === '') return
    await prisma.questionType.update({
        where: { id },
        data: { name: name.trim() }
    })
    revalidatePath('/exams')
}

export async function deleteQuestionType(id: number) {
    await prisma.questionType.delete({
        where: { id }
    })
    revalidatePath('/exams')
}

export async function updateQuestionTypeOrder(items: { id: number, order: number }[]) {
    for (const item of items) {
        await prisma.questionType.update({
            where: { id: item.id },
            data: { order: item.order }
        })
    }
    revalidatePath('/exams')
}
