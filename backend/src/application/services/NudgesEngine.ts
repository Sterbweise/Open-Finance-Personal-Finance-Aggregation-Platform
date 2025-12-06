/**
 * Behavioural Nudges Engine
 * Generates personalized nudges based on spending patterns and behaviors
 */

import { injectable, inject } from 'tsyringe';
import {
    NudgeTemplate,
    UserNudge,
    NudgeType,
    NudgeSeverity
} from '../../domain/entities/Nudge.js';
import { TransactionType, TransactionCategory } from '../../domain/entities/Transaction.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { Money } from '../../domain/value-objects/Money.js';
import {
    INudgeRepository,
    NUDGE_REPOSITORY
} from '../../domain/repositories/INudgeRepository.js';
import {
    ITransactionRepository,
    TRANSACTION_REPOSITORY,
    CategorySpending,
} from '../../domain/repositories/ITransactionRepository.js';
import { Logger } from '../../shared/Logger.js';

export interface NudgeContext {
    userId: string;
    currentMonth: DateRange;
    previousMonth: DateRange;
    baseCurrency: string;
}

export interface GeneratedNudge {
    type: NudgeType;
    severity: NudgeSeverity;
    title: string;
    message: string;
    category?: TransactionCategory;
    data: Record<string, unknown>;
    expiresAt?: Date;
}

@injectable()
export class NudgesEngine {
    private readonly SPENDING_INCREASE_THRESHOLD = 20; // 20%
    private readonly BUDGET_WARNING_THRESHOLD = 80; // 80% of average
    private readonly ECO_FRIENDLY_GOAL = 30; // 30% eco transactions

    constructor(
        @inject(NUDGE_REPOSITORY) private nudgeRepo: INudgeRepository,
        @inject(TRANSACTION_REPOSITORY) private transactionRepo: ITransactionRepository,
        private logger: Logger
    ) { }

    /**
     * Generate all applicable nudges for a user
     */
    async generateNudges(userId: string, baseCurrency: string = 'USD'): Promise<GeneratedNudge[]> {
        this.logger.info('Generating nudges', { userId });

        const context: NudgeContext = {
            userId,
            currentMonth: DateRange.thisMonth(),
            previousMonth: DateRange.previousMonth(),
            baseCurrency,
        };

        const nudges: GeneratedNudge[] = [];

        // Run all nudge generators in parallel
        const [
            spendingNudges,
            categoryNudges,
            ecoNudges,
            recurringNudges,
        ] = await Promise.all([
            this.checkSpendingPatterns(context),
            this.checkCategorySpending(context),
            this.checkEcoFriendly(context),
            this.checkRecurringPayments(context),
        ]);

        nudges.push(...spendingNudges, ...categoryNudges, ...ecoNudges, ...recurringNudges);

        // Sort by severity (ALERT > WARNING > INFO > SUCCESS)
        const severityOrder = { [NudgeSeverity.ALERT]: 0, [NudgeSeverity.WARNING]: 1, [NudgeSeverity.INFO]: 2, [NudgeSeverity.SUCCESS]: 3 };
        nudges.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return nudges;
    }

    /**
     * Save generated nudges to database
     */
    async saveNudges(userId: string, nudges: GeneratedNudge[]): Promise<UserNudge[]> {
        const templates = await this.nudgeRepo.getActiveTemplates();
        const templateMap = new Map(templates.map(t => [t.type, t]));

        const userNudges: UserNudge[] = [];

        for (const nudge of nudges) {
            let template = templateMap.get(nudge.type);

            // Create template if it doesn't exist
            if (!template) {
                template = NudgeTemplate.create({
                    type: nudge.type,
                    category: nudge.category,
                    title: nudge.title,
                    messageTemplate: nudge.message,
                    severity: nudge.severity,
                });
                await this.nudgeRepo.saveTemplate(template);
            }

            const userNudge = UserNudge.create({
                userId,
                nudgeId: template.id,
                message: nudge.message,
                data: nudge.data,
                expiresAt: nudge.expiresAt,
            });

            userNudges.push(userNudge);
        }

        return this.nudgeRepo.saveUserNudges(userNudges);
    }

