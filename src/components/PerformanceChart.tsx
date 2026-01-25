'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

type Props = {
    data: {
        labels: string[]
        scores: number[]
    }
}

export default function PerformanceChart({ data }: Props) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#94a3b8' }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            }
        }
    }

    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Total Score',
                data: data.scores,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.5)',
                tension: 0.3,
            },
        ],
    }

    return <Line options={options} data={chartData} />
}
