'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'

export default function StudentSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('query') || '')
    const [gradeFilter, setGradeFilter] = useState(searchParams.get('grade') || '')
    const [classFilter, setClassFilter] = useState(searchParams.get('class') || '미정')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (query) {
            params.set('query', query)
        }
        if (gradeFilter) {
            params.set('grade', gradeFilter)
        }
        // Always set class parameter to distinguish between 'default' and 'all'
        params.set('class', classFilter)
        const queryString = params.toString()
        router.push(queryString ? `/students?${queryString}` : '/students')
    }

    const handleReset = () => {
        setQuery('')
        setGradeFilter('')
        setClassFilter('')
        router.push('/students')
    }

    const hasFilters = query || gradeFilter || classFilter

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 카드번호 검색"
                className="input"
                style={{ maxWidth: '300px' }}
            />
            <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="input"
                style={{ width: '150px' }}
            >
                <option value="">전체 학년</option>
                {GRADES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                ))}
            </select>
            <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input"
                style={{ width: '150px' }}
            >
                <option value="">전체 반</option>
                {CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
            <button type="submit" className="btn btn-primary">검색</button>
            {hasFilters && (
                <button
                    type="button"
                    className="btn"
                    onClick={handleReset}
                    style={{ background: '#cbd5e1' }}
                >
                    초기화
                </button>
            )}
        </form>
    )
}
