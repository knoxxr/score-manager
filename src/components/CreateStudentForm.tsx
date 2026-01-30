'use client'

import { useState } from 'react'
import { createStudent } from '@/app/actions'
import { CLASSES } from '@/lib/classes'
import { GRADES } from '@/lib/grades'

type Props = {
    existingIds: string[]
    defaultGrade?: number
    defaultClass?: string
}

export default function CreateStudentForm({ existingIds, defaultGrade, defaultClass }: Props) {
    const [id, setId] = useState('')
    const [name, setName] = useState('')
    const [schoolName, setSchoolName] = useState('')
    const [grade, setGrade] = useState<number | ''>(defaultGrade || '')
    const [cls, setCls] = useState(defaultClass || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (id.length !== 5) {
            alert('카드번호는 5자리 숫자여야 합니다.')
            return
        }

        if (existingIds.includes(id)) {
            alert('이미 존재하는 카드번호입니다. 다른 번호를 사용해주세요.')
            return
        }

        const formData = new FormData()
        formData.append('id', id)
        formData.append('name', name)
        formData.append('schoolName', schoolName)
        formData.append('grade', grade.toString())
        formData.append('class', cls)

        try {
            await createStudent(formData)
            // Reset form
            setId('')
            setName('')
            setSchoolName('')
            // Keep grade/class for convenience or reset?
            // Usually convenient to keep if batch entering, but basic reset is safer.
            // Let's reset main fields.
            alert('학생이 등록되었습니다.')
        } catch (error) {
            console.error(error)
            alert('등록 중 오류가 발생했습니다.')
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '1rem', marginTop: '1rem' }}>
            <input
                name="id"
                type="text"
                placeholder="카드번호 (5자리)"
                className="input"
                required
                value={id}
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length <= 5) setId(val)
                }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    name="name"
                    placeholder="이름"
                    className="input"
                    required
                    style={{ flex: 1 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    name="schoolName"
                    placeholder="학교명"
                    className="input"
                    style={{ flex: 1 }}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                    name="grade"
                    className="input"
                    required
                    style={{ flex: 1 }}
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value))}
                >
                    <option value="">학년</option>
                    {GRADES.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                </select>
                <select
                    name="class"
                    className="input"
                    required
                    style={{ flex: 1 }}
                    value={cls}
                    onChange={(e) => setCls(e.target.value)}
                >
                    {CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
            <button type="submit" className="btn btn-primary">등록</button>
        </form>
    )
}
