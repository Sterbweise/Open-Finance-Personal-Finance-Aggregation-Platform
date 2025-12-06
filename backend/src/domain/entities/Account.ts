/**
 * Account Domain Entity
 * Represents a financial account (bank, e-wallet, etc.)
 */

import { v4 as uuidv4 } from 'uuid';
import { Money } from '../value-objects/Money.js';

export enum AccountType {
    SAVINGS = 'SAVINGS',
    CURRENT = 'CURRENT',
    EWALLET = 'EWALLET',
    CREDIT_CARD = 'CREDIT_CARD',
}

export enum Provider {
    BANK = 'BANK',
    GRABPAY = 'GRABPAY',
    TNG = 'TNG',
    SHOPEEPAY = 'SHOPEEPAY',
    VIRTUAL_BANK = 'VIRTUAL_BANK',
    MANUAL = 'MANUAL',
}

export interface AccountProps {
    id?: string;
    userId: string;
    externalId?: string;
    name: string;
    accountType: AccountType;
    provider: Provider;
    accountNumber?: string;
    balance?: number;
    currency?: string;
    isActive?: boolean;
    lastSyncedAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Account {
    private readonly _id: string;
    private readonly _userId: string;
    private _externalId?: string;
    private _name: string;
    private _accountType: AccountType;
    private _provider: Provider;
    private _accountNumber?: string;
    private _balance: Money;
    private _isActive: boolean;
    private _lastSyncedAt?: Date;
    private _metadata?: Record<string, unknown>;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    private constructor(props: AccountProps) {
        this._id = props.id ?? uuidv4();
        this._userId = props.userId;
        this._externalId = props.externalId;
        this._name = props.name;
        this._accountType = props.accountType;
        this._provider = props.provider;
        this._accountNumber = props.accountNumber;
        this._balance = Money.create(props.balance ?? 0, props.currency ?? 'USD');
        this._isActive = props.isActive ?? true;
        this._lastSyncedAt = props.lastSyncedAt;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: AccountProps): Account {
        this.validate(props);
        return new Account(props);
    }

    static fromPersistence(props: AccountProps): Account {
        return new Account(props);
    }

    private static validate(props: AccountProps): void {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Account name is required');
        }
        if (props.name.length > 100) {
            throw new Error('Account name must be 100 characters or less');
        }
        if (!Object.values(AccountType).includes(props.accountType)) {
            throw new Error('Invalid account type');
        }
        if (!Object.values(Provider).includes(props.provider)) {
            throw new Error('Invalid provider');
        }
    }

    // Getters
    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get externalId(): string | undefined { return this._externalId; }
    get name(): string { return this._name; }
    get accountType(): AccountType { return this._accountType; }
    get provider(): Provider { return this._provider; }
    get accountNumber(): string | undefined { return this._accountNumber; }
    get balance(): Money { return this._balance; }
    get currency(): string { return this._balance.currency; }
    get isActive(): boolean { return this._isActive; }
    get lastSyncedAt(): Date | undefined { return this._lastSyncedAt; }
    get metadata(): Record<string, unknown> | undefined { return this._metadata; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // Domain Methods
    updateBalance(amount: number): void {
        this._balance = Money.create(amount, this._balance.currency);
        this._updatedAt = new Date();
    }

    credit(amount: Money): void {
        if (amount.currency !== this._balance.currency) {
            throw new Error('Currency mismatch');
        }
        this._balance = this._balance.add(amount);
        this._updatedAt = new Date();
    }

    debit(amount: Money): void {
        if (amount.currency !== this._balance.currency) {
            throw new Error('Currency mismatch');
        }
        if (this._balance.isLessThan(amount)) {
            throw new Error('Insufficient funds');
        }
        this._balance = this._balance.subtract(amount);
        this._updatedAt = new Date();
    }

    rename(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Account name is required');
        }
        this._name = name;
        this._updatedAt = new Date();
    }

    setExternalId(externalId: string): void {
        this._externalId = externalId;
        this._updatedAt = new Date();
    }

    recordSync(): void {
        this._lastSyncedAt = new Date();
        this._updatedAt = new Date();
    }

    deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }

    activate(): void {
        this._isActive = true;
        this._updatedAt = new Date();
    }

    updateMetadata(metadata: Record<string, unknown>): void {
        this._metadata = { ...this._metadata, ...metadata };
        this._updatedAt = new Date();
    }

    isEwallet(): boolean {
        return [Provider.GRABPAY, Provider.TNG, Provider.SHOPEEPAY].includes(this._provider);
    }

    isBankAccount(): boolean {
        return this._provider === Provider.BANK || this._provider === Provider.VIRTUAL_BANK;
    }

    getProviderDisplayName(): string {
        const displayNames: Record<Provider, string> = {
            [Provider.BANK]: 'Bank Account',
            [Provider.GRABPAY]: 'GrabPay',
            [Provider.TNG]: 'Touch \'n Go',
            [Provider.SHOPEEPAY]: 'ShopeePay',
            [Provider.VIRTUAL_BANK]: 'Virtual Bank',
            [Provider.MANUAL]: 'Manual Entry',
        };
        return displayNames[this._provider] ?? this._provider;
    }

    toJSON(): AccountProps & { balanceAmount: number } {
        return {
            id: this._id,
            userId: this._userId,
            externalId: this._externalId,
            name: this._name,
            accountType: this._accountType,
            provider: this._provider,
            accountNumber: this._accountNumber,
            balance: this._balance.amount,
            balanceAmount: this._balance.amount,
            currency: this._balance.currency,
            isActive: this._isActive,
            lastSyncedAt: this._lastSyncedAt,
            metadata: this._metadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
