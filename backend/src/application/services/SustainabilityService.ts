/**
 * Sustainability Service
 * Calculates and tracks eco-friendly metrics for transactions
 */

import { injectable, inject } from 'tsyringe';
import { Transaction, TransactionCategory } from '../../domain/entities/Transaction.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/ITransactionRepository.js';

export interface SustainabilityScore {
    overall: number;
    byCategory: { category: TransactionCategory; score: number; count: number }[];
    ecoFriendlyCount: number;
    totalTransactions: number;
    carbonFootprintEstimate: number;
    improvement: { trend: 'improving' | 'declining' | 'stable'; percentage: number };
}

export interface EcoMerchant {
    name: string;
    category: TransactionCategory;
    ecoScore: number;
    tags: string[];
}

@injectable()
export class SustainabilityService {
    private readonly ECO_MERCHANTS: Map<string, EcoMerchant> = new Map([
        ['grab_green', { name: 'GrabGreen', category: TransactionCategory.TRANSPORTATION, ecoScore: 85, tags: ['electric', 'carbon-neutral'] }],
        ['eco_mart', { name: 'EcoMart', category: TransactionCategory.GROCERIES, ecoScore: 90, tags: ['organic', 'local'] }],
    ]);

    private readonly CATEGORY_CARBON: Record<TransactionCategory, number> = {
        [TransactionCategory.TRANSPORTATION]: 0.5,
        [TransactionCategory.FOOD_DINING]: 0.3,
        [TransactionCategory.TRAVEL]: 1.0,
        [TransactionCategory.UTILITIES]: 0.4,
        [TransactionCategory.SHOPPING]: 0.2,
        [TransactionCategory.GROCERIES]: 0.15,
        [TransactionCategory.ENTERTAINMENT]: 0.1,
        [TransactionCategory.HEALTHCARE]: 0.05,
        [TransactionCategory.EDUCATION]: 0.05,
        [TransactionCategory.PERSONAL_CARE]: 0.1,
        [TransactionCategory.HOME]: 0.15,
        [TransactionCategory.INVESTMENTS]: 0,
        [TransactionCategory.INCOME]: 0,
        [TransactionCategory.TRANSFER]: 0,
        [TransactionCategory.OTHER]: 0.1,
    };

    constructor(
        @inject(TRANSACTION_REPOSITORY) private transactionRepo: ITransactionRepository,
    ) { }

    async calculateSustainabilityScore(userId: string, dateRange: DateRange): Promise<SustainabilityScore> {
        const transactions = await this.transactionRepo.findAll({ userId, dateRange });
        const ecoFriendly = transactions.filter(tx => tx.isEcoFriendly);

        const categoryScores = new Map<TransactionCategory, { total: number; count: number }>();
        let totalCarbon = 0;

        for (const tx of transactions) {
            const existing = categoryScores.get(tx.category) ?? { total: 0, count: 0 };
            const score = tx.ecoScore ?? (tx.isEcoFriendly ? 70 : 30);
            categoryScores.set(tx.category, { total: existing.total + score, count: existing.count + 1 });
            totalCarbon += (this.CATEGORY_CARBON[tx.category] ?? 0.1) * (tx.amount.amount / 100);
        }

        const byCategory = Array.from(categoryScores.entries()).map(([cat, data]) => ({
            category: cat,
            score: Math.round(data.total / data.count),
            count: data.count,
        }));

        const overall = transactions.length > 0
            ? Math.round(transactions.reduce((sum, tx) => sum + (tx.ecoScore ?? (tx.isEcoFriendly ? 70 : 30)), 0) / transactions.length)
            : 50;

        const previousRange = dateRange.previousPeriod();
        const previousTxs = await this.transactionRepo.findAll({ userId, dateRange: previousRange });
        const prevEco = previousTxs.filter(tx => tx.isEcoFriendly).length;
        const currentPct = transactions.length > 0 ? (ecoFriendly.length / transactions.length) * 100 : 0;
        const prevPct = previousTxs.length > 0 ? (prevEco / previousTxs.length) * 100 : 0;
        const diff = currentPct - prevPct;

        return {
            overall,
            byCategory,
            ecoFriendlyCount: ecoFriendly.length,
            totalTransactions: transactions.length,
            carbonFootprintEstimate: Math.round(totalCarbon * 10) / 10,
            improvement: {
                trend: diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable',
                percentage: Math.round(diff * 10) / 10,
            },
        };
    }

    classifyTransaction(tx: Transaction): { isEcoFriendly: boolean; score: number; tags: string[] } {
        const merchantKey = tx.merchantName?.toLowerCase().replace(/\s/g, '_');
        const merchant = merchantKey ? this.ECO_MERCHANTS.get(merchantKey) : undefined;

        if (merchant) {
            return { isEcoFriendly: true, score: merchant.ecoScore, tags: merchant.tags };
        }

        const baseScore = 50 - (this.CATEGORY_CARBON[tx.category] ?? 0.1) * 20;
        return { isEcoFriendly: baseScore >= 60, score: Math.round(baseScore), tags: [] };
    }

    getEcoSuggestions(category: TransactionCategory): string[] {
        const suggestions: Record<TransactionCategory, string[]> = {
            [TransactionCategory.TRANSPORTATION]: ['Use public transport', 'Try carpooling', 'Consider e-scooters'],
            [TransactionCategory.FOOD_DINING]: ['Choose restaurants with sustainable practices', 'Reduce food delivery'],
            [TransactionCategory.GROCERIES]: ['Buy local produce', 'Bring reusable bags', 'Choose minimal packaging'],
            [TransactionCategory.UTILITIES]: ['Switch to LED bulbs', 'Use energy-efficient appliances'],
            [TransactionCategory.SHOPPING]: ['Buy second-hand', 'Choose sustainable brands'],
            [TransactionCategory.TRAVEL]: ['Offset carbon emissions', 'Choose direct flights'],
            [TransactionCategory.ENTERTAINMENT]: [],
            [TransactionCategory.HEALTHCARE]: [],
            [TransactionCategory.EDUCATION]: [],
            [TransactionCategory.PERSONAL_CARE]: ['Choose eco-friendly products'],
            [TransactionCategory.HOME]: ['Install solar panels', 'Use water-saving fixtures'],
            [TransactionCategory.INVESTMENTS]: [],
            [TransactionCategory.INCOME]: [],
            [TransactionCategory.TRANSFER]: [],
            [TransactionCategory.OTHER]: [],
        };
        return suggestions[category] ?? [];
    }
}
