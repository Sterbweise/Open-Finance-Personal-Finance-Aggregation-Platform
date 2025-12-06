# Open Finance Platform - Architecture Overview

## Exchange Rate & Currency Management

### Overview
This document explains how currency conversion and exchange rates work in the Open Finance Platform.

---

## 1. SettingsContext (Frontend)

**Location:** `frontend/src/contexts/SettingsContext.tsx`

**Purpose:** React Context that provides global state management for the frontend application.

### What It Does:
- 🌍 **User Preferences**: Stores user settings (currency, dark mode, language)
- 💱 **Exchange Rates**: Fetches and caches exchange rates from external API
- 💰 **Currency Conversion**: Provides functions to convert between currencies
- 👤 **User Profile**: Manages user profile data
- 🎨 **UI State**: Manages sidebar collapse/expand state

### Key Features:

```typescript
// Usage in React components:
const { 
  convertCurrency,      // Convert amount from one currency to another
  formatCurrency,       // Format amount with currency symbol
  preferences,          // User preferences (includes selected currency)
  exchangeRates,        // Current exchange rates
  refreshRates          // Manually refresh exchange rates
} = useSettings();

// Example:
const amountInUSD = convertCurrency(100, 'MYR', 'USD');
// Converts 100 MYR to USD using live exchange rates
```

### Cache Duration:
- **24 hours** - Exchange rates are cached in localStorage for 24 hours
- Automatically refreshes after cache expires
- Can be manually refreshed via `refreshRates()`

---

## 2. Shared Types Architecture

### The Problem:
Previously, both frontend and backend had duplicate type definitions:
```
❌ Before:
frontend/src/contexts/SettingsContext.tsx → type Currency = 'USD' | 'MYR' | ...
backend/src/application/services/CurrencyService.ts → type Currency = 'USD' | 'MYR' | ...
```

This caused:
- Code duplication
- Risk of inconsistencies
- Maintenance overhead

### The Solution: Shared Types Package

```
✅ After:
shared/types/currency.ts → SINGLE source of truth
   ↓                   ↓
Frontend            Backend
```

**Location:** `shared/types/`

**Benefits:**
1. ✅ **Single Source of Truth**: Types defined once, used everywhere
2. ✅ **Type Safety**: Compile-time checks ensure frontend/backend consistency
3. ✅ **Easy Maintenance**: Update types in one place
4. ✅ **DRY Principle**: Don't Repeat Yourself

### Shared Types Available:

```typescript
// Currency Types
type Currency = 'USD' | 'MYR' | 'SGD' | 'EUR' | 'GBP' | 'JPY' | 'NGN';

// Currency Info with metadata
interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  locale?: string;
}

// Exchange Rate
interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

// Constants
const SUPPORTED_CURRENCIES: CurrencyInfo[];
const CURRENCY_SYMBOLS: Record<Currency, string>;
const FALLBACK_RATES: Record<Currency, number>;
```

---

## 3. Backend Currency Service

**Location:** `backend/src/application/services/CurrencyService.ts`

**Purpose:** Handles currency conversion on the server-side.

### Key Features:
- Fetches live exchange rates from external API
- Caches rates for 24 hours
- Provides fallback rates if API fails
- Converts Money value objects between currencies

### Cache Duration:
- **24 hours** - Exchange rates are cached in memory for 24 hours
- Reduces API calls and improves performance

### API Used:
- Primary: `https://api.exchangerate-api.com/v4/latest/{currency}`
- Free tier, no API key required
- Fallback to hardcoded rates if API fails

---

## 4. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SHARED TYPES                            │
│            shared/types/currency.ts                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │ • Currency type                                     │   │
│  │ • CURRENCY_SYMBOLS                                  │   │
│  │ • FALLBACK_RATES                                    │   │
│  │ • SUPPORTED_CURRENCIES                              │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────┬────────────────────────────┬────────────────┘
               │                            │
       ┌───────▼───────┐            ┌──────▼───────┐
       │   FRONTEND    │            │   BACKEND    │
       └───────────────┘            └──────────────┘

