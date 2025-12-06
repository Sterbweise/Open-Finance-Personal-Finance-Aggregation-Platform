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
  MYR: 4.1114,
  SGD: 1.2956,
  EUR: 0.8586,
  GBP: 0.7497,
  JPY: 155.2105,
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
 * Convert an amount from one currency to another.
 * You can pass a rates map (e.g., the `conversion_rates` returned by the
 * exchangerate-api v6 endpoint). If no rates are provided, falls back to the
 * static fallback table.
 *
 * @param amount        The amount to convert
 * @param fromCurrency  Source currency code
 * @param toCurrency    Target currency code
 * @param rates         Optional map of rates relative to the base currency (USD)
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // Prefer provided live rates (conversion_rates from API), otherwise fallback
  if (rates && rates[fromCurrency] && rates[toCurrency]) {
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];
    const converted = (amount / fromRate) * toRate;
    return Math.round(converted * 100) / 100;
  }

  // Fallback table (static)
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
