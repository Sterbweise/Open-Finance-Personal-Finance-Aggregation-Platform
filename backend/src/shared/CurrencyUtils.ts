/**
 * Currency Utilities
 * Shared currency conversion functions used across the application
 * This is the single source of truth for currency conversion logic
 */

// Supported currency codes
export type Currency = "USD" | "MYR" | "SGD" | "EUR" | "GBP" | "JPY" | "NGN";

// Fallback exchange rates relative to USD
// Used when external API is unavailable
export const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1.0,
  MYR: 4.47,
  SGD: 1.34,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  NGN: 850,
};

// List of supported currency codes
export const SUPPORTED_CURRENCY_CODES: Currency[] = [
  "USD",
  "MYR",
  "SGD",
  "EUR",
  "GBP",
  "JPY",
  "NGN",
];

/**
 * Check if a currency code is valid/supported
 */
export function isValidCurrency(code: string): code is Currency {
  return SUPPORTED_CURRENCY_CODES.includes(code as Currency);
}

/**
 * Get the fallback exchange rate between two currencies
 * Converts via USD as the base currency
 */
export function getFallbackRate(from: string, to: string): number {
  if (from === to) return 1.0;

  // Validate and default to USD if invalid
  const fromCurrency: Currency = isValidCurrency(from) ? from : "USD";
  const toCurrency: Currency = isValidCurrency(to) ? to : "USD";

  // Get rates relative to USD
  const fromRate = FALLBACK_RATES[fromCurrency];
  const toRate = FALLBACK_RATES[toCurrency];

  // Convert: amount / fromRate = amount in USD
  //          amount in USD * toRate = amount in target
  return toRate / fromRate;
}

/**
 * Convert an amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;

  const rate = getFallbackRate(fromCurrency, toCurrency);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Money object interface for type safety
 */
export interface MoneyDTO {
  amount: number;
  currency: string;
}

/**
 * Convert a Money object to a target currency
 */
export function convertMoney(money: MoneyDTO, toCurrency: string): MoneyDTO {
  return {
    amount: convertAmount(money.amount, money.currency, toCurrency),
    currency: toCurrency,
  };
}

