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
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
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
        layout: {
            padding: {
                top: 20 // Add padding for labels
            }
        },
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#333' }
            },
            title: {
                display: false,
            },
            datalabels: {
                display: true,
                color: '#333',
                align: 'top' as const,
                anchor: 'start' as const,
                offset: -4,
                font: {
                    weight: 'bold' as const,
                    size: 11
                },
                formatter: (value: number) => value // Just show the number
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' }
            },
            x: {
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' }
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
