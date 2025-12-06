'use client';

import { useState, useEffect } from 'react';
import {
    Receipt,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Utensils,
    ShoppingBag,
    Film,
    Car,
    ShoppingCart,
    Zap,
    Briefcase,
    Leaf,
    RefreshCw,
    Calendar,
} from 'lucide-react';
import { useSettings, Currency } from '@/contexts/SettingsContext';

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; className: string }> = {
    FOOD_DINING: { icon: Utensils, label: 'Food & Dining', className: 'cat-food' },
    GROCERIES: { icon: ShoppingCart, label: 'Groceries', className: 'cat-groceries' },
    TRANSPORTATION: { icon: Car, label: 'Transportation', className: 'cat-transport' },
    ENTERTAINMENT: { icon: Film, label: 'Entertainment', className: 'cat-entertainment' },
    SHOPPING: { icon: ShoppingBag, label: 'Shopping', className: 'cat-shopping' },
    UTILITIES: { icon: Zap, label: 'Utilities', className: 'cat-utilities' },
    INCOME: { icon: Briefcase, label: 'Income', className: 'cat-other' },
    OTHER: { icon: ShoppingBag, label: 'Other', className: 'cat-other' },
};

interface Transaction {
    id: string;
    merchantName: string;
    category: string;
    amount: number;
    currency: string;
    type: string;
    transactionDate: string;
    isRecurring: boolean;
    isEcoFriendly: boolean;
}

export default function TransactionsPage() {
    const { preferences, convertCurrency, formatCurrency } = useSettings();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?page=${page}&limit=15`);
            const data = await res.json();
            if (data.success) {
                setTransactions(data.data.transactions);
                setTotalPages(data.data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredTransactions = transactions.filter((tx) => {
        const matchesSearch = tx.merchantName?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = !categoryFilter || tx.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="transactions-page">
            <header className="page-header">
                <div className="page-title">
                    <Receipt size={28} className="title-icon" />
                    <div>
                        <h1>Transactions</h1>
                        <p className="subtitle">View and manage your transaction history</p>
                    </div>
                </div>
                <button onClick={fetchTransactions} className="refresh-btn">
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </header>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="category-filter"
                >
                    <option value="">All Categories</option>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* Transactions Table */}
            <div className="card transactions-card">
                {loading ? (
                    <div className="loading-state">
                        <RefreshCw size={32} className="animate-spin" />
                        <p>Loading transactions...</p>
                    </div>
                ) : (
                    <>
                        <div className="transactions-table">
                            <div className="table-header">
                                <span className="col-merchant">Merchant</span>
                                <span className="col-category">Category</span>
                                <span className="col-date">Date</span>
                                <span className="col-amount">Amount</span>
                            </div>

                            {filteredTransactions.map((tx) => {
                                const config = CATEGORY_CONFIG[tx.category] ?? CATEGORY_CONFIG.OTHER;
                                const Icon = config.icon;
                                const isExpense = tx.type === 'EXPENSE';
                                
                                // Convert amount from transaction's currency to user's preferred currency
                                const sourceCurrency = (tx.currency || 'USD') as Currency;
                                const convertedAmount = convertCurrency(tx.amount, sourceCurrency);
                                const displayAmount = formatCurrency(convertedAmount);

                                return (
                                    <div key={tx.id} className="table-row">
                                        <div className="col-merchant">
                                            <div className={`tx-icon ${config.className}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="merchant-info">
                                                <span className="merchant-name">
                                                    {tx.merchantName || 'Unknown'}
                                                    {tx.isRecurring && <RefreshCw size={12} className="recurring-badge" />}
                                                    {tx.isEcoFriendly && (
                                                        <span className="eco-badge"><Leaf size={10} /></span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-category">
                                            <span className={`category-badge ${config.className}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="col-date">
                                            <Calendar size={14} />
                                            {formatDate(tx.transactionDate)}
                                        </div>
                                        <div className={`col-amount ${isExpense ? 'expense' : 'income'}`}>
                                            {isExpense ? '-' : '+'}{displayAmount}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="pagination-btn"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <span className="page-info">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="pagination-btn"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
