'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

type ImportResult = {
    success: boolean
    matchedByCardNumber: number
    matchedByInfo: number
    newStudentsCreated: number
    failed: number
    totalProcessed: number
    errors: string[]
    importedStudents: {
        studentId: string
        studentName: string
        matchType: 'cardNumber' | 'info' | 'new'
        answers: Record<string, string>
    }[]
}

/**
 * Generate a unique temporary student ID (99XXX format)
 */
let tempIdCounter = 0

async function generateTempStudentId(): Promise<string> {
    // Use 00XXX range for temporary/undetermined IDs (카드번호 미정)
    // Find the next available ID
    const allTempStudents = await prisma.student.findMany({
        where: { id: { startsWith: '00' } },
        select: { id: true },
        orderBy: { id: 'desc' }
    })
    
    const usedIds = new Set(allTempStudents.map(s => s.id))
    
    // Start from 00001 and find a gap
    let candidateNum = Math.max(1, tempIdCounter + 1)
    let candidateId = String(candidateNum).padStart(5, '0')
    
    while (usedIds.has(candidateId) || candidateNum > 999) {
        candidateNum++
        candidateId = String(candidateNum).padStart(5, '0')
    }
    
    tempIdCounter = candidateNum
    return candidateId
}

/**
 * Extract grade from school name string
 * e.g. "동안고1" -> { schoolName: "동안고", grade: 4 }  (고1 = grade 4)
 *      "안양중2" -> { schoolName: "안양중", grade: 2 }  (중2 = grade 2)
 */
function parseSchoolAndGrade(rawSchool: string): { schoolName: string; grade: number | null } {
    if (!rawSchool) return { schoolName: '', grade: null }
    
    const trimmed = rawSchool.trim()
    
    const match = trimmed.match(/^(.+?[고중])(\d)$/)
    if (match) {
        const school = match[1]
        const num = parseInt(match[2])
        const isHigh = /고$/.test(school)
        const isMiddle = /중$/.test(school)
        
        if (isHigh) {
            return { schoolName: school, grade: num + 3 }
        } else if (isMiddle) {
            return { schoolName: school, grade: num }
        }
    }
    
    return { schoolName: trimmed, grade: null }
}

/**
 * Try to find the column index for a header using multiple possible names
 */
function findColumnIndex(headers: string[], ...possibleNames: string[]): number {
    for (const name of possibleNames) {
        const idx = headers.findIndex(h => {
            if (!h) return false
            if (h === name) return true
            if (h.includes(name)) return true
            return false
        })
        if (idx !== -1) return idx
    }
    return -1
}

/**
 * Parse CSV text into 2D array (handles quoted fields with commas)
 */
function parseCSV(csvText: string): any[][] {
    const rows: any[][] = []
    const lines = csvText.split('\n')
    
    for (const line of lines) {
        if (!line.trim()) continue
        const row: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"'
                    i++ // Skip next quote
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        row.push(current.trim())
        rows.push(row)
    }
    
    return rows
}

/**
 * Import scores from downloaded data.
 * Supports both base64-encoded xlsx and CSV text.
 */
