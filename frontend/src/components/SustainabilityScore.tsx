'use client';

import { Leaf, TrendingUp, TrendingDown } from 'lucide-react';

interface SustainabilityScoreProps {
    data: {
        overall: number;
        ecoFriendlyCount: number;
        totalTransactions: number;
        carbonFootprintEstimate: number;
        improvement: { trend: string; percentage: number };
    };
}

export function SustainabilityScore({ data }: SustainabilityScoreProps) {
    const circumference = 2 * Math.PI * 45;
    const progress = (data.overall / 100) * circumference;

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Sustainability Score</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
                <div style={{ position: 'relative', width: 120, height: 120 }}>
                    <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="100%" stopColor="#84cc16" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(0deg)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#22c55e' }}>{data.overall}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</div>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                        <Leaf size={16} style={{ color: '#22c55e' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {data.ecoFriendlyCount} of {data.totalTransactions} transactions are eco-friendly
                        </span>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Carbon Footprint</div>
                        <div style={{ fontWeight: 600 }}>{data.carbonFootprintEstimate} kg CO₂</div>
                    </div>

                    <div className={`badge ${data.improvement.trend === 'improving' ? 'badge-success' : 'badge-warning'}`}>
                        {data.improvement.trend === 'improving' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {data.improvement.trend === 'improving' ? '+' : ''}{data.improvement.percentage}% vs last month
                    </div>
                </div>
            </div>
        </div>
    );
}
