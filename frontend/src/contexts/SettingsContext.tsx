"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import {
  Currency,
  ExchangeRates,
  CURRENCY_SYMBOLS,
  FALLBACK_RATES,
} from "../../../shared/types/currency";

// ============================================
// TYPES
// ============================================

// Re-export for convenience
export type { Currency, ExchangeRates };

export interface UserPreferences {
  currency: Currency;
  enableNudges: boolean;
  enableSustainability: boolean;
  darkMode: boolean;
  locale: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

interface SettingsContextType {
  // Sidebar state
  isSidebarCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  setMobileOpen: (open: boolean) => void;

  // Preferences
  preferences: UserPreferences;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Exchange rates
  exchangeRates: ExchangeRates;
  ratesLoading: boolean;
  refreshRates: () => Promise<void>;

  // Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  convertCurrency: (amount: number, from: Currency, to?: Currency) => number;
  formatCurrency: (amount: number, currency?: Currency) => string;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
}

// ============================================
// CONSTANTS
// ============================================

// Exchange Rate API Configuration
// API key should be set in .env.local file as NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
const EXCHANGE_RATE_API_KEY =
  process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || "";
const EXCHANGE_RATE_API = EXCHANGE_RATE_API_KEY
  ? `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`
  : "https://api.exchangerate-api.com/v4/latest/USD"; // Fallback to free API

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const defaultPreferences: UserPreferences = {
  currency: "USD",
  enableNudges: true,
  enableSustainability: true,
  darkMode: true,
  locale: "en-MY",
};

const defaultProfile: UserProfile = {
  id: "1",
  email: "demo@myduit.my",
  username: "demo_user",
  firstName: "Ahmad",
  lastName: "Rahman",
};

const defaultRates: ExchangeRates = FALLBACK_RATES;

// ============================================
// CONTEXT
// ============================================

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// ============================================
// PROVIDER
// ============================================

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  // User state
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [profile, setProfile] = useState<UserProfile | null>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange rates
  const [exchangeRates, setExchangeRates] =
    useState<ExchangeRates>(defaultRates);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesVersion, setRatesVersion] = useState(0);

  // ============================================
  // EXCHANGE RATES
  // ============================================

  const fetchExchangeRates = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cachedTime = localStorage.getItem("exchange-rates-time");
      if (cachedTime && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
        const cached = localStorage.getItem("exchange-rates");
        if (cached) {
          try {
            setExchangeRates(JSON.parse(cached));
            return;
          } catch {}
        }
      }
    }

    setRatesLoading(true);
    try {
      const res = await fetch(EXCHANGE_RATE_API);
      if (!res.ok) throw new Error("Failed to fetch rates");

      const data = await res.json();
      if (data.result === "success" && data.conversion_rates) {
        setExchangeRates(data.conversion_rates);
        localStorage.setItem(
          "exchange-rates",
          JSON.stringify(data.conversion_rates)
        );
        localStorage.setItem("exchange-rates-time", Date.now().toString());
        setRatesVersion((v) => v + 1); // Trigger re-renders
      }
    } catch (err) {
      console.error("Failed to fetch exchange rates:", err);
      // Fallback to cached rates
      const cached = localStorage.getItem("exchange-rates");
      if (cached) {
        try {
          setExchangeRates(JSON.parse(cached));
        } catch {}
      }
    } finally {
      setRatesLoading(false);
    }
  }, []);

  const refreshRates = useCallback(async () => {
    await fetchExchangeRates(true);
  }, [fetchExchangeRates]);

  // ============================================
  // PREFERENCES
  // ============================================

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const newPrefs = { ...defaultPreferences, ...data.data };
          setPreferences(newPrefs);
          localStorage.setItem("user-preferences", JSON.stringify(newPrefs));
        }
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPrefs: Partial<UserPreferences>) => {
      setIsLoading(true);
      setError(null);

      const updated = { ...preferences, ...newPrefs };

      // Optimistic update
      setPreferences(updated);
      localStorage.setItem("user-preferences", JSON.stringify(updated));

      try {
        const res = await fetch("/api/users/me/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });

        if (!res.ok) {
          throw new Error("Failed to save preferences");
        }

        const data = await res.json();
        if (data.success && data.data) {
          // Update with server response
          setPreferences(data.data);
          localStorage.setItem("user-preferences", JSON.stringify(data.data));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to save preferences";
        setError(message);
        console.error("Preferences update error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [preferences]
  );

  // ============================================
  // PROFILE
  // ============================================

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
          localStorage.setItem("user-profile", JSON.stringify(data.data));
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  }, []);

  const updateProfile = useCallback(
    async (newProfile: Partial<UserProfile>) => {
      if (!profile) return;

      setIsLoading(true);
      setError(null);

      const updated = { ...profile, ...newProfile };

      // Optimistic update
      setProfile(updated);
      localStorage.setItem("user-profile", JSON.stringify(updated));

      try {
        const res = await fetch("/api/users/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            username: updated.username,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update profile");
        }

        const data = await res.json();
        if (data.success && data.data) {
          // Update with server response
          setProfile(data.data);
          localStorage.setItem("user-profile", JSON.stringify(data.data));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(message);
        // Rollback on error
        const cached = localStorage.getItem("user-profile");
        if (cached) {
          setProfile(JSON.parse(cached));
        }
        throw err; // Re-throw so the component knows it failed
      } finally {
        setIsLoading(false);
      }
    },
    [profile]
  );

  // ============================================
  // SIDEBAR
  // ============================================

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebar-collapsed", String(newValue));
      return newValue;
    });
  }, []);

  // ============================================
  // CURRENCY HELPERS
  // ============================================

  const convertCurrency = useCallback(
    (amount: number, from: Currency, to?: Currency): number => {
      const targetCurrency = to || preferences.currency;

      if (from === targetCurrency) return amount;

      // Convert from source to USD, then to target
      const fromRate = exchangeRates[from] || 1;
      const toRate = exchangeRates[targetCurrency] || 1;

      const inUSD = amount / fromRate;
      return inUSD * toRate;
    },
    [exchangeRates, preferences.currency, ratesVersion] // Include ratesVersion to trigger updates
  );

  const formatCurrency = useCallback(
    (amount: number, currency?: Currency): string => {
      const curr = currency || preferences.currency;
      const symbol = CURRENCY_SYMBOLS[curr] || curr;
      const formatted = Math.abs(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
    },
    [preferences.currency]
  );

  // ============================================
  // LOGOUT
  // ============================================

  const logout = useCallback(() => {
    localStorage.removeItem("user-preferences");
    localStorage.removeItem("user-profile");
    setPreferences(defaultPreferences);
    setProfile(null);
    window.location.href = "/";
  }, []);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Load cached data from localStorage
    const savedPrefs = localStorage.getItem("user-preferences");
    if (savedPrefs) {
      try {
        setPreferences((prev) => ({ ...prev, ...JSON.parse(savedPrefs) }));
      } catch {}
    }

    const savedProfile = localStorage.getItem("user-profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch {}
    }

    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) {
      setIsSidebarCollapsed(savedCollapsed === "true");
    }

    // Fetch fresh data from API
    fetchExchangeRates(false);
    fetchPreferences();
    fetchProfile();
  }, [fetchExchangeRates, fetchPreferences, fetchProfile]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo(
    () => ({
      isSidebarCollapsed,
      isMobileOpen,
      toggleSidebar,
      setMobileOpen,
      preferences,
      profile,
      isLoading,
      error,
      exchangeRates,
      ratesLoading,
      refreshRates,
      updatePreferences,
      updateProfile,
      convertCurrency,
      formatCurrency,
      logout,
      fetchProfile,
      fetchPreferences,
    }),
    [
      isSidebarCollapsed,
      isMobileOpen,
      toggleSidebar,
      preferences,
      profile,
      isLoading,
      error,
      exchangeRates,
      ratesLoading,
      refreshRates,
      updatePreferences,
      updateProfile,
      convertCurrency,
      formatCurrency,
      logout,
      fetchProfile,
      fetchPreferences,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

/**
 * Hook for working with exchange rates and currency conversion.
 * Automatically refreshes converted values when currency or rates change.
 */
export function useExchangeRates() {
  const {
    exchangeRates,
    ratesLoading,
    refreshRates,
    convertCurrency,
    formatCurrency,
    preferences,
  } = useSettings();

  return {
    rates: exchangeRates,
    loading: ratesLoading,
    refresh: refreshRates,
    convert: convertCurrency,
    format: formatCurrency,
    currentCurrency: preferences.currency,
  };
}

/**
 * Hook for managing user profile with form state.
 */
export function useUserProfile() {
  const { profile, updateProfile, isLoading, error, fetchProfile } =
    useSettings();

  return {
    profile,
    updateProfile,
    isLoading,
    error,
    refresh: fetchProfile,
  };
}

/**
 * Hook for managing user preferences.
 */
export function usePreferences() {
  const { preferences, updatePreferences, isLoading, error, fetchPreferences } =
    useSettings();

  return {
    preferences,
    updatePreferences,
    isLoading,
    error,
    refresh: fetchPreferences,
  };
}
