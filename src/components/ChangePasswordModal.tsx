'use client'

import { useState } from 'react'
import { changePassword } from '@/app/lib/actions/auth'

export default function ChangePasswordModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setSuccessMessage('')

        const formData = new FormData(e.currentTarget)
        const result = await changePassword(formData)

        setLoading(false)
        if (result.success) {
            setSuccessMessage(result.message)
            setTimeout(() => {
                setIsOpen(false)
                setSuccessMessage('')
            }, 2000) // 2초 뒤 모달 자동차단
        } else {
            setMessage(result.message)
        }
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => { setIsOpen(true); setMessage(''); setSuccessMessage(''); }} 
                className="btn" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#475569' }}
            >
                비밀번호 변경
            </button>
        )
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', 
            alignItems: 'flex-start', paddingTop: '10vh', zIndex: 1000
        }}>
            <div className="card" style={{ 
                width: '100%', maxWidth: '380px', background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                padding: '1.25rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', color: 'white' }}>비밀번호 변경</h2>
                </div>
                
                {message && (
                    <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {message}
                    </div>
                )}
                
                {successMessage && (
                    <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '6px', fontWeight: 'bold', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        {successMessage}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>현재 비밀번호</label>
                        <input 
                            type="password" 
                            name="oldPassword" 
                            required 
                            className="input" 
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)' }} 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>새 비밀번호</label>
                        <input 
                            type="password" 
                            name="newPassword" 
                            required 
                            className="input" 
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)' }} 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>새 비밀번호 확인</label>
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            required 
                            className="input" 
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)' }} 
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ flex: 1, background: '#334155', color: '#cbd5e1', padding: '0.6rem' }}>
                            취소
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                            {loading ? '변경 중...' : '변경하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
