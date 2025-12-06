/**
 * Dashboard Service
 * Application service for generating dashboard data and analytics
 */

import { injectable, inject } from 'tsyringe';
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
import { TransactionType, TransactionCategory } from '../../domain/entities/Transaction.js';
import { Provider } from '../../domain/entities/Account.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { Money } from '../../domain/value-objects/Money.js';
import { Logger } from '../../shared/Logger.js';

export interface DashboardOverview {
    totalBalance: Money;
    monthlyIncome: Money;
    monthlyExpenses: Money;
    monthlyNetCashFlow: Money;
    savingsRate: number; // Percentage
    accountsCount: number;
    transactionsCount: number;
}

export interface AccountSummary {
    id: string;
    name: string;
    provider: Provider;
    balance: Money;
    percentageOfTotal: number;
    lastTransaction?: {
        date: Date;
        amount: Money;
        description: string;
    };
}

export interface SpendingTrends {
    currentMonth: MonthlySpending;
    previousMonth: MonthlySpending;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    sixMonthHistory: MonthlySpending[];
}

export interface CategoryBreakdown {
    categories: CategorySpending[];
    topCategory: {
        category: TransactionCategory;
        amount: Money;
        percentage: number;
    };
    ecoFriendlyPercentage: number;
}

export interface DashboardData {
    overview: DashboardOverview;
    accounts: AccountSummary[];
    spendingTrends: SpendingTrends;
    categoryBreakdown: CategoryBreakdown;
    recentActivity: {
        date: Date;
        type: TransactionType;
        category: TransactionCategory;
        amount: Money;
        description: string;
        merchantName?: string;
    }[];
}

@injectable()
export class DashboardService {
    constructor(
        @inject(TRANSACTION_REPOSITORY) private transactionRepo: ITransactionRepository,
        @inject(ACCOUNT_REPOSITORY) private accountRepo: IAccountRepository,
        private logger: Logger
    ) { }

    /**
     * Get complete dashboard data for a user
     */
    async getDashboardData(userId: string, baseCurrency: string = 'USD'): Promise<DashboardData> {
        this.logger.info('Getting dashboard data', { userId, baseCurrency });

        const [
            overview,
            accounts,
            spendingTrends,
            categoryBreakdown,
            recentActivity,
        ] = await Promise.all([
            this.getOverview(userId, baseCurrency),
            this.getAccountsSummary(userId, baseCurrency),
            this.getSpendingTrends(userId, baseCurrency),
            this.getCategoryBreakdown(userId, baseCurrency),
            this.getRecentActivity(userId, baseCurrency),
        ]);

        return {
            overview,
            accounts,
            spendingTrends,
            categoryBreakdown,
            recentActivity,
        };
    }

