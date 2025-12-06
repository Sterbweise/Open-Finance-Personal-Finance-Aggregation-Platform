/**
 * Currency Service
 * Handles currency conversion and exchange rates
 */

import { injectable } from "tsyringe";
import { Money } from "../../domain/value-objects/Money.js";
import { Logger } from "../../shared/Logger.js";
import axios from "axios";
import {
  Currency,
  CurrencyInfo,
  ExchangeRate,
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
} from "../../../../shared/types/currency.js";

// Re-export for backward compatibility
export type { Currency, CurrencyInfo, ExchangeRate };

@injectable()
export class CurrencyService {
  private rateCache: Map<string, { rate: number; expiresAt: Date }> = new Map();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly BASE_CURRENCY: Currency = "USD";

  constructor(private logger: Logger) {}

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
      return this.getFallbackRate(from, to);
    }
  }

  async convert(money: Money, toCurrency: string): Promise<Money> {
    if (money.currency === toCurrency) return money;
    const rate = await this.getExchangeRate(money.currency, toCurrency);
    return money.convertTo(toCurrency, rate);
  }

  async convertToBase(money: Money): Promise<Money> {
    return this.convert(money, this.BASE_CURRENCY);
  }

  getSupportedCurrencies(): CurrencyInfo[] {
    return [...SUPPORTED_CURRENCIES];
  }

  isSupported(code: string): boolean {
    return SUPPORTED_CURRENCIES.some((c) => c.code === code.toUpperCase());
  }

  private async fetchExchangeRate(from: string, to: string): Promise<number> {
    // Use the free v4 API which doesn't require an API key
    const apiUrl =
      process.env.CURRENCY_API_URL ??
      "https://api.exchangerate-api.com/v4/latest";
    const response = await axios.get(`${apiUrl}/${from}`, { timeout: 5000 });
    if (response.data.rates?.[to]) return response.data.rates[to];
    throw new Error(`Rate not found for ${from} to ${to}`);
  }

  private getFallbackRate(from: string, to: string): number {
    const fromToUsd = FALLBACK_RATES[from as Currency] ?? 1;
    const toToUsd = FALLBACK_RATES[to as Currency] ?? 1;
    return (1 / fromToUsd) * toToUsd;
  }

  clearCache(): void {
    this.rateCache.clear();
  }
}
