'use client';

import { useState, useEffect } from 'react';
import {
    Wallet,
    Building2,
    Smartphone,
    CreditCard,
    Plus,
    RefreshCw,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

const PROVIDER_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    BANK: { icon: Building2, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
    GRABPAY: { icon: Smartphone, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
    TNG: { icon: CreditCard, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    SHOPEEPAY: { icon: Wallet, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    VIRTUAL_BANK: { icon: Building2, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    MANUAL: { icon: Wallet, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
};

interface MoneyValue {
    amount: number;
    currency: string;
}

interface Account {
    id: string;
    name: string;
    provider: string;
    accountType: string;
    balance: MoneyValue;
    balanceConverted: MoneyValue;
    percentageOfTotal: number;
    isActive: boolean;
    lastSyncedAt?: string;
}

interface AccountsResponse {
    accounts: Account[];
    totalBalance: MoneyValue;
    baseCurrency: string;
}

export default function AccountsPage() {
    const { convert, format, currentCurrency } = useExchangeRates();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalBalance, setTotalBalance] = useState<MoneyValue>({ amount: 0, currency: 'USD' });
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('http://localhost:3001/api/v1/accounts');
            if (!res.ok) throw new Error('Failed to fetch accounts');
            
            const data = await res.json();
            if (data.success && data.data) {
                const accountsData: AccountsResponse = data.data;
                setAccounts(accountsData.accounts);
                setTotalBalance(accountsData.totalBalance);
            }
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    // Format account balance - use convert for display in user's preferred currency
    const formatAccountBalance = (balance: MoneyValue): string => {
        const sourceCurrency = (balance.currency || 'USD') as Currency;
        const convertedAmount = convert(balance.amount, sourceCurrency);
        return format(convertedAmount);
    };

    // Calculate total in user's preferred currency
    const calculateDisplayTotal = (): number => {
        return accounts.reduce((sum, acc) => {
            const sourceCurrency = (acc.balance.currency || 'USD') as Currency;
            return sum + convert(acc.balance.amount, sourceCurrency);
        }, 0);
    };

    const displayTotal = calculateDisplayTotal();

    return (
        <div className="accounts-page">
            <header className="page-header">
                <div className="page-title">
                    <Wallet size={28} className="title-icon" />
                    <div>
                        <h1>Accounts</h1>
                        <p className="subtitle">Manage your connected e-wallets and bank accounts</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={fetchAccounts} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={16} />
                        Add Account
                    </button>
                </div>
            </header>

            {/* Error State */}
            {error && (
                <div className="card" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)' }}>
                    <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Total Balance Card */}
            <div className="total-balance-card card">
                <div className="balance-header">
                    <span className="balance-label">Total Balance</span>
                    <TrendingUp size={20} className="trend-icon" />
                </div>
                <div className="balance-amount">{format(displayTotal)}</div>
                <div className="balance-meta">
                    <span className="accounts-count">{accounts.length} connected accounts</span>
                    <span className="change positive">
                        <ArrowUpRight size={14} />
                        +12.5% this month
                    </span>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="accounts-grid">
                {loading ? (
                    <div className="loading-state card">
                        <RefreshCw size={32} className="animate-spin" />
                        <p>Loading accounts...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <Wallet size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }} />
                        <p style={{ color: 'var(--text-muted)' }}>No accounts connected yet</p>
                    </div>
                ) : (
                    accounts.map((account) => {
                        const config = PROVIDER_CONFIG[account.provider] ?? PROVIDER_CONFIG.BANK;
                        const Icon = config.icon;
                        
                        // Calculate percentage based on converted amounts
                        const sourceCurrency = (account.balance.currency || 'USD') as Currency;
                        const convertedBalance = convert(account.balance.amount, sourceCurrency);
                        const percentOfTotal = displayTotal > 0 
                            ? (convertedBalance / displayTotal) * 100 
                            : 0;

                        return (
                            <div key={account.id} className="account-card card">
                                <div className="account-header">
                                    <div
                                        className="account-icon"
                                        style={{ background: config.bg }}
                                    >
                                        <Icon size={24} style={{ color: config.color }} />
                                    </div>
                                    <div className={`account-status ${account.isActive ? 'active' : 'inactive'}`}>
                                        {account.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="account-info">
                                    <h3 className="account-name">{account.name}</h3>
                                    <span className="account-provider">{account.provider.replace('_', ' ')}</span>
                                </div>

                                <div className="account-balance">
                                    {/* Show converted balance in user's preferred currency */}
                                    <span className="balance-value">{format(convertedBalance)}</span>
                                    
                                    {/* Show original currency if different from preferred */}
                                    {account.balance.currency !== currentCurrency && (
                                        <span className="original-balance" style={{ 
                                            fontSize: '0.75rem', 
                                            color: 'var(--text-muted)',
                                            marginTop: '2px',
                                            display: 'block'
                                        }}>
                                            ({account.balance.currency} {account.balance.amount.toLocaleString()})
                                        </span>
                                    )}
                                    
                                    <div className="balance-bar">
                                        <div
                                            className="balance-fill"
                                            style={{
                                                width: `${Math.min(percentOfTotal, 100)}%`,
                                                background: config.color,
                                            }}
                                        />
                                    </div>
                                    <span className="balance-percent">{percentOfTotal.toFixed(1)}% of total</span>
                                </div>

                                <div className="account-actions">
                                    <button className="action-btn">View Details</button>
                                    <button className="action-btn secondary">
                                        <RefreshCw size={14} />
                                        Sync
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Account Prompt */}
            <div className="add-account-prompt card">
                <div className="prompt-content">
                    <Smartphone size={40} className="prompt-icon" />
                    <div>
                        <h3>Connect More Accounts</h3>
                        <p>Link your e-wallets and bank accounts to get a complete view of your finances.</p>
                    </div>
                </div>
                <button className="btn btn-outline">
                    <Plus size={16} />
                    Connect Account
                </button>
            </div>
        </div>
    );
}
