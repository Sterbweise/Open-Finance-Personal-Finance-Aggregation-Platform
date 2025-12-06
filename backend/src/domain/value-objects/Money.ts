/**
 * Money Value Object
 * Immutable value object representing monetary amounts with currency
 */

export interface MoneyProps {
    amount: number;
    currency: string;
}

export class Money {
    private readonly _amount: number;
    private readonly _currency: string;

    private static readonly CURRENCY_DECIMALS: Record<string, number> = {
        USD: 2,
        EUR: 2,
        GBP: 2,
        MYR: 2,
        SGD: 2,
        JPY: 0,
        NGN: 2,
    };

    private constructor(amount: number, currency: string) {
        this._amount = this.roundToDecimals(amount, currency);
        this._currency = currency.toUpperCase();
    }

    static create(amount: number, currency: string = 'USD'): Money {
        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Amount must be a valid number');
        }
        if (!currency || currency.length !== 3) {
            throw new Error('Currency must be a valid 3-letter code');
        }
        return new Money(amount, currency);
    }

    static zero(currency: string = 'USD'): Money {
        return new Money(0, currency);
    }

    static sum(moneyList: Money[]): Money {
        if (moneyList.length === 0) {
            return Money.zero();
        }
        const currency = moneyList[0].currency;
        if (!moneyList.every(m => m.currency === currency)) {
            throw new Error('Cannot sum money with different currencies');
        }
        const total = moneyList.reduce((sum, m) => sum + m.amount, 0);
        return new Money(total, currency);
    }

    private roundToDecimals(amount: number, currency: string): number {
        const decimals = Money.CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
        const factor = Math.pow(10, decimals);
        return Math.round(amount * factor) / factor;
    }

    // Getters
    get amount(): number {
        return this._amount;
    }

    get currency(): string {
        return this._currency;
    }

    // Operations (return new Money instances - immutable)
    add(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this._amount + other._amount, this._currency);
    }

    subtract(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this._amount - other._amount, this._currency);
    }

    multiply(factor: number): Money {
        return new Money(this._amount * factor, this._currency);
    }

    divide(divisor: number): Money {
        if (divisor === 0) {
            throw new Error('Cannot divide by zero');
        }
        return new Money(this._amount / divisor, this._currency);
    }

    percentage(percent: number): Money {
        return new Money((this._amount * percent) / 100, this._currency);
    }

    negate(): Money {
        return new Money(-this._amount, this._currency);
    }

    abs(): Money {
        return new Money(Math.abs(this._amount), this._currency);
    }

    // Comparisons
    equals(other: Money): boolean {
        return this._amount === other._amount && this._currency === other._currency;
    }

    isGreaterThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this._amount > other._amount;
    }

    isGreaterThanOrEqual(other: Money): boolean {
        this.assertSameCurrency(other);
        return this._amount >= other._amount;
    }

    isLessThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this._amount < other._amount;
    }

    isLessThanOrEqual(other: Money): boolean {
        this.assertSameCurrency(other);
        return this._amount <= other._amount;
    }

    isZero(): boolean {
        return this._amount === 0;
    }

    isPositive(): boolean {
        return this._amount > 0;
    }

    isNegative(): boolean {
        return this._amount < 0;
    }

    // Formatting
    format(locale: string = 'en-US'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: this._currency,
        }).format(this._amount);
    }

    formatShort(locale: string = 'en-US'): string {
        if (Math.abs(this._amount) >= 1000000) {
            return `${(this._amount / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(this._amount) >= 1000) {
            return `${(this._amount / 1000).toFixed(1)}K`;
        }
        return this.format(locale);
    }

    // Currency conversion
    convertTo(targetCurrency: string, exchangeRate: number): Money {
        return new Money(this._amount * exchangeRate, targetCurrency);
    }

    // Helper
    private assertSameCurrency(other: Money): void {
        if (this._currency !== other._currency) {
            throw new Error(
                `Currency mismatch: ${this._currency} vs ${other._currency}`
            );
        }
    }

    // Serialization
    toJSON(): MoneyProps {
        return {
            amount: this._amount,
            currency: this._currency,
        };
    }

    toString(): string {
        return `${this._currency} ${this._amount.toFixed(2)}`;
    }
}