    /**
     * Get all active nudges for a user
     */
    async getUserNudges(userId: string): Promise<UserNudge[]> {
        return this.nudgeRepo.findUserNudges(userId, {
            isDismissed: false,
            includeExpired: false,
        });
    }

    /**
     * Check overall spending patterns
     */
    private async checkSpendingPatterns(context: NudgeContext): Promise<GeneratedNudge[]> {
        const nudges: GeneratedNudge[] = [];

        const currentSpending = await this.transactionRepo.aggregate({
            userId: context.userId,
            dateRange: context.currentMonth,
            type: TransactionType.EXPENSE,
        });

        const previousSpending = await this.transactionRepo.aggregate({
            userId: context.userId,
            dateRange: context.previousMonth,
            type: TransactionType.EXPENSE,
        });

        if (previousSpending.totalAmount > 0) {
            const percentChange = ((currentSpending.totalAmount - previousSpending.totalAmount) / previousSpending.totalAmount) * 100;

            if (percentChange >= this.SPENDING_INCREASE_THRESHOLD) {
                nudges.push({
                    type: NudgeType.SPENDING_INCREASE,
                    severity: NudgeSeverity.WARNING,
                    title: 'Spending Alert',
                    message: `Your spending this month is ${Math.round(percentChange)}% higher than last month. Consider reviewing your expenses.`,
                    data: {
                        currentTotal: currentSpending.totalAmount,
                        previousTotal: previousSpending.totalAmount,
                        percentChange,
                    },
                });
            } else if (percentChange <= -this.SPENDING_INCREASE_THRESHOLD) {
                nudges.push({
                    type: NudgeType.SPENDING_DECREASE,
                    severity: NudgeSeverity.SUCCESS,
                    title: 'Great Job!',
                    message: `You've reduced spending by ${Math.round(Math.abs(percentChange))}% compared to last month. Keep it up!`,
                    data: {
                        currentTotal: currentSpending.totalAmount,
                        previousTotal: previousSpending.totalAmount,
                        percentChange,
                    },
                });
            }
        }

        return nudges;
    }

    /**
     * Check category-specific spending
     */
    private async checkCategorySpending(context: NudgeContext): Promise<GeneratedNudge[]> {
        const nudges: GeneratedNudge[] = [];

        const currentCategories = await this.transactionRepo.getSpendingByCategory(
            context.userId,
            context.currentMonth,
            TransactionType.EXPENSE
        );

        const previousCategories = await this.transactionRepo.getSpendingByCategory(
            context.userId,
            context.previousMonth,
            TransactionType.EXPENSE
        );

        const previousMap = new Map(previousCategories.map(c => [c.category, c]));

        for (const current of currentCategories) {
            const previous = previousMap.get(current.category);

            if (previous && previous.totalAmount > 0) {
                const percentChange = ((current.totalAmount - previous.totalAmount) / previous.totalAmount) * 100;

                if (percentChange >= 30) {
                    const displayName = this.getCategoryDisplayName(current.category);
                    nudges.push({
                        type: NudgeType.SPENDING_INCREASE,
                        severity: percentChange >= 50 ? NudgeSeverity.ALERT : NudgeSeverity.WARNING,
                        title: `${displayName} Spending Up`,
                        message: `Your ${displayName.toLowerCase()} spending increased by ${Math.round(percentChange)}% this month.`,
                        category: current.category,
                        data: {
                            category: current.category,
                            currentAmount: current.totalAmount,
                            previousAmount: previous.totalAmount,
                            percentChange,
                        },
                    });
                }
            }

            // Check for unusually high single-category spending
            if (current.percentage >= 40) {
                const displayName = this.getCategoryDisplayName(current.category);
                nudges.push({
                    type: NudgeType.BUDGET_WARNING,
                    severity: NudgeSeverity.INFO,
                    title: `High ${displayName} Spending`,
                    message: `${displayName} accounts for ${Math.round(current.percentage)}% of your spending this month. Consider diversifying your expenses.`,
                    category: current.category,
                    data: {
                        category: current.category,
                        amount: current.totalAmount,
                        percentage: current.percentage,
                    },
                });
            }
        }

        return nudges;
    }

