'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudentExamHistory, getStudentReportData } from '@/app/actions'
import DetailedReportCard from './DetailedReportCard'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import { formatMonthWeek } from '@/lib/date-utils'

type StudentData = {
    id: string
    name: string
    grade: number
    class: string
    remarks?: string
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
    const searchParams = useSearchParams()
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [historyModalStudent, setHistoryModalStudent] = useState<{ id: string, name: string } | null>(null)
    const [examHistory, setExamHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [examSelectionModal, setExamSelectionModal] = useState<{ studentId: string, studentName: string, exams: any[] } | null>(null)
    const [selectedExamForPrint, setSelectedExamForPrint] = useState<number | null>(null)

    // For Modal Report View
    const [viewingReportData, setViewingReportData] = useState<ProcessedReportData | null>(null)
    const [loadingReport, setLoadingReport] = useState(false)

    // Filters
    // Clear selection when exam changes
    useEffect(() => {
        setSelectedStudentIds([])
        setSelectedClass('') // Reset class filter on exam change too, or keep it? Reset seems safer to avoid empty states.
        setSearchQuery('') // Reset search on exam change
    }, [selectedExamId])

    // Auto-print when URL has autoPrint parameter
    useEffect(() => {
        const autoPrint = searchParams.get('autoPrint')
        const studentId = searchParams.get('studentId')

        if (autoPrint === 'true' && studentId && selectedExamId && detailedReports.length > 0) {
            // Auto-select the student
            setSelectedStudentIds([studentId])

            // Trigger print after a short delay to ensure DOM is ready
            setTimeout(() => {
                window.print()
            }, 500)
        }
    }, [searchParams, selectedExamId, detailedReports])

    // Clear selection when search query or class filter changes
    useEffect(() => {
        setSelectedStudentIds([])
    }, [searchQuery, selectedClass])

    const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        if (id) {
            router.push(`/reports?examId=${id}`)
        } else {
            router.push('/reports')
        }
    }

    const toggleSelect = (id: string) => {
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
        ? detailedReports.map(r => ({ ...r.student, info: `${r.totalScore}점`, remarks: (r as any).remarks || '' }))
        : students.map(s => ({ ...s, info: `${s.records.length}회 응시` }))

    let currentList = selectedClass
        ? baseList.filter(s => s.class === selectedClass)
        : baseList

    // Apply search filter (by name or card number/ID)
    if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        currentList = currentList.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            (s.remarks && s.remarks.toLowerCase().includes(query))
        )
    }

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

    const handlePrint = async () => {
        // Smart print: if single student selected without exam, check their exam count
        if (selectedStudentIds.length === 1 && !selectedExamId) {
            const studentId = selectedStudentIds[0]
            const student = currentList.find(s => s.id === studentId)
            if (!student) return

            try {
                const history = await getStudentExamHistory(studentId)

                if (history.length === 0) {
                    alert('응시한 시험이 없습니다.')
                    return
                } else if (history.length === 1) {
                    // Auto-select the only exam and trigger print
                    router.push(`/reports?examId=${history[0].examId}&autoPrint=true&studentId=${studentId}`)
                    return
                } else {
                    // Show exam selection modal with print functionality
                    setExamSelectionModal({
                        studentId,
                        studentName: student.name,
                        exams: history
                    })
                    setSelectedExamForPrint(null) // Reset selection
                    return
                }
            } catch (e) {
                console.error('Failed to check exam history', e)
            }
        }

        // Default print behavior
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleShowHistory = async (studentId: string, studentName: string) => {
        setHistoryModalStudent({ id: studentId, name: studentName })
        setLoadingHistory(true)
        try {
            const history = await getStudentExamHistory(studentId)
            setExamHistory(history)
        } catch (e) {
            console.error('Failed to load exam history', e)
            setExamHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleViewReport = async (studentId: string, examId: number) => {
        setLoadingReport(true)
        try {
            const data = await getStudentReportData(studentId, examId)
            setViewingReportData(data)
        } catch (e) {
            console.error('Failed to load report data', e)
            alert('리포트를 불러오는데 실패했습니다.')
        } finally {
            setLoadingReport(false)
        }
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
                                        {e.name} ({formatMonthWeek(e.date)}) - {formatGrade(e.grade)}
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

                        <div>
                            <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>검색:</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="이름, 카드번호, 비고"
                                style={{ width: 'auto', display: 'inline-block', minWidth: '200px' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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
                                    <th style={{ width: '40px', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>#</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>이름</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>카드번호</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>학년</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>{isDetailedMode ? '점수' : '응시 정보'}</th>
                                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>비고</th>
                                    <th style={{ width: '100px', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>응시 시험</th>
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
                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.id}</td>
                                        <td>{formatGrade(s.grade)}</td>
                                        <td>{s.info}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.remarks || '-'}</td>
                                        <td>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleShowHistory(s.id, s.name)
                                                }}
                                                className="btn"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#f1f5f9' }}
                                            >
                                                조회
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {currentList.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
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
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        시험을 선택해주세요.
                    </div>
                )}
            </div>

            {historyModalStudent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '500px', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto', color: '#000' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{historyModalStudent.name} - 응시 시험 내역</h3>
                            <button onClick={() => setHistoryModalStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        {loadingHistory ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>로딩 중...</div>
                        ) : examHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>응시한 시험이 없습니다.</div>
                        ) : (
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>시험 이름</th>
                                        <th>학년</th>
                                        <th>날짜</th>
                                        <th>점수</th>
                                        <th>리포트</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examHistory.map(record => (
                                        <tr key={record.examId}>
                                            <td>{record.examName}</td>
                                            <td>{formatGrade(record.grade)}</td>
                                            <td>{formatMonthWeek(record.date)}</td>
                                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{record.totalScore}점</td>
                                            <td>
                                                <button
                                                    onClick={() => handleViewReport(historyModalStudent.id, record.examId)}
                                                    className="btn"
                                                    disabled={loadingReport}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.8rem',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        opacity: loadingReport ? 0.7 : 1
                                                    }}
                                                >
                                                    {loadingReport ? '로딩...' : '리포트 보기'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <button onClick={() => setHistoryModalStudent(null)} className="btn" style={{ marginTop: '1rem', width: '100%', background: '#334155', color: 'white' }}>닫기</button>
                    </div>
                </div>
            )}

            {examSelectionModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '500px', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto', color: '#000' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{examSelectionModal.studentName} - 출력할 시험 선택</h3>
                            <button onClick={() => setExamSelectionModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>출력할 시험을 선택해주세요:</p>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {examSelectionModal.exams.map(record => (
                                <label
                                    key={record.examId}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '4px',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer',
                                        background: selectedExamForPrint === record.examId ? '#f1f5f9' : 'white'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="examSelection"
                                        value={record.examId}
                                        checked={selectedExamForPrint === record.examId}
                                        onChange={() => setSelectedExamForPrint(record.examId)}
                                        style={{ marginRight: '0.75rem' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{record.examName}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {formatGrade(record.grade)} | {formatMonthWeek(record.date)} | {record.totalScore}점
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    if (selectedExamForPrint) {
                                        setExamSelectionModal(null)
                                        router.push(`/reports?examId=${selectedExamForPrint}&autoPrint=true&studentId=${examSelectionModal.studentId}`)
                                    } else {
                                        alert('시험을 선택해주세요.')
                                    }
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                리포트 출력
                            </button>
                            <button
                                onClick={() => setExamSelectionModal(null)}
                                className="btn"
                                style={{ flex: 1, background: '#f1f5f9' }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewingReportData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div style={{
                        background: '#525252', // Dark background for contrast against the white report
                        width: '100%', height: '100%',
                        overflowY: 'auto',
                        padding: '2rem',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div className="no-print" style={{ width: '100%', maxWidth: '297mm', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>

                            <button
                                onClick={() => setViewingReportData(null)}
                                className="btn"
                                style={{
                                    background: 'white',
                                    color: '#333',
                                    fontWeight: 'bold',
                                    padding: '0.5rem 1.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                닫기
                            </button>
                        </div>

                        {/* Report Container - ensure it's centered and has print styles applied if user prints from browser, though this is a modal view */}
                        <DetailedReportCard data={viewingReportData} isModal={true} />
                    </div>
                </div>
            )}
        </div>
    )
}
