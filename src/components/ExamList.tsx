'use client'

import { useState } from 'react'
import Link from 'next/link'
import DeleteExamButton from './DeleteExamButton'
import { formatGrade } from '@/lib/grades'
import { formatMonthWeek } from '@/lib/date-utils'

type Exam = {
    id: number
    name: string
    date: Date
    grade: number
    class: string
    type?: string
}

export default function ExamList({ exams }: { exams: Exam[] }) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const sortedExams = [...exams].sort((a, b) => {
        if (!sortConfig) return 0

        let aValue: any = a[sortConfig.key as keyof Exam]
        let bValue: any = b[sortConfig.key as keyof Exam]

        if (sortConfig.key === 'date') {
            aValue = new Date(a.date).getTime()
            bValue = new Date(b.date).getTime()
        } else if (sortConfig.key === 'grade') {
            aValue = a.grade
            bValue = b.grade
        } else if (sortConfig.key === 'name') {
            aValue = a.name
            bValue = b.name
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const getSortIndicator = (key: string) => {
        if (sortConfig?.key !== key) return ' ↕'
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
    }

    const thStyle = { cursor: 'pointer', userSelect: 'none' as const, position: 'sticky' as const, top: 0, background: 'white', zIndex: 10 }

    return (
        <table className="table">
            <thead>
                <tr>
                    <th style={thStyle} onClick={() => handleSort('date')}>
                        시험 날짜{getSortIndicator('date')}
                    </th>
                    <th style={thStyle} onClick={() => handleSort('date')}>
                        주차{getSortIndicator('date')}
                    </th>
                    <th style={thStyle} onClick={() => handleSort('name')}>
                        시험 이름{getSortIndicator('name')}
                    </th>
                    <th style={thStyle} onClick={() => handleSort('grade')}>
                        대상 학년{getSortIndicator('grade')}
                    </th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>관리</th>
                </tr>
            </thead>
            <tbody>
                {sortedExams.length === 0 ? (
                    <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            시험이 없습니다.
                        </td>
                    </tr>
                ) : (
                    sortedExams.map((e) => (
                        <tr key={e.id}>
                            <td>{new Date(e.date).toLocaleDateString('ko-KR')}</td>
                            <td>{formatMonthWeek(new Date(e.date))}</td>
                            <td>
                                <Link href={`/exams/${e.id}`} style={{ textDecoration: 'underline', color: 'var(--primary)' }}>
                                    {e.name}
                                </Link>
                                {e.type === 'VOCAB' && (
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        fontSize: '0.8rem',
                                        background: '#fef3c7',
                                        color: '#d97706',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px',
                                        fontWeight: 'bold'
                                    }}>
                                        어휘
                                    </span>
                                )}
                            </td>
                            <td>{formatGrade(e.grade)}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link href={`/exams/${e.id}/edit`} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white' }}>
                                        수정
                                    </Link>
                                    <DeleteExamButton id={e.id} />
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    )
}
