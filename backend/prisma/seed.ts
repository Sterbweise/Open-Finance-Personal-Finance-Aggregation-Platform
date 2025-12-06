/**
 * Database Seed Script
 * Generates sample data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

// String constants instead of enums (for SQLite compatibility)
const TransactionType = {
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
    TRANSFER: 'TRANSFER',
    DEPOSIT: 'DEPOSIT',
    WITHDRAWAL: 'WITHDRAWAL',
} as const;

const TransactionCategory = {
    FOOD_DINING: 'FOOD_DINING',
    GROCERIES: 'GROCERIES',
    TRANSPORTATION: 'TRANSPORTATION',
    UTILITIES: 'UTILITIES',
    ENTERTAINMENT: 'ENTERTAINMENT',
    SHOPPING: 'SHOPPING',
    HEALTHCARE: 'HEALTHCARE',
    EDUCATION: 'EDUCATION',
    TRAVEL: 'TRAVEL',
    PERSONAL_CARE: 'PERSONAL_CARE',
    HOME: 'HOME',
    INVESTMENTS: 'INVESTMENTS',
    INCOME: 'INCOME',
    TRANSFER: 'TRANSFER',
    OTHER: 'OTHER',
} as const;

const AccountType = {
    SAVINGS: 'SAVINGS',
    CURRENT: 'CURRENT',
    EWALLET: 'EWALLET',
    CREDIT_CARD: 'CREDIT_CARD',
} as const;

const Provider = {
    BANK: 'BANK',
    GRABPAY: 'GRABPAY',
    TNG: 'TNG',
    SHOPEEPAY: 'SHOPEEPAY',
    VIRTUAL_BANK: 'VIRTUAL_BANK',
    MANUAL: 'MANUAL',
} as const;

const CATEGORIES = [
    TransactionCategory.FOOD_DINING,
    TransactionCategory.GROCERIES,
    TransactionCategory.TRANSPORTATION,
    TransactionCategory.ENTERTAINMENT,
    TransactionCategory.SHOPPING,
    TransactionCategory.UTILITIES,
];

const MERCHANTS: Record<string, string[]> = {
    [TransactionCategory.FOOD_DINING]: ['Nasi Lemak Corner', 'Mamak Stall', 'KFC Malaysia', 'McDonald\'s', 'Starbucks'],
    [TransactionCategory.GROCERIES]: ['Tesco', 'Giant', 'Jaya Grocer', '99 Speedmart', 'Mydin'],
    [TransactionCategory.TRANSPORTATION]: ['Grab', 'Shell', 'Petronas', 'Touch \'n Go Reload', 'MRT Ticket'],
    [TransactionCategory.ENTERTAINMENT]: ['Netflix', 'Spotify', 'TGV Cinemas', 'Steam', 'PlayStation'],
    [TransactionCategory.SHOPPING]: ['Shopee', 'Lazada', 'IKEA', 'Uniqlo', 'H&M'],
    [TransactionCategory.UTILITIES]: ['TNB', 'Maxis', 'Digi', 'Celcom', 'TM Unifi'],
};

async function seed() {
    console.log('🌱 Seeding database...');

    // Create demo user
    const passwordHash = await bcrypt.hash('demo123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'demo@openfinance.my' },
        update: {},
        create: {
            id: uuid(),
            email: 'demo@openfinance.my',
            username: 'demo_user',
            passwordHash,
            firstName: 'Ahmad',
            lastName: 'Rahman',
            preferredCurrency: 'USD',
            locale: 'en-MY',
            isActive: true,
            isEmailVerified: true,
        },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create accounts
    const accounts = await Promise.all([
        prisma.account.create({
            data: {
                id: uuid(),
                userId: user.id,
                name: 'Maybank Savings',
                accountType: AccountType.SAVINGS,
                provider: Provider.BANK,
                accountNumber: '1234567890',
                balance: 5000,
                currency: 'USD',
                isActive: true,
            },
        }),
        prisma.account.create({
            data: {
                id: uuid(),
                userId: user.id,
                name: 'GrabPay Wallet',
                accountType: AccountType.EWALLET,
                provider: Provider.GRABPAY,
                accountNumber: 'GP001',
                balance: 250,
                currency: 'USD',
                isActive: true,
            },
        }),
        prisma.account.create({
            data: {
                id: uuid(),
                userId: user.id,
                name: 'Touch \'n Go eWallet',
                accountType: AccountType.EWALLET,
                provider: Provider.TNG,
                accountNumber: 'TNG001',
                balance: 180,
                currency: 'USD',
                isActive: true,
            },
        }),
        prisma.account.create({
            data: {
                id: uuid(),
                userId: user.id,
                name: 'ShopeePay',
                accountType: AccountType.EWALLET,
                provider: Provider.SHOPEEPAY,
                accountNumber: 'SP001',
                balance: 75,
                currency: 'USD',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${accounts.length} accounts`);

    // Generate transactions for last 6 months
    const now = new Date();
    const transactions: any[] = [];

    for (let month = 5; month >= 0; month--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() - month + 1, 0).getDate();

        // Generate 30-50 transactions per month
        const txCount = Math.floor(Math.random() * 20) + 30;

        for (let i = 0; i < txCount; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const txDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const merchants = MERCHANTS[category] ?? ['Unknown'];
            const merchant = merchants[Math.floor(Math.random() * merchants.length)];
            const account = accounts[Math.floor(Math.random() * accounts.length)];

            let amount: number;
            switch (category) {
                case TransactionCategory.FOOD_DINING: amount = Math.random() * 30 + 5; break;
                case TransactionCategory.GROCERIES: amount = Math.random() * 80 + 20; break;
                case TransactionCategory.TRANSPORTATION: amount = Math.random() * 25 + 5; break;
                case TransactionCategory.ENTERTAINMENT: amount = Math.random() * 50 + 10; break;
                case TransactionCategory.SHOPPING: amount = Math.random() * 150 + 20; break;
                case TransactionCategory.UTILITIES: amount = Math.random() * 100 + 30; break;
                default: amount = Math.random() * 50 + 10;
            }

            const isEcoFriendly = Math.random() > 0.75;

            transactions.push({
                id: uuid(),
                userId: user.id,
                accountId: account.id,
                type: TransactionType.EXPENSE,
                category,
                amount: Math.round(amount * 100) / 100,
                amountInBase: Math.round(amount * 100) / 100,
                currency: 'USD',
                exchangeRate: 1.0,
                description: `${merchant} purchase`,
                merchantName: merchant,
                isRecurring: category === TransactionCategory.UTILITIES || category === TransactionCategory.ENTERTAINMENT,
                isEcoFriendly,
                ecoScore: isEcoFriendly ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20,
                transactionDate: txDate,
            });
        }

        // Add 1-2 income transactions per month
        for (let i = 0; i < 2; i++) {
            const day = i === 0 ? 1 : 15;
            transactions.push({
                id: uuid(),
                userId: user.id,
                accountId: accounts[0].id,
                type: TransactionType.INCOME,
                category: TransactionCategory.INCOME,
                amount: i === 0 ? 3500 : 500,
                amountInBase: i === 0 ? 3500 : 500,
                currency: 'USD',
                exchangeRate: 1.0,
                description: i === 0 ? 'Salary' : 'Freelance Income',
                isRecurring: true,
                isEcoFriendly: false,
                transactionDate: new Date(monthStart.getFullYear(), monthStart.getMonth(), day),
            });
        }
    }

    await prisma.transaction.createMany({ data: transactions });
    console.log(`✅ Created ${transactions.length} transactions`);

    // Create nudge templates
    await prisma.nudge.createMany({
        data: [
            { id: uuid(), type: 'SPENDING_INCREASE', title: 'Spending Alert', messageTemplate: 'Your spending is up {{percentage}}% this month', severity: 'WARNING', threshold: 20, isActive: true, priority: 1 },
            { id: uuid(), type: 'ECO_SUGGESTION', title: 'Go Green!', messageTemplate: 'Only {{percentage}}% of your transactions are eco-friendly', severity: 'INFO', isActive: true, priority: 2 },
            { id: uuid(), type: 'BUDGET_WARNING', title: 'Budget Warning', messageTemplate: 'You\'ve spent {{percentage}}% of your typical monthly budget', severity: 'ALERT', threshold: 80, isActive: true, priority: 1 },
        ],
    });

    console.log('✅ Created nudge templates');
    console.log('🎉 Seeding complete!');
}

seed()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
