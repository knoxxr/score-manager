
import { getStudents, createStudent, deleteStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import StudentList from '@/components/StudentList'
import StudentExcelUploader from '@/components/StudentExcelUploader'

import StudentSearch from '@/components/StudentSearch'

export default async function StudentsPage(props: { searchParams: Promise<{ grade?: string, class?: string, query?: string }> }) {
    const searchParams = await props.searchParams
    const students = await getStudents(searchParams.query)

    const defaultGrade = searchParams.grade ? parseInt(searchParams.grade) : undefined
    const defaultClass = searchParams.class || undefined

    return (
        <div>
            <h1>학생 관리 <span style={{ fontSize: '1.2rem', color: '#64748b', marginLeft: '0.5rem' }}>(총 {students.length}명)</span></h1>

            <div style={{ margin: '1rem 0' }}>
                <StudentSearch />
            </div>

            <div style={{ margin: '2rem 0' }} className="card">
                <h3>학생 등록</h3>
                <form action={createStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '1rem', marginTop: '1rem' }}>
                    <input name="id" type="text" placeholder="카드번호" className="input" required />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input name="name" placeholder="이름" className="input" required style={{ flex: 1 }} />
                        <input name="schoolName" placeholder="학교명" className="input" style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            name="grade"
                            className="input"
                            required
                            style={{ flex: 1 }}
                            defaultValue={defaultGrade}
                        >
                            <option value="">학년</option>
                            {GRADES.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                        <select
                            name="class"
                            className="input"
                            required
                            style={{ flex: 1 }}
                            defaultValue={defaultClass}
                        >
                            {CLASSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">등록</button>
                </form>
            </div>

            <StudentExcelUploader />

            <div className="card">
                <StudentList students={students} />
            </div>
        </div>
    )
}
