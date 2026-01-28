'use client'

import TypeChart from './TypeChart'
import PerformanceChart from './PerformanceChart'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'

export default function DetailedReportCard({ data }: { data: ProcessedReportData }) {
    return (
        <div style={{ padding: '2rem', background: 'white', color: 'black', maxWidth: '100%', minHeight: '190mm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }} className="report-container">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 3mm;
                    }
                    .report-container {
                        padding: 5mm !important;
                        padding-bottom: 30mm !important; /* Prevent footer overlap */
                        width: 100% !important;
                        height: 200mm !important;
                        min-height: auto !important;
                        position: relative !important;
                    }
                    .report-footer {
                        position: absolute !important;
                        bottom: 0mm !important;
                        left: 10mm !important;
                        right: 10mm !important;
                        width: auto !important;
                    }
                    .chart-container-print {
                         break-inside: avoid;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
            <div style={{ marginBottom: '0.1rem', borderBottom: '2px solid #333', paddingBottom: '0.1rem' }}>
                <h1 style={{ margin: '0 0 0.1rem 0', fontSize: '1.1rem' }}>{data.examName} 성적 상세 리포트</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div>
                        <span style={{ marginRight: '1rem' }}>이름: <strong>{data.student.name}</strong></span>
                        <span>학년/반: {formatGrade(data.student.grade)} {data.student.class}</span>
                    </div>
                    <div>
                        <span>총점: <strong>{data.totalScore}점</strong></span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.4rem', background: 'white', boxShadow: 'none' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>유형별 성적 분석</h3>
                    <div className="chart-container-print" style={{ height: '180px', display: 'flex', justifyContent: 'center' }}>
                        <TypeChart data={data.typeChartData} />
                    </div>
                    {/* Type Score Table - Compact */}
                    {/* Vocab Score Display */}
                    {data.examType === 'VOCAB' && (
                        <div style={{
                            marginBottom: '0.3rem',
                            padding: '0.3rem',
                            background: '#fffbeb',
                            border: '1px solid #fcd34d',
                            borderRadius: '0.3rem',
                            fontWeight: 'bold',
                            color: '#d97706',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}>
                            어휘 점수 : {data.vocabScore || 0}점 / 10점
                        </div>
                    )}

                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginTop: '0.3rem', textAlign: 'center', lineHeight: '1.1' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc' }}>유형</th>
                                <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc' }}>배점</th>
                                <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc' }}>득점</th>
                                <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc' }}>성취도</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const typeStats = data.gradingData.reduce((acc, q) => {
                                    const type = q.type || '기타'
                                    if (!acc[type]) acc[type] = { total: 0, earned: 0 }
                                    acc[type].total += q.score
                                    if (q.isCorrect) acc[type].earned += q.score
                                    return acc
                                }, {} as Record<string, { total: number, earned: number }>)

                                return Object.entries(typeStats).map(([type, val]) => {
                                    const rate = val.total > 0 ? Math.round((val.earned / val.total) * 100) : 0
                                    return (
                                        <tr key={type}>
                                            <td style={{ padding: '1px', borderBottom: '1px solid #eee' }}>{type}</td>
                                            <td style={{ padding: '1px', borderBottom: '1px solid #eee' }}>{val.total}</td>
                                            <td style={{ padding: '1px', borderBottom: '1px solid #eee' }}>{val.earned}</td>
                                            <td style={{ padding: '1px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: rate >= 80 ? 'var(--success)' : rate < 60 ? 'var(--error)' : 'inherit' }}>{rate}%</td>
                                        </tr>
                                    )
                                })
                            })()}
                        </tbody>
                    </table>
                </div>
                <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.4rem', display: 'flex', flexDirection: 'column', background: 'white', boxShadow: 'none' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>성적 변동 추이</h3>
                    <div className="chart-container-print" style={{ height: '180px', flex: 1 }}>
                        <PerformanceChart data={{
                            labels: data.historyChartData.labels.slice(-5),
                            scores: data.historyChartData.scores.slice(-5)
                        }} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.4rem', background: 'white', boxShadow: 'none' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>문항별 채점 상세</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {Array.from({ length: 3 }).map((_, blockIndex) => {
                        const startIdx = blockIndex * 15;
                        const chunk = data.gradingData.slice(startIdx, startIdx + 15);
                        const showHeader = blockIndex === 0;

                        // If chunk is empty, don't render anything
                        if (chunk.length === 0) return null;

                        // Fill the chunk to 15 items if it's the last block
                        const filledChunk = [...chunk, ...Array(15 - chunk.length).fill(null)];

                        return (
                            <table key={blockIndex} className="table" style={{ width: '100%', fontSize: '0.75rem', tableLayout: 'fixed', textAlign: 'center', lineHeight: '1.3' }}>
                                <colgroup>
                                    {showHeader && <col style={{ width: '40px', background: 'white' }} />}
                                    {Array.from({ length: 15 }).map((_, i) => <col key={i} style={{ width: 'auto' }} />)}
                                </colgroup>
                                <tbody>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>번호</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee', background: 'white', fontWeight: 'bold' }}>
                                                {q ? startIdx + i + 1 : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>유형</th>}
                                        {filledChunk.map((q, i) => {
                                            const currentType = q ? q.type : '';
                                            const prevType = (i > 0 && filledChunk[i - 1]) ? filledChunk[i - 1]?.type : (i > 0 ? '' : null);

                                            // Ensure we treat null and empty string consistently for comparison
                                            const getSafeType = (item: any) => item ? (item.type || '') : '';

                                            if (i > 0 && getSafeType(q) === getSafeType(filledChunk[i - 1])) {
                                                return null;
                                            }

                                            let span = 1;
                                            for (let k = i + 1; k < filledChunk.length; k++) {
                                                if (getSafeType(filledChunk[k]) === getSafeType(q)) {
                                                    span++;
                                                } else {
                                                    break;
                                                }
                                            }

                                            return (
                                                <td key={i} colSpan={span} style={{ padding: '2px', borderBottom: '1px solid #eee', fontSize: '0.7rem', verticalAlign: 'middle', borderRight: '1px solid #eee', borderLeft: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                                    {q ? q.type : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>정답</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee' }}>
                                                {q ? q.answer : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>학생</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee', color: q?.isCorrect ? 'inherit' : 'var(--error)', fontWeight: q?.isCorrect ? 'normal' : 'bold' }}>
                                                {q ? (q.studentAnswer || '-') : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>채점</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee' }}>
                                                {q ? (q.isCorrect ?
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>O</span> :
                                                    <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>X</span>
                                                ) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>배점</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee', color: '#64748b' }}>
                                                {q ? q.score : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {showHeader && <th style={{ padding: '2px', borderBottom: '1px solid #eee' }}>율(%)</th>}
                                        {filledChunk.map((q, i) => (
                                            <td key={i} style={{ padding: '2px', borderBottom: '1px solid #eee', color: '#64748b', fontSize: '0.7rem' }}>
                                                {q ? `${q.correctRate}` : ''}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        )
                    })}
                </div>
            </div>
            <div className="report-footer" style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img src="/images/report_logo.png" alt="Dashnaru" style={{ height: '40px', objectFit: 'contain' }} />
                <img src="/images/report_address.png" alt="Address" style={{ height: '25px', objectFit: 'contain' }} />
            </div>
        </div>
    )
}
