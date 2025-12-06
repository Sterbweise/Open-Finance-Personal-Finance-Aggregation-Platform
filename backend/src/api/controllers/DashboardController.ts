/**
 * Dashboard Controller
 * REST API endpoints for dashboard data
 */

import { Request, Response, NextFunction } from 'express';
import { injectable } from 'tsyringe';
import { DashboardService } from '../../application/services/DashboardService.js';
import { TransactionAggregationService } from '../../application/services/TransactionAggregationService.js';
import { NudgesEngine } from '../../application/services/NudgesEngine.js';
import { SustainabilityService } from '../../application/services/SustainabilityService.js';
import { DateRange } from '../../domain/value-objects/DateRange.js';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    user?: { id: string; email: string; preferredCurrency: string };
}

@injectable()
export class DashboardController {
    constructor(
        private dashboardService: DashboardService,
        private aggregationService: TransactionAggregationService,
        private nudgesEngine: NudgesEngine,
        private sustainabilityService: SustainabilityService
    ) { }

    /**
     * GET /api/v1/dashboard
     */
    async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const currency = req.user?.preferredCurrency ?? 'USD';

            const data = await this.dashboardService.getDashboardData(userId, currency);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/overview
     */
    async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const currency = req.user?.preferredCurrency ?? 'USD';

            const overview = await this.dashboardService.getOverview(userId, currency);
            res.json({ success: true, data: overview });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/spending
     */
    async getSpending(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const { period = 'month' } = req.query;

            let dateRange: DateRange;
            switch (period) {
                case 'week': dateRange = DateRange.lastDays(7); break;
                case 'year': dateRange = DateRange.thisYear(); break;
                default: dateRange = DateRange.thisMonth();
            }

            const summary = await this.aggregationService.getSpendingSummary(userId, dateRange);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/trends
     */
    async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const currency = req.user?.preferredCurrency ?? 'USD';

            const trends = await this.dashboardService.getSpendingTrends(userId, currency);
            res.json({ success: true, data: trends });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/categories
     */
    async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const currency = req.user?.preferredCurrency ?? 'USD';

            const categories = await this.dashboardService.getCategoryBreakdown(userId, currency);
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/nudges
     */
    async getNudges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;

            const [nudges, unreadCount] = await Promise.all([
                this.nudgesEngine.getUserNudges(userId),
                this.nudgesEngine.getUnreadCount(userId),
            ]);

            res.json({ success: true, data: { nudges, unreadCount } });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/dashboard/nudges/generate
     */
    async generateNudges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const currency = req.user?.preferredCurrency ?? 'USD';

            const generated = await this.nudgesEngine.generateNudges(userId, currency);
            const saved = await this.nudgesEngine.saveNudges(userId, generated);

            res.json({ success: true, data: { generated: generated.length, nudges: saved } });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/dashboard/nudges/:id/read
     */
    async markNudgeRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            await this.nudgesEngine.markAsRead(id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/dashboard/nudges/:id/dismiss
     */
    async dismissNudge(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            await this.nudgesEngine.dismissNudge(id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/sustainability
     */
    async getSustainability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const { period = 'month' } = req.query;

            let dateRange: DateRange;
            switch (period) {
                case 'week': dateRange = DateRange.lastDays(7); break;
                case 'year': dateRange = DateRange.thisYear(); break;
                default: dateRange = DateRange.thisMonth();
            }

            const score = await this.sustainabilityService.calculateSustainabilityScore(userId, dateRange);
            res.json({ success: true, data: score });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/payment-methods
     */
    async getPaymentMethodComparison(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.userId!;
            const comparison = await this.dashboardService.getPaymentMethodComparison(userId);
            res.json({ success: true, data: comparison });
        } catch (error) {
            next(error);
        }
    }
}
