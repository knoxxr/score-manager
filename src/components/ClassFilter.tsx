'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

export default function ClassFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentGrade = searchParams.get('grade') || ''
    const currentClass = searchParams.get('class') || ''

    const handleChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/classes?${params.toString()}`)
    }

    return (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <select
                value={currentGrade}
                onChange={(e) => handleChange('grade', e.target.value)}
                className="input"
                style={{ padding: '0.5rem 1rem', fontSize: '1rem', minWidth: '120px' }}
            >
                <option value="">학년 선택</option>
                {GRADES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                ))}
            </select>
            <select
                value={currentClass}
                onChange={(e) => handleChange('class', e.target.value)}
                className="input"
                style={{ padding: '0.5rem 1rem', fontSize: '1rem', minWidth: '120px' }}
            >
                <option value="">반 선택</option>
                {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    )
}
