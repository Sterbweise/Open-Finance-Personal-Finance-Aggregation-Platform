/**
 * Express Routes Configuration
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { DashboardController } from '../controllers/DashboardController.js';
import { TransactionController } from '../controllers/TransactionController.js';

const router = Router();

// Dashboard routes
const dashboardController = container.resolve(DashboardController);
router.get('/dashboard', (req, res, next) => dashboardController.getDashboard(req as any, res, next));
router.get('/dashboard/overview', (req, res, next) => dashboardController.getOverview(req as any, res, next));
router.get('/dashboard/spending', (req, res, next) => dashboardController.getSpending(req as any, res, next));
router.get('/dashboard/trends', (req, res, next) => dashboardController.getTrends(req as any, res, next));
router.get('/dashboard/categories', (req, res, next) => dashboardController.getCategories(req as any, res, next));
router.get('/dashboard/nudges', (req, res, next) => dashboardController.getNudges(req as any, res, next));
router.post('/dashboard/nudges/generate', (req, res, next) => dashboardController.generateNudges(req as any, res, next));
router.post('/dashboard/nudges/:id/read', (req, res, next) => dashboardController.markNudgeRead(req as any, res, next));
router.post('/dashboard/nudges/:id/dismiss', (req, res, next) => dashboardController.dismissNudge(req as any, res, next));
router.get('/dashboard/sustainability', (req, res, next) => dashboardController.getSustainability(req as any, res, next));
router.get('/dashboard/payment-methods', (req, res, next) => dashboardController.getPaymentMethodComparison(req as any, res, next));

// Transaction routes
const transactionController = container.resolve(TransactionController);
router.get('/transactions', (req, res, next) => transactionController.getAll(req as any, res, next));
router.get('/transactions/:id', (req, res, next) => transactionController.getById(req as any, res, next));
router.post('/transactions', (req, res, next) => transactionController.create(req as any, res, next));
router.put('/transactions/:id', (req, res, next) => transactionController.update(req as any, res, next));
router.delete('/transactions/:id', (req, res, next) => transactionController.delete(req as any, res, next));

export default router;