    /**
     * Check eco-friendly spending habits
     */
    private async checkEcoFriendly(context: NudgeContext): Promise<GeneratedNudge[]> {
        const nudges: GeneratedNudge[] = [];

        const ecoFriendlyTxs = await this.transactionRepo.getEcoFriendlyTransactions(
            context.userId,
            context.currentMonth
        );

        const totalTxs = await this.transactionRepo.count({
            userId: context.userId,
            dateRange: context.currentMonth,
        });

        if (totalTxs > 0) {
            const ecoPercentage = (ecoFriendlyTxs.length / totalTxs) * 100;

            if (ecoPercentage >= this.ECO_FRIENDLY_GOAL) {
                nudges.push({
                    type: NudgeType.ECO_SUGGESTION,
                    severity: NudgeSeverity.SUCCESS,
                    title: 'Eco Champion! 🌱',
                    message: `${Math.round(ecoPercentage)}% of your transactions this month are eco-friendly. You're making a positive environmental impact!`,
                    data: {
                        ecoFriendlyCount: ecoFriendlyTxs.length,
                        totalCount: totalTxs,
                        percentage: ecoPercentage,
                    },
                });
            } else if (ecoPercentage < 10 && totalTxs >= 10) {
                nudges.push({
                    type: NudgeType.ECO_SUGGESTION,
                    severity: NudgeSeverity.INFO,
                    title: 'Go Green!',
                    message: `Only ${Math.round(ecoPercentage)}% of your transactions are eco-friendly. Consider choosing sustainable merchants when possible.`,
                    data: {
                        ecoFriendlyCount: ecoFriendlyTxs.length,
                        totalCount: totalTxs,
                        percentage: ecoPercentage,
                        goal: this.ECO_FRIENDLY_GOAL,
                    },
                });
            }
        }

        return nudges;
    }

    /**
     * Check for recurring payment patterns
     */
    private async checkRecurringPayments(context: NudgeContext): Promise<GeneratedNudge[]> {
        const nudges: GeneratedNudge[] = [];

        const recurringTransactions = await this.transactionRepo.getRecurringTransactions(context.userId);

        if (recurringTransactions.length > 0) {
            const totalRecurring = recurringTransactions.reduce((sum, tx) => sum + tx.amount.amount, 0);

            // Get user's average monthly income
            const incomeAgg = await this.transactionRepo.aggregate({
                userId: context.userId,
                dateRange: context.currentMonth,
                type: TransactionType.INCOME,
            });

            if (incomeAgg.totalAmount > 0) {
                const recurringPercentage = (totalRecurring / incomeAgg.totalAmount) * 100;

                if (recurringPercentage >= 50) {
                    nudges.push({
                        type: NudgeType.RECURRING_PAYMENT,
                        severity: NudgeSeverity.WARNING,
                        title: 'Recurring Payments High',
                        message: `Your recurring payments total $${totalRecurring.toFixed(2)} (${Math.round(recurringPercentage)}% of income). Consider reviewing subscriptions.`,
                        data: {
                            count: recurringTransactions.length,
                            total: totalRecurring,
                            percentageOfIncome: recurringPercentage,
                        },
                    });
                } else if (recurringTransactions.length >= 5) {
                    nudges.push({
                        type: NudgeType.RECURRING_PAYMENT,
                        severity: NudgeSeverity.INFO,
                        title: 'Subscription Reminder',
                        message: `You have ${recurringTransactions.length} recurring payments totaling $${totalRecurring.toFixed(2)}/month. Review them to optimize your budget.`,
                        data: {
                            count: recurringTransactions.length,
                            total: totalRecurring,
                        },
                    });
                }
            }
        }

        return nudges;
    }

    /**
     * Mark a nudge as read
     */
    async markAsRead(nudgeId: string): Promise<void> {
        await this.nudgeRepo.markAsRead(nudgeId);
    }

    /**
     * Dismiss a nudge
     */
    async dismissNudge(nudgeId: string): Promise<void> {
        await this.nudgeRepo.dismiss(nudgeId);
    }

    /**
     * Get count of unread nudges
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.nudgeRepo.countUnread(userId);
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
