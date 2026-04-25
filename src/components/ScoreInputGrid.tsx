'use client'

import { useState, useMemo } from 'react'
import { saveExamRecords, deleteExamRecord, deleteExamRecords, batchCreateStudents } from '@/app/actions/exams'
import { CLASSES } from '@/lib/classes'
import { GRADES, formatGrade } from '@/lib/grades'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

type Props = {
    examId: number
    initialStudents: Student[]
    questions: { id: number; type: string; score: number; answer: string }[]
    initialAnswers: Record<string, Record<string, string>>
    initialVisibleStudentIds: string[]
    defaultGrade?: number
    defaultClass?: string
    examType?: string
    isAdmission?: boolean
    initialVocabScores?: Record<string, number>
    initialRemarks?: Record<string, string>
    initialTestDates?: Record<string, string>
}

type Student = {
    id: string
    name: string
    grade: number
    class: string
    schoolName?: string | null
}

export default function ScoreInputGrid({
    examId,
    initialStudents,
    questions,
    initialAnswers,
    initialVisibleStudentIds,
    defaultGrade,
    defaultClass,
    examType,
    isAdmission = false,
    initialVocabScores = {},
    initialRemarks = {},
    initialTestDates = {}
}: Props) {
    const router = useRouter()
    const [students, setStudents] = useState<Student[]>(initialStudents)
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>(initialAnswers)
    const [vocabScores, setVocabScores] = useState<Record<string, number>>(initialVocabScores)
    const [remarks, setRemarks] = useState<Record<string, string>>(initialRemarks)
    const [testDates, setTestDates] = useState<Record<string, string>>(initialTestDates)
    const [saving, setSaving] = useState(false)
    const [visibleStudentIds, setVisibleStudentIds] = useState<string[]>(
        () => {
            // Show any student who has an existing record (answers, vocab, remarks, or test date)
            const ids = new Set([
                ...Object.keys(initialAnswers),
                ...Object.keys(initialVocabScores),
                ...Object.keys(initialRemarks),
                ...Object.keys(initialTestDates)
            ])
            return Array.from(ids)
        }
    ) // Start with students who have any existing data
    const [targetGrade, setTargetGrade] = useState<number | ''>(defaultGrade || '')
    const [targetClass, setTargetClass] = useState<string>(defaultClass || '')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [addStudentQuery, setAddStudentQuery] = useState('')
    const [showAddResults, setShowAddResults] = useState(false)

    // Link import state
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [linkImporting, setLinkImporting] = useState(false)
    const [linkImportResult, setLinkImportResult] = useState<any>(null)

    // Row Selection for Deletion
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

    // Filter students by visibility and search query
    const visibleStudents = useMemo(() => {
        let filtered = students.filter(s => visibleStudentIds.includes(s.id))

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(s => {
                const studentRemarks = remarks[s.id] || ''
                return (
                    studentRemarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })
        }

        return filtered.sort((a, b) => a.name.localeCompare(b.name))
    }, [students, visibleStudentIds, searchQuery, remarks])

    const handleClassChange = (newClass: string) => {
        setTargetClass(newClass)
        if (!newClass) {
            setVisibleStudentIds([])
            return
        }

        const gradeToUse = defaultGrade || (targetGrade as number)

        let classStudents = []
        if (newClass === 'ALL') {
            classStudents = students.filter(s => s.grade === gradeToUse)
        } else {
            classStudents = students.filter(s =>
                s.class === newClass && s.grade === gradeToUse
            )
        }

        const newIds = classStudents.map(s => s.id)
        setVisibleStudentIds(prev => Array.from(new Set([...prev, ...newIds])))
        setSelectedStudentIds([])
    }

    const handleAddStudent = (studentId: string) => {
        setVisibleStudentIds(prev => Array.from(new Set([...prev, studentId])))
        setAddStudentQuery('')
        setShowAddResults(false)
    }

    const addStudentResults = useMemo(() => {
        if (!addStudentQuery.trim()) return []
        const query = addStudentQuery.toLowerCase()
        return students
            .filter(s => !visibleStudentIds.includes(s.id))
            .filter(s => 
                s.name.toLowerCase().includes(query) || 
                s.id.toLowerCase().includes(query)
            )
            .slice(0, 10) // Limit to 10 results
    }, [students, addStudentQuery, visibleStudentIds])


    const focusNextInput = (currentInput: HTMLInputElement) => {
        const inputs = Array.from(document.querySelectorAll('input[data-input-type="grid-input"]')) as HTMLInputElement[]
        const currentIndex = inputs.indexOf(currentInput)

        if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus()
            inputs[currentIndex + 1].select()
        }
    }

    const handleAnswerChange = (studentId: string, qId: number, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [qId]: value
            }
        }))
    }

    const handleVocabScoreChange = (studentId: string, value: string) => {
        // Allow empty input
        if (value === '') {
            setVocabScores(prev => {
                const next = { ...prev }
                delete next[studentId]
                return next
            })
            return
        }

        // Only allow digits
        if (!/^\d+$/.test(value)) return

        const score = parseInt(value, 10)
        // Clamp to 0-10
        if (score > 10) return

        setVocabScores(prev => ({
            ...prev,
            [studentId]: score
        }))
    }

    const handleRemoveStudent = async (studentId: string) => {
        if (confirm('정말로 이 학생의 점수를 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)')) {
            try {
                // Call server action to delete record if it exists
                await deleteExamRecord(examId, studentId)

                // Update UI
                setVisibleStudentIds(prev => prev.filter(id => id !== studentId))
                setAnswers(prev => {
                    const next = { ...prev }
                    delete next[studentId]
                    return next
                })
                setVocabScores(prev => {
                    const next = { ...prev }
                    delete next[studentId]
                    return next
                })
                setRemarks(prev => {
                    const next = { ...prev }
                    delete next[studentId]
                    return next
                })
                setTestDates(prev => {
                    const next = { ...prev }
                    delete next[studentId]
                    return next
                })
                setSelectedStudentIds(prev => prev.filter(id => id !== studentId))
            } catch (e) {
                console.error(e)
                alert('삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const handleBulkDelete = async () => {
        if (selectedStudentIds.length === 0) return
        if (confirm(`선택한 ${selectedStudentIds.length}명의 학생 점수를 정말로 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)`)) {
            try {
                await deleteExamRecords(examId, selectedStudentIds)

                setVisibleStudentIds(prev => prev.filter(id => !selectedStudentIds.includes(id)))
                setAnswers(prev => {
                    const next = { ...prev }
                    selectedStudentIds.forEach(id => delete next[id])
                    return next
                })
                setVocabScores(prev => {
                    const next = { ...prev }
                    selectedStudentIds.forEach(id => delete next[id])
                    return next
                })
                setRemarks(prev => {
                    const next = { ...prev }
                    selectedStudentIds.forEach(id => delete next[id])
                    return next
                })
                setTestDates(prev => {
                    const next = { ...prev }
                    selectedStudentIds.forEach(id => delete next[id])
                    return next
                })
                setSelectedStudentIds([])
            } catch (e) {
                console.error(e)
                alert('일괄 삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const toggleSelectAll = () => {
        if (selectedStudentIds.length > 0 && selectedStudentIds.length === visibleStudents.length) {
            setSelectedStudentIds([])
        } else {
            setSelectedStudentIds(visibleStudents.map(s => s.id))
        }
    }

    const toggleSelectRow = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        )
    }

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

                // Find header row and IDs
                let headerRowIndex = -1
                let idIdx = -1

                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    const row = jsonData[i]
                    if (!Array.isArray(row)) continue
                    
                    const trimmedRow = row.map(cell => String(cell || '').trim())
                    const foundIdx = trimmedRow.findIndex(cell => cell === '학생번호' || cell === '카드번호')
                    
                    if (foundIdx !== -1) {
                        headerRowIndex = i
                        idIdx = foundIdx
                        break
                    }
                }

                if (headerRowIndex === -1) {
                    alert("'학생번호' 또는 '카드번호' 헤더를 찾을 수 없습니다.")
                    return
                }

                const headerRow = jsonData[headerRowIndex]
                const trimmedHeaderRow = Array.from(headerRow).map((cell: any) => String(cell || '').trim())
                const nameIdx = trimmedHeaderRow.findIndex((cell: string) => cell && (cell.includes('이름') || cell.includes('성명')))
                const gradeIdx = trimmedHeaderRow.findIndex((cell: string) => cell && cell.includes('학년'))
                const schoolIdx = trimmedHeaderRow.findIndex((cell: string) => cell && cell.includes('학교'))
                const classIdx = trimmedHeaderRow.findIndex((cell: string) => cell && (cell.includes('반') || cell.includes('학급') || cell.includes('클래스')))

                // Match questions across detected header row and potentially adjacent rows
                const qMap: Record<number, number> = {} // colIdx -> question.id
                
                // Helper to try and map questions from a row
                const mapQuestionsFromRow = (rowData: any[]) => {
                    if (!Array.isArray(rowData)) return
                    rowData.forEach((cell, idx) => {
                        const cellStr = String(cell || '').trim()
                        const match = cellStr.match(/^\d+$/) // Strict number-only match for headers like "1", "2"
                        if (match) {
                            const qNum = parseInt(match[0])
                            if (qNum > 0 && qNum <= questions.length) {
                                qMap[idx] = questions[qNum - 1].id
                            }
                        } else {
                            // Try more lenient match if strict fails (e.g. "1번", "문항1")
                            const lenientMatch = cellStr.match(/\d+/)
                            if (lenientMatch) {
                                const qNum = parseInt(lenientMatch[0])
                                // Only use lenient match if it looks like a question number (not a student ID or something else)
                                if (qNum > 0 && qNum <= questions.length && cellStr.length < 10) {
                                    qMap[idx] = questions[qNum - 1].id
                                }
                            }
                        }
                    })
                }

                // Try current header row
                mapQuestionsFromRow(jsonData[headerRowIndex])
                
                // If not enough questions found, try row above (for some multi-row formats)
                if (Object.keys(qMap).length < questions.length && headerRowIndex > 0) {
                    mapQuestionsFromRow(jsonData[headerRowIndex - 1])
                }
                
                // If still not enough, try row below
                if (Object.keys(qMap).length < questions.length && headerRowIndex < jsonData.length - 1) {
                    mapQuestionsFromRow(jsonData[headerRowIndex + 1])
                }

                if (Object.keys(qMap).length === 0) {
                    alert(`문항 번호(1, 2, 3...) 헤더를 찾을 수 없습니다.\n시스템에 등록된 문항 수: ${questions.length}개\n엑셀 파일에 '1', '2' 등 적절한 문항 번호가 있는지 확인해주세요.`)
                    return
                }

                const processUpload = async (currentStudents: Student[]) => {
                    const newAnswers = { ...answers }
                    let updatedCount = 0
                    const missingStudentsData: any[] = []
                    const unmatchedIds: string[] = []

                    const rows = jsonData.slice(headerRowIndex + 1)
                    
                    // First pass: identify missing students and ensure correct ID mapping
                    rows.forEach(row => {
                        if (!Array.isArray(row)) return
                        let rawExcelId = String(row[idIdx] || '').trim()
                        if (!rawExcelId) return
                        
                        // Ensure 5-digit padding for comparison and creation
                        const excelId = /^\d+$/.test(rawExcelId) ? rawExcelId.padStart(5, '0') : rawExcelId

                        const student = currentStudents.find(s => {
                            const dbId = s.id.trim()
                            if (dbId === excelId) return true
                            if (parseInt(dbId) === parseInt(excelId)) return true
                            if (dbId.length > excelId.length && dbId.endsWith(excelId) && parseInt(dbId) === parseInt(excelId)) return true
                            return false
                        })

                        if (!student) {
                            const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '신규학생'
                            const grade = defaultGrade || 1
                            let cls = classIdx !== -1 ? String(row[classIdx] || '').trim() : ''
                            
                            // If class detected from Excel, try to clean it (e.g. "1반" -> "1반", but checking against current filter)
                            if (!cls) {
                                cls = targetClass && targetClass !== 'ALL' ? targetClass : '미정'
                            }
                            
                            const schoolName = schoolIdx !== -1 ? String(row[schoolIdx] || '').trim() : ''
                            
                            // Check if already in missing list
                            if (!missingStudentsData.some(m => m.id === excelId)) {
                                missingStudentsData.push({
                                    id: excelId,
                                    name,
                                    grade: grade,
                                    class: cls,
                                    schoolName
                                })
                            }
                        }
                    })

                    let activeStudents = [...currentStudents]

                    // Ask to create missing students
                    if (missingStudentsData.length > 0) {
                        if (confirm(`${missingStudentsData.length}명의 매칭되지 않는 학생을 자동으로 등록하시겠습니까?`)) {
                            const createdStudents = await batchCreateStudents(missingStudentsData)
                            if (createdStudents && createdStudents.length > 0) {
                                activeStudents = [...activeStudents, ...createdStudents]
                                setStudents(activeStudents)
                            }
                        }
                    }

                    const updatedStudentIds: string[] = []

                    // Second pass: fill answers using correct IDs
                    rows.forEach(row => {
                        if (!Array.isArray(row)) return
                        let rawExcelId = String(row[idIdx] || '').trim()
                        if (!rawExcelId) return
                        const excelId = /^\d+$/.test(rawExcelId) ? rawExcelId.padStart(5, '0') : rawExcelId

                        const student = activeStudents.find(s => {
                            const dbId = s.id.trim()
                            if (dbId === excelId) return true
                            if (parseInt(dbId) === parseInt(excelId)) return true
                            if (dbId.length > excelId.length && dbId.endsWith(excelId) && parseInt(dbId) === parseInt(excelId)) return true
                            return false
                        })

                        if (student) {
                            const studentId = student.id
                            if (!newAnswers[studentId]) newAnswers[studentId] = {}
                            
                            Object.entries(qMap).forEach(([colIdx, questionId]) => {
                                const val = row[parseInt(colIdx)]
                                if (val !== undefined && val !== null) {
                                    newAnswers[studentId][questionId] = String(val).trim()
                                }
                            })
                            updatedCount++
                            updatedStudentIds.push(studentId)
                        } else {
                            unmatchedIds.push(excelId)
                        }
                    })

                    setAnswers(newAnswers)
                    if (updatedStudentIds.length > 0) {
                        setVisibleStudentIds(prev => Array.from(new Set([...prev, ...updatedStudentIds])))
                    }
                    
                    let message = `${updatedCount}명의 학생 답안이 입력되었습니다. (${Object.keys(qMap).length}개 문항 매칭)`
                    if (unmatchedIds.length > 0) {
                        const examples = unmatchedIds.slice(0, 5).join(', ')
                        message += `\n\n매칭되지 않은 학생 ID가 ${unmatchedIds.length}개 있습니다.\n(예: ${examples}${unmatchedIds.length > 5 ? '...' : ''})\n카드번호를 확인해주세요.`
                    }
                    message += `\n\n'목록 저장' 버튼을 눌러 확정해주세요.`
                    alert(message)
                }

                processUpload(students)
                
                // Reset input
                e.target.value = ''
            } catch (error) {
                console.error('Excel parsing error:', error)
                alert('엑셀 파일 파싱 중 오류가 발생했습니다.')
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handleLinkImport = async () => {
        if (!linkUrl.trim()) {
            alert('URL을 입력해주세요.')
            return
        }

        setLinkImporting(true)
        setLinkImportResult(null)

        try {
            // Use server-side proxy to download the file (avoids CORS issues)
            const proxyResponse = await fetch('/api/download-excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: linkUrl.trim() })
            })

            const proxyResult = await proxyResponse.json()

            if (!proxyResponse.ok || proxyResult.error) {
                throw new Error(proxyResult.error || `파일 다운로드 실패: HTTP ${proxyResponse.status}`)
            }

            const fileData = proxyResult.data
            const fileFormat = proxyResult.format || 'xlsx'

            // Send to server action for processing
            const { importScoresFromExcelData } = await import('@/app/actions/importScoresFromLink')
            const result = await importScoresFromExcelData(examId, fileData, fileFormat)
            setLinkImportResult(result)

            if (result.success && result.importedStudents.length > 0) {
                // Update local state with imported data
                const newAnswers = { ...answers }
                const newStudentIds: string[] = []

                for (const imported of result.importedStudents) {
                    newAnswers[imported.studentId] = imported.answers
                    newStudentIds.push(imported.studentId)

                    // Add new students to local students list if they don't exist
                    if (!students.find(s => s.id === imported.studentId)) {
                        setStudents(prev => [...prev, {
                            id: imported.studentId,
                            name: imported.studentName,
                            grade: defaultGrade || 1,
                            class: '미정'
                        }])
                    }
                }

                setAnswers(newAnswers)
                setVisibleStudentIds(prev => Array.from(new Set([...prev, ...newStudentIds])))

                // Refresh to get latest data from server
                router.refresh()
            }
        } catch (e: any) {
            console.error(e)
            setLinkImportResult({
                success: false,
                errors: [e.message || '링크 처리 중 오류가 발생했습니다.'],
                totalProcessed: 0,
                matchedByCardNumber: 0,
                matchedByInfo: 0,
                newStudentsCreated: 0,
                failed: 0,
                importedStudents: []
            })
        } finally {
            setLinkImporting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        const allStudentIds = Array.from(new Set([...Object.keys(answers), ...Object.keys(vocabScores), ...Object.keys(remarks), ...Object.keys(testDates)]))
        const submissions = allStudentIds.map(sid => ({
            studentId: sid,
            answers: answers[sid] || {},
            vocabScore: vocabScores[sid] || 0,
            remarks: remarks[sid] || '',
            testDate: testDates[sid] || undefined
        }))

        try {
            await saveExamRecords(examId, submissions)
            alert('모든 학생의 점수가 성공적으로 저장되었습니다!')
            router.refresh()
        } catch (e) {
            console.error(e)
            alert('점수 저장 실패')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>학급 선택:</span>
                        <div style={{
                            padding: '0.5rem',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem',
                            minWidth: '60px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>
                            {targetGrade ? formatGrade(targetGrade) : '-'}
                        </div>
                        <select
                            value={targetClass}
                            onChange={(e) => handleClassChange(e.target.value)}
                            className="input"
                            style={{ padding: '0.5rem', minWidth: '150px' }}
                        >
                            <option value="">반 선택</option>
                            <option value="ALL">전체</option>
                            {CLASSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>검색:</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="이름 또는 비고 검색"
                            className="input"
                            style={{ padding: '0.5rem', minWidth: '200px' }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="btn"
                                style={{ padding: '0.5rem 0.75rem' }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    {/* Add Individual Student Search */}
                    <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem', whiteSpace: 'nowrap', color: '#6366f1' }}>학생 추가:</span>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={addStudentQuery}
                                onChange={(e) => { 
                                    setAddStudentQuery(e.target.value); 
                                    setShowAddResults(true); 
                                }}
                                onFocus={() => setShowAddResults(true)}
                                placeholder="성명 또는 카드번호로 학생 찾기"
                                className="input"
                                style={{ padding: '0.5rem', minWidth: '250px', borderColor: '#a5b4fc' }}
                            />
                            {showAddResults && addStudentResults.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    zIndex: 100,
                                    marginTop: '0.25rem',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    {addStudentResults.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => handleAddStudent(s.id)}
                                            style={{
                                                padding: '0.75rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                        >
                                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                {s.schoolName || '학교 정보 없음'} | {formatGrade(s.grade)} | No. {s.id}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showAddResults && addStudentQuery.trim() !== '' && addStudentResults.length === 0 && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, 
                                    background: 'white', padding: '1rem', border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem', zIndex: 100, marginTop: '0.25rem',
                                    fontSize: '0.85rem', color: '#64748b', textAlign: 'center'
                                }}>
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>
                        {showAddResults && (
                            <button 
                                onClick={() => { setShowAddResults(false); setAddStudentQuery(''); }} 
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}
                            >
                                닫기
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* 
                    <button
                        onClick={() => { setShowLinkInput(!showLinkInput); setLinkImportResult(null) }}
                        className="btn"
                        style={{ background: showLinkInput ? '#6366f1' : '#8b5cf6', color: 'white' }}
                    >
                        🔗 링크로 답안 입력
                    </button>
                    */}
                    {selectedStudentIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn"
                            style={{ background: '#ef4444', color: 'white' }}
                        >
                            선택 삭제 ({selectedStudentIds.length})
                        </button>
                    )}
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        총 {visibleStudents.length}명
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? '저장 중...' : '목록 저장'}
                    </button>
                </div>
            </div>

            {/* Link Import Section Hidden
            {showLinkInput && (
                ...
            )}
            */}

            {visibleStudents.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '0.5rem' }}>
                    등록된 학생이 없습니다. 위에서 학생을 선택하여 추가해주세요.
                </div>
            ) : (
                <div style={{ overflowX: 'auto', padding: '1.5rem 0' }} className="card">
                    <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 20, borderRight: '1px solid #e2e8f0', width: '40px', minWidth: '40px', maxWidth: '40px', padding: 0, textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIds.length > 0 && selectedStudentIds.length === visibleStudents.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th style={{ position: 'sticky', left: '40px', background: 'var(--card-bg)', zIndex: 20, borderRight: '1px solid #e2e8f0' }}>학생</th>
                                {isAdmission && (
                                    <th style={{ minWidth: '120px', textAlign: 'center', borderRight: '2px solid #94a3b8', background: '#f0f9ff' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#0284c7', whiteSpace: 'nowrap' }}>응시 일자</div>
                                    </th>
                                )}
                                {examType === 'VOCAB' && (
                                    <th style={{ minWidth: '70px', textAlign: 'center', borderRight: '2px solid #94a3b8', background: '#fffbeb' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#d97706', whiteSpace: 'nowrap' }}>어휘</div>
                                        <div style={{ fontSize: '0.7rem', color: '#d97706', whiteSpace: 'nowrap' }}>(10점)</div>
                                    </th>
                                )}
                                {questions.map((q, idx) => (
                                    <th key={q.id} style={{
                                        minWidth: '60px',
                                        textAlign: 'center',
                                        borderRight: (idx + 1) % 5 === 0 ? '2px solid #94a3b8' : 'none',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>문항{idx + 1}</div>
                                        <div style={{ fontSize: '0.7rem' }}>{q.type}</div>
                                        <div style={{ fontSize: '0.7rem' }}>({q.score}점)</div>
                                    </th>
                                ))}
                                <th style={{ whiteSpace: 'nowrap' }}>정답문항수</th>
                                <th style={{ whiteSpace: 'nowrap', minWidth: '150px' }}>비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map(s => {
                                // Calculate correct answer count (excluding vocab)
                                let correctCount = 0
                                questions.forEach(q => {
                                    if (answers[s.id]?.[q.id] === q.answer) correctCount++
                                })

                                // Total question count (without vocab)
                                const totalQuestions = questions.length

                                return (
                                    <tr key={s.id} style={{ background: selectedStudentIds.includes(s.id) ? 'rgba(71, 85, 105, 0.4)' : 'transparent' }}>
                                        <td style={{ position: 'sticky', left: 0, background: selectedStudentIds.includes(s.id) ? 'var(--card-border)' : 'var(--card-bg)', borderRight: '1px solid #e2e8f0', zIndex: 11, width: '40px', minWidth: '40px', maxWidth: '40px', padding: 0, textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(s.id)}
                                                onChange={() => toggleSelectRow(s.id)}
                                            />
                                        </td>
                                        <td style={{ position: 'sticky', left: '40px', background: selectedStudentIds.includes(s.id) ? 'var(--card-border)' : 'var(--card-bg)', fontWeight: 'bold', borderRight: '1px solid #e2e8f0', zIndex: 11, whiteSpace: 'nowrap', padding: '0 0.5rem' }}>
                                            {s.name} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>{s.class}</span>
                                        </td>
                                        {isAdmission && (
                                            <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '2px solid #94a3b8', background: '#f0f9ff' }}>
                                                <input
                                                    type="date"
                                                    value={testDates[s.id] || ''}
                                                    onChange={(e) => setTestDates(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                    className="input"
                                                    style={{
                                                        width: '120px',
                                                        textAlign: 'center',
                                                        padding: '0.25rem',
                                                        borderColor: '#0284c7',
                                                        color: '#0284c7',
                                                        fontWeight: 'bold'
                                                    }}
                                                    data-input-type="grid-input"
                                                />
                                            </td>
                                        )}
                                        {examType === 'VOCAB' && (
                                            <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '2px solid #94a3b8', background: '#fffbeb' }}>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={vocabScores[s.id] ?? ''}
                                                    onChange={(e) => handleVocabScoreChange(s.id, e.target.value)}
                                                    className="input"
                                                    style={{
                                                        width: '40px',
                                                        textAlign: 'center',
                                                        padding: '0.25rem',
                                                        borderColor: '#d97706',
                                                        color: '#d97706',
                                                        fontWeight: 'bold'
                                                    }}
                                                    data-input-type="grid-input"
                                                />
                                            </td>
                                        )}
                                        {questions.map((q, idx) => (
                                            <td key={q.id} style={{
                                                padding: '0.5rem',
                                                textAlign: 'center',
                                                borderRight: (idx + 1) % 5 === 0 ? '2px solid #94a3b8' : 'none'
                                            }}>
                                                <input
                                                    value={answers[s.id]?.[q.id] || ''}
                                                    onFocus={(e) => e.target.select()}
                                                    onKeyDown={(e) => {
                                                        // Allow navigation
                                                        if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return

                                                        // Handle Backspace/Delete
                                                        if (e.key === 'Backspace' || e.key === 'Delete') {
                                                            e.preventDefault()
                                                            handleAnswerChange(s.id, q.id, '')
                                                            return
                                                        }

                                                        // Handle single char input (overwrite)
                                                        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                                                            e.preventDefault()
                                                            handleAnswerChange(s.id, q.id, e.key)
                                                            focusNextInput(e.currentTarget)
                                                        }
                                                    }}
                                                    onChange={() => { }}
                                                    className="input"
                                                    style={{
                                                        width: '40px',
                                                        textAlign: 'center',
                                                        padding: '0.25rem',
                                                        borderColor: answers[s.id]?.[q.id] === q.answer ? 'var(--success)' :
                                                            answers[s.id]?.[q.id] ? 'var(--error)' : 'var(--card-border)'
                                                    }}
                                                    data-input-type="grid-input"
                                                />
                                            </td>
                                        ))}
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{correctCount}/{totalQuestions}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={remarks[s.id] || ''}
                                                onChange={(e) => setRemarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                placeholder="비고 입력"
                                                className="input"
                                                style={{
                                                    width: '100%',
                                                    minWidth: '150px',
                                                    padding: '0.25rem 0.5rem'
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
