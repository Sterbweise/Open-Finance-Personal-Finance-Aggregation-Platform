'use client';

import { TrendingUp, TrendingDown, Wallet, CreditCard, PieChart, Activity } from 'lucide-react';

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

const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export function DashboardOverview({ data }: OverviewProps) {
    const metrics = [
        {
            label: 'Total Balance',
            value: formatCurrency(data.totalBalance.amount, data.totalBalance.currency),
            icon: <Wallet size={24} />,
            color: 'var(--accent-primary)',
        },
        {
            label: 'Monthly Income',
            value: formatCurrency(data.monthlyIncome.amount, data.monthlyIncome.currency),
            icon: <TrendingUp size={24} />,
            color: 'var(--success)',
            change: '+12%',
            changeType: 'positive',
        },
        {
            label: 'Monthly Expenses',
            value: formatCurrency(data.monthlyExpenses.amount, data.monthlyExpenses.currency),
            icon: <CreditCard size={24} />,
            color: 'var(--danger)',
            change: '+29.5%',
            changeType: 'negative',
        },
        {
            label: 'Savings Rate',
            value: `${data.savingsRate}%`,
            icon: <PieChart size={24} />,
            color: 'var(--success)',
            change: 'Good!',
            changeType: 'positive',
        },
    ];

    return (
        <>
            {metrics.map((metric, index) => (
                <div key={metric.label} className="card metric-card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="label">{metric.label}</span>
                        <div style={{ color: metric.color }}>{metric.icon}</div>
                    </div>
                    <span className="value">{metric.value}</span>
                    {metric.change && (
                        <span className={`change ${metric.changeType}`}>
                            {metric.changeType === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {metric.change}
                        </span>
                    )}
                </div>
            ))}
        </>
    );
}
