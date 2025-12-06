/**
 * Transaction Aggregation Service
 * Application service for aggregating transactions from multiple sources
 */

import { injectable, inject } from 'tsyringe';
import {
    Transaction,
    TransactionType,
    TransactionCategory,
    TransactionProps
} from '../../domain/entities/Transaction.js';
import { Account, Provider } from '../../domain/entities/Account.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { Money } from '../../domain/value-objects/Money.js';
import {
    ITransactionRepository,
    TRANSACTION_REPOSITORY,
    CategorySpending,
    MonthlySpending,
} from '../../domain/repositories/ITransactionRepository.js';
import {
    IAccountRepository,
    ACCOUNT_REPOSITORY
} from '../../domain/repositories/IAccountRepository.js';
import { CurrencyService } from './CurrencyService.js';
import { Logger } from '../../shared/Logger.js';

export interface AggregatedTransactionsResult {
    transactions: Transaction[];
    totalCount: number;
    totalIncome: Money;
    totalExpenses: Money;
    netCashFlow: Money;
    byCategory: CategorySpending[];
    byMonth: MonthlySpending[];
}

export interface SpendingSummary {
    period: DateRange;
    totalSpending: Money;
    averageDaily: Money;
    topCategories: CategorySpending[];
    comparisonToPrevious: {
        absoluteChange: Money;
        percentageChange: number;
        trend: 'up' | 'down' | 'stable';
    };
}

export interface TransactionInsight {
    type: 'spending_spike' | 'recurring_detected' | 'unusual_merchant' | 'category_shift';
    title: string;
    description: string;
    data: Record<string, unknown>;
}

@injectable()
export class TransactionAggregationService {
    constructor(
        @inject(TRANSACTION_REPOSITORY) private transactionRepo: ITransactionRepository,
        @inject(ACCOUNT_REPOSITORY) private accountRepo: IAccountRepository,
        private currencyService: CurrencyService,
        private logger: Logger
    ) { }

    /**
     * Aggregate all transactions for a user within a date range
     */
    async aggregateTransactions(
        userId: string,
        dateRange: DateRange,
        baseCurrency: string = 'USD'
    ): Promise<AggregatedTransactionsResult> {
        this.logger.info('Aggregating transactions', { userId, dateRange, baseCurrency });

        const transactions = await this.transactionRepo.findAll({
            userId,
            dateRange,
        }, { field: 'transactionDate', direction: 'desc' });

        // Convert all transactions to base currency
        const convertedTransactions = await Promise.all(
            transactions.map(async (tx) => {
                if (tx.currency !== baseCurrency) {
                    const rate = await this.currencyService.getExchangeRate(tx.currency, baseCurrency);
                    tx.updateExchangeRate(rate, baseCurrency);
                }
                return tx;
            })
        );

        // Calculate totals
        let totalIncome = Money.zero(baseCurrency);
        let totalExpenses = Money.zero(baseCurrency);

        for (const tx of convertedTransactions) {
            if (tx.isIncome()) {
                totalIncome = totalIncome.add(tx.amountInBase);
            } else if (tx.isExpense()) {
                totalExpenses = totalExpenses.add(tx.amountInBase);
            }
        }

        const netCashFlow = totalIncome.subtract(totalExpenses);

        // Get category breakdown
        const byCategory = await this.transactionRepo.getSpendingByCategory(
            userId,
            dateRange,
            TransactionType.EXPENSE
        );

        // Get monthly breakdown
        const byMonth = await this.transactionRepo.getMonthlySpending(userId, dateRange);

        return {
            transactions: convertedTransactions,
            totalCount: convertedTransactions.length,
            totalIncome,
            totalExpenses,
            netCashFlow,
            byCategory,
            byMonth,
        };
    }

