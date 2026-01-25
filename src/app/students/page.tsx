
import { getStudents, createStudent, deleteStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import StudentRow from '@/components/StudentRow'

export default async function StudentsPage() {
    const students = await getStudents()

    return (
        <div>
            <h1>학생 관리</h1>
            <div style={{ margin: '2rem 0' }} className="card">
                <h3>학생 등록</h3>
                <form action={createStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1fr auto', gap: '1rem', marginTop: '1rem' }}>
                    <input name="id" type="number" placeholder="학번 (5자리)" className="input" required />
                    <input name="name" placeholder="이름" className="input" required />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select name="grade" className="input" required style={{ flex: 1 }}>
                            <option value="">학년</option>
                            {GRADES.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                        <select name="class" className="input" required style={{ flex: 1 }}>
                            {CLASSES.map(c => (
                                <option key={c} value={c}>{c}반</option>
                            ))}
                        </select>
                    </div>
                    <input name="phoneNumber" placeholder="전화번호" className="input" required />
                    <button type="submit" className="btn btn-primary">등록</button>
                </form>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>학번</th>
                            <th>이름</th>
                            <th>학년</th>
                            <th>전화번호</th>
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
                                <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>등록된 학생이 없습니다</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
