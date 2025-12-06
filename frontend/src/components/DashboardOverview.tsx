'use client';

import { TrendingUp, TrendingDown, Wallet, CreditCard, PieChart } from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

interface OverviewProps {
    data: {
        totalBalance: { amount: number; currency: string };
        monthlyIncome: { amount: number; currency: string };
        monthlyExpenses: { amount: number; currency: string };
        monthlyNetCashFlow: { amount: number; currency: string };
        savingsRate: number;
        accountsCount: number;
        transactionsCount: number;
    };
}

export function DashboardOverview({ data }: OverviewProps) {
    const { convert, format } = useExchangeRates();

    const formatValue = (value: { amount: number; currency: string }) => {
        const sourceCurrency = (value.currency || 'USD') as Currency;
        const converted = convert(value.amount, sourceCurrency);
        return format(converted);
    };

    const metrics = [
        {
            label: 'Total Balance',
            value: formatValue(data.totalBalance),
            icon: <Wallet size={22} />,
            color: 'var(--accent-primary)',
        },
        {
            label: 'Monthly Income',
            value: formatValue(data.monthlyIncome),
            icon: <TrendingUp size={22} />,
            color: 'var(--success)',
            change: '+12%',
            changeType: 'positive',
        },
        {
            label: 'Monthly Expenses',
            value: formatValue(data.monthlyExpenses),
            icon: <CreditCard size={22} />,
            color: 'var(--danger)',
            change: '+29.5%',
            changeType: 'negative',
        },
        {
            label: 'Savings Rate',
            value: `${data.savingsRate.toFixed(1)}%`,
            icon: <PieChart size={22} />,
            color: data.savingsRate > 20 ? 'var(--success)' : 'var(--warning)',
            change: data.savingsRate > 20 ? 'Good!' : 'Improve',
            changeType: data.savingsRate > 20 ? 'positive' : 'negative',
        },
    ];

    return (
        <>
            {metrics.map((metric, index) => (
                <div
                    key={metric.label}
                    className="card metric-card animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="label">{metric.label}</span>
                        <div style={{ color: metric.color }}>{metric.icon}</div>
                    </div>
                    <span className="value">{metric.value}</span>
                    {metric.change && (
                        <span
                            className="badge"
                            style={{
                                marginTop: 'var(--spacing-xs)',
                                background: metric.changeType === 'positive' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color: metric.changeType === 'positive' ? 'var(--success)' : 'var(--danger)'
                            }}
                        >
                            {metric.changeType === 'positive' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span style={{ marginLeft: 4 }}>{metric.change}</span>
                        </span>
                    )}
                </div>
            ))}
        </>
    );
}
