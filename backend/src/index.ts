/**
 * Express Application Entry Point
 * Simplified for development without full DI
 */

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './shared/Logger.js';

config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Demo Dashboard API (simplified - no DI required)
app.get('/api/v1/dashboard', async (req, res) => {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ success: false, error: 'No user found. Run db:seed first.' });
        }

        const accounts = await prisma.account.findMany({ where: { userId: user.id } });
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id, transactionDate: { gte: startOfMonth } },
            orderBy: { transactionDate: 'desc' },
        });

        const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

        // Category breakdown
        const categoryMap = new Map<string, number>();
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
        });

        const categories = Array.from(categoryMap.entries())
            .map(([category, totalAmount]) => ({
                category,
                totalAmount,
                percentage: expenses > 0 ? (totalAmount / expenses) * 100 : 0,
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);

        const ecoFriendlyCount = transactions.filter(t => t.isEcoFriendly).length;

        res.json({
            success: true,
            data: {
                overview: {
                    totalBalance,
                    monthlyIncome: income,
                    monthlyExpenses: expenses,
                    monthlyNetCashFlow: income - expenses,
                    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
                    accountsCount: accounts.length,
                    transactionsCount: transactions.length,
                },
                accounts: accounts.map(a => ({
                    id: a.id,
                    name: a.name,
                    provider: a.provider,
                    balance: a.balance,
                    percentageOfTotal: totalBalance > 0 ? (a.balance / totalBalance) * 100 : 0,
                })),
                categories,
                sustainability: {
                    overall: 62,
                    ecoFriendlyCount,
                    totalTransactions: transactions.length,
                    carbonFootprintEstimate: Math.round(expenses * 0.015 * 10) / 10,
                },
                recentTransactions: transactions.slice(0, 10).map(t => ({
                    id: t.id,
                    merchantName: t.merchantName,
                    category: t.category,
                    amount: t.amount,
                    type: t.type,
                    date: t.transactionDate,
                    isRecurring: t.isRecurring,
                    isEcoFriendly: t.isEcoFriendly,
                })),
            },
        });
    } catch (error) {
        logger.error('Dashboard error', { error });
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Transactions list
app.get('/api/v1/transactions', async (req, res) => {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            return res.status(404).json({ success: false, error: 'No user found' });
        }

        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId: user.id },
                orderBy: { transactionDate: 'desc' },
                take: Number(limit),
                skip,
            }),
            prisma.transaction.count({ where: { userId: user.id } }),
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
            },
        });
    } catch (error) {
        logger.error('Transactions error', { error });
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Nudges
app.get('/api/v1/dashboard/nudges', async (req, res) => {
    try {
        const nudges = await prisma.nudge.findMany({ where: { isActive: true } });
        res.json({
            success: true,
            data: {
                nudges: nudges.map(n => ({
                    id: n.id,
                    type: n.type,
                    severity: n.severity,
                    title: n.title,
                    message: n.messageTemplate,
                })),
                unreadCount: nudges.length,
            },
        });
    } catch (error) {
        logger.error('Nudges error', { error });
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT ?? 3001;

const start = async () => {
    try {
        await prisma.$connect();
        logger.info('Database connected');

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`API available at http://localhost:${PORT}/api/v1`);
            logger.info(`Dashboard: http://localhost:${PORT}/api/v1/dashboard`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
};

start();

export default app;
