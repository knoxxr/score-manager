
import { getTeachers, createTeacher, deleteTeacher } from '@/app/actions'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import TeacherRow from '@/components/TeacherRow'

export default async function TeachersPage() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') redirect('/dashboard')

    const teachers = await getTeachers()

    return (
        <div>
            <h1>선생님 관리</h1>
            <div style={{ margin: '2rem 0' }} className="card">
                <h3>선생님 등록</h3>
                <form action={createTeacher} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input name="name" placeholder="선생님 이름" className="input" required />
                    <select name="grade" className="input" required style={{ width: '150px' }}>
                        <option value="">담당 학년</option>
                        {GRADES.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                    <select name="class" className="input" required style={{ width: '200px' }}>
                        {CLASSES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>등록</button>
                </form>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>학년</th>
                            <th>이름</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map((t) => (
                            <TeacherRow key={t.id} teacher={t} />
                        ))}
                        {teachers.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'center', color: '#64748b' }}>등록된 선생님이 없습니다</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