    /**
     * Generate spending summary with comparisons to previous period
     */
    async getSpendingSummary(
        userId: string,
        dateRange: DateRange,
        baseCurrency: string = 'USD'
    ): Promise<SpendingSummary> {
        this.logger.info('Generating spending summary', { userId, dateRange });

        // Get current period spending
        const currentAggregation = await this.transactionRepo.aggregate({
            userId,
            dateRange,
            type: TransactionType.EXPENSE,
        });

        const totalSpending = Money.create(currentAggregation.totalAmount, baseCurrency);
        const averageDaily = totalSpending.divide(dateRange.daysCount);

        // Get top categories
        const topCategories = await this.transactionRepo.getSpendingByCategory(
            userId,
            dateRange,
            TransactionType.EXPENSE
        );

        // Get previous period for comparison
        const previousRange = dateRange.previousPeriod();
        const previousAggregation = await this.transactionRepo.aggregate({
            userId,
            dateRange: previousRange,
            type: TransactionType.EXPENSE,
        });

        const previousSpending = Money.create(previousAggregation.totalAmount, baseCurrency);
        const absoluteChange = totalSpending.subtract(previousSpending);

        let percentageChange = 0;
        if (!previousSpending.isZero()) {
            percentageChange = (absoluteChange.amount / previousSpending.amount) * 100;
        }

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (percentageChange > 5) trend = 'up';
        else if (percentageChange < -5) trend = 'down';

        return {
            period: dateRange,
            totalSpending,
            averageDaily,
            topCategories: topCategories.slice(0, 5),
            comparisonToPrevious: {
                absoluteChange,
                percentageChange: Math.round(percentageChange * 10) / 10,
                trend,
            },
        };
    }

    /**
     * Aggregate transactions from all accounts for dashboard display
     */
    async getUnifiedDashboardData(userId: string): Promise<{
        accounts: Account[];
        totalBalance: Money;
        recentTransactions: Transaction[];
        monthlySpending: SpendingSummary;
        yearToDateSpending: SpendingSummary;
        insights: TransactionInsight[];
    }> {
        this.logger.info('Getting unified dashboard data', { userId });

        const accounts = await this.accountRepo.findByUserId(userId);
        const totalBalanceAmount = await this.accountRepo.getTotalBalance(userId, 'USD');
        const totalBalance = Money.create(totalBalanceAmount, 'USD');

        const recentTransactions = await this.transactionRepo.findByUserId(userId, { limit: 10, offset: 0 });

        const monthlySpending = await this.getSpendingSummary(userId, DateRange.thisMonth());
        const yearToDateSpending = await this.getSpendingSummary(userId, DateRange.thisYear());

        const insights = await this.generateInsights(userId);

        return {
            accounts,
            totalBalance,
            recentTransactions,
            monthlySpending,
            yearToDateSpending,
            insights,
        };
    }

    /**
     * Generate transaction insights
     */
    private async generateInsights(userId: string): Promise<TransactionInsight[]> {
        const insights: TransactionInsight[] = [];

        // Check for spending spikes in categories
        const thisMonth = DateRange.thisMonth();
        const lastMonth = DateRange.previousMonth();

        const thisMonthCategories = await this.transactionRepo.getSpendingByCategory(
            userId,
            thisMonth,
            TransactionType.EXPENSE
        );

        const lastMonthCategories = await this.transactionRepo.getSpendingByCategory(
            userId,
            lastMonth,
            TransactionType.EXPENSE
        );

        const lastMonthMap = new Map(lastMonthCategories.map(c => [c.category, c]));

        for (const category of thisMonthCategories) {
            const lastMonthData = lastMonthMap.get(category.category);
            if (lastMonthData && lastMonthData.totalAmount > 0) {
                const percentChange = ((category.totalAmount - lastMonthData.totalAmount) / lastMonthData.totalAmount) * 100;

                if (percentChange > 25) {
                    insights.push({
                        type: 'spending_spike',
                        title: `${this.getCategoryDisplayName(category.category)} spending up`,
                        description: `Your ${this.getCategoryDisplayName(category.category).toLowerCase()} spending increased by ${Math.round(percentChange)}% compared to last month.`,
                        data: {
                            category: category.category,
                            thisMonth: category.totalAmount,
                            lastMonth: lastMonthData.totalAmount,
                            percentChange,
                        },
                    });
                }
            }
        }

        // Check for recurring transactions
        const recurringTransactions = await this.transactionRepo.getRecurringTransactions(userId);
        if (recurringTransactions.length > 0) {
            const totalRecurring = recurringTransactions.reduce((sum, tx) => sum + tx.amount.amount, 0);
            insights.push({
                type: 'recurring_detected',
                title: 'Recurring payments detected',
                description: `You have ${recurringTransactions.length} recurring payment(s) totaling $${totalRecurring.toFixed(2)}/month.`,
                data: {
                    count: recurringTransactions.length,
                    total: totalRecurring,
                },
            });
        }

        return insights;
    }

    private getCategoryDisplayName(category: TransactionCategory): string {
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
        return displayNames[category] ?? category;
    }
}
