'use client'

import { useState, useMemo } from 'react'
import { saveExamRecords, deleteExamRecord, deleteExamRecords } from '@/app/actions/exams'
import { CLASSES } from '@/lib/classes'
import { GRADES, formatGrade } from '@/lib/grades'
import { useRouter } from 'next/navigation'

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
}

type Student = {
    id: string
    name: string
    grade: number
    class: string
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
    initialVocabScores = {}
}: Props) {
    const [students, setStudents] = useState<Student[]>(initialStudents)
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>(initialAnswers)
    const [vocabScores, setVocabScores] = useState<Record<string, number>>(initialVocabScores)
    const [saving, setSaving] = useState(false)
    const [visibleStudentIds, setVisibleStudentIds] = useState<string[]>(initialVisibleStudentIds)
    const [targetGrade, setTargetGrade] = useState<number | ''>(defaultGrade || '')
    const [targetClass, setTargetClass] = useState<string>(defaultClass || '')

    // Row Selection for Deletion
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

    // Filter students by visibility
    const visibleStudents = useMemo(() => {
        const sorted = students.filter(s => visibleStudentIds.includes(s.id))
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
    }, [students, visibleStudentIds])

    const handleClassChange = (newClass: string) => {
        setTargetClass(newClass)
        if (!newClass) {
            setVisibleStudentIds([])
            return
        }

        const gradeToUse = defaultGrade || (targetGrade as number)

        const classStudents = students.filter(s =>
            s.class === newClass && s.grade === gradeToUse
        )

        const newIds = classStudents.map(s => s.id)
        setVisibleStudentIds(newIds)
        setSelectedStudentIds([])
    }

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

    const handleSave = async () => {
        setSaving(true)
        const allStudentIds = Array.from(new Set([...Object.keys(answers), ...Object.keys(vocabScores)]))
        const submissions = allStudentIds.map(sid => ({
            studentId: sid,
            answers: answers[sid] || {},
            vocabScore: vocabScores[sid] || 0
        }))

        try {
            await saveExamRecords(examId, submissions)
            alert('모든 학생의 점수가 성공적으로 저장되었습니다!')
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
                        {CLASSES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                {!isAdmission && (
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
                                <th>총점</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map(s => {
                                // Calculate preview score locally
                                let currentScore = 0
                                questions.forEach(q => {
                                    if (answers[s.id]?.[q.id] === q.answer) currentScore += q.score
                                })

                                const vScore = vocabScores[s.id] || 0
                                if (!isAdmission) {
                                    currentScore += vScore
                                }

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
                                        {!isAdmission && (
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
                                                    onChange={(e) => {
                                                        handleAnswerChange(s.id, q.id, e.target.value)
                                                        if (e.target.value.length === 1) {
                                                            focusNextInput(e.target)
                                                        }
                                                    }}
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
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{currentScore}</td>
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
