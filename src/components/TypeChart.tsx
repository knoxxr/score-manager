'use client'

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
)

type Props = {
    data: {
        labels: string[]
        scores: number[]
        averages?: number[] // Optional: Class average for comparison
    }
}

export default function TypeChart({ data }: Props) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 20,
                    display: false // Hide numbers to look cleaner
                },
                pointLabels: {
                    font: {
                        size: 12
                    }
                }
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top' as const,
            }
        }
    }

    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: '내 점수',
                data: data.scores,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
            },
            // Add average dataset if available
            ...(data.averages ? [{
                label: '평균',
                data: data.averages,
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                borderColor: '#94a3b8',
                borderWidth: 1,
                borderDash: [5, 5]
            }] : [])
        ],
    }

    return <Radar data={chartData} options={options} />
}
