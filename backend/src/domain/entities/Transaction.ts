/**
 * Transaction Domain Entity
 * Core business entity representing a financial transaction
 */

import { v4 as uuidv4 } from 'uuid';
import { Money } from '../value-objects/Money.js';

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    TRANSFER = 'TRANSFER',
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
}

export enum TransactionCategory {
    FOOD_DINING = 'FOOD_DINING',
    GROCERIES = 'GROCERIES',
    TRANSPORTATION = 'TRANSPORTATION',
    UTILITIES = 'UTILITIES',
    ENTERTAINMENT = 'ENTERTAINMENT',
    SHOPPING = 'SHOPPING',
    HEALTHCARE = 'HEALTHCARE',
    EDUCATION = 'EDUCATION',
    TRAVEL = 'TRAVEL',
    PERSONAL_CARE = 'PERSONAL_CARE',
    HOME = 'HOME',
    INVESTMENTS = 'INVESTMENTS',
    INCOME = 'INCOME',
    TRANSFER = 'TRANSFER',
    OTHER = 'OTHER',
}

export interface TransactionProps {
    id?: string;
    userId: string;
    accountId: string;
    payerId?: string;
    payeeId?: string;
    externalId?: string;
    type: TransactionType;
    category: TransactionCategory;
    subCategory?: string;
    amount: number;
    amountInBase?: number;
    currency?: string;
    exchangeRate?: number;
    description?: string;
    merchantName?: string;
    merchantCategory?: string;
    isRecurring?: boolean;
    isEcoFriendly?: boolean;
    ecoScore?: number;
    ecoTags?: string[];
    metadata?: Record<string, unknown>;
    transactionDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Transaction {
    private readonly _id: string;
    private readonly _userId: string;
    private readonly _accountId: string;
    private _payerId?: string;
    private _payeeId?: string;
    private _externalId?: string;
    private _type: TransactionType;
    private _category: TransactionCategory;
    private _subCategory?: string;
    private _amount: Money;
    private _amountInBase: Money;
    private _exchangeRate: number;
    private _description?: string;
    private _merchantName?: string;
    private _merchantCategory?: string;
    private _isRecurring: boolean;
    private _isEcoFriendly: boolean;
    private _ecoScore?: number;
    private _ecoTags: string[];
    private _metadata?: Record<string, unknown>;
    private _transactionDate: Date;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    private constructor(props: TransactionProps) {
        this._id = props.id ?? uuidv4();
        this._userId = props.userId;
        this._accountId = props.accountId;
        this._payerId = props.payerId;
        this._payeeId = props.payeeId;
        this._externalId = props.externalId;
        this._type = props.type;
        this._category = props.category;
        this._subCategory = props.subCategory;
        this._amount = Money.create(props.amount, props.currency ?? 'USD');
        this._exchangeRate = props.exchangeRate ?? 1.0;
        this._amountInBase = Money.create(
            props.amountInBase ?? props.amount * this._exchangeRate,
            'USD'
        );
        this._description = props.description;
        this._merchantName = props.merchantName;
        this._merchantCategory = props.merchantCategory;
        this._isRecurring = props.isRecurring ?? false;
        this._isEcoFriendly = props.isEcoFriendly ?? false;
        this._ecoScore = props.ecoScore;
        this._ecoTags = props.ecoTags ?? [];
        this._metadata = props.metadata;
        this._transactionDate = props.transactionDate;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: TransactionProps): Transaction {
        this.validate(props);
        return new Transaction(props);
    }

    static fromPersistence(props: TransactionProps): Transaction {
        return new Transaction(props);
    }

    private static validate(props: TransactionProps): void {
        if (props.amount < 0) {
            throw new Error('Transaction amount cannot be negative');
        }
        if (!Object.values(TransactionType).includes(props.type)) {
            throw new Error('Invalid transaction type');
        }
        if (!Object.values(TransactionCategory).includes(props.category)) {
            throw new Error('Invalid transaction category');
        }
        if (props.ecoScore !== undefined && (props.ecoScore < 0 || props.ecoScore > 100)) {
            throw new Error('Eco score must be between 0 and 100');
        }
    }

    // Getters
    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get accountId(): string { return this._accountId; }
    get payerId(): string | undefined { return this._payerId; }
    get payeeId(): string | undefined { return this._payeeId; }
    get externalId(): string | undefined { return this._externalId; }
    get type(): TransactionType { return this._type; }
    get category(): TransactionCategory { return this._category; }
    get subCategory(): string | undefined { return this._subCategory; }
    get amount(): Money { return this._amount; }
    get amountInBase(): Money { return this._amountInBase; }
    get currency(): string { return this._amount.currency; }
    get exchangeRate(): number { return this._exchangeRate; }
    get description(): string | undefined { return this._description; }
    get merchantName(): string | undefined { return this._merchantName; }
    get merchantCategory(): string | undefined { return this._merchantCategory; }
    get isRecurring(): boolean { return this._isRecurring; }
    get isEcoFriendly(): boolean { return this._isEcoFriendly; }
    get ecoScore(): number | undefined { return this._ecoScore; }
    get ecoTags(): string[] { return [...this._ecoTags]; }
    get metadata(): Record<string, unknown> | undefined { return this._metadata; }
    get transactionDate(): Date { return this._transactionDate; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // Domain Methods
    categorize(category: TransactionCategory, subCategory?: string): void {
        this._category = category;
        this._subCategory = subCategory;
        this._updatedAt = new Date();
    }

    markAsRecurring(): void {
        this._isRecurring = true;
        this._updatedAt = new Date();
    }

    unmarkAsRecurring(): void {
        this._isRecurring = false;
        this._updatedAt = new Date();
    }

    setEcoMetrics(isEcoFriendly: boolean, score?: number, tags?: string[]): void {
        this._isEcoFriendly = isEcoFriendly;
        if (score !== undefined) {
            if (score < 0 || score > 100) {
                throw new Error('Eco score must be between 0 and 100');
            }
            this._ecoScore = score;
        }
        if (tags) {
            this._ecoTags = [...tags];
        }
        this._updatedAt = new Date();
    }

    updateDescription(description: string): void {
        this._description = description;
        this._updatedAt = new Date();
    }

    setMerchant(name: string, category?: string): void {
        this._merchantName = name;
        this._merchantCategory = category;
        this._updatedAt = new Date();
    }

    updateExchangeRate(rate: number, baseCurrency: string = 'USD'): void {
        this._exchangeRate = rate;
        this._amountInBase = Money.create(this._amount.amount * rate, baseCurrency);
        this._updatedAt = new Date();
    }

    isExpense(): boolean {
        return this._type === TransactionType.EXPENSE;
    }

    isIncome(): boolean {
        return this._type === TransactionType.INCOME;
    }

    isTransfer(): boolean {
        return this._type === TransactionType.TRANSFER;
    }

    getCategoryDisplayName(): string {
        const displayNames: Record<TransactionCategory, string> = {
            [TransactionCategory.FOOD_DINING]: 'Food & Dining',
            [TransactionCategory.GROCERIES]: 'Groceries',
            [TransactionCategory.TRANSPORTATION]: 'Transportation',
            [TransactionCategory.UTILITIES]: 'Utilities',
            [TransactionCategory.ENTERTAINMENT]: 'Entertainment',
            [TransactionCategory.SHOPPING]: 'Shopping',
            [TransactionCategory.HEALTHCARE]: 'Healthcare',
            [TransactionCategory.EDUCATION]: 'Education',
            [TransactionCategory.TRAVEL]: 'Travel',
            [TransactionCategory.PERSONAL_CARE]: 'Personal Care',
            [TransactionCategory.HOME]: 'Home & Living',
            [TransactionCategory.INVESTMENTS]: 'Investments',
            [TransactionCategory.INCOME]: 'Income',
            [TransactionCategory.TRANSFER]: 'Transfer',
            [TransactionCategory.OTHER]: 'Other',
        };
        return displayNames[this._category] ?? this._category;
    }

    toJSON(): TransactionProps & { amountValue: number; amountInBaseValue: number } {
        return {
            id: this._id,
            userId: this._userId,
            accountId: this._accountId,
            payerId: this._payerId,
            payeeId: this._payeeId,
            externalId: this._externalId,
            type: this._type,
            category: this._category,
            subCategory: this._subCategory,
            amount: this._amount.amount,
            amountValue: this._amount.amount,
            amountInBase: this._amountInBase.amount,
            amountInBaseValue: this._amountInBase.amount,
            currency: this._amount.currency,
            exchangeRate: this._exchangeRate,
            description: this._description,
            merchantName: this._merchantName,
            merchantCategory: this._merchantCategory,
            isRecurring: this._isRecurring,
            isEcoFriendly: this._isEcoFriendly,
            ecoScore: this._ecoScore,
            ecoTags: this._ecoTags,
            metadata: this._metadata,
            transactionDate: this._transactionDate,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
