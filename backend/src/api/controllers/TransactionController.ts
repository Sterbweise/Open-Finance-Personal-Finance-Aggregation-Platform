/**
 * Transaction Controller
 */

import { Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/ITransactionRepository.js';
import { Transaction, TransactionType, TransactionCategory } from '../../domain/entities/Transaction.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';
import { AuthenticatedRequest } from './DashboardController.js';

@injectable()
export class TransactionController {
    constructor(
        @inject(TRANSACTION_REPOSITORY) private transactionRepo: ITransactionRepository
    ) { }

    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const { page = 1, limit = 20, category, type, startDate, endDate } = req.query;

            const dateRange = startDate && endDate
                ? DateRange.create(new Date(startDate as string), new Date(endDate as string))
                : undefined;

            const transactions = await this.transactionRepo.findAll(
                {
                    userId,
                    category: category as TransactionCategory,
                    type: type as TransactionType,
                    dateRange,
                },
                { field: 'transactionDate', direction: 'desc' },
                { limit: Number(limit), offset: (Number(page) - 1) * Number(limit) }
            );

            const total = await this.transactionRepo.count({ userId, category: category as TransactionCategory, type: type as TransactionType, dateRange });

            res.json({
                success: true,
                data: {
                    transactions: transactions.map(tx => tx.toJSON()),
                    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const transaction = await this.transactionRepo.findById(id);

            if (!transaction) {
                res.status(404).json({ success: false, error: 'Transaction not found' });
                return;
            }

            if (transaction.userId !== req.userId) {
                res.status(403).json({ success: false, error: 'Forbidden' });
                return;
            }

            res.json({ success: true, data: transaction.toJSON() });
        } catch (error) {
            next(error);
        }
    }

    async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const { accountId, type, category, amount, currency, description, merchantName, transactionDate } = req.body;

            const transaction = Transaction.create({
                userId,
                accountId,
                type,
                category,
                amount,
                currency: currency ?? 'USD',
                description,
                merchantName,
                transactionDate: new Date(transactionDate),
            });

            const saved = await this.transactionRepo.save(transaction);
            res.status(201).json({ success: true, data: saved.toJSON() });
        } catch (error) {
            next(error);
        }
    }

    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const transaction = await this.transactionRepo.findById(id);

            if (!transaction) {
                res.status(404).json({ success: false, error: 'Transaction not found' });
                return;
            }

            if (transaction.userId !== req.userId) {
                res.status(403).json({ success: false, error: 'Forbidden' });
                return;
            }

            const { category, description, merchantName, isRecurring } = req.body;

            if (category) transaction.categorize(category);
            if (description) transaction.updateDescription(description);
            if (merchantName) transaction.setMerchant(merchantName);
            if (isRecurring !== undefined) {
                isRecurring ? transaction.markAsRecurring() : transaction.unmarkAsRecurring();
            }

            const updated = await this.transactionRepo.update(transaction);
            res.json({ success: true, data: updated.toJSON() });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const transaction = await this.transactionRepo.findById(id);

            if (!transaction) {
                res.status(404).json({ success: false, error: 'Transaction not found' });
                return;
            }

            if (transaction.userId !== req.userId) {
                res.status(403).json({ success: false, error: 'Forbidden' });
                return;
            }

            await this.transactionRepo.delete(id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }
}
