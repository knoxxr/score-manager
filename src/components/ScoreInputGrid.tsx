'use client'

import { useState } from 'react'
import { saveExamRecords } from '@/app/actions/exams'

type Props = {
    examId: number
    students: any[] // We can refine types later
    questions: any[]
    records: any[]
}

export default function ScoreInputGrid({ examId, students, questions, records }: Props) {
    // Initialize state with existing records
    const initialAnswers: Record<number, Record<string, string>> = {}

    students.forEach(s => {
        const record = records.find(r => r.studentId === s.id)
        if (record && record.studentAnswers) {
            try {
                initialAnswers[s.id] = JSON.parse(record.studentAnswers)
            } catch (e) {
                initialAnswers[s.id] = {}
            }
        } else {
            initialAnswers[s.id] = {}
        }
    })

    const [answers, setAnswers] = useState(initialAnswers)
    const [saving, setSaving] = useState(false)

    const handleAnswerChange = (studentId: number, qId: number, value: string) => {
        setAnswers(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [qId]: value
            }
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        const submissions = Object.entries(answers).map(([studentId, ans]) => ({
            studentId: parseInt(studentId),
            answers: ans
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                >
                    {saving ? '저장 중...' : '전체 저장'}
                </button>
            </div>

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
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => {
                            // Calculate preview score locally
                            let currentScore = 0
                            questions.forEach(q => {
                                if (answers[s.id]?.[q.id] === q.answer) currentScore += q.score
                            })

                            return (
                                <tr key={s.id}>
                                    <td style={{ position: 'sticky', left: 0, background: 'var(--card-bg)', fontWeight: 'bold' }}>
                                        {s.name} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({s.id})</span>
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
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
