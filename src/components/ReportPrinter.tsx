'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DetailedReportCard from './DetailedReportCard'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'

type StudentData = {
    id: number
    name: string
    grade: number
    records: any[]
}

type Props = {
    exams: { id: number, name: string, date: Date, grade: number, class: string }[]
    teachers: { id: number, name: string, assignments: { grade: number, class: string }[] }[]
    selectedExamId?: number
    detailedReports: ProcessedReportData[]
    students: StudentData[]
}

export default function ReportPrinter({ exams, teachers, selectedExamId, detailedReports, students }: Props) {
    const router = useRouter()
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])

    // Filters
    const [filterTeacherId, setFilterTeacherId] = useState<number | null>(null)

    // Filter Logic
    const filteredExams = exams.filter(e => {
        if (filterTeacherId) {
            const teacher = teachers.find(t => t.id === filterTeacherId)
            if (!teacher) return true
            // Check if exam matches any assignment
            return teacher.assignments.some(a => a.grade === e.grade && a.class === e.class)
        }
        return true
    })

    const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = parseInt(e.target.value)
        setFilterTeacherId(id || null)
    }

    // Clear selection when exam changes
    useEffect(() => {
        setSelectedStudentIds([])
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

    const toggleAll = () => {
        if (selectedExamId) {
            // Context: Detailed Reports
            const targetIds = detailedReports.map(r => r.student.id)
            if (selectedStudentIds.length === targetIds.length) {
                setSelectedStudentIds([])
            } else {
                setSelectedStudentIds(targetIds)
            }
        } else {
            // Context: Student List
            const targetIds = students.map(s => s.id)
            if (selectedStudentIds.length === targetIds.length) {
                setSelectedStudentIds([])
            } else {
                setSelectedStudentIds(targetIds)
            }
        }
    }

    const handlePrint = () => {
        // Use timeout to ensure DOM updates are flushed and browser is ready
        setTimeout(() => {
            window.print()
        }, 100)
    }

    // Determine what to show based on mode
    const isDetailedMode = !!selectedExamId
    const currentList = isDetailedMode
        ? detailedReports.map(r => ({ ...r.student, info: `${r.totalScore}점` }))
        : students.map(s => ({ ...s, info: `${s.records.length}회 응시` }))

    return (
        <div>
            <div className="no-print">
                <div className="card" style={{ marginBottom: '2rem' }}>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <select
                            className="input"
                            style={{ width: 'auto' }}
                            onChange={handleTeacherChange}
                            value={filterTeacherId || ''}
                        >
                            <option value="">-- 선생님 선택 --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.assignments.map(a => `${formatGrade(a.grade)} ${a.class}`).join(', ')})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>시험 선택:</label>
                        <select
                            className="input"
                            style={{ width: 'auto', display: 'inline-block' }}
                            value={selectedExamId || ''}
                            onChange={handleExamChange}
                        >
                            <option value="">-- 시험을 선택해주세요 --</option>
                            {filteredExams.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.date.toLocaleDateString('ko-KR')} | {formatGrade(e.grade)} {e.class}반)</option>
                            ))}
                        </select>
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
