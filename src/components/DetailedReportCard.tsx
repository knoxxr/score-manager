'use client'

import TypeChart from './TypeChart'
import PerformanceChart from './PerformanceChart'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'

export default function DetailedReportCard({ data }: { data: ProcessedReportData }) {
    return (
        <div style={{ padding: '1rem', background: 'white', color: 'black', maxWidth: '100%' }} className="report-container">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    .report-container {
                        padding: 0 !important;
                    }
                    .chart-container-print {
                         break-inside: avoid;
                    }
                }
            `}</style>
            <div style={{ marginBottom: '1rem', borderBottom: '2px solid #333', paddingBottom: '0.5rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{data.exam.name} 성적 상세 리포트</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                    <div>
                        <span style={{ marginRight: '1rem' }}>이름: <strong>{data.student.name}</strong></span>
                        <span>학년: {formatGrade(data.student.grade)}</span>
                    </div>
                    <div>
                        <span>총점: <strong>{data.totalScore}점</strong></span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.8rem' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.3rem', marginTop: 0, fontSize: '1rem' }}>유형별 성적 분석</h3>
                    <div className="chart-container-print" style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                        <TypeChart data={data.typeChartData} />
                    </div>
                </div>
                <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.8rem' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.3rem', marginTop: 0, fontSize: '1rem' }}>성적 변동 추이</h3>
                    <div className="chart-container-print" style={{ height: '200px' }}>
                        <PerformanceChart data={data.historyChartData} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.8rem' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.3rem', marginTop: 0, fontSize: '1rem' }}>문항별 채점 상세</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    {Array.from({ length: 3 }).map((_, blockIndex) => {
                        const startIdx = blockIndex * 15;
                        const chunk = data.gradingData.slice(startIdx, startIdx + 15);

                        // If chunk is empty, don't render anything (unless you want empty grids, but better to hide)
                        if (chunk.length === 0) return null;

                        // Fill the chunk to 15 items if it's the last block and incomplete (optional, but makes tables aligned)
                        // For now let's just render what we have or fill with empty objects for consistent grid
                        const filledChunk = [...chunk, ...Array(15 - chunk.length).fill(null)];

                        return (
                            <table key={blockIndex} className="table" style={{ width: '100%', fontSize: '0.75rem', tableLayout: 'fixed', textAlign: 'center' }}>
                                <colgroup>
                                    <col style={{ width: '60px', background: '#f8fafc' }} />
                                    {Array.from({ length: 15 }).map((_, i) => <col key={i} style={{ width: 'auto' }} />)}
                                </colgroup>
                                <tbody>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>번호</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee', background: '#f8fafc', fontWeight: 'bold' }}>
                                                {q ? startIdx + i + 1 : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>유형</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                {q ? q.type : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>정답</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>
                                                {q ? q.answer : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>학생 답</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee', color: q?.isCorrect ? 'inherit' : 'var(--error)', fontWeight: q?.isCorrect ? 'normal' : 'bold' }}>
                                                {q ? (q.studentAnswer || '-') : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>채점</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>
                                                {q ? (q.isCorrect ?
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>O</span> :
                                                    <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>X</span>
                                                ) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>배점</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee', color: '#64748b' }}>
                                                {q ? q.score : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '0.2rem', borderBottom: '1px solid #eee' }}>정답률</th>
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '0.2rem', borderBottom: '1px solid #eee', color: '#64748b', fontSize: '0.7rem' }}>
                                                {q ? `${q.correctRate}%` : ''}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
