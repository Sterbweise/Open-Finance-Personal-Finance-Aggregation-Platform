'use client';

import { Utensils, ShoppingBag, Film, Car, ShoppingCart, Zap, Briefcase, Leaf, RefreshCw } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: any; className: string }> = {
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

export function TransactionList({ transactions }: TransactionListProps) {
    return (
        <div className="transaction-list">
            {transactions.map((tx) => {
                const config = CATEGORY_CONFIG[tx.category] ?? CATEGORY_CONFIG.OTHER;
                const Icon = config.icon;
                const isExpense = tx.type === 'EXPENSE';

                return (
                    <div key={tx.id} className="transaction-item">
                        <div className={`icon ${config.className}`}>
                            <Icon size={20} />
                        </div>
                        <div className="details">
                            <div className="merchant">
                                {tx.merchantName}
                                {tx.isRecurring && (
                                    <RefreshCw size={12} style={{ marginLeft: 6, color: 'var(--text-muted)' }} />
                                )}
                                {tx.isEcoFriendly && (
                                    <span className="eco-badge" style={{ marginLeft: 6 }}>
                                        <Leaf size={10} /> Eco
                                    </span>
                                )}
                            </div>
                            <div className="category">
                                {tx.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <div className={`amount ${isExpense ? 'expense' : 'income'}`}>
                            {isExpense ? '-' : '+'}${tx.amount.amount.toLocaleString()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
