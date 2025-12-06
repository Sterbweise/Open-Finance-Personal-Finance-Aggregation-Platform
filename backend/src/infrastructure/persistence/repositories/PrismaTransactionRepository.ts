/**
 * Prisma Transaction Repository
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';
import {
    ITransactionRepository,
    TransactionFilters,
    TransactionSortOptions,
    PaginationOptions,
    TransactionAggregation,
    CategorySpending,
    MonthlySpending,
} from '../../../domain/repositories/ITransactionRepository.js';
import { Transaction, TransactionType, TransactionCategory, TransactionProps } from '../../../domain/entities/Transaction.js';
import { DateRange } from '../../../domain/value-objects/DateRange.js';

@injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<Transaction | null> {
        const data = await this.prisma.transaction.findUnique({ where: { id } });
        return data ? this.toDomain(data) : null;
    }

    async findByUserId(userId: string, options?: PaginationOptions): Promise<Transaction[]> {
        const data = await this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { transactionDate: 'desc' },
            take: options?.limit,
            skip: options?.offset,
        });
        return data.map(d => this.toDomain(d));
    }

    async findByAccountId(accountId: string, options?: PaginationOptions): Promise<Transaction[]> {
        const data = await this.prisma.transaction.findMany({
            where: { accountId },
            orderBy: { transactionDate: 'desc' },
            take: options?.limit,
            skip: options?.offset,
        });
        return data.map(d => this.toDomain(d));
    }

    async findByExternalId(externalId: string): Promise<Transaction | null> {
        const data = await this.prisma.transaction.findFirst({ where: { externalId } });
        return data ? this.toDomain(data) : null;
    }

    async findAll(
        filters?: TransactionFilters,
        sort?: TransactionSortOptions,
        pagination?: PaginationOptions
    ): Promise<Transaction[]> {
        const where = this.buildWhereClause(filters);
        const data = await this.prisma.transaction.findMany({
            where,
            orderBy: sort ? { [sort.field]: sort.direction } : { transactionDate: 'desc' },
            take: pagination?.limit,
            skip: pagination?.offset,
        });
        return data.map(d => this.toDomain(d));
    }

    async save(transaction: Transaction): Promise<Transaction> {
        const data = this.toPersistence(transaction);
        const created = await this.prisma.transaction.create({ data });
        return this.toDomain(created);
    }

    async saveMany(transactions: Transaction[]): Promise<Transaction[]> {
        const results: Transaction[] = [];
        for (const tx of transactions) {
            results.push(await this.save(tx));
        }
        return results;
    }

    async update(transaction: Transaction): Promise<Transaction> {
        const data = this.toPersistence(transaction);
        const updated = await this.prisma.transaction.update({
            where: { id: transaction.id },
            data,
        });
        return this.toDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.transaction.delete({ where: { id } });
    }

    async count(filters?: TransactionFilters): Promise<number> {
        return this.prisma.transaction.count({ where: this.buildWhereClause(filters) });
    }

    async aggregate(filters: TransactionFilters): Promise<TransactionAggregation> {
        const where = this.buildWhereClause(filters);
        const result = await this.prisma.transaction.aggregate({
            where,
            _sum: { amountInBase: true },
            _count: true,
            _avg: { amountInBase: true },
            _min: { amountInBase: true },
            _max: { amountInBase: true },
        });

        return {
            totalAmount: result._sum.amountInBase ?? 0,
            count: result._count,
            averageAmount: result._avg.amountInBase ?? 0,
            minAmount: result._min.amountInBase ?? 0,
            maxAmount: result._max.amountInBase ?? 0,
        };
    }

    async getSpendingByCategory(
        userId: string,
        dateRange: DateRange,
        type?: TransactionType
    ): Promise<CategorySpending[]> {
        const where: Prisma.TransactionWhereInput = {
            userId,
            transactionDate: { gte: dateRange.start, lte: dateRange.end },
            ...(type && { type }),
        };

        const grouped = await this.prisma.transaction.groupBy({
            by: ['category'],
            where,
            _sum: { amountInBase: true },
            _count: true,
        });

        const total = grouped.reduce((sum, g) => sum + (g._sum.amountInBase ?? 0), 0);

        return grouped.map(g => ({
            category: g.category as TransactionCategory,
            totalAmount: g._sum.amountInBase ?? 0,
            count: g._count,
            percentage: total > 0 ? ((g._sum.amountInBase ?? 0) / total) * 100 : 0,
        }));
    }

    async getMonthlySpending(
        userId: string,
        dateRange: DateRange,
        type?: TransactionType
    ): Promise<MonthlySpending[]> {
        const transactions = await this.findAll({
            userId,
            dateRange,
            ...(type && { type }),
        });

        const monthly = new Map<string, { total: number; count: number }>();

        for (const tx of transactions) {
            const month = tx.transactionDate.toISOString().slice(0, 7);
            const existing = monthly.get(month) ?? { total: 0, count: 0 };
            monthly.set(month, { total: existing.total + tx.amountInBase.amount, count: existing.count + 1 });
        }

        return Array.from(monthly.entries())
            .map(([month, data]) => ({ month, totalAmount: data.total, count: data.count }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    async getRecurringTransactions(userId: string): Promise<Transaction[]> {
        const data = await this.prisma.transaction.findMany({
            where: { userId, isRecurring: true },
            orderBy: { transactionDate: 'desc' },
        });
        return data.map(d => this.toDomain(d));
    }

    async getEcoFriendlyTransactions(userId: string, dateRange?: DateRange): Promise<Transaction[]> {
        const where: Prisma.TransactionWhereInput = {
            userId,
            isEcoFriendly: true,
            ...(dateRange && { transactionDate: { gte: dateRange.start, lte: dateRange.end } }),
        };
        const data = await this.prisma.transaction.findMany({ where, orderBy: { transactionDate: 'desc' } });
        return data.map(d => this.toDomain(d));
    }

    private buildWhereClause(filters?: TransactionFilters): Prisma.TransactionWhereInput {
        if (!filters) return {};
        return {
            ...(filters.userId && { userId: filters.userId }),
            ...(filters.accountId && { accountId: filters.accountId }),
            ...(filters.type && { type: filters.type }),
            ...(filters.category && { category: filters.category }),
            ...(filters.categories && { category: { in: filters.categories } }),
            ...(filters.dateRange && { transactionDate: { gte: filters.dateRange.start, lte: filters.dateRange.end } }),
            ...(filters.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
            ...(filters.isEcoFriendly !== undefined && { isEcoFriendly: filters.isEcoFriendly }),
        };
    }

    private toDomain(data: any): Transaction {
        return Transaction.fromPersistence({
            id: data.id,
            userId: data.userId,
            accountId: data.accountId,
            payerId: data.payerId ?? undefined,
            payeeId: data.payeeId ?? undefined,
            externalId: data.externalId ?? undefined,
            type: data.type as TransactionType,
            category: data.category as TransactionCategory,
            subCategory: data.subCategory ?? undefined,
            amount: data.amount,
            amountInBase: data.amountInBase,
            currency: data.currency,
            exchangeRate: data.exchangeRate,
            description: data.description ?? undefined,
            merchantName: data.merchantName ?? undefined,
            merchantCategory: data.merchantCategory ?? undefined,
            isRecurring: data.isRecurring,
            isEcoFriendly: data.isEcoFriendly,
            ecoScore: data.ecoScore ?? undefined,
            ecoTags: data.ecoTags ? JSON.parse(data.ecoTags) : undefined,
            metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
            transactionDate: data.transactionDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    private toPersistence(tx: Transaction): Prisma.TransactionCreateInput {
        return {
            id: tx.id,
            user: { connect: { id: tx.userId } },
            account: { connect: { id: tx.accountId } },
            externalId: tx.externalId,
            type: tx.type,
            category: tx.category,
            subCategory: tx.subCategory,
            amount: tx.amount.amount,
            amountInBase: tx.amountInBase.amount,
            currency: tx.currency,
            exchangeRate: tx.exchangeRate,
            description: tx.description,
            merchantName: tx.merchantName,
            merchantCategory: tx.merchantCategory,
            isRecurring: tx.isRecurring,
            isEcoFriendly: tx.isEcoFriendly,
            ecoScore: tx.ecoScore,
            ecoTags: tx.ecoTags.length > 0 ? JSON.stringify(tx.ecoTags) : null,
            metadata: tx.metadata ? JSON.stringify(tx.metadata) : null,
            transactionDate: tx.transactionDate,
        };
    }
}
