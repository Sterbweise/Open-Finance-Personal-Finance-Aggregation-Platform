/**
 * Nudge Repository Interface (Port)
 */

import { NudgeTemplate, UserNudge, NudgeType, NudgeSeverity } from '../entities/Nudge.js';
import { TransactionCategory } from '../entities/Transaction.js';

export interface NudgeTemplateFilters {
    type?: NudgeType;
    category?: TransactionCategory;
    severity?: NudgeSeverity;
    isActive?: boolean;
}

export interface UserNudgeFilters {
    userId?: string;
    nudgeId?: string;
    isRead?: boolean;
    isDismissed?: boolean;
    includeExpired?: boolean;
}

export interface INudgeRepository {
    // Nudge Templates
    findTemplateById(id: string): Promise<NudgeTemplate | null>;
    findTemplatesByType(type: NudgeType): Promise<NudgeTemplate[]>;
    findAllTemplates(filters?: NudgeTemplateFilters): Promise<NudgeTemplate[]>;
    saveTemplate(template: NudgeTemplate): Promise<NudgeTemplate>;
    updateTemplate(template: NudgeTemplate): Promise<NudgeTemplate>;
    deleteTemplate(id: string): Promise<void>;
    getActiveTemplates(): Promise<NudgeTemplate[]>;

    // User Nudges
    findUserNudgeById(id: string): Promise<UserNudge | null>;
    findUserNudges(userId: string, filters?: Omit<UserNudgeFilters, 'userId'>): Promise<UserNudge[]>;
    findUnreadUserNudges(userId: string): Promise<UserNudge[]>;
    saveUserNudge(userNudge: UserNudge): Promise<UserNudge>;
    saveUserNudges(userNudges: UserNudge[]): Promise<UserNudge[]>;
    updateUserNudge(userNudge: UserNudge): Promise<UserNudge>;
    deleteUserNudge(id: string): Promise<void>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    dismiss(id: string): Promise<void>;
    deleteExpiredNudges(): Promise<number>;
    countUnread(userId: string): Promise<number>;
}

export const NUDGE_REPOSITORY = Symbol('INudgeRepository');
