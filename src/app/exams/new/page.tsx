
import ExamForm from '@/components/ExamForm'
import Link from 'next/link'

export default function NewExamPage() {
    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/exams" className="btn" style={{ background: '#334155', color: 'white' }}>
                    &larr; 목록으로 돌아가기
                </Link>
            </div>
            <h1>새 시험 생성</h1>
            <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                <ExamForm />
            </div>
        </div>
    )
}
