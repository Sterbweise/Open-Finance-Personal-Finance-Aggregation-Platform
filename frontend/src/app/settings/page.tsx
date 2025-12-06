'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSettings, useUserProfile, usePreferences, Currency } from '@/contexts/SettingsContext';
import {
    Settings,
    Globe,
    Bell,
    Leaf,
    Moon,
    User,
    Mail,
    LogOut,
    Check,
    Save,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
}

// ============================================
// CONSTANTS
// ============================================

const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
];

// ============================================
// VALIDATION
// ============================================

function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(
    firstName: string,
    lastName: string,
    email: string
): FormErrors | null {
    const errors: FormErrors = {};

    if (!firstName.trim()) {
        errors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName.trim()) {
        errors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!email.trim()) {
        errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
        errors.email = 'Please enter a valid email address';
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

// ============================================
// COMPONENT
// ============================================

export default function SettingsPage() {
    const { logout, exchangeRates, ratesLoading } = useSettings();
    const { profile, updateProfile, isLoading: profileLoading, error: profileError } = useUserProfile();
    const { preferences, updatePreferences, isLoading: prefsLoading } = usePreferences();

    // UI State
    const [saved, setSaved] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Combined loading state
    const isLoading = profileLoading || prefsLoading;

    // Sync form with profile
    useEffect(() => {
        if (profile) {
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setEmail(profile.email || '');
            setIsDirty(false);
            setFormErrors({});
        }
    }, [profile]);

    // Show saved indicator
    const showSaved = useCallback(() => {
        setSaved(true);
        const timer = setTimeout(() => setSaved(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // ============================================
    // HANDLERS
    // ============================================

    const handleCurrencyChange = async (currency: Currency) => {
        if (currency === preferences.currency) return;

        try {
            await updatePreferences({ currency });
            showSaved();
        } catch (err) {
            console.error('Failed to update currency:', err);
        }
    };

    const handleToggle = async (key: 'enableNudges' | 'enableSustainability' | 'darkMode') => {
        try {
            await updatePreferences({ [key]: !preferences[key] });
            showSaved();
        } catch (err) {
            console.error('Failed to update setting:', err);
        }
    };

    const handleInputChange = (
        setter: (val: string) => void,
        field: keyof FormErrors
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setter(value);
        setIsDirty(true);
        setSubmitError(null);

        // Clear field error on change
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSaveProfile = async () => {
        // Validate form
        const errors = validateForm(firstName, lastName, email);
        if (errors) {
            setFormErrors(errors);
            return;
        }

        setSubmitError(null);

        try {
            await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
            });
            setIsDirty(false);
            setFormErrors({});
            showSaved();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save profile';
            setSubmitError(message);
        }
    };

    const getExchangeRateInfo = (currency: Currency): string => {
        if (currency === 'USD') return '1.00';
        const rate = exchangeRates[currency];
        return rate !== undefined ? rate.toFixed(4) : '-';
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="settings-page">
            <header className="page-header">
                <div className="page-title">
                    <Settings size={28} className="title-icon" />
                    <div>
                        <h1>Settings</h1>
                        <p className="subtitle">Manage your preferences and account</p>
                    </div>
                </div>
                {saved && (
                    <div className="save-indicator">
                        <Check size={16} />
                        <span>Saved</span>
                    </div>
                )}
            </header>

            {/* Global Error */}
            {(profileError || submitError) && (
                <div
                    className="card"
                    style={{
                        background: 'var(--danger-bg)',
                        border: '1px solid var(--danger)',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            color: 'var(--danger)',
                        }}
                    >
                        <AlertCircle size={20} />
                        <span>{profileError || submitError}</span>
                    </div>
                </div>
            )}

            <div className="settings-grid">
                {/* General Settings */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <Globe size={20} />
                        General Settings
                    </h2>

                    {/* Currency Selection */}
                    <div
                        className="setting-item"
                        style={{ flexDirection: 'column', alignItems: 'stretch' }}
                    >
                        <div className="setting-info">
                            <h3>Default Currency</h3>
                            <p>
                                Choose your preferred currency for displaying amounts
                                {ratesLoading && (
                                    <RefreshCw
                                        size={12}
                                        className="animate-spin"
                                        style={{ marginLeft: '8px', display: 'inline' }}
                                    />
                                )}
                            </p>
                        </div>
                        <div className="currency-grid">
                            {CURRENCIES.map((currency) => (
                                <button
                                    key={currency.code}
                                    onClick={() => handleCurrencyChange(currency.code)}
                                    className={`currency-option ${preferences.currency === currency.code ? 'selected' : ''
                                        }`}
                                    disabled={isLoading}
                                    type="button"
                                >
                                    <span className="currency-symbol">{currency.symbol}</span>
                                    <span className="currency-code">{currency.code}</span>
                                    <span className="currency-name">{currency.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                        Rate: {getExchangeRateInfo(currency.code)}
                                    </span>
                                    {preferences.currency === currency.code && (
                                        <Check size={14} className="check-icon" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggle Settings */}
                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>
                                <Bell size={16} /> Behavioural Nudges
                            </h3>
                            <p>Receive spending insights and recommendations</p>
                        </div>
                        <button
                            onClick={() => handleToggle('enableNudges')}
                            className={`toggle ${preferences.enableNudges ? 'on' : ''}`}
                            role="switch"
                            aria-checked={preferences.enableNudges}
                            disabled={isLoading}
                            type="button"
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>
                                <Leaf size={16} /> Sustainability Metrics
                            </h3>
                            <p>Track eco-friendly transactions and carbon footprint</p>
                        </div>
                        <button
                            onClick={() => handleToggle('enableSustainability')}
                            className={`toggle ${preferences.enableSustainability ? 'on' : ''}`}
                            role="switch"
                            aria-checked={preferences.enableSustainability}
                            disabled={isLoading}
                            type="button"
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>
                                <Moon size={16} /> Dark Mode
                            </h3>
                            <p>Use dark theme for the interface</p>
                        </div>
                        <button
                            onClick={() => handleToggle('darkMode')}
                            className={`toggle ${preferences.darkMode ? 'on' : ''}`}
                            role="switch"
                            aria-checked={preferences.darkMode}
                            disabled={isLoading}
                            type="button"
                        >
                            <span className="toggle-slider" />
                        </button>
                    </div>
                </section>

                {/* Account Settings */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <User size={20} />
                        Account Settings
                    </h2>

                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={handleInputChange(setFirstName, 'firstName')}
                            placeholder="Enter your first name"
                            className={`input ${formErrors.firstName ? 'error' : ''}`}
                            aria-invalid={!!formErrors.firstName}
                            aria-describedby={formErrors.firstName ? 'firstName-error' : undefined}
                        />
                        {formErrors.firstName && (
                            <p id="firstName-error" className="form-error">
                                {formErrors.firstName}
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={handleInputChange(setLastName, 'lastName')}
                            placeholder="Enter your last name"
                            className={`input ${formErrors.lastName ? 'error' : ''}`}
                            aria-invalid={!!formErrors.lastName}
                            aria-describedby={formErrors.lastName ? 'lastName-error' : undefined}
                        />
                        {formErrors.lastName && (
                            <p id="lastName-error" className="form-error">
                                {formErrors.lastName}
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            <Mail size={14} /> Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleInputChange(setEmail, 'email')}
                            placeholder="Enter your email"
                            className={`input ${formErrors.email ? 'error' : ''}`}
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? 'email-error' : undefined}
                        />
                        {formErrors.email && (
                            <p id="email-error" className="form-error">
                                {formErrors.email}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={isLoading || !isDirty}
                        className="btn btn-primary"
                        type="button"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>

                    <div className="divider" />

                    <div className="danger-zone">
                        <h3>Danger Zone</h3>
                        <p>Once you logout, you'll need to sign in again.</p>
                        <button onClick={logout} className="btn btn-danger" type="button">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
