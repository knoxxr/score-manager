'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

// --- Teacher Actions ---

export async function getTeachers() {
    return await prisma.teacher.findMany({
        include: { assignments: { orderBy: { grade: 'asc' } } },
        orderBy: { name: 'asc' }
    })
}

export async function createTeacher(formData: FormData) {
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const cls = formData.get('class') as string

    if (!name || isNaN(grade) || !cls) {
        throw new Error('Invalid input')
    }

    try {
        await prisma.teacher.create({
            data: {
                name,
                assignments: {
                    create: { grade, class: cls }
                }
            }
        })
    } catch (e) {
        console.error(e)
        // Check if unique constraint on assignment failed
        throw new Error('Failed to create teacher.')
    }

    revalidatePath('/teachers')
}

export async function deleteTeacher(id: number) {
    await prisma.teacher.delete({ where: { id } })
    revalidatePath('/teachers')
}

export async function addTeacherAssignment(teacherId: number, grade: number, cls: string) {
    try {
        await prisma.teacherAssignment.create({
            data: {
                teacherId,
                grade,
                class: cls
            }
        })
    } catch (e) {
        console.log(e)
        throw new Error('Assignment already exists')
    }
    revalidatePath('/teachers')
}

export async function removeTeacherAssignment(id: number) {
    await prisma.teacherAssignment.delete({ where: { id } })
    revalidatePath('/teachers')
}

// --- Student Actions ---


export async function getStudents(query?: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const where: any = session.role === 'TEACHER' && session.grade
        ? { grade: session.grade }
        : {}

    if (query) {
        where.OR = [
            { name: { contains: query } },
            { id: { contains: query } }
        ]
    }

    return await prisma.student.findMany({
        where,
        include: { teacher: true },
        orderBy: { grade: 'asc' }
    })
}


export async function createStudent(formData: FormData) {
    const id = (formData.get('id') as string).trim()
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)
    const cls = formData.get('class') as string || '대시'
    const phoneNumber = (formData.get('phoneNumber') as string) || ''
    const schoolName = (formData.get('schoolName') as string) || ''

    // Find teacher for this grade AND class
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
        where: { grade, class: cls },
        include: { teacher: true }
    })

    // We can let it fail if no teacher exists, or leave it null.
    // User req: "담당 선생님" is part of info. Auto-assign based on grade makes sense if 1 teacher per grade.

    if (!id || !name || isNaN(grade) || !/^\d{5}$/.test(id)) {
        throw new Error('Invalid input: Student ID must be 5 digits.')
    }

    try {
        await prisma.student.create({
            data: {
                id, // Manual ID (String)
                name,
                grade,
                class: cls,
                schoolName,
                phoneNumber,
                teacherId: teacherAssignment?.teacher.id || null
            }
        })
    } catch (e) {
        console.error(e)
        throw new Error('Failed to create student (ID might exist)')
    }

    revalidatePath('/students')
}

export async function deleteStudent(id: string) {
    await prisma.student.delete({ where: { id } })
    revalidatePath('/students')
}

export async function deleteStudents(ids: string[]) {
    await prisma.student.deleteMany({
        where: { id: { in: ids } }
    })
    revalidatePath('/students')
}

export async function updateTeacher(id: number, formData: FormData) {
    const name = formData.get('name') as string

    if (!name) {
        throw new Error('Invalid input')
    }

    try {
        await prisma.teacher.update({
            where: { id },
            data: { name }
        })
    } catch (e) {
        console.error(e)
        throw new Error('Update failed')
    }

    revalidatePath('/teachers')
}

