/**
 * Nudge Domain Entity
 * Represents a behavioural nudge template and user-specific nudges
 */

import { v4 as uuidv4 } from 'uuid';
import { TransactionCategory } from './Transaction.js';

export enum NudgeType {
    SPENDING_INCREASE = 'SPENDING_INCREASE',
    SPENDING_DECREASE = 'SPENDING_DECREASE',
    BUDGET_WARNING = 'BUDGET_WARNING',
    SAVING_OPPORTUNITY = 'SAVING_OPPORTUNITY',
    UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY',
    RECURRING_PAYMENT = 'RECURRING_PAYMENT',
    ECO_SUGGESTION = 'ECO_SUGGESTION',
    GOAL_PROGRESS = 'GOAL_PROGRESS',
    STREAK_ACHIEVEMENT = 'STREAK_ACHIEVEMENT',
}

export enum NudgeSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ALERT = 'ALERT',
    SUCCESS = 'SUCCESS',
}

export interface NudgeTemplateProps {
    id?: string;
    type: NudgeType;
    category?: TransactionCategory;
    title: string;
    messageTemplate: string;
    severity: NudgeSeverity;
    threshold?: number;
    isActive?: boolean;
    priority?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserNudgeProps {
    id?: string;
    userId: string;
    nudgeId: string;
    message: string;
    data?: Record<string, unknown>;
    isRead?: boolean;
    isDismissed?: boolean;
    expiresAt?: Date;
    createdAt?: Date;
}

export class NudgeTemplate {
    private readonly _id: string;
    private _type: NudgeType;
    private _category?: TransactionCategory;
    private _title: string;
    private _messageTemplate: string;
    private _severity: NudgeSeverity;
    private _threshold?: number;
    private _isActive: boolean;
    private _priority: number;
    private readonly _createdAt: Date;
    private _updatedAt: Date;

    private constructor(props: NudgeTemplateProps) {
        this._id = props.id ?? uuidv4();
        this._type = props.type;
        this._category = props.category;
        this._title = props.title;
        this._messageTemplate = props.messageTemplate;
        this._severity = props.severity;
        this._threshold = props.threshold;
        this._isActive = props.isActive ?? true;
        this._priority = props.priority ?? 1;
        this._createdAt = props.createdAt ?? new Date();
        this._updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: NudgeTemplateProps): NudgeTemplate {
        return new NudgeTemplate(props);
    }

    static fromPersistence(props: NudgeTemplateProps): NudgeTemplate {
        return new NudgeTemplate(props);
    }

    // Getters
    get id(): string { return this._id; }
    get type(): NudgeType { return this._type; }
    get category(): TransactionCategory | undefined { return this._category; }
    get title(): string { return this._title; }
    get messageTemplate(): string { return this._messageTemplate; }
    get severity(): NudgeSeverity { return this._severity; }
    get threshold(): number | undefined { return this._threshold; }
    get isActive(): boolean { return this._isActive; }
    get priority(): number { return this._priority; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    // Domain Methods
    compileMessage(data: Record<string, string | number>): string {
        let message = this._messageTemplate;
        for (const [key, value] of Object.entries(data)) {
            message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return message;
    }

    shouldTrigger(value: number): boolean {
        if (this._threshold === undefined) return true;
        return value >= this._threshold;
    }

    deactivate(): void {
        this._isActive = false;
        this._updatedAt = new Date();
    }

    activate(): void {
        this._isActive = true;
        this._updatedAt = new Date();
    }

    toJSON(): NudgeTemplateProps {
        return {
            id: this._id,
            type: this._type,
            category: this._category,
            title: this._title,
            messageTemplate: this._messageTemplate,
            severity: this._severity,
            threshold: this._threshold,
            isActive: this._isActive,
            priority: this._priority,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}

export class UserNudge {
    private readonly _id: string;
    private readonly _userId: string;
    private readonly _nudgeId: string;
    private _message: string;
    private _data?: Record<string, unknown>;
    private _isRead: boolean;
    private _isDismissed: boolean;
    private _expiresAt?: Date;
    private readonly _createdAt: Date;

    private constructor(props: UserNudgeProps) {
        this._id = props.id ?? uuidv4();
        this._userId = props.userId;
        this._nudgeId = props.nudgeId;
        this._message = props.message;
        this._data = props.data;
        this._isRead = props.isRead ?? false;
        this._isDismissed = props.isDismissed ?? false;
        this._expiresAt = props.expiresAt;
        this._createdAt = props.createdAt ?? new Date();
    }

    static create(props: UserNudgeProps): UserNudge {
        return new UserNudge(props);
    }

    static fromPersistence(props: UserNudgeProps): UserNudge {
        return new UserNudge(props);
    }

    // Getters
    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get nudgeId(): string { return this._nudgeId; }
    get message(): string { return this._message; }
    get data(): Record<string, unknown> | undefined { return this._data; }
    get isRead(): boolean { return this._isRead; }
    get isDismissed(): boolean { return this._isDismissed; }
    get expiresAt(): Date | undefined { return this._expiresAt; }
    get createdAt(): Date { return this._createdAt; }

    // Domain Methods
    markAsRead(): void {
        this._isRead = true;
    }

    dismiss(): void {
        this._isDismissed = true;
    }

    isExpired(): boolean {
        if (!this._expiresAt) return false;
        return new Date() > this._expiresAt;
    }

    isVisible(): boolean {
        return !this._isDismissed && !this.isExpired();
    }

    toJSON(): UserNudgeProps {
        return {
            id: this._id,
            userId: this._userId,
            nudgeId: this._nudgeId,
            message: this._message,
            data: this._data,
            isRead: this._isRead,
            isDismissed: this._isDismissed,
            expiresAt: this._expiresAt,
            createdAt: this._createdAt,
        };
    }
}
