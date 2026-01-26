'use client'

import { useState } from 'react'
import { deleteTeacher, updateTeacher, addTeacherAssignment, removeTeacherAssignment } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

type Teacher = {
    id: number
    name: string
    assignments: {
        id: number
        grade: number
        class: string
    }[]
}

export default function TeacherRow({ teacher }: { teacher: Teacher }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(teacher.name)

    // State for adding new assignment
    const [isAdding, setIsAdding] = useState(false)
    const [newGrade, setNewGrade] = useState<number | ''>('')
    const [newClass, setNewClass] = useState<string>('대시')

    const handleSave = async () => {
        const formData = new FormData()
        formData.append('name', name)

        await updateTeacher(teacher.id, formData)
        setIsEditing(false)
    }

    const handleAddAssignment = async () => {
        if (!newGrade) return
        await addTeacherAssignment(teacher.id, newGrade, newClass)
        setIsAdding(false)
        setNewGrade('')
    }

    if (isEditing) {
        return (
            <tr>
                <td colSpan={2}>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input"
                        style={{ padding: '0.25rem', width: '100%' }}
                    />
                </td>
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
            <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {teacher.assignments.map(a => (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px' }}>
                                {formatGrade(a.grade)} {a.class}반
                            </span>
                            <button
                                onClick={() => removeTeacherAssignment(a.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                title="담당 해제"
                            >
                                x
                            </button>
                        </div>
                    ))}

                    {isAdding ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                            <select
                                value={newGrade}
                                onChange={e => setNewGrade(parseInt(e.target.value))}
                                className="input"
                                style={{ padding: '0.2rem', width: '80px', fontSize: '0.8rem' }}
                            >
                                <option value="">학년</option>
                                {GRADES.map(g => (
                                    <option key={g.value} value={g.value}>{g.label}</option>
                                ))}
                            </select>
                            <select
                                value={newClass}
                                onChange={e => setNewClass(e.target.value)}
                                className="input"
                                style={{ padding: '0.2rem', width: '70px', fontSize: '0.8rem' }}
                            >
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <button onClick={handleAddAssignment} className="btn btn-primary" style={{ padding: '2px 6px', fontSize: '0.8rem' }}>Ok</button>
                            <button onClick={() => setIsAdding(false)} className="btn" style={{ padding: '2px 6px', fontSize: '0.8rem', background: '#334155' }}>X</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="btn"
                            style={{
                                padding: '2px 8px',
                                fontSize: '0.8rem',
                                background: 'transparent',
                                border: '1px dashed #475569',
                                color: '#94a3b8',
                                width: 'fit-content',
                                marginTop: '0.5rem'
                            }}
                        >
                            + 담당 추가
                        </button>
                    )}
                </div>
            </td>
            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>{teacher.name}</td>
            <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setIsEditing(true)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white' }}>이름 수정</button>
                    <button onClick={() => deleteTeacher(teacher.id)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--error)' }}>삭제</button>
                </div>
            </td>
        </tr>
    )
}
