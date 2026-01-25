'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

// --- Teacher Actions ---

export async function getTeachers() {
    return await prisma.teacher.findMany({
        orderBy: { grade: 'asc' }
    })
}

export async function createTeacher(formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)

    if (!name || isNaN(grade)) {
        throw new Error('Invalid input')
    }

    try {
        await prisma.teacher.create({
            data: {
                name,
                grade
            }
        })
    } catch (e) {
        console.error(e)
        throw new Error('Teacher already exists for this grade')
    }

    revalidatePath('/teachers')
}

export async function deleteTeacher(id: number) {
    await prisma.teacher.delete({ where: { id } })
    revalidatePath('/teachers')
}

// --- Student Actions ---


export async function getStudents() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const where = session.role === 'TEACHER' && session.grade
        ? { grade: session.grade }
        : {}

    return await prisma.student.findMany({
        where,
        include: { teacher: true },
        orderBy: { grade: 'asc' }
    })
}


export async function createStudent(formData: FormData) {
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const cls = formData.get('class') as string || '대시'
    const phoneNumber = formData.get('phoneNumber') as string

    // Find teacher for this grade AND class
    const teacher = await prisma.teacher.findFirst({
        where: { grade, class: cls }
    })

    // We can let it fail if no teacher exists, or leave it null.
    // User req: "담당 선생님" is part of info. Auto-assign based on grade makes sense if 1 teacher per grade.

    if (!id || !name || isNaN(grade)) {
        throw new Error('Invalid input')
    }

    try {
        await prisma.student.create({
            data: {
                id, // Manual ID
                name,
                grade,
                class: cls,
                phoneNumber,
                teacherId: teacher?.id || null
            }
        })
    } catch (e) {
        console.error(e)
        throw new Error('Failed to create student (ID might exist)')
    }

    revalidatePath('/students')
}

export async function deleteStudent(id: number) {
    await prisma.student.delete({ where: { id } })
    revalidatePath('/students')
}

export async function updateTeacher(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const cls = formData.get('class') as string

    if (!name || isNaN(grade) || !cls) {
        throw new Error('Invalid input')
    }

    try {
        await prisma.teacher.update({
            where: { id },
            data: { name, grade, class: cls }
        })
    } catch (e) {
        console.error(e)
        throw new Error('Update failed')
    }

    revalidatePath('/teachers')
}

export async function updateStudent(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)

    if (!name || isNaN(grade)) {
        throw new Error('Invalid input')
    }

    // Auto-assign teacher
    const teacher = await prisma.teacher.findUnique({
        where: { grade }
    })

    await prisma.student.update({
        where: { id },
        data: {
            name,
            grade,
            phoneNumber,
            teacherId: teacher?.id || null
        }
    })

    revalidatePath('/students')
}
