
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ClassFilter from '@/components/ClassFilter'
import StudentRow from '@/components/StudentRow'

export default async function ClassesPage(props: { searchParams: Promise<{ grade?: string, class?: string }> }) {
    const searchParams = await props.searchParams
    const grade = searchParams.grade ? parseInt(searchParams.grade) : undefined
    const className = searchParams.class

    let students: any[] = []

    if (grade && className) {
        students = await prisma.student.findMany({
            where: {
                grade: grade,
                class: className
            },
            orderBy: { name: 'asc' },
            include: { teacher: true }
        })
    }

    return (
        <div>
            <h1>정규반 관리</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ color: '#64748b', margin: 0 }}>학년과 반을 선택하여 학생 명단을 확인하세요.</p>
                <Link
                    href={`/students?grade=${grade || ''}&class=${className || ''}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.9rem' }}
                >
                    + 신규 학생 등록
                </Link>
            </div>

            <ClassFilter />

            {(grade && className) ? (
                <div className="card">
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>학생 명단 ({students.length}명)</h3>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>카드번호</th>
                                <th>이름</th>
                                <th>학교명</th>
                                <th>학년</th>
                                <th>반</th>
                                <th>담당 선생님</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => (
                                <StudentRow key={s.id} student={s} />
                            ))}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                        해당 반에 등록된 학생이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b'
                }}>
                    👆 위에서 학년과 반을 모두 선택해주세요.
                </div>
            )}
        </div>
    )
}
