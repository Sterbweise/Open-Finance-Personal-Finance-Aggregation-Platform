'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';
import { Building2, Smartphone, CreditCard, Wallet, PieChart } from 'lucide-react';

Chart.register(...registerables);

const PROVIDER_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    BANK: { label: 'Bank Accounts', color: '#6366f1', icon: Building2 },
    GRABPAY: { label: 'GrabPay', color: '#22c55e', icon: Smartphone },
    TNG: { label: 'Touch \'n Go', color: '#3b82f6', icon: CreditCard },
    SHOPEEPAY: { label: 'ShopeePay', color: '#f97316', icon: Wallet },
    OTHER: { label: 'Other', color: '#64748b', icon: Wallet },
};

interface AccountRepartitionChartProps {
    accounts: {
        id: string;
        name: string;
        provider: string;
        balance: { amount: number; currency: string };
        percentageOfTotal?: number;
    }[];
}

export function AccountRepartitionChart({ accounts }: AccountRepartitionChartProps) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);
    const { convert, format, currentCurrency } = useExchangeRates();

    useEffect(() => {
        if (!chartRef.current || accounts.length === 0) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Group accounts by provider and convert to user's currency
        const providerTotals: Record<string, number> = {};
        
        accounts.forEach(account => {
            const sourceCurrency = (account.balance.currency || 'USD') as Currency;
            const convertedBalance = convert(account.balance.amount, sourceCurrency);
            const provider = account.provider || 'OTHER';
            
            if (!providerTotals[provider]) {
                providerTotals[provider] = 0;
            }
            providerTotals[provider] += convertedBalance;
        });

        const providers = Object.keys(providerTotals);
        const values = Object.values(providerTotals);
        const colors = providers.map(p => PROVIDER_CONFIG[p]?.color || PROVIDER_CONFIG.OTHER.color);

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: providers.map(p => PROVIDER_CONFIG[p]?.label || p),
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#1a1a24',
                    borderWidth: 3,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        display: false,
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
    }, [accounts, convert, format, currentCurrency]);

    // Calculate total and prepare legend
    const providerTotals: Record<string, number> = {};
    let grandTotal = 0;

    accounts.forEach(account => {
        const sourceCurrency = (account.balance.currency || 'USD') as Currency;
        const convertedBalance = convert(account.balance.amount, sourceCurrency);
        const provider = account.provider || 'OTHER';
        
        if (!providerTotals[provider]) {
            providerTotals[provider] = 0;
        }
        providerTotals[provider] += convertedBalance;
        grandTotal += convertedBalance;
    });

    const providerData = Object.entries(providerTotals).map(([provider, total]) => ({
        provider,
        total,
        percentage: (total / grandTotal) * 100,
        config: PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.OTHER,
    }));

    if (accounts.length === 0) {
        return (
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Account Distribution</h3>
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                    No accounts to display
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Account Distribution</h3>

            {/* Chart */}
            <div style={{ 
                position: 'relative',
                width: '240px',
                height: '240px',
                margin: '0 auto var(--spacing-lg) auto',
            }}>
                <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
                {/* Center text */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {format(grandTotal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {providerData.map(({ provider, total, percentage, config }) => {
                    const Icon = config.icon;
                    return (
                        <div key={provider} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-sm)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${config.color}15`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 'var(--radius-sm)',
                                    background: `${config.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon size={16} style={{ color: config.color }} />
                                </div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {config.label}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{format(total)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {percentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

