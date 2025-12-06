/**
 * Virtual Bank API Client
 * Generated client wrapper for the Virtual Bank API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Logger } from '../../../shared/Logger.js';

export interface VirtualBankUser {
    id?: number;
    username: string;
    password: string;
    email: string;
    first_name?: string;
    last_name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    date_of_birth?: string;
    phone_number?: number;
    date_joined?: string;
}

export interface VirtualBankAccount {
    id?: number;
    user?: VirtualBankUser;
    name: string;
    account_type: 'SAVINGS' | 'CURRENT';
    balance: string;
    number?: string;
    currency: 'USD' | 'EUR' | 'GBP' | 'NGN' | 'JPY';
    created_date?: string;
}

export interface VirtualBankTransaction {
    id?: number;
    account: VirtualBankAccount;
    payer: VirtualBankAccount;
    payee: VirtualBankAccount;
    transaction_type: 'DEPOSIT' | 'TRANSFER' | 'DEBIT_CARD';
    amount_sent: string;
    amount_received: string;
    currency_sent: string;
    currency_received: string;
    rate: string;
    identifier?: string;
    description: string;
    date?: string;
}

export interface VirtualBankTransfer {
    amount: number;
    payer_account_number: string;
    payee_account_number: string;
    description?: string;
}

export interface VirtualBankDeposit {
    amount: number;
    account_number: string;
    description?: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export class VirtualBankApiClient {
    private client: AxiosInstance;
    private accessToken?: string;
    private refreshToken?: string;
    private logger: Logger;

    constructor(baseUrl?: string) {
        this.logger = new Logger('VirtualBankAPI');
        this.client = axios.create({
            baseURL: baseUrl ?? process.env.VIRTUAL_BANK_API_URL ?? 'http://161.97.158.103:8030',
            timeout: parseInt(process.env.VIRTUAL_BANK_API_TIMEOUT ?? '30000'),
            headers: { 'Content-Type': 'application/json' },
        });

        this.client.interceptors.response.use(
            response => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401 && this.refreshToken) {
                    try {
                        await this.refreshAccessToken();
                        const config = error.config!;
                        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
                        return this.client(config);
                    } catch {
                        this.logger.error('Token refresh failed');
                    }
                }
                throw error;
            }
        );
    }

    private setAuthHeader(): void {
        if (this.accessToken) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
        }
    }

    // Auth
    async login(username: string, password: string): Promise<AuthTokens> {
        const response = await this.client.post<AuthTokens>('/auth/login/', { username, password });
        this.accessToken = response.data.access;
        this.refreshToken = response.data.refresh;
        this.setAuthHeader();
        return response.data;
    }

    async register(user: VirtualBankUser): Promise<VirtualBankUser> {
        const response = await this.client.post<VirtualBankUser>('/auth/register/', user);
        return response.data;
    }

    async refreshAccessToken(): Promise<void> {
        if (!this.refreshToken) throw new Error('No refresh token');
        const response = await this.client.post<{ access: string }>('/auth/token/refresh/', { refresh: this.refreshToken });
        this.accessToken = response.data.access;
        this.setAuthHeader();
    }

    async getCurrentUser(): Promise<VirtualBankUser> {
        this.setAuthHeader();
        const response = await this.client.get<VirtualBankUser>('/auth/verify/');
        return response.data;
    }

    // Accounts
    async getAccounts(): Promise<VirtualBankAccount[]> {
        this.setAuthHeader();
        const response = await this.client.get<VirtualBankAccount[]>('/accounts/');
        return response.data;
    }

    async getAccount(number: number): Promise<VirtualBankAccount> {
        this.setAuthHeader();
        const response = await this.client.get<VirtualBankAccount>(`/accounts/${number}/`);
        return response.data;
    }

    async createAccount(data: { name: string; account_type?: string; currency?: string }): Promise<VirtualBankAccount> {
        this.setAuthHeader();
        const response = await this.client.post<VirtualBankAccount>('/accounts/create/', data);
        return response.data;
    }

    // Transactions
    async getTransactions(page?: number, size?: number): Promise<PaginatedResponse<VirtualBankTransaction>> {
        this.setAuthHeader();
        const response = await this.client.get<PaginatedResponse<VirtualBankTransaction>>('/transactions/', { params: { page, size } });
        return response.data;
    }

    async getTransaction(identifier: string): Promise<VirtualBankTransaction> {
        this.setAuthHeader();
        const response = await this.client.get<VirtualBankTransaction>(`/transactions/${identifier}/`);
        return response.data;
    }

    // Transfers
    async getTransfers(page?: number, size?: number): Promise<PaginatedResponse<VirtualBankTransaction>> {
        this.setAuthHeader();
        const response = await this.client.get<PaginatedResponse<VirtualBankTransaction>>('/transfers/', { params: { page, size } });
        return response.data;
    }

    async createTransfer(data: VirtualBankTransfer): Promise<VirtualBankTransaction> {
        this.setAuthHeader();
        const response = await this.client.post<VirtualBankTransaction>('/transfers/create/', data);
        return response.data;
    }

    // Deposits
    async getDeposits(page?: number, size?: number): Promise<PaginatedResponse<VirtualBankTransaction>> {
        this.setAuthHeader();
        const response = await this.client.get<PaginatedResponse<VirtualBankTransaction>>('/deposits/', { params: { page, size } });
        return response.data;
    }

    async createDeposit(data: VirtualBankDeposit): Promise<VirtualBankTransaction> {
        this.setAuthHeader();
        const response = await this.client.post<VirtualBankTransaction>('/deposits/create/', data);
        return response.data;
    }

    // Debit Cards
    async getDebitCards(): Promise<unknown[]> {
        this.setAuthHeader();
        const response = await this.client.get('/debit-cards/');
        return response.data;
    }

    // Notifications
    async getNotifications(page?: number, size?: number): Promise<PaginatedResponse<unknown>> {
        this.setAuthHeader();
        const response = await this.client.get('/notifications/', { params: { page, size } });
        return response.data;
    }

    setTokens(access: string, refresh: string): void {
        this.accessToken = access;
        this.refreshToken = refresh;
        this.setAuthHeader();
    }
}
