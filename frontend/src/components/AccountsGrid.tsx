'use client';

import { Building2, Smartphone, CreditCard, Wallet } from 'lucide-react';
import { useExchangeRates, Currency } from '@/contexts/SettingsContext';

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
    balance: { amount: number; currency: string };
    percentageOfTotal: number;
}

interface AccountsGridProps {
    accounts: Account[];
}

export function AccountsGrid({ accounts }: AccountsGridProps) {
    const { convert, format } = useExchangeRates();

    return (
        <>
            {accounts.map((account, index) => {
                const config = PROVIDER_CONFIG[account.provider] ?? PROVIDER_CONFIG.BANK;
                const Icon = config.icon;

                const sourceCurrency = (account.balance.currency || 'USD') as Currency;
                const convertedBalance = convert(account.balance.amount, sourceCurrency);
                const formattedBalance = format(convertedBalance);

                return (
                    <div key={account.id} className="card animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 'var(--radius-md)',
                                background: config.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Icon size={22} style={{ color: config.color }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {account.name}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {account.provider.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
                            {formattedBalance}
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                            <div className="fill" style={{ width: `${account.percentageOfTotal}%`, background: config.color }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            {account.percentageOfTotal.toFixed(1)}% of total balance
                        </div>
                    </div>
                );
            })}
        </>
    );
}
