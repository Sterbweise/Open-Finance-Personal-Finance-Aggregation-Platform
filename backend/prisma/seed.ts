/**
 * Database Seed Script
 * Generates sample data for development
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

// String constants instead of enums (for SQLite compatibility)
const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
} as const;

const TransactionCategory = {
  FOOD_DINING: "FOOD_DINING",
  GROCERIES: "GROCERIES",
  TRANSPORTATION: "TRANSPORTATION",
  UTILITIES: "UTILITIES",
  ENTERTAINMENT: "ENTERTAINMENT",
  SHOPPING: "SHOPPING",
  HEALTHCARE: "HEALTHCARE",
  EDUCATION: "EDUCATION",
  TRAVEL: "TRAVEL",
  PERSONAL_CARE: "PERSONAL_CARE",
  HOME: "HOME",
  INVESTMENTS: "INVESTMENTS",
  INCOME: "INCOME",
  TRANSFER: "TRANSFER",
  OTHER: "OTHER",
} as const;

const AccountType = {
  SAVINGS: "SAVINGS",
  CURRENT: "CURRENT",
  EWALLET: "EWALLET",
  CREDIT_CARD: "CREDIT_CARD",
} as const;

const Provider = {
  BANK: "BANK",
  GRABPAY: "GRABPAY",
  TNG: "TNG",
  SHOPEEPAY: "SHOPEEPAY",
  VIRTUAL_BANK: "VIRTUAL_BANK",
  MANUAL: "MANUAL",
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
  [TransactionCategory.FOOD_DINING]: [
    "Nasi Lemak Corner",
    "Mamak Stall",
    "KFC Malaysia",
    "McDonald's",
    "Starbucks",
  ],
  [TransactionCategory.GROCERIES]: [
    "Tesco",
    "Giant",
    "Jaya Grocer",
    "99 Speedmart",
    "Mydin",
  ],
  [TransactionCategory.TRANSPORTATION]: [
    "Grab",
    "Shell",
    "Petronas",
    "Touch 'n Go Reload",
    "MRT Ticket",
  ],
  [TransactionCategory.ENTERTAINMENT]: [
    "Netflix",
    "Spotify",
    "TGV Cinemas",
    "Steam",
    "PlayStation",
  ],
  [TransactionCategory.SHOPPING]: ["Shopee", "Lazada", "IKEA", "Uniqlo", "H&M"],
  [TransactionCategory.UTILITIES]: [
    "TNB",
    "Maxis",
    "Digi",
    "Celcom",
    "TM Unifi",
  ],
};

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user with Malaysian preferences
  const passwordHash = await bcrypt.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@openfinance.my" },
    update: {},
    create: {
      id: uuid(),
      email: "demo@openfinance.my",
      username: "demo_user",
      passwordHash,
      firstName: "Ahmad",
      lastName: "Rahman",
      preferredCurrency: "MYR",
      locale: "en-MY",
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create accounts - Malaysian banks and e-wallets use MYR
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Maybank Savings",
        accountType: AccountType.SAVINGS,
        provider: Provider.BANK,
        accountNumber: "1234567890",
        balance: 22500, // ~5000 USD in MYR (1 USD ≈ 4.5 MYR)
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "GrabPay Wallet",
        accountType: AccountType.EWALLET,
        provider: Provider.GRABPAY,
        accountNumber: "GP001",
        balance: 1125, // ~250 USD in MYR
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "Touch 'n Go eWallet",
        accountType: AccountType.EWALLET,
        provider: Provider.TNG,
        accountNumber: "TNG001",
        balance: 810, // ~180 USD in MYR
        currency: "MYR",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: "ShopeePay",
        accountType: AccountType.EWALLET,
        provider: Provider.SHOPEEPAY,
        accountNumber: "SP001",
        balance: 337.5, // ~75 USD in MYR
        currency: "MYR",
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
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() - month + 1,
      0
    ).getDate();

    // Generate 30-50 transactions per month
    const txCount = Math.floor(Math.random() * 20) + 30;

    for (let i = 0; i < txCount; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const txDate = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        day
      );
      const category =
        CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const merchants = MERCHANTS[category] ?? ["Unknown"];
      const merchant = merchants[Math.floor(Math.random() * merchants.length)];
      const account = accounts[Math.floor(Math.random() * accounts.length)];

      // Generate amounts in MYR (Malaysian Ringgit)
      // Typical Malaysian transaction amounts
      let amountMYR: number;
      switch (category) {
        case TransactionCategory.FOOD_DINING:
          amountMYR = Math.random() * 135 + 22.5;
          break; // ~RM 22-157 (~$5-35)
        case TransactionCategory.GROCERIES:
          amountMYR = Math.random() * 360 + 90;
          break; // ~RM 90-450 (~$20-100)
        case TransactionCategory.TRANSPORTATION:
          amountMYR = Math.random() * 112.5 + 22.5;
          break; // ~RM 22-135 (~$5-30)
        case TransactionCategory.ENTERTAINMENT:
          amountMYR = Math.random() * 225 + 45;
          break; // ~RM 45-270 (~$10-60)
        case TransactionCategory.SHOPPING:
          amountMYR = Math.random() * 675 + 90;
          break; // ~RM 90-765 (~$20-170)
        case TransactionCategory.UTILITIES:
          amountMYR = Math.random() * 450 + 135;
          break; // ~RM 135-585 (~$30-130)
        default:
          amountMYR = Math.random() * 225 + 45;
      }

      const isEcoFriendly = Math.random() > 0.75;
      const amountRounded = Math.round(amountMYR * 100) / 100;
      const exchangeRateMYRtoUSD = 0.22; // 1 MYR ≈ 0.22 USD (or 1 USD ≈ 4.5 MYR)
      const amountInBaseUSD =
        Math.round(amountRounded * exchangeRateMYRtoUSD * 100) / 100;

      transactions.push({
        id: uuid(),
        userId: user.id,
        accountId: account.id,
        type: TransactionType.EXPENSE,
        category,
        amount: amountRounded,
        amountInBase: amountInBaseUSD,
        currency: "MYR",
        exchangeRate: exchangeRateMYRtoUSD,
        description: `${merchant} purchase`,
        merchantName: merchant,
        isRecurring:
          category === TransactionCategory.UTILITIES ||
          category === TransactionCategory.ENTERTAINMENT,
        isEcoFriendly,
        ecoScore: isEcoFriendly
          ? Math.floor(Math.random() * 30) + 70
          : Math.floor(Math.random() * 40) + 20,
        transactionDate: txDate,
      });
    }

    // Add 1-2 income transactions per month (in MYR)
    for (let i = 0; i < 2; i++) {
      const day = i === 0 ? 1 : 15;
      const amountMYR = i === 0 ? 15750 : 2250; // ~RM 15,750 ($3,500) salary, ~RM 2,250 ($500) freelance
      const exchangeRateMYRtoUSD = 0.22; // 1 MYR ≈ 0.22 USD
      const amountInBaseUSD =
        Math.round(amountMYR * exchangeRateMYRtoUSD * 100) / 100;

      transactions.push({
        id: uuid(),
        userId: user.id,
        accountId: accounts[0].id,
        type: TransactionType.INCOME,
        category: TransactionCategory.INCOME,
        amount: amountMYR,
        amountInBase: amountInBaseUSD,
        currency: "MYR",
        exchangeRate: exchangeRateMYRtoUSD,
        description: i === 0 ? "Salary" : "Freelance Income",
        isRecurring: true,
        isEcoFriendly: false,
        transactionDate: new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day
        ),
      });
    }
  }

  await prisma.transaction.createMany({ data: transactions });
  console.log(`✅ Created ${transactions.length} transactions`);

  // Create nudge templates
  await prisma.nudge.createMany({
    data: [
      {
        id: uuid(),
        type: "SPENDING_INCREASE",
        title: "Spending Alert",
        messageTemplate: "Your spending is up {{percentage}}% this month",
        severity: "WARNING",
        threshold: 20,
        isActive: true,
        priority: 1,
      },
      {
        id: uuid(),
        type: "ECO_SUGGESTION",
        title: "Go Green!",
        messageTemplate:
          "Only {{percentage}}% of your transactions are eco-friendly",
        severity: "INFO",
        isActive: true,
        priority: 2,
      },
      {
        id: uuid(),
        type: "BUDGET_WARNING",
        title: "Budget Warning",
        messageTemplate:
          "You've spent {{percentage}}% of your typical monthly budget",
        severity: "ALERT",
        threshold: 80,
        isActive: true,
        priority: 1,
      },
    ],
  });

  console.log("✅ Created nudge templates");
  console.log("🎉 Seeding complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
