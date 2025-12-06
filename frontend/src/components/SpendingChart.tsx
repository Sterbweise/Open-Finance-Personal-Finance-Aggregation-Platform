'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SpendingChartProps {
    data: {
        sixMonthHistory: { month: string; totalAmount: number; count: number }[];
        trend: string;
        percentageChange: number;
    };
}

export function SpendingChart({ data }: SpendingChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.sixMonthHistory.map(h => {
                    const [year, month] = h.month.split('-');
                    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
                }),
                datasets: [{
                    label: 'Monthly Spending',
                    data: data.sixMonthHistory.map(h => h.totalAmount),
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 36, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#a0a0b0',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `$${ctx.parsed.y.toLocaleString()}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6a6a7a' },
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#6a6a7a',
                            callback: (value) => `$${(value as number / 1000).toFixed(1)}k`,
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3>Spending Trends</h3>
                <span className={`badge ${data.trend === 'increasing' ? 'badge-danger' : 'badge-success'}`}>
                    {data.trend === 'increasing' ? '↑' : '↓'} {Math.abs(data.percentageChange)}%
                </span>
            </div>
            <div style={{ height: '280px' }}>
                <canvas ref={chartRef} />
            </div>
        </div>
    );
}
