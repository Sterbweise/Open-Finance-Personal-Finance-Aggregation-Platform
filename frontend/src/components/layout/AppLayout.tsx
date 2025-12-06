'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

interface AppLayoutContentProps {
    children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutContentProps) {
    const { isSidebarCollapsed, isMobileOpen } = useSettings();

    return (
        <div className="app-layout">
            <Sidebar />
            <main
                className="main-content"
                data-sidebar-collapsed={isSidebarCollapsed}
                data-mobile-open={isMobileOpen}
            >
                <div className="main-content-inner">
                    {children}
                </div>
            </main>
        </div>
    );
}

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <SettingsProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </SettingsProvider>
    );
}
