'use client';

import { useState, useEffect } from 'react';
import { DashboardOverview } from '@/components/DashboardOverview';
import { SpendingChart } from '@/components/SpendingChart';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { NudgesList } from '@/components/NudgesList';
import { TransactionList } from '@/components/TransactionList';
import { AccountsGrid } from '@/components/AccountsGrid';
import { SustainabilityScore } from '@/components/SustainabilityScore';
import { Wallet } from 'lucide-react';

// Mock data for demonstration
const mockData = {
    overview: {
        totalBalance: { amount: 5505, currency: 'USD' },
        monthlyIncome: { amount: 4000, currency: 'USD' },
        monthlyExpenses: { amount: 2850, currency: 'USD' },
        monthlyNetCashFlow: { amount: 1150, currency: 'USD' },
        savingsRate: 28.8,
        accountsCount: 4,
        transactionsCount: 127,
    },
    accounts: [
        { id: '1', name: 'Maybank Savings', provider: 'BANK', balance: { amount: 5000, currency: 'USD' }, percentageOfTotal: 90.8 },
        { id: '2', name: 'GrabPay Wallet', provider: 'GRABPAY', balance: { amount: 250, currency: 'USD' }, percentageOfTotal: 4.5 },
        { id: '3', name: 'Touch \'n Go', provider: 'TNG', balance: { amount: 180, currency: 'USD' }, percentageOfTotal: 3.3 },
        { id: '4', name: 'ShopeePay', provider: 'SHOPEEPAY', balance: { amount: 75, currency: 'USD' }, percentageOfTotal: 1.4 },
    ],
    spendingTrends: {
        currentMonth: { month: '2024-01', totalAmount: 2850, count: 45 },
        previousMonth: { month: '2023-12', totalAmount: 2200, count: 38 },
        trend: 'increasing',
        percentageChange: 29.5,
        sixMonthHistory: [
            { month: '2023-08', totalAmount: 1800, count: 32 },
            { month: '2023-09', totalAmount: 2100, count: 35 },
            { month: '2023-10', totalAmount: 1950, count: 33 },
            { month: '2023-11', totalAmount: 2300, count: 40 },
            { month: '2023-12', totalAmount: 2200, count: 38 },
            { month: '2024-01', totalAmount: 2850, count: 45 },
        ],
    },
    categories: [
        { category: 'FOOD_DINING', totalAmount: 680, count: 28, percentage: 23.9 },
        { category: 'SHOPPING', totalAmount: 520, count: 8, percentage: 18.2 },
        { category: 'ENTERTAINMENT', totalAmount: 450, count: 12, percentage: 15.8 },
        { category: 'TRANSPORTATION', totalAmount: 380, count: 22, percentage: 13.3 },
        { category: 'GROCERIES', totalAmount: 320, count: 6, percentage: 11.2 },
        { category: 'UTILITIES', totalAmount: 280, count: 4, percentage: 9.8 },
        { category: 'OTHER', totalAmount: 220, count: 5, percentage: 7.7 },
    ],
    nudges: [
        { id: '1', type: 'SPENDING_INCREASE', severity: 'WARNING', title: 'Food spending up 31%', message: 'Your Food & Dining spending increased by 31% compared to last month.', isRead: false },
        { id: '2', type: 'ECO_SUGGESTION', severity: 'INFO', title: 'Go Green!', message: 'Only 18% of your transactions are eco-friendly. Consider choosing sustainable merchants.', isRead: false },
        { id: '3', type: 'SAVING_OPPORTUNITY', severity: 'SUCCESS', title: 'Great savings rate!', message: "You're saving 28.8% of your income this month. Keep it up!", isRead: true },
    ],
    recentTransactions: [
        { id: '1', merchantName: 'Nasi Lemak Corner', category: 'FOOD_DINING', amount: { amount: 12.50, currency: 'USD' }, type: 'EXPENSE', date: '2024-01-05' },
        { id: '2', merchantName: 'Shell Petrol', category: 'TRANSPORTATION', amount: { amount: 45.00, currency: 'USD' }, type: 'EXPENSE', date: '2024-01-05' },
        { id: '3', merchantName: 'Netflix', category: 'ENTERTAINMENT', amount: { amount: 15.99, currency: 'USD' }, type: 'EXPENSE', date: '2024-01-04', isRecurring: true },
        { id: '4', merchantName: 'Jaya Grocer', category: 'GROCERIES', amount: { amount: 85.30, currency: 'USD' }, type: 'EXPENSE', date: '2024-01-04', isEcoFriendly: true },
        { id: '5', merchantName: 'Salary', category: 'INCOME', amount: { amount: 3500, currency: 'USD' }, type: 'INCOME', date: '2024-01-01' },
    ],
    sustainability: {
        overall: 62,
        ecoFriendlyCount: 23,
        totalTransactions: 127,
        carbonFootprintEstimate: 45.2,
        improvement: { trend: 'improving', percentage: 8.5 },
    },
};

export default function HomePage() {
    const [data, setData] = useState(mockData);
    const [loading, setLoading] = useState(false);

    return (
        <div className="container">
            <header className="header">
                <div>
                    <h1>
                        <Wallet size={32} style={{ color: 'var(--accent-primary)' }} />
                        Open Finance
                    </h1>
                    <p className="subtitle">Personal Finance Dashboard for Malaysian Professionals</p>
                </div>
            </header>

            <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <DashboardOverview data={data.overview} />
            </div>

            <div className="dashboard-grid-main" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <SpendingChart data={data.spendingTrends} />
                    <CategoryBreakdown data={data.categories} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <NudgesList nudges={data.nudges} />
                    <SustainabilityScore data={data.sustainability} />
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <AccountsGrid accounts={data.accounts} />
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Transactions</h3>
                <TransactionList transactions={data.recentTransactions} />
            </div>
        </div>
    );
}
