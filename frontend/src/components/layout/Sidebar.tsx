'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    User,
    Menu,
    X,
    LucideIcon,
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const {
        profile,
        logout,
        isSidebarCollapsed,
        isMobileOpen,
        toggleSidebar,
        setMobileOpen
    } = useSettings();

    const handleNavClick = () => {
        // Close mobile menu on navigation
        if (isMobileOpen) {
            setMobileOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Menu Button - Fixed position */}
            <button
                onClick={() => setMobileOpen(true)}
                className="mobile-menu-btn"
                aria-label="Open menu"
                type="button"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
                role="navigation"
                aria-label="Main navigation"
            >
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Wallet size={28} className="logo-icon" />
                        {!isSidebarCollapsed && (
                            <span className="logo-text">MyDuit</span>
                        )}
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="mobile-close-btn"
                        aria-label="Close menu"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={handleNavClick}
                                title={isSidebarCollapsed ? item.name : undefined}
                            >
                                <Icon size={20} className="nav-icon" />
                                {!isSidebarCollapsed && (
                                    <span className="nav-text">{item.name}</span>
                                )}
                                {isActive && <div className="nav-indicator" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    {profile && (
                        <div className="user-info">
                            <div className="user-avatar">
                                <User size={18} />
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="user-details">
                                    <span className="user-name">{profile.firstName} {profile.lastName}</span>
                                    <span className="user-email">{profile.email}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button onClick={logout} className="logout-btn" title="Logout" type="button">
                        <LogOut size={18} />
                        {!isSidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Collapse Toggle - Desktop Only */}
                <button
                    onClick={toggleSidebar}
                    className="collapse-btn"
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    type="button"
                >
                    {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </aside>
        </>
    );
}
