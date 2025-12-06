/**
 * Currency Service
 * Handles currency conversion and exchange rates
 */

import { injectable } from 'tsyringe';
import { Money } from '../../domain/value-objects/Money.js';
import { Logger } from '../../shared/Logger.js';
import axios from 'axios';

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    timestamp: Date;
}

export interface SupportedCurrency {
    code: string;
    name: string;
    symbol: string;
}

@injectable()
export class CurrencyService {
    private rateCache: Map<string, { rate: number; expiresAt: Date }> = new Map();
    private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
    private readonly BASE_CURRENCY = 'USD';

    private readonly SUPPORTED_CURRENCIES: SupportedCurrency[] = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    ];

    private readonly FALLBACK_RATES: Record<string, number> = {
        USD: 1.0, MYR: 4.47, SGD: 1.34, EUR: 0.92, GBP: 0.79, JPY: 149.5, NGN: 850,
    };

    constructor(private logger: Logger) { }

    async getExchangeRate(from: string, to: string): Promise<number> {
        if (from === to) return 1.0;
        const cacheKey = `${from}_${to}`;
        const cached = this.rateCache.get(cacheKey);
        if (cached && cached.expiresAt > new Date()) return cached.rate;

        try {
            const rate = await this.fetchExchangeRate(from, to);
            this.rateCache.set(cacheKey, { rate, expiresAt: new Date(Date.now() + this.CACHE_TTL_MS) });
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

    getSupportedCurrencies(): SupportedCurrency[] {
        return [...this.SUPPORTED_CURRENCIES];
    }

    isSupported(code: string): boolean {
        return this.SUPPORTED_CURRENCIES.some(c => c.code === code.toUpperCase());
    }

    private async fetchExchangeRate(from: string, to: string): Promise<number> {
        const apiUrl = process.env.CURRENCY_API_URL ?? 'https://api.exchangerate-api.com/v4/latest';
        const response = await axios.get(`${apiUrl}/${from}`, { timeout: 5000 });
        if (response.data.rates?.[to]) return response.data.rates[to];
        throw new Error(`Rate not found for ${from} to ${to}`);
    }

    private getFallbackRate(from: string, to: string): number {
        const fromToUsd = this.FALLBACK_RATES[from] ?? 1;
        const toToUsd = this.FALLBACK_RATES[to] ?? 1;
        return (1 / fromToUsd) * toToUsd;
    }

    clearCache(): void {
        this.rateCache.clear();
    }
}
