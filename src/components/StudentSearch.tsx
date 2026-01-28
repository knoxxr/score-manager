'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function StudentSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('query') || '')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
            params.set('query', query)
        } else {
            params.delete('query')
        }
        router.push(`/students?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 카드번호 검색"
                className="input"
                style={{ maxWidth: '300px' }}
            />
            <button type="submit" className="btn btn-primary">검색</button>
            {query && (
                <button
                    type="button"
                    className="btn"
                    onClick={() => {
                        setQuery('')
                        router.push('/students')
                    }}
                    style={{ background: '#cbd5e1' }}
                >
                    초기화
                </button>
            )}
        </form>
    )
}
