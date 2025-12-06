'use client';

import { Lightbulb, TrendingUp, AlertTriangle, Info, ArrowRight, Sparkles } from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

interface SmartNudgesWidgetProps {
    data: {
        overview: {
            monthlyIncome: { amount: number; currency: string };
            monthlyExpenses: { amount: number; currency: string };
            totalBalance: { amount: number; currency: string };
        };
        categories: {
            category: string;
            totalAmount: number;
            percentage: number;
        }[];
        accounts: {
            provider: string;
            balance: { amount: number; currency: string };
        }[];
    };
}

interface Nudge {
    id: string;
    type: 'insight' | 'warning' | 'tip' | 'achievement';
    title: string;
    message: string;
    icon: any;
    color: string;
    bgColor: string;
}

export function SmartNudgesWidget({ data }: SmartNudgesWidgetProps) {
    const { convert, format } = useExchangeRates();

    // Generate intelligent nudges based on user data
    const generateNudges = (): Nudge[] => {
        const nudges: Nudge[] = [];

        const convertedIncome = convert(data.overview.monthlyIncome.amount, (data.overview.monthlyIncome.currency || 'USD') as Currency);
        const convertedExpenses = convert(data.overview.monthlyExpenses.amount, (data.overview.monthlyExpenses.currency || 'USD') as Currency);
        const convertedBalance = convert(data.overview.totalBalance.amount, (data.overview.totalBalance.currency || 'USD') as Currency);

        // 1. Spending trends
        if (data.categories.length > 0) {
            const topCategory = data.categories[0];
            const topCategoryName = topCategory.category.replace(/_/g, ' ').toLowerCase();
            const topCategoryAmount = topCategory.totalAmount;
            const topCategoryPercentage = topCategory.percentage;

            if (topCategoryPercentage > 35) {
                nudges.push({
                    id: 'category-high',
                    type: 'warning',
                    title: 'High Spending Alert',
                    message: `${topCategoryName} accounts for ${topCategoryPercentage.toFixed(0)}% of your spending (${format(topCategoryAmount)}). Consider reviewing this category.`,
                    icon: AlertTriangle,
                    color: '#f59e0b',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                });
            }

            // Food spending insight
            const foodCategory = data.categories.find(c => c.category === 'FOOD_DINING');
            if (foodCategory && foodCategory.totalAmount > 500) {
                nudges.push({
                    id: 'food-spending',
                    type: 'tip',
                    title: 'Dining Opportunity',
                    message: `You spent ${format(foodCategory.totalAmount)} on dining. Cooking at home 2-3 times more per week could save ~${format(foodCategory.totalAmount * 0.3)}/month.`,
                    icon: Lightbulb,
                    color: '#6366f1',
                    bgColor: 'rgba(99, 102, 241, 0.1)',
                });
            }
        }

        // 2. Savings rate check
        const savingsRate = convertedIncome > 0 ? ((convertedIncome - convertedExpenses) / convertedIncome) * 100 : 0;
        
        if (savingsRate >= 20) {
            nudges.push({
                id: 'savings-achievement',
                type: 'achievement',
                title: 'Excellent Savings!',
                message: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep up the great work! You're on track to save ${format((convertedIncome - convertedExpenses) * 12)} this year.`,
                icon: Sparkles,
                color: '#22c55e',
                bgColor: 'rgba(34, 197, 94, 0.1)',
            });
        } else if (savingsRate < 10 && savingsRate >= 0) {
            nudges.push({
                id: 'savings-low',
                type: 'tip',
                title: 'Boost Your Savings',
                message: `Your savings rate is ${savingsRate.toFixed(0)}%. Financial experts recommend saving at least 20% of income. Small changes can make a big difference!`,
                icon: TrendingUp,
                color: '#3b82f6',
                bgColor: 'rgba(59, 130, 246, 0.1)',
            });
        } else if (savingsRate < 0) {
            nudges.push({
                id: 'spending-alert',
                type: 'warning',
                title: 'Spending Exceeds Income',
                message: `You're spending ${format(Math.abs(convertedExpenses - convertedIncome))} more than you earn. Review your expenses to avoid depleting your savings.`,
                icon: AlertTriangle,
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
            });
        }

        // 3. Account balance optimization
        const wallets = data.accounts.filter(acc => ['GRABPAY', 'TNG', 'SHOPEEPAY'].includes(acc.provider));
        const banks = data.accounts.filter(acc => acc.provider === 'BANK');
        
        if (wallets.length > 0 && banks.length > 0) {
            const walletTotal = wallets.reduce((sum, w) => {
                return sum + convert(w.balance.amount, (w.balance.currency || 'USD') as Currency);
            }, 0);
            const bankTotal = banks.reduce((sum, b) => {
                return sum + convert(b.balance.amount, (b.balance.currency || 'USD') as Currency);
            }, 0);

            if (walletTotal > bankTotal * 0.5 && walletTotal > 1000) {
                nudges.push({
                    id: 'wallet-balance',
                    type: 'tip',
                    title: 'Balance Optimization',
                    message: `You have ${format(walletTotal)} across e-wallets. Consider moving unused funds to your bank account to earn interest.`,
                    icon: Info,
                    color: '#06b6d4',
                    bgColor: 'rgba(6, 182, 212, 0.1)',
                });
            }
        }

        // 4. Emergency fund check
        if (convertedBalance < convertedExpenses * 3) {
            nudges.push({
                id: 'emergency-fund',
                type: 'insight',
                title: 'Emergency Fund Goal',
                message: `Build an emergency fund of 3-6 months expenses (${format(convertedExpenses * 3)} - ${format(convertedExpenses * 6)}). You're ${format(Math.max(0, convertedExpenses * 3 - convertedBalance))} away from your 3-month goal.`,
                icon: Info,
                color: '#8b5cf6',
                bgColor: 'rgba(139, 92, 246, 0.1)',
            });
        }

        // 5. Transportation spending
        const transportCategory = data.categories.find(c => c.category === 'TRANSPORTATION');
        if (transportCategory && transportCategory.totalAmount > 300) {
            nudges.push({
                id: 'transport-tip',
                type: 'tip',
                title: 'Transportation Costs',
                message: `Transportation costs ${format(transportCategory.totalAmount)} this month. Using GrabPay or TNG e-wallet promotions could save up to 15%.`,
                icon: Lightbulb,
                color: '#22c55e',
                bgColor: 'rgba(34, 197, 94, 0.1)',
            });
        }

        // Return top 4 nudges
        return nudges.slice(0, 4);
    };

    const nudges = generateNudges();

    if (nudges.length === 0) {
        return (
            <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Smart Insights</h3>
                <div style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                }}>
                    <Lightbulb size={32} style={{ margin: '0 auto var(--spacing-sm) auto', opacity: 0.3 }} />
                    <p>Keep tracking your spending to unlock personalized insights!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0 }}>Smart Insights</h3>
                <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                    {nudges.length} New
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {nudges.map((nudge) => {
                    const Icon = nudge.icon;
                    return (
                        <div
                            key={nudge.id}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: nudge.bgColor,
                                border: `1px solid ${nudge.color}30`,
                                borderRadius: 'var(--radius-md)',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.borderColor = `${nudge.color}60`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.borderColor = `${nudge.color}30`;
                            }}
                        >
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 'var(--radius-sm)',
                                    background: `${nudge.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={18} style={{ color: nudge.color }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--spacing-xs)',
                                    }}>
                                        {nudge.title}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.5,
                                    }}>
                                        {nudge.message}
                                    </div>
                                </div>
                                <ArrowRight size={16} style={{ color: nudge.color, flexShrink: 0, marginTop: 'var(--spacing-xs)' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

