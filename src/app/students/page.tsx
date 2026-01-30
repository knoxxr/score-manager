
import { getStudents, createStudent, deleteStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import StudentList from '@/components/StudentList'
import StudentExcelUploader from '@/components/StudentExcelUploader'
import CreateStudentForm from '@/components/CreateStudentForm'

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
                <CreateStudentForm
                    existingIds={students.map(s => s.id)}
                    defaultGrade={defaultGrade}
                    defaultClass={defaultClass}
                />
            </div>

            <StudentExcelUploader />

            <div className="card">
                <StudentList students={students} />
            </div>
        </div>
    )
}
