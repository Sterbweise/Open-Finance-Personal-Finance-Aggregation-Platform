'use client';

import { AlertTriangle, Info, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Nudge {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    isRead: boolean;
}

interface NudgesListProps {
    nudges: Nudge[];
}

const SEVERITY_CONFIG = {
    WARNING: { icon: AlertTriangle, className: 'warning' },
    INFO: { icon: Info, className: 'info' },
    SUCCESS: { icon: CheckCircle, className: 'success' },
    ALERT: { icon: AlertCircle, className: 'alert' },
};

export function NudgesList({ nudges }: NudgesListProps) {
    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3>Financial Nudges</h3>
                <span className="badge badge-info">{nudges.filter(n => !n.isRead).length} new</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {nudges.map((nudge) => {
                    const config = SEVERITY_CONFIG[nudge.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.INFO;
                    const Icon = config.icon;
                    return (
                        <div key={nudge.id} className={`nudge-card ${config.className}`} style={{ opacity: nudge.isRead ? 0.6 : 1 }}>
                            <div className="icon">
                                <Icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{nudge.title}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{nudge.message}</div>
                            </div>
                            <button
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 4,
                                }}
                                title="Dismiss"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
