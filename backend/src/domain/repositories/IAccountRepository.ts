/**
 * Account Repository Interface (Port)
 */

import { Account, Provider, AccountType } from '../entities/Account.js';

export interface AccountFilters {
    userId?: string;
    provider?: Provider;
    accountType?: AccountType;
    isActive?: boolean;
}

export interface IAccountRepository {
    findById(id: string): Promise<Account | null>;
    findByUserId(userId: string): Promise<Account[]>;
    findByExternalId(externalId: string): Promise<Account | null>;
    findAll(filters?: AccountFilters, options?: { limit?: number; offset?: number }): Promise<Account[]>;
    save(account: Account): Promise<Account>;
    update(account: Account): Promise<Account>;
    delete(id: string): Promise<void>;
    getTotalBalance(userId: string, currency?: string): Promise<number>;
    getByProvider(userId: string, provider: Provider): Promise<Account[]>;
    count(filters?: AccountFilters): Promise<number>;
}

export const ACCOUNT_REPOSITORY = Symbol('IAccountRepository');
