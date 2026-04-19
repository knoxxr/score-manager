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
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)' }}>
                <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>비밀번호 변경</h2>
                {message && <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#ef4444', color: 'white', borderRadius: '4px' }}>{message}</div>}
                {successMessage && <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#10b981', color: 'white', borderRadius: '4px', fontWeight: 'bold', textAlign: 'center' }}>{successMessage}</div>}
                
                {!successMessage && (
                    <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#3b82f620', color: '#60a5fa', borderRadius: '4px', fontSize: '0.9rem' }}>
                        * 초기 비밀번호는 <strong>1234</strong> 입니다.
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>현재 비밀번호</label>
                        <input type="password" name="oldPassword" required className="input" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>새 비밀번호</label>
                        <input type="password" name="newPassword" required className="input" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>새 비밀번호 확인</label>
                        <input type="password" name="confirmPassword" required className="input" style={{ width: '100%' }} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn" style={{ flex: 1, background: '#64748b' }}>
                            취소
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                            {loading ? '변경 중...' : '변경하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
