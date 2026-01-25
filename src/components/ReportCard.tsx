
import PerformanceChart from './PerformanceChart'

type Student = {
    id: number
    name: string
    // ... other fields
}

type ExamRecord = {
    examId: number
    examName: string
    date: Date
    totalScore: number
    // ...
}

export default function ReportCard({ student, records }: { student: Student, records: ExamRecord[] }) {
    const chartData = {
        labels: records.map(r => r.examName),
        scores: records.map(r => r.totalScore)
    }

    const recentRecords = [...records].sort((a, b) => b.date.getTime() - a.date.getTime())

    return (
        <div className="report-card" style={{ padding: '2rem', background: 'white', color: 'black', marginBottom: '2rem' }}>
            <div style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>학생 성적표</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <div>
                        <strong>이름:</strong> {student.name}
                    </div>
                    <div>
                        <strong>학번:</strong> {student.id}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>성적 추이</h3>
                <div style={{ height: '300px', width: '100%' }}>
                    <PerformanceChart data={chartData} />
                </div>
            </div>

            <div>
                <h3>시험 기록</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>날짜</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>시험명</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>점수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentRecords.map((r, i) => (
                            <tr key={i}>
                                <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{r.date.toLocaleDateString('ko-KR')}</td>
                                <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{r.examName}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{r.totalScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
