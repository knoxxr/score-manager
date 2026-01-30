'use client'

import { useState, useEffect } from 'react'
import { createExam, updateExam } from '@/app/actions/exams'
import { getQuestionTypes } from '@/app/actions/types'
import { GRADES, DEFAULT_GRADE_CUTOFFS } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import QuestionTypeManager from './QuestionTypeManager'

type Question = {
    id: number
    type: string
    score: number
    answer: string
}

type Props = {
    initialData?: {
        id: number
        name: string
        grade: number
        class: string
        date: Date
        type?: string
        isAdmission?: boolean
        subjectInfo: string
        gradeCutoffs?: string
    }
}

export default function ExamForm({ initialData }: Props) {
    const [availableTypes, setAvailableTypes] = useState<string[]>([])
    const [showTypeManager, setShowTypeManager] = useState(false)

    useEffect(() => {
        loadTypes()
    }, [])

    const loadTypes = async () => {
        const types = await getQuestionTypes()
        setAvailableTypes(types.map((t: any) => t.name))
    }

    const [questions, setQuestions] = useState<Question[]>(() => {
        if (initialData?.subjectInfo) {
            try {
                return JSON.parse(initialData.subjectInfo)
            } catch (e) {
                console.error("Failed to parse subjectInfo", e)
            }
        }
        return [{ id: 1, type: '화법', score: 2, answer: '1' }]
    })

    const addQuestion = () => {
        const lastQuestion = questions.length > 0 ? questions[questions.length - 1] : null
        const initialType = lastQuestion ? lastQuestion.type : (availableTypes[0] || '화법')

        setQuestions([...questions, {
            id: questions.length + 1,
            type: initialType,
            score: 2,
            answer: '1'
        }])
    }

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], [field]: value }
        setQuestions(newQuestions)
    }

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const handleSubmit = async (formData: FormData) => {
        if (initialData) {
            await updateExam(initialData.id, formData)
        } else {
            await createExam(formData)
        }
    }

    const [cutoffs, setCutoffs] = useState<Record<string, number>>(() => {
        if (initialData?.gradeCutoffs && initialData.gradeCutoffs !== '{}') {
            try {
                const parsed = JSON.parse(initialData.gradeCutoffs)
                // Ensure all keys exist
                return { ...DEFAULT_GRADE_CUTOFFS, ...parsed }
            } catch (e) {
                console.error("Failed to parse gradeCutoffs", e)
            }
        }
        return DEFAULT_GRADE_CUTOFFS
    })

    const [isVocab, setIsVocab] = useState(initialData ? initialData.type === 'VOCAB' : true)
    const [isAdmission, setIsAdmission] = useState(initialData ? initialData.isAdmission : false)

    const handleAdmissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked
        setIsAdmission(checked)
        if (checked) {
            setIsVocab(false)
        }
    }

    const updateCutoff = (grade: string, value: number) => {
        setCutoffs(prev => ({ ...prev, [grade]: value }))
    }

    return (
        <form action={handleSubmit} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{initialData ? '시험 수정' : '새 시험 생성'}</h3>
                <button
                    type="button"
                    onClick={() => setShowTypeManager(true)}
                    className="btn"
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                    ⚙️ 문제 유형 수정
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) minmax(140px, auto) minmax(140px, auto) auto', gap: '1rem', margin: '1rem 0' }}>
                <input
                    name="name"
                    defaultValue={initialData?.name}
                    placeholder="시험 이름 (예: 중간고사)"
                    className="input"
                    required
                    style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                />
                <select
                    name="grade"
                    defaultValue={initialData?.grade}
                    className="input"
                    required
                    style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                >
                    <option value="">대상 학년</option>
                    {GRADES.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                </select>

                <input
                    name="date"
                    type="date"
                    defaultValue={initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : ''}
                    className="input"
                    required
                    style={{ fontSize: '1.1rem', padding: '0.75rem' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isAdmission ? 0.5 : 1 }}>
                        <input
                            type="checkbox"
                            name="isVocab"
                            id="isVocab"
                            checked={isVocab}
                            onChange={(e) => setIsVocab(e.target.checked)}
                            disabled={isAdmission}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: isAdmission ? 'not-allowed' : 'pointer' }}
                        />
                        <label htmlFor="isVocab" style={{ cursor: isAdmission ? 'not-allowed' : 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>어휘시험</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            name="isAdmission"
                            id="isAdmission"
                            checked={isAdmission}
                            onChange={handleAdmissionChange}
                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                        />
                        <label htmlFor="isAdmission" style={{ cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>입학테스트</label>
                    </div>
                </div>
            </div>

            <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>등급 구분 점수 (각 등급 최저 점수)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map(g => (
                        <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>{g}등급</label>
                            <input
                                type="number"
                                value={cutoffs[g.toString()]}
                                onChange={(e) => updateCutoff(g.toString(), parseInt(e.target.value) || 0)}
                                className="input"
                                style={{ width: '60px', padding: '0.4rem' }}
                            />
                        </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', opacity: 0.5 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>9등급</label>
                        <input
                            type="number"
                            value={cutoffs['9']}
                            disabled
                            className="input"
                            style={{ width: '60px', padding: '0.4rem', background: '#e2e8f0' }}
                        />
                    </div>
                </div>
                <input type="hidden" name="gradeCutoffs" value={JSON.stringify(cutoffs)} />
            </div>

            <h4>문항 설정</h4>
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    <span style={{ width: '30px', textAlign: 'center' }}>No</span>
                    <span style={{ width: '120px' }}>유형</span>
                    <span style={{ width: '80px' }}>정답</span>
                    <span style={{ width: '60px' }}>배점</span>
                    <span style={{ width: '30px' }}></span>
                </div>
                {questions.map((q, idx) => (
                    <div key={idx}
                        style={{
                            display: 'flex', gap: '0.5rem',
                            borderBottom: (idx + 1) % 5 === 0 && idx < questions.length - 1 ? '2px dashed #cbd5e1' : 'none',
                            paddingBottom: (idx + 1) % 5 === 0 && idx < questions.length - 1 ? '1rem' : '0',
                            marginBottom: (idx + 1) % 5 === 0 && idx < questions.length - 1 ? '1rem' : '0.5rem'
                        }}
                    >
                        <span style={{ padding: '0.5rem', width: '30px' }}>{idx + 1}</span>
                        <select
                            value={q.type}
                            onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                            className="input"
                            style={{ width: '120px' }}
                        >
                            {availableTypes.includes(q.type) ? null : <option value={q.type}>{q.type}</option>}
                            {availableTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <input
                            value={q.answer}
                            onChange={(e) => updateQuestion(idx, 'answer', e.target.value)}
                            className="input"
                            placeholder="정답"
                            style={{ width: '80px' }}
                        />
                        <select
                            value={q.score}
                            onChange={(e) => updateQuestion(idx, 'score', parseInt(e.target.value))}
                            className="input"
                            style={{ width: '60px' }}
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                        </select>
                        <button type="button" onClick={() => removeQuestion(idx)} className="btn" style={{ color: 'var(--error)' }}>X</button>
                    </div>
                ))}
                <button type="button" onClick={addQuestion} className="btn btn-primary" style={{ width: '100%' }}>+ 문항 추가</button>
            </div>

            <input type="hidden" name="subjectInfo" value={JSON.stringify(questions)} />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {initialData ? '시험 수정' : '시험 생성'}
            </button>

            {showTypeManager && (
                <QuestionTypeManager
                    onClose={() => setShowTypeManager(false)}
                    onUpdate={loadTypes}
                />
            )}
        </form >
    )
}
