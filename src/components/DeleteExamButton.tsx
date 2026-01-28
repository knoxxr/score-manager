'use client'

import { deleteExam } from '@/app/actions/exams'

export default function DeleteExamButton({ id }: { id: number }) {
    const handleDelete = async () => {
        if (confirm('정말로 이 시험을 삭제하시겠습니까? (모든 성적 데이터가 함께 삭제됩니다)')) {
            await deleteExam(id)
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="btn"
            style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.5rem' }}
        >
            삭제
        </button>
    )
}
