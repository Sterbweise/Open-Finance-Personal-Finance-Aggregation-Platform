/**
 * Currency Service
 * Handles currency conversion and exchange rates with caching and API support
 * Uses shared CurrencyUtils for fallback rates
 */

import { injectable } from "tsyringe";
import { Money } from "../../domain/value-objects/Money.js";
import { Logger } from "../../shared/Logger.js";
import {
  getFallbackRate,
  isValidCurrency,
  SUPPORTED_CURRENCY_CODES,
  type Currency,
} from "../../shared/CurrencyUtils.js";
import axios from "axios";

// Re-export types for backward compatibility
export type { Currency };

export interface CurrencyInfo {
  code: Currency;
  name: string;
  symbol: string;
  locale?: string;
}

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

const CURRENCY_INFO: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
];

@injectable()
export class CurrencyService {
  private rateCache: Map<string, { rate: number; expiresAt: Date }> = new Map();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly BASE_CURRENCY: Currency = "USD";

  constructor(private logger: Logger) {}

  /**
   * Get exchange rate between two currencies
   * Uses cache first, then API, then fallback rates
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;

    const cacheKey = `${from}_${to}`;
    const cached = this.rateCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) return cached.rate;

    try {
      const rate = await this.fetchExchangeRate(from, to);
      this.rateCache.set(cacheKey, {
        rate,
        expiresAt: new Date(Date.now() + this.CACHE_TTL_MS),
      });
      return rate;
    } catch {
      // Use shared fallback rate utility
      const rate = getFallbackRate(from, to);
      if (!isValidCurrency(from)) {
        this.logger.warn(`Invalid source currency: ${from}, using fallback`);
      }
      if (!isValidCurrency(to)) {
        this.logger.warn(`Invalid target currency: ${to}, using fallback`);
      }
      return rate;
    }
  }

  /**
   * Convert a Money object to another currency
   */
  async convert(money: Money, toCurrency: string): Promise<Money> {
    if (money.currency === toCurrency) return money;
    const rate = await this.getExchangeRate(money.currency, toCurrency);
    return money.convertTo(toCurrency, rate);
  }

  /**
   * Convert Money to the base currency (USD)
   */
  async convertToBase(money: Money): Promise<Money> {
    return this.convert(money, this.BASE_CURRENCY);
  }

  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies(): CurrencyInfo[] {
    return [...CURRENCY_INFO];
  }

  /**
   * Check if a currency code is supported
   */
  isSupported(code: string): boolean {
    return SUPPORTED_CURRENCY_CODES.includes(code.toUpperCase() as Currency);
  }

  /**
   * Fetch live exchange rate from API
   */
  private async fetchExchangeRate(from: string, to: string): Promise<number> {
    // Prefer v6 endpoint with API key if provided; otherwise fall back to free v4
    const apiKey = process.env.CURRENCY_API_KEY || "";
    const baseUrlWithKey = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest`
      : "https://api.exchangerate-api.com/v4/latest";
    const apiUrl = process.env.CURRENCY_API_URL ?? baseUrlWithKey;

    // Exchangerate-api expects base currency in the URL
    const response = await axios.get(`${apiUrl}/${from}`, { timeout: 5000 });
    if (response.data?.conversion_rates?.[to]) {
      return response.data.conversion_rates[to];
    }
    if (response.data?.rates?.[to]) {
      return response.data.rates[to];
    }
    throw new Error(`Rate not found for ${from} to ${to}`);
  }

  /**
   * Clear the rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
  }
}
