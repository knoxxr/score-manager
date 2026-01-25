'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from './lib/actions/auth'

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <button aria-disabled={pending} type="submit" className="btn btn-primary" style={{ width: '100%' }}>
      {pending ? '로그인 중...' : '로그인'}
    </button>
  )
}

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <h1 style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Score Manager Login
      </h1>
      <form action={dispatch} className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>아이디</label>
          <input name="username" className="input" required placeholder="admin 또는 선생님 ID" />
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>비밀번호</label>
          <input name="password" type="password" className="input" required placeholder="비밀번호" />
        </div>
        <LoginButton />

        {errorMessage && (
          <div style={{ marginTop: '1rem', color: 'var(--error)', textAlign: 'center' }}>
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  )
}
