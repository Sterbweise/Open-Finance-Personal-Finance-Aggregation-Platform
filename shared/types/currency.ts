/**
 * Shared Currency Types
 * Used by both frontend and backend for consistent currency handling
 */

/**
 * Supported currencies across the platform
 */
export type Currency = 'USD' | 'MYR' | 'SGD' | 'EUR' | 'GBP' | 'JPY' | 'NGN';

/**
 * Currency metadata
 */
export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  locale?: string;
}

/**
 * Exchange rate information
 */
export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

/**
 * Exchange rates collection (base currency: USD)
 */
export interface ExchangeRates {
  [key: string]: number;
}

/**
 * Money value object interface
 */
export interface MoneyValue {
  amount: number;
  currency: Currency;
}

/**
 * Supported currencies with their metadata
 */
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
];

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  MYR: 'RM',
  SGD: 'S$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  NGN: '₦',
};

/**
 * Fallback exchange rates (relative to USD)
 * Used when API is unavailable
 */
export const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1.0,
  MYR: 4.47,
  SGD: 1.34,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  NGN: 850,
};

/**
 * Helper function to check if a string is a valid currency code
 */
export function isValidCurrency(code: string): code is Currency {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: Currency): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

