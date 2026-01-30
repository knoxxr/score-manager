'use client'

import { useState } from 'react'
import StudentRow from './StudentRow'
import { deleteStudents } from '@/app/actions'

type Student = {
    id: string
    name: string
    grade: number
    class: string
    schoolName?: string | null
    phoneNumber: string
    teacher?: { name: string } | null
}

export default function StudentList({ students }: { students: Student[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(students.map(s => s.id)))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return
        if (confirm(`${selectedIds.size}명의 학생을 삭제하시겠습니까?`)) {
            await deleteStudents(Array.from(selectedIds))
            setSelectedIds(new Set())
        }
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const sortedStudents = [...students].sort((a, b) => {
        if (!sortConfig) return 0

        let aValue: any = a[sortConfig.key as keyof Student]
        let bValue: any = b[sortConfig.key as keyof Student]

        if (sortConfig.key === 'teacher') {
            aValue = a.teacher?.name || ''
            bValue = b.teacher?.name || ''
        } else if (sortConfig.key === 'grade') {
            aValue = a.grade
            bValue = b.grade
        } else if (sortConfig.key === 'class') {
            aValue = a.class
            bValue = b.class
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const getSortIndicator = (key: string) => {
        if (sortConfig?.key !== key) return ' ↕' // visual hint
        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
    }

    const thStyle = { cursor: 'pointer', userSelect: 'none' as const, position: 'sticky' as const, top: 0, background: 'white', zIndex: 10 }

    return (
        <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>
                    총 {students.length}명
                </div>
                {selectedIds.size > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        className="btn"
                        style={{ color: 'white', background: 'var(--error)' }}
                    >
                        선택 삭제 ({selectedIds.size})
                    </button>
                )}
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '40px', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <input
                                type="checkbox"
                                checked={students.length > 0 && selectedIds.size === students.length}
                                onChange={toggleSelectAll}
                                style={{ transform: 'scale(1.2)' }}
                            />
                        </th>
                        <th onClick={() => handleSort('id')} style={thStyle}>학번{getSortIndicator('id')}</th>
                        <th onClick={() => handleSort('name')} style={thStyle}>이름{getSortIndicator('name')}</th>
                        <th onClick={() => handleSort('schoolName')} style={thStyle}>학교명{getSortIndicator('schoolName')}</th>
                        <th onClick={() => handleSort('grade')} style={thStyle}>학년{getSortIndicator('grade')}</th>
                        <th onClick={() => handleSort('class')} style={thStyle}>반{getSortIndicator('class')}</th>
                        <th onClick={() => handleSort('teacher')} style={thStyle}>담당 선생님{getSortIndicator('teacher')}</th>
                        <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStudents.map((s) => (
                        <StudentRow
                            key={s.id}
                            student={s}
                            isSelected={selectedIds.has(s.id)}
                            onSelect={() => toggleSelect(s.id)}
                        />
                    ))}
                    {sortedStudents.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: '#64748b' }}>등록된 학생이 없습니다</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
