'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DetailedReportCard from './DetailedReportCard'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

type StudentData = {
    id: number
    name: string
    grade: number
    class: string
    records: any[]
}

type Props = {
    exams: { id: number, name: string, date: Date, grade: number, class: string }[]
    selectedExamId?: number
    detailedReports: ProcessedReportData[]
    students: StudentData[]
}

export default function ReportPrinter({ exams, selectedExamId, detailedReports, students }: Props) {
    const router = useRouter()
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')

    // Filters
    // Clear selection when exam changes
    useEffect(() => {
        setSelectedStudentIds([])
        setSelectedClass('') // Reset class filter on exam change too, or keep it? Reset seems safer to avoid empty states.
    }, [selectedExamId])

    const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        if (id) {
            router.push(`/reports?examId=${id}`)
        } else {
            router.push('/reports')
        }
    }

    const toggleSelect = (id: number) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id))
        } else {
            setSelectedStudentIds([...selectedStudentIds, id])
        }
    }

    // Determine what to show based on mode
    const isDetailedMode = !!selectedExamId

    // Filter by Class first
    const baseList = isDetailedMode
        ? detailedReports.map(r => ({ ...r.student, info: `${r.totalScore}점` }))
        : students.map(s => ({ ...s, info: `${s.records.length}회 응시` }))

    const currentList = selectedClass
        ? baseList.filter(s => s.class === selectedClass)
        : baseList

    const toggleAll = () => {
        const targetIds = currentList.map(s => s.id)

        // If all currently visible are selected, deselect them.
        // Otherwise, select ALL currently visible (adding to existing selection if we want additive, but simpler to just set set to visible?)
        // Standard "Select All" usually selects all visible items.

        const allVisibleSelected = targetIds.every(id => selectedStudentIds.includes(id))

        if (allVisibleSelected) {
            // Deselect visible ones
            setSelectedStudentIds(prev => prev.filter(id => !targetIds.includes(id)))
        } else {
            // Select all visible ones (merge unique)
            const newSet = new Set([...selectedStudentIds, ...targetIds])
            setSelectedStudentIds(Array.from(newSet))
        }
    }

    const handlePrint = () => {
        // Use timeout to ensure DOM updates are flushed and browser is ready
        setTimeout(() => {
            window.print()
        }, 100)
    }

    return (
        <div>
            <div className="no-print">
                <div className="card" style={{ marginBottom: '2rem' }}>

                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>시험 선택:</label>
                            <select
                                className="input"
                                style={{ width: 'auto', display: 'inline-block' }}
                                value={selectedExamId || ''}
                                onChange={handleExamChange}
                            >
                                <option value="">-- 시험을 선택해주세요 --</option>
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>
                                        {e.name} ({e.date.toLocaleDateString('ko-KR')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>반 선택:</label>
                            <select
                                className="input"
                                style={{ width: 'auto', display: 'inline-block', minWidth: '120px' }}
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">전체 (모든 반)</option>
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <button
                                onClick={toggleAll}
                                className="btn"
                                style={{ marginRight: '1rem', background: '#334155', color: 'white' }}
                                disabled={currentList.length === 0}
                            >
                                {currentList.length > 0 && selectedStudentIds.length === currentList.length ? '전체 해제' : '전체 선택'}
                            </button>
                            <span style={{ color: '#94a3b8' }}>{selectedStudentIds.length} 명 선택됨</span>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="btn btn-primary"
                            disabled={selectedStudentIds.length === 0}
                        >
                            선택한 리포트 출력
                        </button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>이름</th>
                                    <th>학년</th>
                                    <th>{isDetailedMode ? '점수' : '응시 정보'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.map(s => (
                                    <tr key={s.id} onClick={() => toggleSelect(s.id)} style={{ cursor: 'pointer', background: selectedStudentIds.includes(s.id) ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(s.id)}
                                                onChange={() => { }}
                                            />
                                        </td>
                                        <td>{s.name}</td>
                                        <td>{formatGrade(s.grade)}</td>
                                        <td>{s.info}</td>
                                    </tr>
                                ))}
                                {currentList.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="print-only">
                {isDetailedMode ? (
                    detailedReports
                        .filter(r => selectedStudentIds.includes(r.student.id))
                        .map((r, index, array) => (
                            <div key={r.student.id} className={index < array.length - 1 ? "print-page-break" : ""}>
                                <DetailedReportCard data={r} />
                            </div>
                        ))
                ) : (
                    // Fallback for simple list printing if needed, or disable it
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        시험을 선택해주세요.
                    </div>
                )}
            </div>
        </div>
    )
}
