'use client'

import { useState, useMemo } from 'react'
import { saveExamRecords, deleteExamRecord } from '@/app/actions/exams'
import { CLASSES } from '@/lib/classes'
import { GRADES } from '@/lib/grades'

type Props = {
    examId: number
    students: any[] // We can refine types later
    questions: any[]
    records: any[]
}

export default function ScoreInputGrid({ examId, students, questions, records }: Props) {
    // Initialize state with existing records
    const initialAnswers: Record<number, Record<string, string>> = {}
    const initialVisibleStudentIds: number[] = []

    students.forEach(s => {
        const record = records.find(r => r.studentId === s.id)
        if (record && record.studentAnswers) {
            try {
                initialAnswers[s.id] = JSON.parse(record.studentAnswers)
                initialVisibleStudentIds.push(s.id)
            } catch (e) {
                initialAnswers[s.id] = {}
            }
        } else {
            initialAnswers[s.id] = {}
        }
    })

    const [answers, setAnswers] = useState(initialAnswers)
    const [saving, setSaving] = useState(false)
    const [visibleStudentIds, setVisibleStudentIds] = useState<number[]>(initialVisibleStudentIds)
    const [targetGrade, setTargetGrade] = useState<number | ''>('')
    const [targetClass, setTargetClass] = useState<string>("")

    // Filter students by visibility
    const visibleStudents = useMemo(() => {
        const sorted = students.filter(s => visibleStudentIds.includes(s.id))
        // Sort by Grade, then Class, then Name
        return sorted.sort((a, b) => {
            if (a.grade !== b.grade) return a.grade - b.grade
            if (a.class !== b.class) return a.class.localeCompare(b.class)
            return a.name.localeCompare(b.name)
        })
    }, [students, visibleStudentIds])

    const handleAnswerChange = (studentId: number, qId: number, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [qId]: value
            }
        }))
    }

    const handleAddClass = () => {
        if (!targetClass || targetGrade === '') return
        // Find all students in this grade AND class
        const studentsInClass = students.filter(s => s.class === targetClass && s.grade === targetGrade)

        // Add only those not already visible
        const newIds = studentsInClass
            .map(s => s.id)
            .filter(id => !visibleStudentIds.includes(id))

        if (newIds.length > 0) {
            setVisibleStudentIds(prev => [...prev, ...newIds])
        }
        setTargetClass("")
    }

    const handleRemoveStudent = async (studentId: number) => {
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
            } catch (e) {
                console.error(e)
                alert('삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const handleSave = async () => {
        setSaving(true)
        // Only save answers for students in the current view? Or all?
        // Let's save ONLY visible students to allow "removing" a student effectively by hiding them?
        // Actually, if we want to delete a record, we might need explicit delete logic.
        // For now, let's save all answers that match visible students to ensure WYSIWYG.
        const submissions = visibleStudents.map(s => ({
            studentId: s.id,
            answers: answers[s.id] || {}
        }))

        try {
            await saveExamRecords(examId, submissions)
            alert('점수가 성공적으로 저장되었습니다!')
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
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>학생 추가:</span>
                    <select
                        value={targetGrade}
                        onChange={(e) => setTargetGrade(e.target.value ? parseInt(e.target.value) : '')}
                        className="input"
                        style={{ padding: '0.5rem', minWidth: '100px' }}
                    >
                        <option value="">학년 선택</option>
                        {GRADES.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                    <select
                        value={targetClass}
                        onChange={(e) => setTargetClass(e.target.value)}
                        className="input"
                        style={{ padding: '0.5rem', minWidth: '150px' }}
                    >
                        <option value="">반 선택</option>
                        {CLASSES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddClass}
                        disabled={!targetClass || targetGrade === ''}
                        className="btn"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        해당 반 전체 추가
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <div style={{ overflowX: 'auto' }} className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 10 }}>학생</th>
                                {questions.map((q, idx) => (
                                    <th key={q.id} style={{ minWidth: '60px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>문항{idx + 1}</div>
                                        <div style={{ fontSize: '0.7rem' }}>{q.type}</div>
                                        <div style={{ fontSize: '0.7rem' }}>({q.score}점)</div>
                                    </th>
                                ))}
                                <th>총점</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleStudents.map(s => {
                                // Calculate preview score locally
                                let currentScore = 0
                                questions.forEach(q => {
                                    if (answers[s.id]?.[q.id] === q.answer) currentScore += q.score
                                })

                                return (
                                    <tr key={s.id}>
                                        <td style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', fontWeight: 'bold' }}>
                                            <div>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.class} ({s.id})</div>
                                        </td>
                                        {questions.map(q => (
                                            <td key={q.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                <input
                                                    value={answers[s.id]?.[q.id] || ''}
                                                    onChange={(e) => handleAnswerChange(s.id, q.id, e.target.value)}
                                                    className="input"
                                                    style={{
                                                        width: '40px',
                                                        textAlign: 'center',
                                                        padding: '0.25rem',
                                                        borderColor: answers[s.id]?.[q.id] === q.answer ? 'var(--success)' :
                                                            answers[s.id]?.[q.id] ? 'var(--error)' : 'var(--card-border)'
                                                    }}
                                                />
                                            </td>
                                        ))}
                                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{currentScore}</td>
                                        <td>
                                            <button
                                                onClick={() => handleRemoveStudent(s.id)}
                                                style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                삭제
                                            </button>
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