FRONTEND:                          BACKEND:
─────────                          ────────

1. SettingsContext                 1. CurrencyService
   ├─ Fetch rates from API            ├─ Fetch rates from API
   ├─ Cache 24 hours                  ├─ Cache 24 hours
   ├─ convertCurrency()               ├─ getExchangeRate()
   └─ formatCurrency()                └─ convert(Money)

2. React Components                2. Transaction Controller
   ├─ TransactionList                 ├─ Return transactions
   ├─ DashboardOverview               │   with currency info
   ├─ AccountsGrid                    └─ Frontend converts
   └─ TransactionsPage                    to user's currency
```

---

## 5. How Exchange Rates Work

### Frontend Flow:

```typescript
// 1. User opens the app
// 2. SettingsContext initializes
useEffect(() => {
  fetchExchangeRates(); // Check cache, fetch if expired
}, []);

// 3. Exchange rates loaded
exchangeRates = {
  USD: 1,
  MYR: 4.47,
  SGD: 1.34,
  EUR: 0.92,
  ...
}

// 4. Component displays transaction
const transaction = {
  amount: 100,
  currency: 'MYR'  // Transaction in Malaysian Ringgit
};

// 5. Convert to user's preferred currency (e.g., USD)
const convertedAmount = convertCurrency(100, 'MYR', 'USD');
// Formula: (100 / 4.47) * 1 = $22.37

// 6. Display
formatCurrency(22.37, 'USD') // "$22.37"
```

### Backend Flow:

```typescript
// 1. Service needs to aggregate transactions in different currencies
const transactions = [
  { amount: 100, currency: 'MYR' },
  { amount: 50, currency: 'SGD' },
  { amount: 20, currency: 'USD' }
];

// 2. Convert all to base currency (USD)
for (const tx of transactions) {
  const rate = await currencyService.getExchangeRate(tx.currency, 'USD');
  tx.updateExchangeRate(rate, 'USD');
}

// 3. Now all transactions have amountInBase in USD
// Can aggregate: $22.37 + $37.31 + $20.00 = $79.68
```

---

## 6. Cache Strategy

### Why 24 Hours?

**Benefits:**
- ✅ Reduces API calls (free tier has limits)
- ✅ Better performance (no network delay)
- ✅ Exchange rates don't change significantly hour-to-hour
- ✅ Good balance between accuracy and performance

**When to Refresh:**
- Automatically after 24 hours
- Manually via "Refresh" button
- On app restart if cache expired

### Cache Locations:

1. **Frontend:** `localStorage` (persists across sessions)
2. **Backend:** In-memory Map (lost on restart, but fast)

---

## 7. How to Add New Currency

1. **Update shared types:**
```typescript
// shared/types/currency.ts
export type Currency = 'USD' | 'MYR' | 'SGD' | 'EUR' | 'GBP' | 'JPY' | 'NGN' | 'NEW_CURRENCY';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  // ... existing currencies
  { code: 'NEW_CURRENCY', name: 'New Currency Name', symbol: 'NC', locale: 'en-XX' },
];

export const FALLBACK_RATES: Record<Currency, number> = {
  // ... existing rates
  NEW_CURRENCY: 1.5, // fallback rate relative to USD
};
```

2. **That's it!** Both frontend and backend automatically use the new currency.

---

## 8. Summary

### SettingsContext Purpose:
- **Global State Manager** for React app
- Provides currency conversion functions to all components
- Caches exchange rates for 24 hours
- Manages user preferences and profile

### Why Shared Types:
- **Single source of truth** for type definitions
- **Type safety** between frontend and backend
- **Easier maintenance** - change once, update everywhere
- **Better DX** (Developer Experience)

### Cache Duration:
- **24 hours** for both frontend and backend
- Optimal balance between API usage and data freshness
- Can be manually refreshed when needed

