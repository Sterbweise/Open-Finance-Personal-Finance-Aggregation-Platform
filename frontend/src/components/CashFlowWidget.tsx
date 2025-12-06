'use client';

import { TrendingUp, TrendingDown, DollarSign, ArrowRight } from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

interface CashFlowWidgetProps {
    income: { amount: number; currency: string };
    expenses: { amount: number; currency: string };
    netCashFlow: { amount: number; currency: string };
}

export function CashFlowWidget({ income, expenses, netCashFlow }: CashFlowWidgetProps) {
    const { convert, format } = useExchangeRates();

    const convertedIncome = convert(income.amount, (income.currency || 'USD') as Currency);
    const convertedExpenses = convert(expenses.amount, (expenses.currency || 'USD') as Currency);
    const convertedNet = convert(netCashFlow.amount, (netCashFlow.currency || 'USD') as Currency);

    const isPositive = convertedNet >= 0;
    const savingsRate = convertedIncome > 0 ? (convertedNet / convertedIncome) * 100 : 0;
    
    // Calculate percentages for visual bar
    const total = convertedIncome;
    const expensePercentage = total > 0 ? (convertedExpenses / total) * 100 : 0;
    const netPercentage = total > 0 ? Math.abs(convertedNet / total) * 100 : 0;

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Cash Flow Overview</h3>

            {/* Main Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                {/* Income */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Income</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                        {format(convertedIncome)}
                    </div>
                </div>

                {/* Expenses */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                        <TrendingDown size={16} style={{ color: 'var(--danger)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expenses</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                        {format(convertedExpenses)}
                    </div>
                </div>
            </div>

            {/* Visual Flow */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Flow Breakdown</span>
                </div>
                <div style={{
                    display: 'flex',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.03)',
                }}>
                    <div
                        style={{
                            width: `${expensePercentage}%`,
                            background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}
                        title={`Expenses: ${expensePercentage.toFixed(1)}%`}
                    >
                        {expensePercentage > 15 && `${expensePercentage.toFixed(0)}%`}
                    </div>
                    <div
                        style={{
                            width: `${netPercentage}%`,
                            background: isPositive
                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}
                        title={`Net: ${netPercentage.toFixed(1)}%`}
                    >
                        {netPercentage > 15 && `${netPercentage.toFixed(0)}%`}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Expenses</span>
                    <span>{isPositive ? 'Savings' : 'Deficit'}</span>
                </div>
            </div>

            {/* Net Cash Flow */}
            <div style={{
                padding: 'var(--spacing-lg)',
                background: isPositive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                            <DollarSign size={16} style={{ color: isPositive ? 'var(--success)' : 'var(--warning)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Net Cash Flow</span>
                        </div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: isPositive ? 'var(--success)' : 'var(--warning)',
                        }}>
                            {isPositive ? '+' : ''}{format(convertedNet)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                            Savings Rate
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: savingsRate >= 20 ? 'var(--success)' : savingsRate >= 10 ? 'var(--warning)' : 'var(--danger)',
                        }}>
                            {savingsRate.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Insight */}
                <div style={{
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                }}>
                    {savingsRate >= 20 ? (
                        <>🎉 Excellent! You're saving {savingsRate.toFixed(0)}% of your income.</>
                    ) : savingsRate >= 10 ? (
                        <>💪 Good job! Try to increase your savings rate to 20% or more.</>
                    ) : savingsRate >= 0 ? (
                        <>⚠️ Your savings rate is low. Consider reducing expenses.</>
                    ) : (
                        <>🚨 Warning: You're spending more than you earn this month!</>
                    )}
                </div>
            </div>
        </div>
    );
}

