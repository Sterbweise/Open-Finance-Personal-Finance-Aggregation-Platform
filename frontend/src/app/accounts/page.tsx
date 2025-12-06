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
import { useSettings } from '@/contexts/SettingsContext';

const PROVIDER_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
    BANK: { icon: Building2, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
    GRABPAY: { icon: Smartphone, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
    TNG: { icon: CreditCard, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    SHOPEEPAY: { icon: Wallet, color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
};

interface Account {
    id: string;
    name: string;
    provider: string;
    accountType: string;
    balance: number;
    currency: string;
    isActive: boolean;
}

export default function AccountsPage() {
    const { preferences } = useSettings();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalBalance, setTotalBalance] = useState(0);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            if (data.success && data.data.accounts) {
                setAccounts(data.data.accounts);
                const total = data.data.accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
                setTotalBalance(total);
            }
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: preferences.currency,
        }).format(amount);
    };

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
                <button className="btn btn-primary">
                    <Plus size={16} />
                    Add Account
                </button>
            </header>

            {/* Total Balance Card */}
            <div className="total-balance-card card">
                <div className="balance-header">
                    <span className="balance-label">Total Balance</span>
                    <TrendingUp size={20} className="trend-icon" />
                </div>
                <div className="balance-amount">{formatCurrency(totalBalance)}</div>
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
                ) : (
                    accounts.map((account) => {
                        const config = PROVIDER_CONFIG[account.provider] ?? PROVIDER_CONFIG.BANK;
                        const Icon = config.icon;
                        const percentOfTotal = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;

                        return (
                            <div key={account.id} className="account-card card">
                                <div className="account-header">
                                    <div
                                        className="account-icon"
                                        style={{ background: config.bg }}
                                    >
                                        <Icon size={24} style={{ color: config.color }} />
                                    </div>
                                    <div className="account-status active">Active</div>
                                </div>

                                <div className="account-info">
                                    <h3 className="account-name">{account.name}</h3>
                                    <span className="account-provider">{account.provider.replace('_', ' ')}</span>
                                </div>

                                <div className="account-balance">
                                    <span className="balance-value">{formatCurrency(account.balance)}</span>
                                    <div className="balance-bar">
                                        <div
                                            className="balance-fill"
                                            style={{
                                                width: `${percentOfTotal}%`,
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