    /**
     * Get dashboard overview metrics
     */
    async getOverview(userId: string, baseCurrency: string = 'USD'): Promise<DashboardOverview> {
        const totalBalanceAmount = await this.accountRepo.getTotalBalance(userId, baseCurrency);
        const totalBalance = Money.create(totalBalanceAmount, baseCurrency);

        const thisMonth = DateRange.thisMonth();

        // Get monthly income
        const incomeAggregation = await this.transactionRepo.aggregate({
            userId,
            dateRange: thisMonth,
            type: TransactionType.INCOME,
        });
        const monthlyIncome = Money.create(incomeAggregation.totalAmount, baseCurrency);

        // Get monthly expenses
        const expenseAggregation = await this.transactionRepo.aggregate({
            userId,
            dateRange: thisMonth,
            type: TransactionType.EXPENSE,
        });
        const monthlyExpenses = Money.create(expenseAggregation.totalAmount, baseCurrency);

        const monthlyNetCashFlow = monthlyIncome.subtract(monthlyExpenses);

        // Calculate savings rate
        let savingsRate = 0;
        if (!monthlyIncome.isZero()) {
            savingsRate = (monthlyNetCashFlow.amount / monthlyIncome.amount) * 100;
        }

        const accounts = await this.accountRepo.findByUserId(userId);
        const transactionsCount = await this.transactionRepo.count({ userId, dateRange: thisMonth });

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            monthlyNetCashFlow,
            savingsRate: Math.round(savingsRate * 10) / 10,
            accountsCount: accounts.length,
            transactionsCount,
        };
    }

    /**
     * Get accounts summary with percentage breakdown
     */
    async getAccountsSummary(userId: string, baseCurrency: string = 'USD'): Promise<AccountSummary[]> {
        const accounts = await this.accountRepo.findByUserId(userId);
        const totalBalance = await this.accountRepo.getTotalBalance(userId, baseCurrency);

        const summaries: AccountSummary[] = [];

        for (const account of accounts) {
            const balance = account.balance;
            const percentageOfTotal = totalBalance > 0
                ? (balance.amount / totalBalance) * 100
                : 0;

            // Get last transaction for this account
            const recentTxs = await this.transactionRepo.findByAccountId(account.id, { limit: 1, offset: 0 });
            const lastTx = recentTxs[0];

            summaries.push({
                id: account.id,
                name: account.name,
                provider: account.provider,
                balance,
                percentageOfTotal: Math.round(percentageOfTotal * 10) / 10,
                lastTransaction: lastTx ? {
                    date: lastTx.transactionDate,
                    amount: lastTx.amount,
                    description: lastTx.description ?? '',
                } : undefined,
            });
        }

        // Sort by balance descending
        return summaries.sort((a, b) => b.balance.amount - a.balance.amount);
    }

    /**
     * Get spending trends over time
     */
    async getSpendingTrends(userId: string, _baseCurrency: string = 'USD'): Promise<SpendingTrends> {
        const sixMonths = DateRange.lastMonths(6);
        const history = await this.transactionRepo.getMonthlySpending(
            userId,
            sixMonths,
            TransactionType.EXPENSE
        );

        const thisMonth = DateRange.thisMonth();
        const lastMonth = DateRange.previousMonth();

        const currentMonthData = await this.transactionRepo.getMonthlySpending(
            userId,
            thisMonth,
            TransactionType.EXPENSE
        );

        const previousMonthData = await this.transactionRepo.getMonthlySpending(
            userId,
            lastMonth,
            TransactionType.EXPENSE
        );

        const currentMonth: MonthlySpending = currentMonthData[0] ?? {
            month: thisMonth.format().start.slice(0, 7),
            totalAmount: 0,
            count: 0
        };

        const previousMonth: MonthlySpending = previousMonthData[0] ?? {
            month: lastMonth.format().start.slice(0, 7),
            totalAmount: 0,
            count: 0
        };

        let percentageChange = 0;
        if (previousMonth.totalAmount > 0) {
            percentageChange = ((currentMonth.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount) * 100;
        }

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (percentageChange > 10) trend = 'increasing';
        else if (percentageChange < -10) trend = 'decreasing';

        return {
            currentMonth,
            previousMonth,
            trend,
            percentageChange: Math.round(percentageChange * 10) / 10,
            sixMonthHistory: history,
        };
    }

    /**
     * Get spending breakdown by category
     */
    async getCategoryBreakdown(userId: string, baseCurrency: string = 'USD'): Promise<CategoryBreakdown> {
        const thisMonth = DateRange.thisMonth();

        const categories = await this.transactionRepo.getSpendingByCategory(
            userId,
            thisMonth,
            TransactionType.EXPENSE
        );

        // Sort by amount descending
        categories.sort((a, b) => b.totalAmount - a.totalAmount);

        const topCategory = categories[0] ?? {
            category: TransactionCategory.OTHER,
            totalAmount: 0,
            count: 0,
            percentage: 0,
        };

        // Calculate eco-friendly percentage
        const ecoFriendlyTxs = await this.transactionRepo.getEcoFriendlyTransactions(userId, thisMonth);
        const totalTxCount = await this.transactionRepo.count({ userId, dateRange: thisMonth });

        const ecoFriendlyPercentage = totalTxCount > 0
            ? (ecoFriendlyTxs.length / totalTxCount) * 100
            : 0;

        return {
            categories,
            topCategory: {
                category: topCategory.category,
                amount: Money.create(topCategory.totalAmount, baseCurrency),
                percentage: topCategory.percentage,
            },
            ecoFriendlyPercentage: Math.round(ecoFriendlyPercentage * 10) / 10,
        };
    }

    /**
     * Get recent transaction activity
     */
    async getRecentActivity(
        userId: string,
        _baseCurrency: string = 'USD',
        limit: number = 10
    ): Promise<DashboardData['recentActivity']> {
        const transactions = await this.transactionRepo.findByUserId(userId, { limit, offset: 0 });

        return transactions.map(tx => ({
            date: tx.transactionDate,
            type: tx.type,
            category: tx.category,
            amount: tx.amount,
            description: tx.description ?? '',
            merchantName: tx.merchantName,
        }));
    }

    /**
     * Get spending comparison between e-wallets and bank accounts
     */
    async getPaymentMethodComparison(userId: string): Promise<{
        ewallets: { total: Money; percentage: number; count: number };
        bank: { total: Money; percentage: number; count: number };
    }> {
        const thisMonth = DateRange.thisMonth();

        const ewalletAccounts = await this.accountRepo.getByProvider(userId, Provider.GRABPAY);
        const tngAccounts = await this.accountRepo.getByProvider(userId, Provider.TNG);
        const shopeeAccounts = await this.accountRepo.getByProvider(userId, Provider.SHOPEEPAY);
        const bankAccounts = await this.accountRepo.getByProvider(userId, Provider.BANK);

        const allEwalletIds = [
            ...ewalletAccounts.map(a => a.id),
            ...tngAccounts.map(a => a.id),
            ...shopeeAccounts.map(a => a.id),
        ];

        const bankIds = bankAccounts.map(a => a.id);

        let ewalletTotal = 0;
        let ewalletCount = 0;
        let bankTotal = 0;
        let bankCount = 0;

        for (const accountId of allEwalletIds) {
            const agg = await this.transactionRepo.aggregate({
                accountId,
                dateRange: thisMonth,
                type: TransactionType.EXPENSE,
            });
            ewalletTotal += agg.totalAmount;
            ewalletCount += agg.count;
        }

        for (const accountId of bankIds) {
            const agg = await this.transactionRepo.aggregate({
                accountId,
                dateRange: thisMonth,
                type: TransactionType.EXPENSE,
            });
            bankTotal += agg.totalAmount;
            bankCount += agg.count;
        }

        const total = ewalletTotal + bankTotal;
        const ewalletPercentage = total > 0 ? (ewalletTotal / total) * 100 : 0;
        const bankPercentage = total > 0 ? (bankTotal / total) * 100 : 0;

        return {
            ewallets: {
                total: Money.create(ewalletTotal, 'USD'),
                percentage: Math.round(ewalletPercentage * 10) / 10,
                count: ewalletCount,
            },
            bank: {
                total: Money.create(bankTotal, 'USD'),
                percentage: Math.round(bankPercentage * 10) / 10,
                count: bankCount,
            },
        };
    }
}
