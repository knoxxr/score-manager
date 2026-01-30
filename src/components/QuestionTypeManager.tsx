'use client'

import { useState, useEffect } from 'react'
import { getQuestionTypes, addQuestionType, updateQuestionType, deleteQuestionType } from '@/app/actions/types'

type QuestionType = {
    id: number
    name: string
    order: number
}

type Props = {
    onClose: () => void
    onUpdate: () => void // Callback to refresh parent's list
}

export default function QuestionTypeManager({ onClose, onUpdate }: Props) {
    const [types, setTypes] = useState<QuestionType[]>([])
    const [newType, setNewType] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')

    useEffect(() => {
        loadTypes()
    }, [])

    const loadTypes = async () => {
        const data = await getQuestionTypes()
        setTypes(data)
    }

    const handleAdd = async () => {
        if (!newType.trim()) return
        setLoading(true)
        await addQuestionType(newType)
        setNewType('')
        await loadTypes()
        onUpdate()
        setLoading(false)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        setLoading(true)
        await deleteQuestionType(id)
        await loadTypes()
        onUpdate()
        setLoading(false)
    }

    const startEdit = (t: QuestionType) => {
        setEditingId(t.id)
        setEditName(t.name)
    }

    const handleUpdate = async () => {
        if (editingId === null || !editName.trim()) return
        setLoading(true)
        await updateQuestionType(editingId, editName)
        setEditingId(null)
        setEditName('')
        await loadTypes()
        onUpdate()
        setLoading(false)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditName('')
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', maxHeight: '80vh', overflowY: 'auto', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>문제 유형 관리</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="새 유형 이름"
                        className="input"
                        style={{ flex: 1 }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} disabled={loading} className="btn btn-primary">추가</button>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {types.map(t => (
                        <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                            {editingId === t.id ? (
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input"
                                        style={{ flex: 1, padding: '0.2rem' }}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate()
                                            if (e.key === 'Escape') cancelEdit()
                                        }}
                                    />
                                    <button onClick={handleUpdate} disabled={loading} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>저장</button>
                                    <button onClick={cancelEdit} disabled={loading} className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>취소</button>
                                </div>
                            ) : (
                                <>
                                    <span>{t.name}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => startEdit(t)} disabled={loading} className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: '#f1f5f9' }}>수정</button>
                                        <button onClick={() => handleDelete(t.id)} disabled={loading} className="btn" style={{ color: 'red', border: '1px solid #fee2e2', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>삭제</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>

                <button onClick={onClose} className="btn" style={{ marginTop: '1rem', width: '100%', background: '#334155', color: 'white' }}>닫기</button>
            </div>
        </div>
    )
}
