'use client'

import TypeChart from './TypeChart'
import PerformanceChart from './PerformanceChart'
import { ProcessedReportData } from '@/lib/report-utils'
import { formatGrade } from '@/lib/grades'

export default function DetailedReportCard({ data }: { data: ProcessedReportData }) {
    return (
        <div style={{ padding: '0.5rem', background: 'white', color: 'black', maxWidth: '100%', minHeight: '190mm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }} className="report-container">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 3mm;
                    }
                    .report-container {
                        padding: 3mm !important;
                        padding-bottom: 35mm !important; /* Prevent footer overlap */
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
                        <span style={{ marginRight: '1rem' }}>
                            {data.student.schoolName && <span style={{ marginRight: '1rem' }}>학교명 : <strong>{data.student.schoolName}</strong></span>}
                            이름 : <strong>{data.student.name}</strong>
                        </span>
                        <span>학년/반: {formatGrade(data.student.grade)} {data.student.class}</span>
                    </div>
                    <div>
                        <span style={{ marginRight: '1rem' }}>
                            <strong>{data.totalScore}점 / {data.maxTotalScore}점</strong>
                        </span>
                        {!data.isAdmission && data.studentGrade && (
                            <span style={{ fontSize: '1.2rem', color: '#dc2626', marginLeft: '0.5rem' }}>
                                <strong>{data.studentGrade}등급</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: data.isAdmission ? '1fr' : '1fr 1fr', gap: '0.2rem', marginBottom: '0.2rem' }}>
                <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.3rem', background: 'white', boxShadow: 'none' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>유형별 성적 분석</h3>
                    <div className="chart-container-print" style={{ height: '170px', display: 'flex', justifyContent: 'center' }}>
                        <TypeChart data={data.typeChartData} />
                    </div>


                    {/* Vocab Score Display */}
                    {!data.isAdmission && (
                        <div style={{
                            marginTop: '0.5rem',
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

                    {/* Tables Container */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                        {/* Left: Type Score Table */}
                        <div style={{ flex: 1 }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center', lineHeight: '1.1', tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '25%' }} />
                                    <col style={{ width: '25%' }} />
                                    <col style={{ width: '25%' }} />
                                    <col style={{ width: '25%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc', textAlign: 'center' }}>유형</th>
                                        <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc', textAlign: 'center' }}>배점</th>
                                        <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc', textAlign: 'center' }}>득점</th>
                                        <th style={{ padding: '1px', background: 'white', borderBottom: '1px solid #ccc', textAlign: 'center' }}>성취도</th>
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

                        {/* Right: Vertical Grade Cutoff Table */}
                        {!data.isAdmission && data.gradeCutoffs && Object.keys(data.gradeCutoffs).length > 0 && (
                            <div style={{ width: '80px' }}>
                                <table className="table" style={{ width: '100%', fontSize: '0.7rem', textAlign: 'center', lineHeight: '1.1', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '2px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>등급</th>
                                            <th style={{ padding: '2px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>컷</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(data.gradeCutoffs).sort((a, b) => parseInt(a) - parseInt(b)).map(g => (
                                            <tr key={g}>
                                                <th style={{ padding: '2px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>{g}</th>
                                                <td style={{
                                                    padding: '2px',
                                                    border: '1px solid #e2e8f0',
                                                    fontWeight: data.studentGrade?.toString() === g ? 'bold' : 'normal',
                                                    background: data.studentGrade?.toString() === g ? '#fee2e2' : 'white',
                                                    color: data.studentGrade?.toString() === g ? '#dc2626' : 'inherit'
                                                }}>
                                                    {data.gradeCutoffs[g]}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                {!data.isAdmission && (
                    <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.3rem', display: 'flex', flexDirection: 'column', background: 'white', boxShadow: 'none' }}>
                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>성적 변동 추이</h3>
                        <div className="chart-container-print" style={{ height: '85px', flex: 1 }}>
                            <PerformanceChart data={{
                                labels: data.historyChartData.labels.slice(-5),
                                scores: data.historyChartData.scores.slice(-5)
                            }} />
                        </div>
                    </div>
                )}
            </div>

            <div className="card" style={{ border: '1px solid #ccc', breakInside: 'avoid', padding: '0.4rem', background: 'white', boxShadow: 'none', marginTop: 'auto' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.1rem', marginTop: 0, fontSize: '0.85rem' }}>문항별 채점 상세</h3>
                <div style={{ marginTop: '0.5rem' }}>
                    {(() => {
                        // Prepare data: ensure we have exactly 45 items
                        const filledData = [...data.gradingData];
                        if (filledData.length < 45) {
                            filledData.push(...Array(45 - filledData.length).fill(null));
                        }
                        const items = filledData.slice(0, 45); // Cap at 45 just in case

                        const isAdmission = data.isAdmission;
                        const vPadding = isAdmission ? '10px' : '1px';
                        const hPadding = '1px';
                        const cellPadding = `${vPadding} ${hPadding}`;
                        const headerPadding = isAdmission ? '10px 2px' : '2px';

                        return (
                            <table className="table" style={{ width: '100%', fontSize: '0.75rem', tableLayout: 'fixed', textAlign: 'center', lineHeight: '1.1' }}>
                                <colgroup>
                                    <col style={{ width: '60px', background: 'white' }} />
                                    {items.map((_, i) => <col key={i} style={{ width: 'auto' }} />)}
                                </colgroup>
                                <tbody>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>번호</th>
                                        {items.map((q, i) => (
                                            <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee', background: 'white', fontWeight: 'bold' }}>
                                                {q ? i + 1 : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>유형</th>
                                        {items.map((q, i) => {
                                            const getSafeType = (item: any) => item ? (item.type || '') : '';

                                            // Check if this type matches the previous one to decide if we should render
                                            if (i > 0 && getSafeType(q) === getSafeType(items[i - 1])) {
                                                return null;
                                            }

                                            // Calculate span
                                            let span = 1;
                                            for (let k = i + 1; k < items.length; k++) {
                                                if (getSafeType(items[k]) === getSafeType(q)) {
                                                    span++;
                                                } else {
                                                    break;
                                                }
                                            }

                                            return (
                                                <td key={i} colSpan={span} style={{ padding: cellPadding, borderBottom: '1px solid #eee', fontSize: '0.7rem', verticalAlign: 'middle', borderRight: '1px solid #eee', borderLeft: '1px solid #eee', whiteSpace: 'nowrap' }}>
                                                    {q ? q.type : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>정답</th>
                                        {items.map((q, i) => (
                                            <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee' }}>
                                                {q ? q.answer : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>학생</th>
                                        {items.map((q, i) => (
                                            <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee', color: q?.isCorrect ? 'inherit' : 'var(--error)', fontWeight: q?.isCorrect ? 'normal' : 'bold' }}>
                                                {q ? (q.studentAnswer || '-') : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>채점</th>
                                        {items.map((q, i) => (
                                            <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee' }}>
                                                {q ? (q.isCorrect ?
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>O</span> :
                                                    <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>X</span>
                                                ) : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <th style={{ padding: headerPadding, borderBottom: '1px solid #eee' }}>배점</th>
                                        {items.map((q, i) => (
                                            <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee', color: '#64748b' }}>
                                                {q ? q.score : ''}
                                            </td>
                                        ))}
                                    </tr>
                                    {!isAdmission && (
                                        <tr>
                                            <th style={{ padding: headerPadding, borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>정답률(%)</th>
                                            {items.map((q, i) => (
                                                <td key={i} style={{ padding: cellPadding, borderBottom: '1px solid #eee', color: '#64748b', fontSize: '0.7rem' }}>
                                                    {q ? `${q.correctRate}` : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>
            </div>
            <div className="report-footer" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <img src="/images/report_logo.png" alt="Dashnaru" style={{ height: '40px', objectFit: 'contain' }} />
                <img src="/images/report_address.png" alt="Address" style={{ height: '25px', objectFit: 'contain' }} />
            </div>
        </div>
    )
}
