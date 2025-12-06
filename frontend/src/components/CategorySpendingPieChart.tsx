'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useExchangeRates } from '@/contexts/SettingsContext';
import { PieChart as PieChartIcon } from 'lucide-react';

Chart.register(...registerables);

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    FOOD_DINING: { label: 'Food & Dining', color: '#f97316' },
    GROCERIES: { label: 'Groceries', color: '#84cc16' },
    TRANSPORTATION: { label: 'Transportation', color: '#06b6d4' },
    ENTERTAINMENT: { label: 'Entertainment', color: '#ec4899' },
    SHOPPING: { label: 'Shopping', color: '#8b5cf6' },
    UTILITIES: { label: 'Utilities', color: '#6366f1' },
    HEALTHCARE: { label: 'Healthcare', color: '#10b981' },
    EDUCATION: { label: 'Education', color: '#f59e0b' },
    TRAVEL: { label: 'Travel', color: '#14b8a6' },
    OTHER: { label: 'Other', color: '#64748b' },
};

interface CategorySpendingPieChartProps {
    data: {
        category: string;
        totalAmount: number;
        count: number;
        percentage: number;
    }[];
}

export function CategorySpendingPieChart({ data }: CategorySpendingPieChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);
    const { format } = useExchangeRates();

    useEffect(() => {
        if (!chartRef.current || data.length === 0) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const labels = data.map(cat => CATEGORY_CONFIG[cat.category]?.label || cat.category);
        const values = data.map(cat => cat.totalAmount);
        const colors = data.map(cat => CATEGORY_CONFIG[cat.category]?.color || CATEGORY_CONFIG.OTHER.color);

        chartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#1a1a24',
                    borderWidth: 2,
                    hoverOffset: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a0a0b0',
                            padding: 12,
                            font: {
                                size: 11,
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i] as number;
                                        const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(0);
                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                                            hidden: false,
                                            index: i,
                                        };
                                    });
                                }
                                return [];
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 36, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#a0a0b0',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => {
                                const value = ctx.parsed;
                                const total = values.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${format(value)} (${percentage}%)`;
                            },
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
    }, [data, format]);

    const total = data.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const totalCount = data.reduce((sum, cat) => sum + cat.count, 0);

    return (
        <div className="card">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    <PieChartIcon size={24} style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ margin: 0 }}>Spending by Category</h3>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spent</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{format(total)}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transactions</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{totalCount}</div>
                    </div>
                </div>
            </div>

            <div style={{ height: '280px' }}>
                <canvas ref={chartRef} />
            </div>
        </div>
    );
}

