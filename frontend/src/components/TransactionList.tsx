'use client';

import { Utensils, ShoppingBag, Film, Car, ShoppingCart, Zap, Briefcase, Leaf, RefreshCw, LucideIcon } from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; className: string }> = {
    FOOD_DINING: { icon: Utensils, className: 'cat-food' },
    GROCERIES: { icon: ShoppingCart, className: 'cat-groceries' },
    TRANSPORTATION: { icon: Car, className: 'cat-transport' },
    ENTERTAINMENT: { icon: Film, className: 'cat-entertainment' },
    SHOPPING: { icon: ShoppingBag, className: 'cat-shopping' },
    UTILITIES: { icon: Zap, className: 'cat-utilities' },
    INCOME: { icon: Briefcase, className: 'cat-other' },
    OTHER: { icon: ShoppingBag, className: 'cat-other' },
};

interface Transaction {
    id: string;
    merchantName: string;
    category: string;
    amount: { amount: number; currency: string };
    type: string;
    date: string;
    isRecurring?: boolean;
    isEcoFriendly?: boolean;
}

interface TransactionListProps {
    transactions: Transaction[];
}

function formatCategory(category: string): string {
    return category
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateString: string): string {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}

export function TransactionList({ transactions }: TransactionListProps) {
    const { convert, format, currentCurrency } = useExchangeRates();

    if (!transactions || transactions.length === 0) {
        return (
            <div className="transactions-list">
                <div style={{
                    padding: 'var(--spacing-xl)',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                }}>
                    No recent transactions
                </div>
            </div>
        );
    }

    return (
        <div className="transactions-list">
            {transactions.map((tx) => {
                const config = CATEGORY_CONFIG[tx.category] ?? CATEGORY_CONFIG.OTHER;
                const Icon = config.icon;
                const isExpense = tx.type === 'EXPENSE';

                // Convert amount from source currency to user's preferred currency
                const sourceCurrency = (tx.amount.currency || 'USD') as Currency;
                const convertedAmount = convert(tx.amount.amount, sourceCurrency);
                const formattedAmount = format(convertedAmount);

                return (
                    <article key={tx.id} className="transaction-row">
                        <div className={`transaction-icon ${config.className}`}>
                            <Icon size={18} />
                        </div>

                        <div className="transaction-info">
                            <div className="transaction-merchant">
                                <span>{tx.merchantName}</span>
                                {tx.isRecurring && (
                                    <RefreshCw
                                        size={12}
                                        style={{ color: 'var(--info)', flexShrink: 0 }}
                                        aria-label="Recurring transaction"
                                    />
                                )}
                                {tx.isEcoFriendly && (
                                    <span className="eco-badge" aria-label="Eco-friendly purchase">
                                        <Leaf size={10} />
                                    </span>
                                )}
                            </div>
                            <div className="transaction-category">
                                {formatCategory(tx.category)} • {formatDate(tx.date)}
                            </div>
                        </div>

                        <div className={`transaction-amount ${isExpense ? 'expense' : 'income'}`}>
                            {isExpense ? '−' : '+'}{formattedAmount}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
