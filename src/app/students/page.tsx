
import { getStudents, createStudent, deleteStudent } from '@/app/actions'
import { formatGrade, GRADES } from '@/lib/grades'
import { CLASSES } from '@/lib/classes'
import StudentList from '@/components/StudentList'
import StudentExcelUploader from '@/components/StudentExcelUploader'
import CreateStudentForm from '@/components/CreateStudentForm'

import StudentSearch from '@/components/StudentSearch'

export default async function StudentsPage(props: { searchParams: Promise<{ grade?: string, class?: string, query?: string }> }) {
    const searchParams = await props.searchParams
    const allStudents = await getStudents(searchParams.query)

    // Filter students based on search parameters
    let students = allStudents

    // Default to '미정' class if no class parameter is provided in URL
    const classToFilter = searchParams.class !== undefined ? searchParams.class : '미정'

    // Apply grade filter if specified
    if (searchParams.grade) {
        const grade = parseInt(searchParams.grade)
        students = students.filter(s => s.grade === grade)
    }

    // Apply class filter only if classToFilter is not empty (empty string means "전체 반")
    if (classToFilter !== '') {
        students = students.filter(s => s.class === classToFilter)
    }

    const hasFilters = searchParams.query || searchParams.grade || searchParams.class !== undefined

    const defaultGrade = searchParams.grade ? parseInt(searchParams.grade) : undefined
    const defaultClass = searchParams.class !== undefined ? searchParams.class : '미정'

    return (
        <div>
            <h1>학생 관리 <span style={{ fontSize: '1.2rem', color: '#64748b', marginLeft: '0.5rem' }}>
                {hasFilters ? `(검색 결과: ${students.length}명 / 전체 ${allStudents.length}명)` : `(반 미정: ${students.length}명)`}
            </span></h1>

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
