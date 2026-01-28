
import ExamForm from '@/components/ExamForm'
import { getExam } from '@/app/actions/exams'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function EditExamPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const id = parseInt(params.id)
    const exam = await getExam(id)

    if (!exam) return notFound()

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <Link href={`/exams/${id}`} className="btn" style={{ background: '#334155', color: 'white' }}>
                    &larr; 돌아가기
                </Link>
            </div>
            <h1>시험 수정</h1>
            <div style={{ marginTop: '2rem', maxWidth: '800px' }}>
                <ExamForm initialData={exam} />
            </div>
        </div>
    )
}