export async function updateStudent(id: string, formData: FormData) {
    const newId = (formData.get('id') as string).trim()
    const name = formData.get('name') as string
    const grade = parseInt(formData.get('grade') as string)

    const cls = formData.get('class') as string || '대시'
    const schoolName = (formData.get('schoolName') as string) || ''

    if (!name || isNaN(grade)) {
        throw new Error('Invalid input')
    }

    const data: any = {
        name,
        grade,
        class: cls,
        schoolName,
    }

    // Handle ID Update
    if (newId && newId !== id) {
        if (!/^\d{5}$/.test(newId)) {
            throw new Error('New ID must be 5 digits')
        }
        const existing = await prisma.student.findUnique({ where: { id: newId } })
        if (existing) {
            throw new Error('New ID already exists')
        }
        data.id = newId
    }

    // Auto-assign teacher
    const teacher = await prisma.teacherAssignment.findFirst({
        where: { grade, class: cls },
        include: { teacher: true }
    })
    data.teacherId = teacher?.teacher.id || null

    try {
        await prisma.student.update({
            where: { id },
            data
        })
    } catch (e) {
        console.error("Update failed", e)
        throw new Error('Update failed')
    }

    revalidatePath('/students')
}

import * as XLSX from 'xlsx'

export async function uploadStudentsExcel(formData: FormData) {
    const file = formData.get('file') as File | null
    // const grade = parseInt(formData.get('grade') as string)
    const defaultGrade = 1

    if (!file) {
        throw new Error('Invalid file')
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

    // Find header row index
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const row = jsonData[i]
        if (row.includes('반명') && row.includes('학생명') && row.includes('학교명') && row.includes('카드번호')) {
            headerRowIndex = i
            break
        }
    }

    if (headerRowIndex === -1) {
        throw new Error('헤더를 찾을 수 없습니다. (반명, 학생명, 학교명, 카드번호)')
    }

    const headers = jsonData[headerRowIndex]
    const classIdx = headers.indexOf('반명')
    const nameIdx = headers.indexOf('학생명')
    const schoolIdx = headers.indexOf('학교명')
    const idIdx = headers.indexOf('카드번호')

    const rows = jsonData.slice(headerRowIndex + 1)
    let successCount = 0

    for (const row of rows) {
        const rawId = row[idIdx]
        if (rawId === undefined || rawId === null) continue
        let id = String(rawId).trim()
        const name = row[nameIdx]
        let cls = row[classIdx] as string
        const schoolName = row[schoolIdx] || ''

        if (!id || !name || !cls) continue

        // Detect Grade from Class Name (leading 1, 2, 3) and School Name
        let rowGrade = defaultGrade // Default fallback
        const gradeMatch = cls.match(/^([123])/)

        if (gradeMatch) {
            const num = parseInt(gradeMatch[1])
            const isHigh = /고|고등|고등학교$/.test(schoolName)
            const isMiddle = /중|중학교|중등$/.test(schoolName)

            if (isHigh) {
                rowGrade = num + 3 // 4, 5, 6
            } else if (isMiddle) {
                rowGrade = num // 1, 2, 3
            } else {
                rowGrade = num
            }
            // If neither, keep default or maybe just num? User specified "Combine to input...". 
            // If school type matches, we override.
        }

        // Remove ONLY the first digit (1, 2, or 3) from class name if it was used for grade detection
        // User requirement: "Only the first number corresponds to grade. The rest is kept."
        cls = cls.replace(/^[123]/, '').trim()

        // Check if student exists
        const exists = await prisma.student.findUnique({ where: { id } })
        if (exists) continue

        // Find teacher using the determined rowGrade
        const teacherAssignment = await prisma.teacherAssignment.findFirst({
            where: { grade: rowGrade, class: cls },
            include: { teacher: true }
        })

        try {
            await prisma.student.create({
                data: {
                    id,
                    name,
                    grade: rowGrade,
                    class: cls,
                    schoolName,
                    phoneNumber: '',
                    teacherId: teacherAssignment?.teacher.id || null
                }
            })
            successCount++
        } catch (e) {
            console.error(`Failed to upload student ${id}`, e)
        }
    }

    revalidatePath('/students')
}