export async function importScoresFromExcelData(
    examId: number,
    data: string,
    format: 'xlsx' | 'csv' = 'xlsx'
): Promise<ImportResult> {
    const result: ImportResult = {
        success: false,
        matchedByCardNumber: 0,
        matchedByInfo: 0,
        newStudentsCreated: 0,
        failed: 0,
        totalProcessed: 0,
        errors: [],
        importedStudents: []
    }

    try {
        // 1. Fetch exam info
        const exam = await prisma.exam.findUnique({ where: { id: examId } })
        if (!exam) {
            result.errors.push('시험을 찾을 수 없습니다.')
            return result
        }

        const questions = JSON.parse(exam.subjectInfo) as {
            id: number
            type: string
            score: number
            answer: string
        }[]

        // 2. Parse data based on format
        let jsonData: any[][]
        
        if (format === 'csv') {
            jsonData = parseCSV(data)
        } else {
            const binaryStr = atob(data)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i)
            }
            const workbook = XLSX.read(bytes, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
        }


        // 3. Find header row
        let headerRowIndex = -1

        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            const row = jsonData[i]
            if (!Array.isArray(row)) continue

            const trimmedRow = row.map(cell => String(cell || '').trim())
            
            const hasNameCol = trimmedRow.some(cell => 
                cell === '이름' || cell === '학생이름' || cell === '성명' || cell === '학생명'
            )
            const hasIdCol = trimmedRow.some(cell => 
                cell === '카드번호' || cell === '학생번호'
            )
            
            if (hasNameCol || hasIdCol) {
                headerRowIndex = i
                break
            }
        }

        if (headerRowIndex === -1) {
            result.errors.push("'이름', '카드번호', '학생번호' 등의 헤더를 찾을 수 없습니다.")
            return result
        }

        const headerRow = jsonData[headerRowIndex]
        const trimmedHeaders = headerRow.map((cell: any) => String(cell || '').trim())

        // 4. Detect column indices
        const idIdx = findColumnIndex(trimmedHeaders, '카드번호', '학생번호')
        const nameIdx = findColumnIndex(trimmedHeaders, '이름', '학생이름', '성명', '학생명')
        const schoolIdx = findColumnIndex(trimmedHeaders, '학교', '학교명')
        const gradeIdx = findColumnIndex(trimmedHeaders, '학년')
        const classIdx = findColumnIndex(trimmedHeaders, '정규반', '반명', '반', '학급', '클래스')

        if (nameIdx === -1 && idIdx === -1) {
            result.errors.push("이름 또는 카드번호 열을 찾을 수 없습니다.")
            return result
        }

        // 5. Map question columns
        const qMap: Record<number, number> = {}

        trimmedHeaders.forEach((header, idx) => {
            if (!header) return

            // Format B: Google Forms style "[N]" at the end
            const bracketMatch = header.match(/\[(\d+)\]\s*$/)
            if (bracketMatch) {
                const qNum = parseInt(bracketMatch[1])
                if (qNum > 0 && qNum <= questions.length) {
                    qMap[idx] = questions[qNum - 1].id
                }
                return
            }

            // Format A: Pure number headers
            const pureNumMatch = header.match(/^\d+$/)
            if (pureNumMatch) {
                const qNum = parseInt(pureNumMatch[0])
                if (qNum > 0 && qNum <= questions.length) {
                    qMap[idx] = questions[qNum - 1].id
                }
                return
            }

            // Format C: "1번", "문항1" etc.
            const lenientMatch = header.match(/(\d+)/)
            if (lenientMatch && header.length < 10) {
                const qNum = parseInt(lenientMatch[1])
                if (qNum > 0 && qNum <= questions.length) {
                    const maxIdentIdx = Math.max(idIdx, nameIdx, schoolIdx, gradeIdx, classIdx)
                    if (idx > maxIdentIdx) {
                        qMap[idx] = questions[qNum - 1].id
                    }
                }
            }
        })

        // Try adjacent rows if no questions found
        if (Object.keys(qMap).length === 0) {
            const tryRow = (rowIdx: number) => {
                if (rowIdx < 0 || rowIdx >= jsonData.length) return
                const row = jsonData[rowIdx]
                if (!Array.isArray(row)) return
                row.forEach((cell, idx) => {
                    const cellStr = String(cell || '').trim()
                    const match = cellStr.match(/^\d+$/)
                    if (match) {
                        const qNum = parseInt(match[0])
                        if (qNum > 0 && qNum <= questions.length) {
                            qMap[idx] = questions[qNum - 1].id
                        }
                    }
                })
            }
            tryRow(headerRowIndex - 1)
            tryRow(headerRowIndex + 1)
        }

        if (Object.keys(qMap).length === 0) {
            result.errors.push(`문항 번호를 찾을 수 없습니다. (시스템 문항 수: ${questions.length}개)\n헤더에 [1], [2] 또는 1, 2 형태의 문항 번호가 있는지 확인해주세요.`)
            return result
        }

        // 6. Process each data row
        const dataRows = jsonData.slice(headerRowIndex + 1)

        for (const row of dataRows) {
            if (!Array.isArray(row)) continue

            const rawCardNumber = idIdx !== -1 ? String(row[idIdx] || '').trim() : ''
            const studentName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : ''
            const rawSchool = schoolIdx !== -1 ? String(row[schoolIdx] || '').trim() : ''
            const rawGradeVal = gradeIdx !== -1 ? row[gradeIdx] : null
            const rawClass = classIdx !== -1 ? String(row[classIdx] || '').trim() : ''

            if (!rawCardNumber && !studentName) continue

            result.totalProcessed++

            const { schoolName: parsedSchool, grade: gradeFromSchool } = parseSchoolAndGrade(rawSchool)
            
            let studentGrade: number | null = null
            if (rawGradeVal !== null && rawGradeVal !== undefined) {
                const g = parseInt(String(rawGradeVal))
                if (!isNaN(g)) studentGrade = g
            }
            if (studentGrade === null && gradeFromSchool !== null) {
                studentGrade = gradeFromSchool
            }

            // Extract answers
            const rowAnswers: Record<string, string> = {}
            Object.entries(qMap).forEach(([colIdx, questionId]) => {
                const val = row[parseInt(colIdx)]
                if (val !== undefined && val !== null) {
                    rowAnswers[questionId.toString()] = String(val).trim()
                }
            })

            let matchedStudent: { id: string; name: string } | null = null
            let matchType: 'cardNumber' | 'info' | 'new' = 'new'

            // Step 1: Match by card number
            if (rawCardNumber) {
                const paddedId = /^\d+$/.test(rawCardNumber)
                    ? rawCardNumber.padStart(5, '0')
                    : rawCardNumber

                const student = await prisma.student.findUnique({
                    where: { id: paddedId },
                    select: { id: true, name: true }
                })

                if (student) {
                    matchedStudent = student
                    matchType = 'cardNumber'
                    result.matchedByCardNumber++
                }
            }

            // Step 2: Match by name + school + grade + class
            if (!matchedStudent && studentName) {
                const whereCondition: any = { name: studentName }

                if (parsedSchool) {
                    whereCondition.schoolName = { contains: parsedSchool }
                }

                if (studentGrade !== null) {
                    whereCondition.grade = studentGrade
                }

                if (rawClass) {
                    whereCondition.class = { contains: rawClass }
                }

                const student = await prisma.student.findFirst({
                    where: whereCondition,
                    select: { id: true, name: true }
                })

                if (student) {
                    matchedStudent = student
                    matchType = 'info'
                    result.matchedByInfo++
                } else if (Object.keys(whereCondition).length > 1) {
                    // Fallback: try with just name
                    const studentByName = await prisma.student.findFirst({
                        where: { name: studentName },
                        select: { id: true, name: true }
                    })
                    if (studentByName) {
                        matchedStudent = studentByName
                        matchType = 'info'
                        result.matchedByInfo++
                    }
                }
            }

            // Step 3: Create new student
            if (!matchedStudent && studentName) {
                try {
                    // Use card number from Excel as student ID, or generate temp ID
                    let studentId: string
                    if (rawCardNumber && /^\d+$/.test(rawCardNumber)) {
                        studentId = rawCardNumber.padStart(5, '0')
                    } else {
                        studentId = await generateTempStudentId()
                    }

                    const finalGrade = studentGrade ?? exam.grade ?? 1
                    const studentClass = rawClass || '미정'

                    const teacherAssignment = await prisma.teacherAssignment.findFirst({
                        where: { grade: finalGrade, class: studentClass },
                        include: { teacher: true }
                    })

                    const newStudent = await prisma.student.create({
                        data: {
                            id: studentId,
                            name: studentName,
                            grade: finalGrade,
                            class: studentClass,
                            schoolName: parsedSchool || rawSchool || '',
                            phoneNumber: '',
                            teacherId: teacherAssignment?.teacher.id || null
                        }
                    })

                    matchedStudent = { id: newStudent.id, name: newStudent.name }
                    matchType = 'new'
                    result.newStudentsCreated++
                } catch (createError: any) {
                    result.errors.push(`학생 생성 실패 (${studentName}): ${createError.message}`)
                    result.failed++
                    continue
                }
            }

            if (!matchedStudent) {
                result.errors.push(`매칭 실패: 카드번호=${rawCardNumber}, 이름=${studentName}`)
                result.failed++
                continue
            }

            // 7. Save exam record
            try {
                const existing = await prisma.examRecord.findUnique({
                    where: {
                        examId_studentId: {
                            examId,
                            studentId: matchedStudent.id
                        }
                    }
                })

                let finalAnswers = rowAnswers
                let finalVocab = 0
                let finalRemarks = ''

                if (existing) {
                    finalVocab = existing.vocabScore
                    finalRemarks = existing.remarks || ''
                    try {
                        const existingAnswers = JSON.parse(existing.studentAnswers)
                        // 기존 내용에 새로 엑셀에서 올라온 내용을 덮어씌움 (기존 답변 유지, 새 답변 업데이트)
                        finalAnswers = { ...existingAnswers, ...rowAnswers }
                    } catch (e) {
                        // 기존 파싱 실패 시 무시
                    }
                }

                // 점수 계산
                let finalTotalScore = 0
                const finalTypeScores: Record<string, number> = {}

                questions.forEach(q => {
                    if (!finalTypeScores[q.type]) finalTypeScores[q.type] = 0
                })

                questions.forEach(q => {
                    const studentAnswer = finalAnswers[q.id.toString()]
                    if (studentAnswer && studentAnswer.trim() === q.answer.trim()) {
                        finalTotalScore += q.score
                        finalTypeScores[q.type] += q.score
                    }
                })

                const recordData = {
                    studentAnswers: JSON.stringify(finalAnswers),
                    totalScore: finalTotalScore,
                    vocabScore: finalVocab,
                    typeScores: JSON.stringify(finalTypeScores),
                    remarks: finalRemarks
                }

                if (existing) {
                    await prisma.examRecord.update({
                        where: { id: existing.id },
                        data: recordData
                    })
                } else {
                    await prisma.examRecord.create({
                        data: {
                            examId,
                            studentId: matchedStudent.id,
                            ...recordData
                        }
                    })
                }

                result.importedStudents.push({
                    studentId: matchedStudent.id,
                    studentName: matchedStudent.name,
                    matchType,
                    answers: finalAnswers
                })
            } catch (saveError: any) {
                result.errors.push(`성적 저장 실패 (${matchedStudent.name}): ${saveError.message}`)
                result.failed++
            }
        }

        result.success = true
        revalidatePath(`/exams/${examId}`)
        revalidatePath('/students')

    } catch (error: any) {
        result.errors.push(`처리 중 오류: ${error.message}`)
    }

    return result
}
