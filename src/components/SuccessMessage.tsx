'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuccessMessage({ message }: { message: string }) {
    const router = useRouter()
    const [show, setShow] = useState(true)

    useEffect(() => {
        // Auto-hide after 3 seconds
        const timer = setTimeout(() => {
            setShow(false)
            // Remove success param from URL
            const url = new URL(window.location.href)
            url.searchParams.delete('success')
            router.replace(url.pathname + url.search)
        }, 3000)

        return () => clearTimeout(timer)
    }, [router])

    if (!show) return null

    return (
        <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            color: '#065f46',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span>✓ {message}</span>
            <button
                onClick={() => {
                    setShow(false)
                    const url = new URL(window.location.href)
                    url.searchParams.delete('success')
                    router.replace(url.pathname + url.search)
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#065f46'
                }}
            >
                &times;
            </button>
        </div>
    )
}
