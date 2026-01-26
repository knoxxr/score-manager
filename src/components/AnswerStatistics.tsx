'use client'

import React, { useMemo } from 'react'

type Question = {
    id: number
    type: string
    score: number
    answer: string
}

type ExamRecord = {
    id: number
    studentId: number
    studentAnswers: string // JSON string
}

interface AnswerStatisticsProps {
    questions: Question[]
    records: ExamRecord[]
}

export default function AnswerStatistics({ questions, records }: AnswerStatisticsProps) {
    const incorrectStats = useMemo(() => {
        if (!questions.length || !records.length) return []

        const stats = questions.map(q => ({
            ...q,
            incorrectCount: 0,
            totalCount: 0
        }))

        records.forEach(record => {
            try {
                const answers = JSON.parse(record.studentAnswers) as Record<string, string>

                stats.forEach(stat => {
                    const studentAnswer = answers[stat.id.toString()]
                    // Count only if attempted (or should we count unattempted as wrong? usually unattempted is wrong)
                    // Let's assume strict matching. If not equal, it's incorrect.

                    // Normalize comparison (trim)
                    const isCorrect = studentAnswer && studentAnswer.trim() === stat.answer.trim()

                    if (!isCorrect) {
                        stat.incorrectCount++
                    }
                    stat.totalCount++
                })
            } catch (e) {
                console.error("Failed to parse student answers", e)
            }
        })

        // Sort by incorrect count desc
        return stats
            .filter(s => s.incorrectCount > 0)
            .sort((a, b) => b.incorrectCount - a.incorrectCount)
            .slice(0, 5) // Top 5
    }, [questions, records])

    if (incorrectStats.length === 0) return null

    return (
        <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #334155'
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                📉 오답률 상위 문제 (Top 5)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {incorrectStats.map((stat) => (
                    <div key={stat.id} style={{
                        padding: '1rem',
                        backgroundColor: '#0f172a',
                        borderRadius: '0.375rem',
                        border: '1px solid #334155'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>#{stat.id}번</span>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{stat.type}</span>
                        </div>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                            정답: {stat.answer}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                flex: 1,
                                height: '6px',
                                backgroundColor: '#334155',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(stat.incorrectCount / stat.totalCount) * 100}%`,
                                    height: '100%',
                                    backgroundColor: '#ef4444'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 'bold' }}>
                                {stat.incorrectCount}명 오답
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
