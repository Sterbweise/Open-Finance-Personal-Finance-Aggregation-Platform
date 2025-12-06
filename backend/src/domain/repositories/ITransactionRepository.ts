/**
 * Transaction Repository Interface (Port)
 */

import { Transaction, TransactionType, TransactionCategory } from '../entities/Transaction.js';
import { DateRange } from '../value-objects/DateRange.js';

export interface TransactionFilters {
    userId?: string;
    accountId?: string;
    type?: TransactionType;
    category?: TransactionCategory;
    categories?: TransactionCategory[];
    dateRange?: DateRange;
    minAmount?: number;
    maxAmount?: number;
    merchantName?: string;
    isRecurring?: boolean;
    isEcoFriendly?: boolean;
    searchQuery?: string;
}

export interface TransactionSortOptions {
    field: 'transactionDate' | 'amount' | 'createdAt';
    direction: 'asc' | 'desc';
}

export interface PaginationOptions {
    limit: number;
    offset: number;
}

export interface TransactionAggregation {
    totalAmount: number;
    count: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
}

export interface CategorySpending {
    category: TransactionCategory;
    totalAmount: number;
    count: number;
    percentage: number;
}

export interface MonthlySpending {
    month: string; // YYYY-MM format
    totalAmount: number;
    count: number;
}

export interface ITransactionRepository {
    findById(id: string): Promise<Transaction | null>;
    findByUserId(userId: string, options?: PaginationOptions): Promise<Transaction[]>;
    findByAccountId(accountId: string, options?: PaginationOptions): Promise<Transaction[]>;
    findByExternalId(externalId: string): Promise<Transaction | null>;
    findAll(
        filters?: TransactionFilters,
        sort?: TransactionSortOptions,
        pagination?: PaginationOptions
    ): Promise<Transaction[]>;
    save(transaction: Transaction): Promise<Transaction>;
    saveMany(transactions: Transaction[]): Promise<Transaction[]>;
    update(transaction: Transaction): Promise<Transaction>;
    delete(id: string): Promise<void>;
    count(filters?: TransactionFilters): Promise<number>;

    // Aggregation methods
    aggregate(filters: TransactionFilters): Promise<TransactionAggregation>;
    getSpendingByCategory(
        userId: string,
        dateRange: DateRange,
        type?: TransactionType
    ): Promise<CategorySpending[]>;
    getMonthlySpending(
        userId: string,
        dateRange: DateRange,
        type?: TransactionType
    ): Promise<MonthlySpending[]>;
    getRecurringTransactions(userId: string): Promise<Transaction[]>;
    getEcoFriendlyTransactions(userId: string, dateRange?: DateRange): Promise<Transaction[]>;
}

export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
