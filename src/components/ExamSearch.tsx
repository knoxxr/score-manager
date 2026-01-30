'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { GRADES } from '@/lib/grades'

export default function ExamSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('query') || '')
    const [gradeFilter, setGradeFilter] = useState(searchParams.get('grade') || '')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (query) {
            params.set('query', query)
        }
        if (gradeFilter) {
            params.set('grade', gradeFilter)
        }
        const queryString = params.toString()
        router.push(queryString ? `/exams?${queryString}` : '/exams')
    }

    const handleReset = () => {
        setQuery('')
        setGradeFilter('')
        router.push('/exams')
    }

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="시험 이름 검색"
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
            <button type="submit" className="btn btn-primary">검색</button>
            {(query || gradeFilter) && (
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
