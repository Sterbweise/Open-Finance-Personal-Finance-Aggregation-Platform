'use client';

import { useExchangeRates } from '@/contexts/SettingsContext';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    FOOD_DINING: { label: 'Food & Dining', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    GROCERIES: { label: 'Groceries', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' },
    TRANSPORTATION: { label: 'Transportation', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    ENTERTAINMENT: { label: 'Entertainment', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
    SHOPPING: { label: 'Shopping', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    UTILITIES: { label: 'Utilities', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
    OTHER: { label: 'Other', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
};

// Support both legacy number format and new Money object format
interface CategoryData {
    category: string;
    totalAmount: number | { amount: number; currency: string };
    count?: number;
    percentage: number;
}

interface CategoryBreakdownProps {
    data: CategoryData[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
    const { format } = useExchangeRates();

    return (
        <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Spending by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {data.map((cat) => {
                    const config = CATEGORY_CONFIG[cat.category] ?? CATEGORY_CONFIG.OTHER;
                    // Handle both number and Money object formats
                    const amount = typeof cat.totalAmount === 'number' 
                        ? cat.totalAmount 
                        : cat.totalAmount.amount;
                    
                    return (
                        <div key={cat.category}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: config.color }} />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{config.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <span style={{ fontWeight: 600 }}>{format(amount)}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', width: '50px', textAlign: 'right' }}>
                                        {cat.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div className="fill" style={{ width: `${cat.percentage}%`, background: config.color }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
