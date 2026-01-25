'use client'

import { useState } from 'react'
import { deleteStudent, updateStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

type Student = {
    id: number
    name: string
    grade: number
    class: string
    phoneNumber: string
    teacher?: { name: string } | null
}

export default function StudentRow({ student }: { student: Student }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(student.name)
    const [grade, setGrade] = useState(student.grade)
    const [cls, setCls] = useState(student.class)
    const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber)

    const handleSave = async () => {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('grade', grade.toString())
        formData.append('class', cls)
        formData.append('phoneNumber', phoneNumber)

        await updateStudent(student.id, formData)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <tr>
                <td>{student.id}</td>
                <td>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem' }}
                    />
                </td>
                <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    </div>
                </td>
                <td>
                    <input
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem' }}
                    />
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
        <tr>
            <td>{student.id}</td>
            <td>{student.name}</td>
            <td>{formatGrade(student.grade)} {student.class}반</td>
            <td>{student.phoneNumber}</td>
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
