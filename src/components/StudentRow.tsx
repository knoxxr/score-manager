'use client'

import { useState } from 'react'
import { deleteStudent, updateStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

type Student = {
    id: string
    name: string
    grade: number
    class: string
    schoolName?: string | null
    phoneNumber: string
    teacher?: { name: string } | null
}

export default function StudentRow({ student, isSelected, onSelect }: { student: Student, isSelected?: boolean, onSelect?: (checked: boolean) => void }) {
    const [isEditing, setIsEditing] = useState(false)
    const [newId, setNewId] = useState(student.id)
    const [name, setName] = useState(student.name)
    const [schoolName, setSchoolName] = useState(student.schoolName || '')
    const [grade, setGrade] = useState(student.grade)
    const [cls, setCls] = useState(student.class)
    const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber)

    const handleSave = async () => {
        const formData = new FormData()
        formData.append('id', newId) // New ID
        formData.append('name', name)
        formData.append('schoolName', schoolName)
        formData.append('grade', grade.toString())
        formData.append('class', cls)
        formData.append('phoneNumber', phoneNumber)

        await updateStudent(student.id, formData) // Pass OLD ID for lookup
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <tr className={isSelected ? 'bg-slate-50' : ''}>
                <td>
                    {onSelect && (
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect(e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                        />
                    )}
                </td>
                <td>
                    <input
                        value={newId}
                        onChange={e => {
                            const val = e.target.value.replace(/[^0-9]/g, '')
                            if (val.length <= 5) setNewId(val)
                        }}
                        className="input"
                        style={{ padding: '0.25rem', width: '60px' }}
                        placeholder="번호"
                    />
                </td>
                <td>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem', width: '80px' }}
                        placeholder="이름"
                    />
                </td>
                <td>
                    <input
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem', width: '100px' }}
                        placeholder="학교명"
                    />
                </td>
                <td>
                    <select
                        value={grade}
                        onChange={e => setGrade(parseInt(e.target.value))}
                        className="input"
                        style={{ padding: '0.25rem', width: '80px' }}
                    >
                        {GRADES.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                </td>
                <td>
                    <select
                        value={cls}
                        onChange={e => setCls(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem', width: '70px' }}
                    >
                        {CLASSES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </td>
                <td>-</td>
                <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>저장</button>
                        <button onClick={() => setIsEditing(false)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#334155' }}>취소</button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr className={isSelected ? 'bg-slate-50' : ''}>
            <td>
                {onSelect && (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                    />
                )}
            </td>
            <td>{student.id}</td>
            <td>{student.name}</td>
            <td>{student.schoolName || '-'}</td>
            <td>{formatGrade(student.grade)}</td>
            <td>{student.class}</td>
            <td>{student.teacher?.name || '-'}</td>
            <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setIsEditing(true)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white' }}>수정</button>
                    <button onClick={() => deleteStudent(student.id)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--error)' }}>삭제</button>
                </div>
            </td>
        </tr>
    )
}
